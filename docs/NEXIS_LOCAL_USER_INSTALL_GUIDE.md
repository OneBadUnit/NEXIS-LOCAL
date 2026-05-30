# NEXIS-LOCAL — User Install Guide

**For:** Anyone setting up NEXIS-LOCAL on a Windows PC  
**Assumes:** No programming experience required  
**Last verified:** 2026-05-29 (Documentation Sync)

---

## Quick Start

> Get from zero to a working NEXIS-LOCAL in 5 steps.

| Step | What you do | Time |
|---|---|---|
| 1 | Install Ollama | ~2 min |
| 2 | Download and run NEXIS Companion | ~1 min |
| 3 | Open NEXIS in your browser | ~30 sec |
| 4 | Pull the AI model | ~10–15 min (download) |
| 5 | Create your first project | ~1 min |

**Detailed instructions for each step are below.**

---

## Table of Contents

1. [What NEXIS-LOCAL Is](#1-what-nexis-local-is)
2. [System Requirements](#2-system-requirements)
3. [Downloading the Project](#3-downloading-the-project)
4. [Installing Ollama](#4-installing-ollama)
5. [Installing Required Models](#5-installing-required-models)
6. [Installing NEXIS Companion](#6-installing-nexis-companion)
7. [First Startup](#7-first-startup)
8. [Choosing an AI Model](#8-choosing-an-ai-model)
9. [Verifying Everything Works](#9-verifying-everything-works)
10. [Common Problems and Fixes](#10-common-problems-and-fixes)
11. [If Something Breaks](#11-if-something-breaks)
12. [Updating NEXIS-LOCAL](#12-updating-nexis-local)
13. [Uninstalling NEXIS-LOCAL](#13-uninstalling-nexis-local)

---

## 1. What NEXIS-LOCAL Is

NEXIS-LOCAL is a personal AI workspace that runs entirely on your computer.

You give it source material — documents, articles, web pages, images — and it
uses a local AI model to transform that material into structured, useful output:
summaries, timelines, key points, scripts, hooks, and more.

**Everything stays on your machine.** No data is sent to any cloud service.
The AI works offline, using a model downloaded to your computer.

### What you can do with it

- **Collect** sources: paste a URL, upload a PDF, DOCX, image, or type text directly
- **Review** what was extracted from each source
- **Create a Summary Package:** outline, timeline, key points, and summary
- **Create a Creator Package:** hook script, dialogue script, title suggestions, and keywords
- **Refine** any output with a follow-up instruction (change tone, shorten, expand, etc.)

### What it is not

NEXIS-LOCAL is not a chat assistant. It is a structured document and content
processing tool. Think of it as an AI-powered research and writing assistant
that works from your own source material.

---

## 2. System Requirements

### Minimum requirements

| Component | Minimum | Notes |
|---|---|---|
| Operating system | Windows 10 or 11 (64-bit) | |
| RAM | 8 GB | 16 GB recommended for smooth performance |
| Disk space | 15 GB free | 5 GB for the `qwen2.5:7b` model, remainder for the app and your data |
| Internet | Needed only during setup | After models are downloaded, NEXIS works offline |

### Recommended

- 16 GB RAM or more
- A dedicated GPU (NVIDIA or AMD) — Ollama can use it automatically to make the AI faster
- SSD (solid-state drive) — much faster model loading than a traditional hard drive

### What you do NOT need

- Programming experience
- Python, Node.js, or any development tools
- A cloud account or subscription
- Always-on internet after setup

> **Note (2026-05-29):** The "no cloud account" claim above is now verified true at the code level. The Supabase authentication gate was removed in Phase 1 (AppLayout.jsx v009). NEXIS-LOCAL opens directly to the workspace with no sign-in screen.

---

## 3. Downloading the Project

NEXIS-LOCAL is distributed as source code on GitHub. You have two options.

### Option A — Download as a ZIP (easiest, no Git required)

1. Go to: `https://github.com/OneBadUnit/NEXIS`
2. Click the green **Code** button
3. Click **Download ZIP**
4. When the download finishes, right-click the ZIP and choose **Extract All**
5. Choose a destination folder, for example: `C:\Users\YourName\NEXIS-LOCAL`
6. Click **Extract**

You now have the NEXIS-LOCAL folder on your computer.

### Option B — Clone with Git

If you have Git installed:

1. Open a folder where you want NEXIS to live
2. Right-click and choose **Open in Terminal** (or open Command Prompt)
3. Run:

```
git clone https://github.com/OneBadUnit/NEXIS.git NEXIS-LOCAL
```

---

## 4. Installing Ollama

Ollama is the free, open-source program that runs AI models on your computer.
NEXIS needs it to do any AI processing.

### Step 1 — Download Ollama

Go to: **https://ollama.com/download**

Click **Download for Windows**.

### Step 2 — Run the installer

Double-click the downloaded file (something like `OllamaSetup.exe`).

Follow the on-screen steps. The installer is standard — click Next and Finish.

### Step 3 — Verify Ollama is installed

After installation, Ollama runs quietly in the background. You may see it in
the system tray (the small icons near the clock in the bottom-right corner of
your screen).

To confirm it is working:

1. Open your browser
2. Go to: `http://localhost:11434/`
3. You should see the text: **Ollama is running**

If you see that text, Ollama is installed and working correctly.

---

## 5. Installing Required Models

A model is the AI brain that NEXIS uses. You need to download it once. It
stays on your computer permanently — you do not need to download it again.

### The model NEXIS uses

**`qwen2.5:7b`** — the primary AI model for all NEXIS operations  
Size: approximately 4.7 GB  
This is the only model required for standard use.

### How to download the model

1. Press **Windows + R** on your keyboard
2. Type `cmd` and press Enter — this opens a black Command Prompt window
3. Type the following and press Enter:

```
ollama pull qwen2.5:7b
```

4. Wait for the download to finish. It will show progress. Depending on your
   internet speed, this takes 5–20 minutes.
5. When it is done, you will see a line saying `success`.

You can close the Command Prompt window after the download finishes.

### Optional: Vision model

If you want NEXIS to describe images, you also need:

```
ollama pull llava:13b
```

Size: approximately 8 GB. This is optional — NEXIS works without it.

---

## 6. Installing NEXIS Companion

NEXIS Companion is an optional management tool that helps with first-time
Ollama setup, model downloads, and diagnostics. It can start Ollama for you,
download AI models with progress tracking, and report system status.

> **New in current version:** AI generation (Create / Refine) works directly
> from NEXIS to Ollama without the Companion. The Companion is **recommended
> for first-time users** — it makes setup easier. Experienced users who already
> have Ollama running with a model can skip this section.

**You do not install it. You just download it and double-click it.**

### Step 1 — Download NEXIS Companion

Download it from the GitHub releases page:

```
https://github.com/OneBadUnit/NEXIS/releases/download/companion-v0.1.0/NEXIS.Companion.exe
```

Save it somewhere easy to find — your Desktop or a `NEXIS` folder works well.

### Step 2 — Run NEXIS Companion

Double-click `NEXIS Companion.exe`.

A small console window will open showing status messages. This is normal —
it means the Companion is running.

**Keep this window open while you use NEXIS.** You can minimise it, but do
not close it.

### What the Companion does

- Checks whether Ollama is installed and running
- Can start Ollama automatically if it is not running
- Can download AI models on your behalf
- Provides NEXIS with a safe local connection to your AI

You do not need to interact with it. Just keep it running.

---

## 7. First Startup

With Ollama installed, a model downloaded, and NEXIS Companion running, you
are ready to open NEXIS.

### Starting the backend and frontend

NEXIS-LOCAL includes a startup file that opens both the backend and frontend for you.

**Using NEXIS-LOCAL.bat (recommended):**

1. Open the NEXIS-LOCAL folder you downloaded in Step 3
2. Double-click the file named `NEXIS-LOCAL.bat`
3. Two windows open — one for the backend (port 8000) and one for the frontend (port 3000)
4. Wait for both to show a ready message

If you need manual setup instructions, see [NEXIS_LOCAL_RECOVERY_AND_SETUP.md](NEXIS_LOCAL_RECOVERY_AND_SETUP.md).

The backend runs on **http://localhost:8000**. The frontend runs on **http://localhost:3000**.

### Opening NEXIS

Open your browser (Chrome, Edge, or Firefox) and go to:

```
http://localhost:3000
```

You should see the NEXIS workspace open directly.

### What you see on first open

- The NEXIS workspace opens directly
- **No sign-in required.** NEXIS-LOCAL opens directly to the workspace. There is no account creation step and no login screen.

---

## 8. Choosing an AI Model

When NEXIS starts, it uses the **NEXIS Local Companion** to detect which AI
model is available on your computer.

### Default model

NEXIS is pre-configured to use `qwen2.5:7b`. If you downloaded that model in
Step 5, everything should work automatically.

### Confirming your model in NEXIS

1. Look for the **Model Config** or settings area in the top bar or settings overlay
2. It should show **Local AI** as the mode (with Ollama)
3. The model name should show `qwen2.5:7b`

### If you want to use a different model

Any model you have installed in Ollama can be used. To see what you have:

1. Open Command Prompt
2. Type: `ollama list`
3. Press Enter

The list shows all models on your computer. You can switch models in the NEXIS
settings if you prefer a different one.

---

## 9. Verifying Everything Works

Use the built-in Diagnostics tool to confirm all parts are connected.

### How to open Diagnostics

Look for a **Diagnostics** button in the NEXIS interface (usually accessible
from the top bar or a help/settings area). Click it.

### What to look for

| Item | Expected status | What it means |
|---|---|---|
| NEXIS Companion | Connected | The Companion program is running |
| Ollama | Running | Ollama is active and reachable |
| `qwen2.5:7b` | Available | The AI model is installed and ready |

If all three show as working, NEXIS is fully operational.

### Quick end-to-end test

1. Click **New Project** (or open an existing project)
2. In the **Collect** step, paste any public URL into the URL field
   (example: a news article)
3. Click **Collect**
4. Wait a moment — NEXIS will extract the text from the page
5. Once collected, go to **Create Package**
6. Choose **Summary Package**
7. Click **Create**

If the AI produces a summary, everything is working end-to-end.

---

## 10. Common Problems and Fixes

### NEXIS shows "Local AI Unavailable" or AI operations fail

**Cause:** Ollama is not running, or no model has been downloaded.

**Fix:**
1. Look for the Ollama icon in the system tray (bottom-right near the clock) —
   make sure it is running. Or open Command Prompt and type: `ollama serve`
2. Make sure `qwen2.5:7b` is downloaded (`ollama list` to check)
3. If NEXIS Companion is running, click **Recheck** in AI Model Settings

> **Note:** NEXIS Companion not running does not block AI generation as long
> as Ollama is running with a model. The Companion is used for management
> features (start Ollama, download models, diagnostics).

---

### "Ollama is not installed" or Companion shows Ollama not found

**Cause:** Ollama was not installed, or was installed but is not running.

**Fix:**
1. Download and install Ollama from `https://ollama.com/download`
2. If already installed, look for the Ollama icon in the system tray (bottom-right
   near the clock) and make sure it is running
3. Or open Command Prompt and type: `ollama serve`

---

### Model not available — AI operations fail or hang

**Cause:** The `qwen2.5:7b` model is not downloaded yet.

**Fix:** Open Command Prompt and run:

```
ollama pull qwen2.5:7b
```

Wait for the download to complete. This is a one-time download (~4.7 GB).

---

### Model download stalls or stops partway through

**Cause:** Usually a temporary network issue or insufficient disk space.

**Fix:**
- Check you have at least 10 GB of free disk space
- Run the `ollama pull qwen2.5:7b` command again — Ollama resumes downloads
  from where they stopped, it does not restart from scratch

---

### Port 8765 already in use

**Cause:** Another copy of NEXIS Companion is already running.

**Fix:** Check the taskbar or system tray for an existing Companion window.
Close the duplicate and use the one that is already running.

---

### The browser shows a blank page or cannot connect to localhost:3000

**Cause:** The NEXIS frontend is not running.

**Fix:** Make sure the frontend startup process completed successfully.
Refer to Step 7 above or the developer setup guide
([NEXIS_LOCAL_RECOVERY_AND_SETUP.md](NEXIS_LOCAL_RECOVERY_AND_SETUP.md)).

---

### NEXIS collected a URL but the summary seems wrong or off-topic

**Cause:** Some websites block automated content extraction, so NEXIS may have
received navigation menus or page boilerplate instead of the article.

**Fix:** This is a known limitation for certain websites. Try:
- A different article from the same site
- Copying the article text directly and using the **Text** collect option
- Downloading the page as a PDF and uploading it via **File**

---

### The AI response is very slow

**Cause:** Running an AI model locally is demanding. Without a GPU, it runs
on your CPU which is slower.

**What helps:**
- Close other programs to free up RAM
- If you have an NVIDIA or AMD GPU, Ollama uses it automatically — make
  sure your graphics drivers are up to date
- The first response after starting is always slower — subsequent responses
  in the same session are faster

---

### Windows Defender or antivirus warns about NEXIS Companion

**Cause:** `NEXIS Companion.exe` is not signed with a commercial code-signing
certificate. Windows Defender SmartScreen may show a warning for unsigned
executables.

**Fix:** Click **More info** → **Run anyway** to allow it. The binary is safe —
it is open source and the source code is available at
`https://github.com/OneBadUnit/NEXIS/tree/main/bridge`.

---

## 11. If Something Breaks

Something went wrong and you are not sure why. That is okay — NEXIS runs several
pieces at once, and any one of them can cause problems.

You do not need to understand the error. You just need to capture the right
information so someone can help you — whether that is a friend, a colleague,
or a free AI assistant like ChatGPT.

---

### The four windows NEXIS uses

When NEXIS is running, up to four separate windows or processes are active at
the same time. Knowing which one showed the error is the most useful piece of
information you can provide.

| Window / Program | What it is | Port |
|---|---|---|
| **NEXIS Companion** | The local helper app that connects NEXIS to your AI | 8765 |
| **NEXIS Backend** | The engine that processes your documents and runs packages | 8000 |
| **NEXIS Frontend** | The visual interface you see in your browser | 3000 |
| **Ollama** | The AI model service (may be in the system tray, not a visible window) | 11434 |

When something breaks, the error will appear in one of these four places.
Note which one it is.

---

### What to capture before asking for help

Copy and paste all of the following:

1. **Which step failed** — e.g. "I was trying to collect a URL"
2. **Which window showed the error** — e.g. "the Backend window"
3. **The full error message** — copy it exactly, including any code or numbers
4. **What you clicked right before it failed** — e.g. "I clicked the Collect button"
5. **A screenshot if possible** — press **Windows + Shift + S** to take one

---

### Common error messages explained

#### `No module named 'app'`

This appears in the **Backend window**.

It usually means the backend was started from the wrong folder. The backend
must be started from inside the `backend` folder — not from the main
NEXIS-LOCAL folder.

If you see this, go back to the startup instructions and make sure you are in
the right folder before starting the backend.

---

#### `Could not read package.json` or `npm error: missing package.json`

This appears in the **Frontend window**.

It usually means the frontend was started from the wrong folder. The frontend
must be started from inside the `frontend` folder.

---

#### `Ollama not reachable` / `connection refused` / `Error: connect ECONNREFUSED 127.0.0.1:11434`

This usually means **Ollama is not running**.

Fix: Look for the Ollama icon in your system tray (near the clock, bottom-right
of your screen). If it is not there, open Ollama from the Start menu or rerun
the Ollama installer.

---

#### `Companion not reachable` / `bridge unavailable` / `Error: connect ECONNREFUSED 127.0.0.1:8765`

This usually means **NEXIS Companion is not running**.

Fix: Find `NEXIS Companion.exe` and double-click it. Keep the window open.
Refresh NEXIS in your browser.

---

#### Browser opens but NEXIS does not load (blank page or spinning)

Check both the **Backend window** and the **Frontend window**.

- If the Backend window is not open or shows an error, NEXIS cannot process
  anything — start the backend first.
- If the Frontend window shows an error, the browser interface failed to start —
  look at the error message and follow the startup steps again.
- If both windows look fine, try refreshing the browser and waiting 10–15 seconds.

---

#### `model not found` / `pull model to continue` / `qwen2.5:7b not available`

This means the AI model has not been downloaded yet, or a different model name
is configured.

Fix: Open a Command Prompt window and run:

```
ollama pull qwen2.5:7b
```

Wait for the download to finish, then try again.

---

### Copy/paste help template

If you need to ask someone for help — a friend, colleague, or a free AI
assistant like ChatGPT — copy the block below, fill it in, and send it:

```
I am trying to run NEXIS-LOCAL.

Step that failed:
Window showing the error:
Full error message:
What I clicked before it failed:
Screenshot attached: yes / no

My setup:
Windows version:
Did Ollama start?                  yes / no / not sure
Did NEXIS Companion start?         yes / no / not sure
Did the Backend window stay open?  yes / no / not sure
Did the Frontend window stay open? yes / no / not sure
```

The more of this you fill in, the faster someone can help you.

---

## 12. Updating NEXIS-LOCAL

### Updating the NEXIS code

**If you downloaded a ZIP:**
1. Go to `https://github.com/OneBadUnit/NEXIS`
2. Download the latest ZIP
3. Extract it to the same folder, replacing the old files
4. Re-run the setup steps for backend and frontend (install dependencies again)

**If you used Git:**
1. Open Command Prompt in your NEXIS-LOCAL folder
2. Run: `git pull origin main`
3. Re-run backend and frontend setup steps

### Updating Ollama

Ollama updates itself automatically in the background on Windows. You can also
download the latest version from `https://ollama.com/download` and run the
installer again — it updates in place.

### Updating AI models

Models do not auto-update. To get a newer version of a model:

```
ollama pull qwen2.5:7b
```

Ollama will download the latest version and replace the old one.

### Updating NEXIS Companion

Download the latest `NEXIS Companion.exe` from the GitHub releases page:

```
https://github.com/OneBadUnit/NEXIS/releases
```

Replace your old `NEXIS Companion.exe` with the new one.

---

## 13. Uninstalling NEXIS-LOCAL

NEXIS-LOCAL does not use a Windows installer, so there is no standard
"Uninstall" in Control Panel. Removal is manual.

### Step 1 — Delete the NEXIS-LOCAL folder

Delete the folder where you extracted or cloned NEXIS-LOCAL
(example: `C:\Users\YourName\NEXIS-LOCAL`).

This removes all NEXIS code, your local database (`nexis.db`), and all saved
project data.

**Warning:** Your projects and collected sources are stored in `nexis.db`
inside that folder. Once the folder is deleted, they cannot be recovered.

### Step 2 — Remove NEXIS Companion

Delete `NEXIS Companion.exe` from wherever you saved it (Desktop, etc.).

### Step 3 — Uninstall Ollama (optional)

If you no longer want Ollama on your computer:

1. Open **Settings → Apps**
2. Search for **Ollama**
3. Click **Uninstall**

Ollama model files are stored separately. After uninstalling Ollama, delete
the model cache folder to free disk space:

```
C:\Users\YourName\.ollama
```

### Step 4 — Remove model files (optional)

If you want to recover the disk space used by models without fully uninstalling
Ollama:

```
ollama rm qwen2.5:7b
ollama rm llava:13b
```

---

## Reference

| Item | Value |
|---|---|
| NEXIS backend address | http://localhost:8000 |
| NEXIS frontend address | http://localhost:3000 |
| NEXIS Companion address | http://localhost:8765 |
| Ollama address | http://localhost:11434 |
| Primary model | `qwen2.5:7b` (~4.7 GB) |
| Vision model (optional) | `llava:13b` (~8 GB) |
| Ollama download | https://ollama.com/download |
| NEXIS source | https://github.com/OneBadUnit/NEXIS |
| NEXIS Companion download | https://github.com/OneBadUnit/NEXIS/releases |
