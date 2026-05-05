import { supabase } from './supabase'

export async function signUp(email, password) {
  return await supabase.auth.signUp({ email, password })
}

export async function signIn(email, password) {
  return await supabase.auth.signInWithPassword({ email, password })
}

export async function signOut() {
  return await supabase.auth.signOut()
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser()
  return data?.user || null
}

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data?.session || null
}

export async function resetPasswordForEmail(email) {
  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  })
}

// ── Profile helpers ──────────────────────────────────────────

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows found — expected when profile doesn't exist yet
    console.error("[Profile] getProfile error:", error.message);
  }
  return data ?? null;
}

export async function ensureProfile(user) {
  if (!user) return null;

  let profile = await getProfile(user.id);

  if (!profile) {
    const { data, error } = await supabase
      .from("profiles")
      .insert({ id: user.id, email: user.email, tier: "free" })
      .select()
      .single();

    if (error) {
      console.error("[Profile] ensureProfile create error:", error.message);
      return null;
    }

    console.log("[Profile] created profile:", data);
    profile = data;
  } else {
    console.log("[Profile] loaded profile:", profile);
  }

  return profile;
}

export async function getCurrentProfile() {
  const user = await getCurrentUser();
  if (!user) return null;
  return await getProfile(user.id);
}
