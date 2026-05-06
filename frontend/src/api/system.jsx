import { API_BASE } from "./api.jsx";

export async function systemCheck() {
  const res = await fetch(`${API_BASE}/api/system/check`);

  if (!res.ok) {
    throw new Error("System check failed");
  }

  return res.json();
}
