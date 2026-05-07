# NEXIS

Local-First AI Workspace • Document Intelligence • Creator & Understanding Packages

NEXIS is a modular, local-AI-first workspace designed to collect, understand, transform, and refine information through a unified pipeline. It combines a FastAPI backend, a React frontend, local AI integration through the NEXIS Companion, and structured package workflows built for real-world creator and analysis tasks.

NEXIS is designed around one core idea:

> Your AI should work for you — locally when possible, privately when desired, and without forcing users into complex technical workflows.

This repository contains the source-only version of NEXIS — no model weights, binaries, caches, or external AI models are stored in Git.

---

# 🚀 Features

## Local-First AI Architecture

• Designed primarily for local AI usage through Ollama
• NEXIS Companion bridges the frontend to local AI safely
• No browser-to-raw-Ollama communication
• Provider/API mode supported as a secondary option
• Structured local model management and diagnostics

---

## Collect → Understand → Create Workflow

### Collect

Ingest and organize information from:

• Documents (PDF, DOCX, TXT)
• URLs and web content
• Images and OCR
• Notes and raw text
• Audio/video pipelines (in development)

---

### Understand Packages

Structured analysis packages that transform raw information into organized outputs:

• Summaries
• Timelines
• Key Points
• Outlines
• Source-aware document processing
• Multi-document workflows with preserved source boundaries

---

### Creator Packages

Transform source material into creator-ready outputs:

• Hook Scripts
• Dialogue Scripts
• Title Suggestions
• Keywords
• Engaging rewrites
• Structured creator workflows

---

### Refinement Layer

Refine generated outputs without regenerating entire projects:

Examples:
• Professional tone cleanup
• Shortening/expanding
• Educational tone
• Creator-style optimization
• SEO-focused rewrites
• Future preset-based refinement workflows

---

# 🧠 Local AI Integration

NEXIS currently supports:

• Windows via NEXIS Companion
• Linux / WSL2 via nexis-bridge-linux

The local bridge system provides:

• Safe local AI communication
• Ollama detection and startup
• Model detection
• Diagnostics and troubleshooting
• Local endpoint abstraction
• Future-friendly companion architecture

---

# 🧩 Frontend UI

## React-Based Workspace

• Project-oriented workflow
• Clean focused UI
• Overlay-driven design system
• Package-based processing flows
• Integrated diagnostics/help system
• Local AI status monitoring

---

## Tested Models Overlay

NEXIS includes guided recommendations for tested local AI models, helping users choose models appropriate for:

• Structured extraction
• Summaries
• Creator workflows
• Lower-end systems
• General-purpose generation

---

# ⚙️ Backend Architecture

## FastAPI Backend

Modular architecture with separation between:

• Routes
• Services
• AI integration
• Schemas
• Storage
• Ingestion pipelines
• Package processing

---

## Companion Architecture

Local AI communication is intentionally separated from the hosted backend.

This allows:

• Local privacy
• Reduced hosted AI costs
• Better GPU utilization
• Offline/local workflows
• Cleaner browser security handling

---

# 📁 Repository Structure

```text
NEXIS/
├── backend/        ← FastAPI backend and package processing
├── bridge/         ← NEXIS Companion / local AI bridge
├── frontend/       ← React frontend workspace
├── docs/           ← Documentation and references
└── .gitignore      ← Ignore rules for binaries/models/caches
```

---

# 🛠️ Requirements

## Backend

• Python 3.11+
• FastAPI
• Uvicorn
• Ollama (for local AI workflows)

---

## Frontend

• Node.js 18+
• npm

---

## Local AI (Recommended)

• Ollama
• qwen2.5:7b recommended for structured workflows
• llama3.1:8b supported for conversational/creative workflows

---

# ⚙️ Setup

## Backend

Run the API:

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Default API URL:

```text
http://localhost:8000
```

---

## Frontend

Run the UI:

```bash
cd frontend
npm install
npm run dev
```

Default UI URL:

```text
http://localhost:3000
```

---

## NEXIS Companion (Windows)

Build the companion:

```bash
cd bridge
build.bat
```

Result:

```text
dist/windows/NEXIS Companion.exe
```

Run by double-clicking the executable.

---

## Linux / WSL2 Bridge

Build:

```bash
cd bridge
bash build.sh
```

Run:

```bash
./dist/linux/nexis-bridge-linux
```

---

# 🧱 Design Principles

• Local-first AI workflows
• Beginner-friendly UX
• Modular architecture
• Structured AI packages
• Source-aware document handling
• Minimal technical friction
• Clean, focused UI
• Reproducible setup
• No model weights stored in Git

---

# 🔒 Privacy Philosophy

NEXIS is designed to minimize unnecessary data exposure.

Local AI workflows are prioritized whenever possible.

Diagnostic reporting is user-controlled and designed to avoid collecting personal content or unrelated user information.

---

# 📝 License

This repository is private and currently unlicensed.
All rights reserved unless a license is added.

---

# 📌 Status

NEXIS is under active development.

Current major focus areas:

• Local AI reliability
• Package workflows
• Creator/refinement systems
• Source-aware document intelligence
• Companion stability
• User-friendly onboarding
