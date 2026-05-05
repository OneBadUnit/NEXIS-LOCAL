// ============================================================
// ARC-NEXUS - APP LAYOUT
// File: src/layout/AppLayout.jsx
// Version: 007 (password recovery + account overlay)
// ============================================================

import React, { useState, useEffect } from "react";

import TopBar from "./TopBar";

import NexusDashboard from "../pages/NexusDashboard";
import HelpOverlay from "../components/HelpOverlay";
import SetupOverlay from "../components/SetupOverlay";
import SignUpOverlay from "../components/SignUpOverlay";
import SignedOutScreen from "../components/SignedOutScreen";
import PasswordRecoveryOverlay from "../components/PasswordRecoveryOverlay";
import AccountOverlay from "../components/AccountOverlay";
import { signUp, signIn, signOut, ensureProfile } from "../lib/auth";
import { supabase } from "../lib/supabase";

import "./layout.css";

export default function AppLayout() {
  // null | "help" | "setup"
  const [overlay, setOverlay] = useState(null);
  const [showSignUp, setShowSignUp] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [showPasswordRecovery, setShowPasswordRecovery] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Auth — authLoading stays true until the initial session check resolves
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

  // Raw signUp — overlay handles its own result display; also updates user if session active
  const handleSignUp = async (email, password) => {
    const result = await signUp(email, password);
    // onAuthStateChange will handle setUser if Supabase creates a session
    return result;
  };

  // Returns the error (or null) so the caller can display it
  const handleSignIn = async (email, password) => {
    const { data, error } = await signIn(email, password);
    if (error) {
      console.error("[Auth] signIn error:", error.message);
      return error;
    }
    console.log("[Auth] signIn user:", data.user, "session:", data.session);
    // onAuthStateChange will update user state
    return null;
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
        onSignIn={handleSignIn}
        onSignUpSuccess={handleSignUp}
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
        onOpenSignUp={() => setShowSignUp(true)}
        onOpenAccount={() => setShowAccount(true)}
        onSignIn={handleSignIn}
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
      {overlay === "setup" && (
        <SetupOverlay onClose={() => setOverlay(null)} />
      )}
      {showSignUp && (
        <SignUpOverlay
          onClose={() => setShowSignUp(false)}
          onSignUpSuccess={handleSignUp}
          onGoToSignIn={() => setShowSignUp(false)}
        />
      )}
      {showAccount && (
        <AccountOverlay
          onClose={() => setShowAccount(false)}
          user={user}
          profile={profile}
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
