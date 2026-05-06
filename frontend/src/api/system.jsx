const API_BASE =
  process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8000";

export async function systemCheck() {
  const res = await fetch(`${API_BASE}/api/system/check`);

  if (!res.ok) {
    throw new Error("System check failed");
  }

  return res.json();
}
