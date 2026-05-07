// ============================================================
// ARC-NEXUS - APP LAYOUT
// File: src/layout/AppLayout.jsx
// Version: 007 (password recovery + account overlay)
// ============================================================

import React, { useState, useEffect } from "react";

import TopBar from "./TopBar";

import NexusDashboard from "../pages/NexusDashboard";
import HelpOverlay from "../components/HelpOverlay";
import SignedOutScreen from "../components/SignedOutScreen";
import PasswordRecoveryOverlay from "../components/PasswordRecoveryOverlay";
import AccountOverlay from "../components/AccountOverlay";
import { sendMagicLink, signOut, ensureProfile } from "../lib/auth";
import { supabase } from "../lib/supabase";

import "./layout.css";

export default function AppLayout() {
  // null | "help"
  const [overlay, setOverlay] = useState(null);
  const [showAccount, setShowAccount] = useState(false);
  const [showPasswordRecovery, setShowPasswordRecovery] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Raw signUp — authLoading stays true until the initial session check resolves
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // ── Temporary Supabase debug check ────────────────────────
  useEffect(() => {
    (async () => {
      console.log("SUPABASE URL exists:", !!process.env.REACT_APP_SUPABASE_URL);
      console.log("SUPABASE KEY exists:", !!process.env.REACT_APP_SUPABASE_ANON_KEY);

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log("Supabase session:", sessionData, sessionError);

      const { data: userData, error: userError } = await supabase.auth.getUser();
      console.log("Supabase user:", userData, userError);

      if (userData?.user) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userData.user.id)
          .single();
        console.log("Supabase profile:", profile, profileError);
      }
    })();
  }, []);
  // ── End debug check ────────────────────────────────────────

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data }) => {
      const sessionUser = data?.session?.user ?? null;
      console.log("[Auth] initial session user:", sessionUser);
      setUser(sessionUser);
      if (sessionUser) {
        ensureProfile(sessionUser)
          .then((p) => setProfile(p))
          .catch((e) => console.error("[Profile] initial load error:", e))
          .finally(() => setAuthLoading(false));
      } else {
        setAuthLoading(false);
      }
    });

    // Reactive auth state listener
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user ?? null;
      console.log("[Auth] onAuthStateChange:", _event, sessionUser);
      setUser(sessionUser);
      if (_event === "PASSWORD_RECOVERY") {
        setShowPasswordRecovery(true);
      }
      if (sessionUser) {
        ensureProfile(sessionUser)
          .then((p) => setProfile(p))
          .catch((e) => console.error("[Profile] auth state profile error:", e));
      } else {
        setProfile(null);
      }
    });

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  // Send a magic-link email. Returns { error } from Supabase.
  const handleSendMagicLink = async (email) => {
    const { error } = await sendMagicLink(email);
    if (error) console.error("[Auth] sendMagicLink error:", error.message);
    return { error };
  };

  const handleSignOut = async () => {
    await signOut();
    // onAuthStateChange will clear user state
  };

  useEffect(() => {
    const main = document.querySelector(".arcn-main");
    if (!main) return;

    const handleScroll = () => {
      setShowScrollTop(main.scrollTop > 200);
    };

    main.addEventListener("scroll", handleScroll);

    return () => {
      main.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    const main = document.querySelector(".arcn-main");
    if (main) {
      main.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // ── Loading ────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "var(--arc-bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(255,255,255,0.3)",
          fontSize: "0.9rem",
        }}
      >
        Loading…
      </div>
    );
  }

  // ── Signed-out gate ────────────────────────────────────────
  if (!user) {
    return (
      <SignedOutScreen
        onSendMagicLink={handleSendMagicLink}
      />
    );
  }

  // ── Authenticated app ──────────────────────────────────────
  return (
    <div className="layout">
      <TopBar
        onHome={() => setOverlay(null)}
        openOverlay={(name) => setOverlay(name)}
        user={user}
        onOpenAccount={() => setShowAccount(true)}
        onSignOut={handleSignOut}
      />

      <main className="arcn-main">
        <NexusDashboard user={user} profile={profile} />
      </main>

      {showScrollTop && (
        <button
          className="scroll-top-button"
          onClick={scrollToTop}
          aria-label="Scroll to top"
          title="Scroll to top"
        >
          ↑
        </button>
      )}

      {/* Overlays — rendered on top of everything */}
      {overlay === "help" && (
        <HelpOverlay onClose={() => setOverlay(null)} />
      )}
      {showAccount && (
        <AccountOverlay
          onClose={() => setShowAccount(false)}
          user={user}
          profile={profile}
          onProfileUpdate={(updated) => setProfile(updated)}
        />
      )}
      {showPasswordRecovery && (
        <PasswordRecoveryOverlay
          onComplete={() => setShowPasswordRecovery(false)}
        />
      )}
    </div>
  );
}
