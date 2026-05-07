// ============================================================
// ARC-NEXUS - APP LAYOUT
// File: src/layout/AppLayout.jsx
// Version: 008 (email/password auth — no magic-link, no providers)
// ============================================================
//
// AUTH CHANGE: All magic-link / OTP code removed.
// Auth gate relies exclusively on the Supabase session returned by
// getSession() / onAuthStateChange(). No localStorage flags, URL params,
// demo booleans, or hardcoded bypasses are used anywhere in this file.
// ============================================================

import React, { useState, useEffect } from "react";

import TopBar from "./TopBar";

import NexusDashboard from "../pages/NexusDashboard";
import HelpOverlay from "../components/HelpOverlay";
import DiagnosticsOverlay from "../components/DiagnosticsOverlay";
import SignedOutScreen from "../components/SignedOutScreen";
import PasswordRecoveryOverlay from "../components/PasswordRecoveryOverlay";
import AccountOverlay from "../components/AccountOverlay";
// AUTH CHANGE: sendMagicLink removed. signIn / signUp use password-based Supabase auth.
import { signIn, signUp, signOut, ensureProfile } from "../lib/auth";
import { supabase } from "../lib/supabase";

import "./layout.css";

export default function AppLayout() {
  // null | "help"
  const [overlay, setOverlay] = useState(null);
  const [showAccount, setShowAccount] = useState(false);
  const [showPasswordRecovery, setShowPasswordRecovery] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // authLoading stays true until the initial Supabase session check resolves.
  // The app NEVER renders until this completes — no bypass possible.
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

  // AUTH CHANGE: Replaced sendMagicLink with password-based handlers.

  // Sign in with email + password. Returns { error } from Supabase.
  // On success, onAuthStateChange fires and sets user → app renders.
  const handleSignIn = async (email, password) => {
    const { error } = await signIn(email, password);
    if (error) console.error("[Auth] signIn error:", error.message);
    return { error };
  };

  // Sign up with email + password. Supabase sends a confirmation email.
  // The user must confirm before signInWithPassword will succeed.
  const handleSignUp = async (email, password) => {
    const { error } = await signUp(email, password);
    if (error) console.error("[Auth] signUp error:", error.message);
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

  // ── Signed-out gate ──────────────────────────────────────────────────────
  // AUTH CHANGE: The only accepted source of truth is the Supabase `user`
  // object populated by getSession() / onAuthStateChange() above.
  // No localStorage flag, URL param, or demo/mock value can bypass this check.
  if (!user) {
    return (
      <SignedOutScreen
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
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
      {overlay === "diagnostics" && (
        <DiagnosticsOverlay onClose={() => setOverlay(null)} />
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
