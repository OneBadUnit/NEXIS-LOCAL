export async function systemCheck() {
  const res = await fetch("http://127.0.0.1:8000/system/check");

  if (!res.ok) {
    throw new Error("System check failed");
  }

  return res.json();
}
