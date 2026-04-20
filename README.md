# ARC‑NEXUS  
Multimodal Ingestion Engine • Vision + Audio • Document Intelligence

ARC‑NEXUS is a modular, GPU‑aware ingestion and analysis system designed to process images, documents, audio, and video through a unified pipeline. It includes a FastAPI backend, a React frontend, and a clean architecture for multimodal AI workflows.

This repository contains the source‑only version of ARC‑NEXUS — no binaries, no heavy model files, and no external dependencies checked into Git.

---

## 🚀 Features

### Multimodal Ingestion
• Images (vision models, OCR, scene analysis)  
• Audio (transcription, metadata extraction)  
• Video (frame sampling, OCR, metadata)  
• Documents (PDF, DOCX, TXT, URLs)

### GPU‑Optimized Vision Pipeline
• Designed for local GPU inference (RTX‑class cards)  
• Supports quantized multimodal models  
• Modular adapters for swapping model backends

### Frontend UI
• React‑based “Assimilation” interface  
• Clean transcript‑style output panel  
• No thumbnails, no clutter — intentional UX

### Backend Architecture
• FastAPI application  
• Modular ingestion utilities (audio, video, OCR, PDF, DOCX, URLs, vision)  
• Clear separation of routes, services, schemas, and models

---

## 📁 Repository Structure

ARC-NEXUS/  
├── backend/        ← FastAPI backend, ingestion utilities, vision pipeline  
├── frontend/       ← React frontend (Assimilation UI)  
└── .gitignore      ← Ignore rules (no binaries, models, caches, or large artifacts)

---

## 🛠️ Requirements

### Backend
• Python 3.11+  
• FastAPI  
• Uvicorn  
• PyTorch (with CUDA for GPU vision models)  
• OCR stack (EasyOCR / Tesseract installed locally, not in repo)

### Frontend
• Node.js 18+  
• npm or yarn

---

## ⚙️ Setup

### Backend
Run the API:

    cd backend
    pip install -r requirements.txt
    uvicorn app.main:app --reload

Default API URL:

    http://localhost:8000

### Frontend
Run the UI:

    cd frontend
    npm install
    npm run dev

Default UI URL:

    http://localhost:5173

---

## 🧩 Vision Model Integration

ARC‑NEXUS supports local GPU‑hosted multimodal models, such as quantized LLaVA‑style models.  
Model weights are not included in this repository and must be downloaded/configured locally.

---

## 🧱 Design Principles

• Modular — each ingestion path is isolated and replaceable  
• GPU‑aware — optimized for RTX‑class cards  
• Clean UI — focused, minimal, task‑oriented  
• Source‑only Git — no binaries, no large artifacts, no model weights  
• Reproducible — clone → install → run

---

## 📝 License

This repository is private and unlicensed.  
All rights reserved unless a license is added.

---

## 📌 Status

ARC‑NEXUS is under active development.  
This repository represents the clean, source‑only baseline for ongoing work.
