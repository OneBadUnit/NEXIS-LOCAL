# NEXIS Local Companion -- Bridge Server

## What is this?

**NEXIS Local Companion** (binary name: `NEXIS Companion.exe` on Windows,
`nexis-bridge` on Mac/Linux) is a small background server that runs on your
computer and connects the NEXIS web app to a locally installed
[Ollama](https://ollama.com) instance.

It is a single compiled binary. It has no installer, no Python, no Node. You
double-click it and it runs.

---

## Why does it exist?

When you visit NEXIS at `https://nexis-psi.vercel.app`, your browser cannot
call `http://localhost:11434` (the Ollama address) directly. Browsers block
cross-origin requests from a hosted HTTPS site to a local HTTP service -- this
is a browser security rule called CORS.

NEXIS Local Companion solves this by running a small HTTP server on your
machine at `http://localhost:8765`. It:

- Accepts requests from the NEXIS web app
- Checks whether Ollama is installed and running
- Can start Ollama automatically (no terminal needed)
- Can pull model files on your behalf (with live progress)
- Proxies generation requests to Ollama
- Reports diagnostics if something goes wrong

Normal users never need to open a terminal.

---

## Architecture

```
NEXIS Web App (browser)
        |
        |  http://localhost:8765
        v
NEXIS Local Companion  <-- this binary
        |
        |  http://localhost:11434
        v
     Ollama
        |
        v
  Local AI Model (e.g. qwen2.5:7b)
```

---

## Endpoints (v2.0.0)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Companion + Ollama status |
| GET | `/diagnostics` | Full system snapshot |
| GET | `/ollama/find` | Search known install paths |
| POST | `/ollama/start` | Start Ollama if installed |
| POST | `/ollama/restart` | Kill and restart Ollama |
| GET | `/models` | List available models |
| POST | `/models/pull` | Start async model download |
| GET | `/models/pull/progress?job=<id>` | SSE stream of pull progress |
| POST | `/generate` | Run a prompt through Ollama |
| GET | `/system` | System info (CPU, GPU, paths) |
| POST | `/diagnostics/open-terminal` | Open OS terminal (last resort) |

---

## Running on Windows

1. Download `NEXIS Companion.exe` from the releases page or build it yourself.
2. Double-click `NEXIS Companion.exe`.
3. A console window opens showing status. Keep it open (minimise is fine).
4. Go to NEXIS in your browser and it will detect the Companion automatically.

**Do not close the console window** while you are using NEXIS local AI.

---

## Running on Mac

```bash
chmod +x ./nexis-bridge
./nexis-bridge
```

Keep the terminal open while using NEXIS.

If macOS blocks the binary ("unidentified developer"), right-click it in
Finder -> Open -> Open to allow it once.

---

## Running on Linux

```bash
chmod +x ./nexis-bridge
./nexis-bridge
```

---

## Building from source

Requires [Go 1.21+](https://go.dev/dl/).

**Windows:**
```bat
build.bat
```
Output: `dist\windows\NEXIS Companion.exe`

**Mac / Linux (all platforms at once):**
```bash
chmod +x build.sh
./build.sh
```
Output: `dist/windows/NEXIS Companion.exe`, `dist/macos/nexis-bridge`,
`dist/linux/nexis-bridge`

The build uses only the Go standard library -- no `go get` required.

---

## Trusted origins

The Companion only responds to requests from:

- `https://nexis-psi.vercel.app`
- `https://*.vercel.app` (Vercel preview deployments)
- `http://localhost:3000`
- `http://localhost:5173`
- `http://127.0.0.1:3000`
- `http://127.0.0.1:5173`

All other origins receive a 403 response.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Port 8765 already in use | Another instance is running. Close it first. |
| "Ollama NOT FOUND" on startup | Download Ollama at [ollama.com/download](https://ollama.com/download) |
| NEXIS shows "Local AI Unavailable" | Make sure the Companion console window is still open |
| Model pull stalls | Check disk space; Ollama models are 4-8 GB |
| macOS blocks the binary | Right-click -> Open -> Open |

---

## Roadmap (v3 ideas)

- Windows installer (.msi)
- System tray icon with status
- Launch on login / autostart
- ARM64 builds (Apple Silicon native, Raspberry Pi)
- Bundled Ollama installer flow

---

## License

Part of the NEXIS project by ARC NEXUS LLC.
