// ============================================================
// ARC-NEXUS - MODEL CONFIG
// File: src/components/ModelConfig/ModelConfig.jsx
// Version: 004 (appliance-style: Companion -> Tested Models -> Edit Model)
//
// Design principles:
//   - MODEL section answers "Is my Local AI system ready?" at a glance
//   - NEXIS Companion is the primary control (Running / Start / Configure)
//   - Tested Models is second
//   - Edit Model (full AI settings modal) is last
//   - Normal users never see "localhost", "port", or terminal commands
//   - Terminal access buried under Advanced > Troubleshooting only
//
// Companion status states (companionStatus):
//   "checking"   ?? currently pinging the bridge
//   "running"    ?? bridge reachable (green)
//   "start"      ?? saved exe path exists but bridge not reachable (yellow)
//   "configure"  ?? no saved exe path and bridge not reachable (red)
//
// AI uiState (inside Edit Model modal):
//   COMPANION_NOT_RUNNING, CHECKING, OLLAMA_NOT_INSTALLED,
//   OLLAMA_NOT_RUNNING, OLLAMA_STARTING, OLLAMA_HUNG,
//   NO_MODELS, PULLING_MODEL, PULL_FAILED, MODEL_READY,
//   CHECK_FAILED_TEMP
//
// Props:
//   config         ?? saved model config object or null
//   onConfigChange ?? called with new config or null on save/clear
// ============================================================

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  getDiagnostics,
  startOllama,
  restartOllama,
  pullModel,
  subscribePullProgress,
  openTerminal,
  BRIDGE_DEFAULT_URL,
  RECOMMENDED_MODEL,
  getCompanionDownload,
  isLegacyOllamaEndpoint,
} from "../../lib/bridge.js";

// ???? localStorage key for saved companion exe path ????????????????????????????????????????????????
const COMPANION_PATH_KEY = "nexis_companion_path";

function getSavedCompanionPath() {
  try { return localStorage.getItem(COMPANION_PATH_KEY) || ""; } catch { return ""; }
}
function saveCompanionPath(path) {
  try { localStorage.setItem(COMPANION_PATH_KEY, path); } catch {}
}
function clearCompanionPath() {
  try { localStorage.removeItem(COMPANION_PATH_KEY); } catch {}
}

// ???? Tested models data ????????????????????????????????????????????????????????????????????????????????????????????????????????

const TESTED_MODELS = [
  {
    name: "qwen2.5:7b",
    tag: "Recommended",
    tagColor: "#38bdf8",
    bestFor: ["Summaries", "Timelines", "Extraction", "Structured outputs"],
    notes: [
      "Performs well with NEXIS Summary Packages",
      "Good at preserving structure and formatting",
    ],
    hardware: "Mid-range GPU recommended",
  },
  {
    name: "qwen2.5:7b",
    tag: "Popular",
    tagColor: "rgba(255,255,255,0.25)",
    bestFor: ["Conversation", "Brainstorming", "Creative generation"],
    notes: [
      "Strong conversational model",
      "May struggle with large mixed-document summarization",
    ],
    hardware: "Mid / high-range GPU recommended",
  },
  {
    name: "phi-3-mini",
    tag: "Low-end",
    tagColor: "rgba(255,255,255,0.2)",
    bestFor: ["Low-end systems", "CPU / light GPU usage"],
    notes: [
      "Faster but less detailed outputs",
    ],
    hardware: "Low-end GPU or CPU systems",
  },
];

// ???? Collapsible helper ????????????????????????????????????????????????????????????????????????????????????????????????????????

function Collapsible({ label, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: 10, borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          all: "unset", display: "flex", alignItems: "center", gap: 8,
          width: "100%", padding: "9px 14px", cursor: "pointer",
          fontSize: "0.8rem", color: "rgba(255,255,255,0.35)",
          background: "rgba(255,255,255,0.03)", userSelect: "none", boxSizing: "border-box",
        }}
      >
        <span style={{ fontSize: "0.7rem" }}>{open ? "v" : ">"}</span>
        {label}
      </button>
      {open && (
        <div style={{ padding: "12px 16px", background: "rgba(0,0,0,0.18)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ???? Tested Models Overlay ??????????????????????????????????????????????????????????????????????????????????????????????????

function TestedModelsOverlay({ onClose }) {
  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.72)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 10002,
    }}>
      <div className="panel" style={{
        width: 520, margin: 0, maxHeight: "88vh",
        overflowY: "auto", display: "flex", flexDirection: "column", gap: 0,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <h3 style={{ margin: 0 }}>Tested Models</h3>
          <button className="btn" style={{ padding: "3px 10px" }} onClick={onClose}>&times;</button>
        </div>

        <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.45)", margin: "0 0 20px", lineHeight: 1.6 }}>
          NEXIS supports many local AI models. These are tested starting points.
          Results may vary depending on your hardware, quantization, and context size.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
          {TESTED_MODELS.map((m) => (
            <div key={m.name} style={{
              borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.03)", padding: "14px 16px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span style={{ fontWeight: 700, fontSize: "0.95rem", fontFamily: "monospace" }}>{m.name}</span>
                <span style={{
                  fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.06em",
                  textTransform: "uppercase", padding: "2px 7px", borderRadius: 4,
                  background: "rgba(255,255,255,0.08)", color: m.tagColor,
                  border: `1px solid ${m.tagColor}33`,
                }}>{m.tag}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px" }}>
                <div>
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Best for</div>
                  <ul style={{ margin: 0, paddingLeft: 14, lineHeight: 1.8, fontSize: "0.83rem" }}>
                    {m.bestFor.map((b) => <li key={b}>{b}</li>)}
                  </ul>
                </div>
                <div>
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Notes</div>
                  <ul style={{ margin: 0, paddingLeft: 14, lineHeight: 1.8, fontSize: "0.83rem" }}>
                    {m.notes.map((n) => <li key={n}>{n}</li>)}
                  </ul>
                </div>
              </div>
              <div style={{ marginTop: 10, fontSize: "0.78rem", color: "rgba(255,255,255,0.35)" }}>
                Hardware: {m.hardware}
              </div>
            </div>
          ))}
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Explore more models</div>
          <a href="https://ollama.com/library" target="_blank" rel="noreferrer"
            style={{ fontSize: "0.85rem", color: "var(--arc-accent)", textDecoration: "none" }}>
            Ollama Model Library &rarr;
          </a>
          <a href="https://huggingface.co/models" target="_blank" rel="noreferrer"
            style={{ fontSize: "0.85rem", color: "var(--arc-accent)", textDecoration: "none" }}>
            Hugging Face Models &rarr;
          </a>
        </div>
      </div>
    </div>
  );
}

// ???? NEXIS Companion Overlay ??????????????????????????????????????????????????????????????????????????????????????????????

function CompanionOverlay({ onClose, companionStatus, savedPath, onPathSaved, onRecheck }) {
  const companionDl = getCompanionDownload();
  const [pathInput, setPathInput]   = useState(savedPath || "");
  const [pathSaved, setPathSaved]   = useState(false);

  const handleSavePath = () => {
    const trimmed = pathInput.trim();
    if (!trimmed) return;
    saveCompanionPath(trimmed);
    setPathSaved(true);
    onPathSaved(trimmed);
    setTimeout(() => setPathSaved(false), 2000);
  };

  const handleClearPath = () => {
    clearCompanionPath();
    setPathInput("");
    onPathSaved("");
  };

  const statusDot = companionStatus === "running"
    ? "var(--arc-accent)"
    : companionStatus === "start"
      ? "#f59e0b"
      : "rgba(239,68,68,0.7)";
  const statusText = companionStatus === "running"
    ? "Running"
    : companionStatus === "start"
      ? "Not running"
      : "Not configured";

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.72)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 10002,
    }}>
      <div className="panel" style={{
        width: 520, margin: 0, maxHeight: "92vh",
        overflowY: "auto", display: "flex", flexDirection: "column", gap: 0,
      }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <h3 style={{ margin: 0 }}>NEXIS Companion</h3>
          <button className="btn" style={{ padding: "3px 10px" }} onClick={onClose}>&times;</button>
        </div>

        {/* Current status */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8, marginBottom: 20,
          padding: "8px 12px", borderRadius: 8,
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
        }}>
          <span style={{ fontSize: "0.72rem", color: statusDot }}>&#x25CF;</span>
          <span style={{ fontSize: "0.82rem", fontWeight: 600, color: statusDot }}>{statusText}</span>
          <button
            className="btn"
            style={{ padding: "2px 10px", fontSize: "0.75rem", marginLeft: "auto" }}
            onClick={onRecheck}
          >
            Recheck
          </button>
        </div>

        {/* Browser security note */}
        <p style={{ margin: "0 0 18px", fontSize: "0.8rem", color: "rgba(255,255,255,0.38)", lineHeight: 1.6, padding: "8px 12px", borderRadius: 6, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          For security reasons, web browsers cannot directly start programs on your computer.
          Open NEXIS Companion manually from the saved location below, then click Recheck.
        </p>

        {/* What / Why */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontWeight: 700, fontSize: "0.88rem", margin: "0 0 6px" }}>What is the NEXIS Companion?</p>
          <p style={{ margin: "0 0 10px", fontSize: "0.83rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
            NEXIS Companion is a small program that runs on your computer and lets NEXIS
            communicate with your local AI. Without it, NEXIS cannot use any local AI model.
          </p>
          <p style={{ margin: 0, fontSize: "0.83rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
            You download it once, keep it open while using NEXIS, and it works silently in
            the background. No internet connection is needed once a model is downloaded.
          </p>
        </div>

        {/* Recommended install location */}
        <div style={{
          marginBottom: 20, padding: "12px 14px", borderRadius: 8,
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
        }}>
          <p style={{ fontWeight: 700, fontSize: "0.82rem", margin: "0 0 4px" }}>Recommended save location</p>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>
            Save the companion to a permanent location you can easily find:
          </p>
          <div style={{
            margin: "8px 0 0", padding: "7px 12px", borderRadius: 6,
            background: "rgba(0,0,0,0.3)", fontFamily: "monospace", fontSize: "0.82rem",
            color: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.08)",
          }}>
            Documents\NEXIS Companion\
          </div>
        </div>

        {/* Download */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontWeight: 700, fontSize: "0.88rem", margin: "0 0 8px" }}>Step 1 - Download</p>
          {companionDl.supported ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <a
                href={companionDl.url}
                target="_blank"
                rel="noreferrer"
                className="btn primary"
                style={{ textDecoration: "none", padding: "7px 16px", fontSize: "0.85rem" }}
              >
                {companionDl.label}
              </a>
              <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>
                {companionDl.platform}
              </span>
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: "0.82rem", color: "rgba(255,255,255,0.45)" }}>
              NEXIS Local Companion currently supports Windows and Linux/WSL2.
            </p>
          )}
        </div>

        {/* Set location */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontWeight: 700, fontSize: "0.88rem", margin: "0 0 4px" }}>Step 2 - Save the location</p>
          <p style={{ margin: "0 0 10px", fontSize: "0.8rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>
            After downloading, copy the full file path and paste it below. NEXIS uses this
            to remind you where to find the companion when you need to start it.
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              value={pathInput}
              onChange={(e) => setPathInput(e.target.value)}
              placeholder="e.g. C:\Users\You\Documents\NEXIS Companion\NEXIS Companion.exe"
              style={{ flex: 1, minWidth: 200, fontSize: "0.82rem" }}
            />
            <button
              className="btn primary"
              style={{ padding: "6px 14px", fontSize: "0.82rem", flexShrink: 0 }}
              onClick={handleSavePath}
              disabled={!pathInput.trim()}
            >
              {pathSaved ? "Saved!" : "Save Location"}
            </button>
          </div>
          {savedPath && (
            <div style={{ marginTop: 8, display: "flex", alignItems: "flex-start", gap: 8 }}>
              <div style={{
                flex: 1, padding: "6px 10px", borderRadius: 6,
                background: "rgba(0,0,0,0.25)", fontFamily: "monospace", fontSize: "0.75rem",
                color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.07)",
                wordBreak: "break-all",
              }}>
                {savedPath}
              </div>
              <button
                className="btn"
                style={{ padding: "4px 10px", fontSize: "0.75rem", flexShrink: 0, color: "rgba(239,68,68,0.65)", borderColor: "rgba(239,68,68,0.3)" }}
                onClick={handleClearPath}
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Step 3 - Start */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontWeight: 700, fontSize: "0.88rem", margin: "0 0 4px" }}>Step 3 - Start the Companion</p>
          <p style={{ margin: "0 0 10px", fontSize: "0.8rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>
            Navigate to the saved location and double-click the file to start it. A small window
            will open - keep it open while using NEXIS. You can minimise it.
          </p>
          {savedPath && (
            <div style={{
              padding: "10px 14px", borderRadius: 8,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              fontSize: "0.82rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.5,
            }}>
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.75rem" }}>Your saved path:</span>
              <br />
              <span style={{ fontFamily: "monospace", wordBreak: "break-all" }}>{savedPath}</span>
            </div>
          )}
          <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
            <button className="btn" style={{ padding: "6px 14px", fontSize: "0.82rem" }} onClick={onRecheck}>
              After starting - click Recheck
            </button>
          </div>
        </div>

        {/* Troubleshooting */}
        <Collapsible label="Troubleshooting / Advanced">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <p style={{ fontWeight: 600, fontSize: "0.82rem", margin: "0 0 4px" }}>Companion window opened but status shows not running</p>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>
                Wait a few seconds, then click Recheck. The companion may still be starting up.
              </p>
            </div>
            <div>
              <p style={{ fontWeight: 600, fontSize: "0.82rem", margin: "0 0 4px" }}>Companion closes immediately when opened</p>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>
                On Windows, right-click the file and choose "Run as administrator". If it still closes,
                check that your antivirus is not blocking it.
              </p>
            </div>
            <div>
              <p style={{ fontWeight: 600, fontSize: "0.82rem", margin: "0 0 4px" }}>Default companion address</p>
              <p style={{ margin: "0 0 4px", fontSize: "0.8rem", color: "rgba(255,255,255,0.45)" }}>
                The companion listens on:
              </p>
              <div style={{
                padding: "6px 10px", borderRadius: 6,
                background: "rgba(0,0,0,0.3)", fontFamily: "monospace", fontSize: "0.8rem",
                color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.07)",
              }}>
                {BRIDGE_DEFAULT_URL}
              </div>
            </div>
          </div>
        </Collapsible>

      </div>
    </div>
  );
}

// ???? Companion status pill ??????????????????????????????????????????????????????????????????????????????????????????????????

function CompanionPill({ status, onClick }) {
  const colors = {
    running:   { bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.35)", dot: "#22c55e",  text: "Running" },
    start:     { bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.35)", dot: "#f59e0b", text: "Companion Setup" },
    configure: { bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.35)",  dot: "rgba(239,68,68,0.8)", text: "Configure" },
    checking:  { bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.1)", dot: "rgba(255,255,255,0.25)", text: "Checking..." },
  };
  const c = colors[status] || colors.checking;

  return (
    <button
      onClick={onClick}
      disabled={status === "checking"}
      style={{
        all: "unset",
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "3px 10px", borderRadius: 20,
        background: c.bg, border: `1px solid ${c.border}`,
        cursor: status === "checking" ? "default" : "pointer",
        fontSize: "0.78rem", fontWeight: 600,
        color: c.dot,
        transition: "opacity 0.15s",
        userSelect: "none",
      }}
    >
      <span style={{ fontSize: "0.6rem" }}>&#x25CF;</span>
      {c.text}
    </button>
  );
}

// ???? Pull progress bar ??????????????????????????????????????????????????????????????????????????????????????????????????????????

function PullProgressBar({ percent, status }) {
  const pct = percent != null ? percent : null;
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 3, background: "var(--arc-accent)",
          width: pct != null ? `${pct}%` : "30%",
          transition: pct != null ? "width 0.4s ease" : "none",
          animation: pct == null ? "pulse 1.5s ease-in-out infinite" : "none",
        }} />
      </div>
      <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", margin: "5px 0 0" }}>
        {pct != null ? `${pct}% \u2014 ${status || "downloading\u2026"}` : (status || "Preparing download\u2026")}
      </p>
    </div>
  );
}

// ???? System badge ????????????????????????????????????????????????????????????????????????????????????????????????????????????????????

function SystemBadge({ diag }) {
  if (!diag) return null;
  return (
    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 3 }}>
      {diag.has_nvidia_gpu ? (
        <p style={{ fontSize: "0.78rem", color: "var(--arc-accent)", margin: 0 }}>
          NVIDIA GPU detected \u2014 AI will run fast.
        </p>
      ) : (
        <p style={{ fontSize: "0.78rem", color: "#f59e0b", margin: 0 }}>
          No NVIDIA GPU \u2014 AI will run on CPU (slower but supported).
        </p>
      )}
      {diag.cpu_count > 0 && (
        <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.35)", margin: 0 }}>
          {diag.cpu_count} CPU threads &middot; {diag.platform}
        </p>
      )}
    </div>
  );
}

// ???? Main component ????????????????????????????????????????????????????????????????????????????????????????????????????????????????

export default function ModelConfig({ config, onConfigChange }) {
  const companionDl = getCompanionDownload();

  // ???? Companion status (workspace-level) ??????????????????????????????????????????????????????????????????????
  const [companionStatus, setCompanionStatus] = useState("checking"); // checking|running|start|configure
  const [savedCompanionPath, setSavedCompanionPath] = useState(getSavedCompanionPath());
  const [companionOverlayOpen, setCompanionOverlayOpen] = useState(false);

  // ???? Overlays ??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
  const [modalOpen, setModalOpen]               = useState(false);
  const [testedModelsOpen, setTestedModelsOpen] = useState(false);
  const [tab, setTab]                           = useState("local");

  // ???? Edit Model state machine ????????????????????????????????????????????????????????????????????????????????????????????
  const [uiState, setUiState]       = useState(null);
  const [statusMsg, setStatusMsg]   = useState("");
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedModel, setSelectedModel]     = useState("");
  const [diagInfo, setDiagInfo]               = useState(null);
  const [pullPercent, setPullPercent]   = useState(null);
  const [pullStatus, setPullStatus]     = useState("");
  const [pullModel_, setPullModel_]     = useState(RECOMMENDED_MODEL);
  const cancelPullRef = useRef(null);
  const [showAdvanced, setShowAdvanced]         = useState(false);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  const [localEndpoint, setLocalEndpoint]       = useState(BRIDGE_DEFAULT_URL);
  const [terminalOpening, setTerminalOpening]   = useState(false);

  // ???? Provider ????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
  const [providerName, setProviderName] = useState("");
  const [providerKey, setProviderKey]   = useState("");

  // ???? Companion status check ????????????????????????????????????????????????????????????????????????????????????????????????
  const checkCompanionStatus = useCallback(async () => {
    setCompanionStatus("checking");
    const diag = await getDiagnostics(BRIDGE_DEFAULT_URL);
    if (diag) {
      setCompanionStatus("running");
    } else {
      const path = getSavedCompanionPath();
      setCompanionStatus(path ? "start" : "configure");
    }
  }, []);

  // Check on mount
  useEffect(() => { checkCompanionStatus(); }, [checkCompanionStatus]);

  // ???? Companion pill click ????????????????????????????????????????????????????????????????????????????????????????????????????
  const handleCompanionPillClick = () => {
    // "start" = saved path exists but bridge not reachable.
    // In Electron we can launch the executable directly.
    // In a plain browser we cannot spawn processes, so fall through to the overlay.
    if (companionStatus === "start" && savedCompanionPath) {
      const isElectron = !!(
        typeof window !== "undefined" &&
        window.process &&
        window.process.versions &&
        window.process.versions.electron
      );

      if (isElectron) {
        try {
          const fs    = window.require("fs");
          const child = window.require("child_process");

          if (!fs.existsSync(savedCompanionPath)) {
            // Saved path no longer valid — reset and open setup
            clearCompanionPath();
            setSavedCompanionPath("");
            checkCompanionStatus();
            setCompanionOverlayOpen(true);
            return;
          }

          // Launch the companion detached so it outlives the renderer
          const proc = child.spawn(savedCompanionPath, [], {
            detached: true,
            stdio: "ignore",
          });
          proc.unref();

          // Re-check status after a short delay to update the pill automatically
          setTimeout(() => checkCompanionStatus(), 3000);
          return; // do NOT open the overlay — companion is being launched
        } catch (err) {
          // Launch attempt failed — fall through to overlay so user can troubleshoot
          console.error("[Companion] launch failed:", err);
          setCompanionOverlayOpen(true);
          return;
        }
      }
      // Browser: cannot launch; open overlay (existing behaviour)
    }

    setCompanionOverlayOpen(true);
  };

  // ???? Edit Model: open modal ??????????????????????????????????????????????????????????????????????????????????????????????????

  const handleOpen = async () => {
    if (config?.type === "provider") {
      setTab("provider");
      setProviderName(config.providerName || "");
      setProviderKey(config.providerKey || "");
      setModalOpen(true);
      return;
    }

    setTab("local");
    const ep = isLegacyOllamaEndpoint(config?.endpoint)
      ? BRIDGE_DEFAULT_URL
      : (config?.endpoint || BRIDGE_DEFAULT_URL);
    setLocalEndpoint(ep);
    setSelectedModel(config?.model || "");
    setShowAdvanced(false);
    setShowTroubleshooting(false);
    setModalOpen(true);

    await runDetection(ep, config?.model || "");
  };

  // ???? Full detection flow ??????????????????????????????????????????????????????????????????????????????????????????????????????

  const runDetection = async (endpoint = localEndpoint, currentModel = selectedModel) => {
    const base = endpoint.replace(/\/$/, "");
    setUiState("CHECKING");
    setStatusMsg("Checking your local AI\u2026");
    setAvailableModels([]);
    setDiagInfo(null);

    const diag = await getDiagnostics(base);

    if (!diag) {
      if (config?.type === "local" && config?.model) {
        setUiState("CHECK_FAILED_TEMP");
        setStatusMsg("Could not reach the NEXIS Companion right now.");
      } else {
        setUiState("COMPANION_NOT_RUNNING");
        setStatusMsg("Start the NEXIS Companion to use local AI.");
      }
      // Also refresh companion pill status
      checkCompanionStatus();
      return;
    }

    setDiagInfo(diag);
    // Companion is reachable ?? update pill
    setCompanionStatus("running");

    if (!diag.ollama_installed) {
      setUiState("OLLAMA_NOT_INSTALLED");
      setStatusMsg("Ollama needs to be installed on your computer.");
      return;
    }

    if (!diag.ollama_running) {
      setUiState("OLLAMA_NOT_RUNNING");
      setStatusMsg("Ollama is installed but not open. NEXIS can open it for you.");
      return;
    }

    const models = Array.isArray(diag.models) ? diag.models : [];
    if (models.length === 0) {
      setUiState("NO_MODELS");
      setPullModel_(diag.recommended_model || RECOMMENDED_MODEL);
      setStatusMsg("No AI model found. NEXIS can download one for you.");
      return;
    }

    setAvailableModels(models);
    let chosen = currentModel;
    if (chosen && !models.includes(chosen)) chosen = models[0];
    if (!chosen) chosen = models[0];
    setSelectedModel(chosen);
    setUiState("MODEL_READY");
    setStatusMsg("");
  };

  // ???? Action handlers ??????????????????????????????????????????????????????????????????????????????????????????????????????????????

  const handleStartOllama = async () => {
    setUiState("OLLAMA_STARTING");
    setStatusMsg("Opening Ollama\u2026 this may take up to 20 seconds.");
    const result = await startOllama(localEndpoint);
    if (result.error || !result.ollamaNowRunning) {
      setUiState("OLLAMA_HUNG");
      setStatusMsg("Ollama did not start in time. Try restarting it.");
      return;
    }
    await runDetection(localEndpoint, selectedModel);
  };

  const handleRestartOllama = async () => {
    setUiState("OLLAMA_STARTING");
    setStatusMsg("Restarting Ollama\u2026");
    const result = await restartOllama(localEndpoint);
    if (result.error || !result.ollamaNowRunning) {
      setUiState("OLLAMA_HUNG");
      setStatusMsg("Restart did not complete. Try closing Ollama manually, then click Recheck.");
      return;
    }
    await runDetection(localEndpoint, selectedModel);
  };

  const handleDownloadModel = async () => {
    setUiState("PULLING_MODEL");
    setPullPercent(null);
    setPullStatus("Starting download\u2026");
    const model = pullModel_ || RECOMMENDED_MODEL;
    const result = await pullModel(model, localEndpoint);
    if (result.error || !result.started) {
      setUiState("PULL_FAILED");
      setStatusMsg(result.error || "Download could not start. Make sure Ollama is open.");
      return;
    }
    cancelPullRef.current = subscribePullProgress(
      result.jobId, localEndpoint,
      ({ status, percent }) => { setPullPercent(percent); setPullStatus(status || "Downloading\u2026"); },
      async ({ success, error }) => {
        cancelPullRef.current = null;
        if (!success) {
          setUiState("PULL_FAILED");
          setStatusMsg(error || "Download failed. Check that Ollama is open and try again.");
          return;
        }
        await runDetection(localEndpoint, model);
      }
    );
  };

  const handleCancelPull = () => {
    if (cancelPullRef.current) { cancelPullRef.current(); cancelPullRef.current = null; }
    setUiState("NO_MODELS");
    setStatusMsg("Download cancelled.");
  };

  useEffect(() => () => { if (cancelPullRef.current) cancelPullRef.current(); }, []);

  const handleOpenTerminal = async () => {
    if (!window.confirm(
      "This will open a Command Prompt window on your computer.\n\n" +
      "Only do this if you have been asked to by NEXIS support. Continue?"
    )) return;
    setTerminalOpening(true);
    await openTerminal(localEndpoint);
    setTerminalOpening(false);
  };

  const handleSaveLocal = () => {
    const newConfig = { type: "local", endpoint: localEndpoint, model: selectedModel };
    localStorage.setItem("nexis_model_config", JSON.stringify(newConfig));
    onConfigChange(newConfig);
    setModalOpen(false);
  };

  const handleSaveProvider = () => {
    if (!providerName.trim() || !providerKey.trim()) return;
    const newConfig = { type: "provider", providerName: providerName.trim(), providerKey: providerKey.trim() };
    localStorage.setItem("nexis_model_config", JSON.stringify(newConfig));
    onConfigChange(newConfig);
    setModalOpen(false);
  };

  const handleClear = () => {
    localStorage.removeItem("nexis_model_config");
    onConfigChange(null);
    setModalOpen(false);
  };

  const isBusy = uiState === "CHECKING" || uiState === "OLLAMA_STARTING" || uiState === "PULLING_MODEL";

  // ???? Derive model summary for workspace row ????????????????????????????????????????????????????????????????
  const modelSummary = (() => {
    if (config?.type === "provider") return `Provider \u2014 ${config.providerName || "unknown"}`;
    if (config?.type === "local" && config?.model) return config.model;
    return null;
  })();

  // ???? Render ????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????

  return (
    <>
      {/* ??????????????????????????????????????????????????????????????????????????????????????????????????????
          WORKSPACE STATUS ROW
          Priority: 1. NEXIS Companion  2. Tested Models  3. Edit Model
          ?????????????????????????????????????????????????????????????????????????????????????????????????????? */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>

        {/* 1 ?? NEXIS Companion */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>
            Companion
          </span>
          <CompanionPill status={companionStatus} onClick={handleCompanionPillClick} />
        </div>

        <span style={{ color: "rgba(255,255,255,0.12)", fontSize: "0.9rem" }}>|</span>

        {/* 2 ?? Tested Models */}
        <button
          className="btn"
          style={{ padding: "3px 12px", fontSize: "0.8rem" }}
          onClick={() => setTestedModelsOpen(true)}
        >
          Tested Models
        </button>

        {/* 3 ?? Edit Model (with optional model name) */}
        <button
          className="btn"
          style={{ padding: "3px 12px", fontSize: "0.8rem" }}
          onClick={handleOpen}
        >
          {config ? "Edit Model" : "Configure Model"}
        </button>

        {/* Model name summary (subtle, when configured) */}
        {modelSummary && (
          <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.28)", marginLeft: 2 }}>
            {modelSummary}
          </span>
        )}
      </div>

      {/* ??????????????????????????????????????????????????????????????????????????????????????????????????????
          NEXIS COMPANION OVERLAY
          ?????????????????????????????????????????????????????????????????????????????????????????????????????? */}
      {companionOverlayOpen && (
        <CompanionOverlay
          onClose={() => setCompanionOverlayOpen(false)}
          companionStatus={companionStatus}
          savedPath={savedCompanionPath}
          onPathSaved={(path) => setSavedCompanionPath(path)}
          onRecheck={async () => {
            await checkCompanionStatus();
          }}
        />
      )}

      {/* ??????????????????????????????????????????????????????????????????????????????????????????????????????
          TESTED MODELS OVERLAY
          ?????????????????????????????????????????????????????????????????????????????????????????????????????? */}
      {testedModelsOpen && (
        <TestedModelsOverlay onClose={() => setTestedModelsOpen(false)} />
      )}

      {/* ??????????????????????????????????????????????????????????????????????????????????????????????????????
          EDIT MODEL MODAL (AI Model Settings)
          ?????????????????????????????????????????????????????????????????????????????????????????????????????? */}
      {modalOpen && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.65)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 10001,
        }}>
          <div className="panel" style={{ width: 460, margin: 0, maxHeight: "90vh", overflowY: "auto" }}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>AI Model Settings</h3>
              <button className="btn" style={{ padding: "3px 10px" }} onClick={() => setModalOpen(false)}>
                &times;
              </button>
            </div>

            <div className="row" style={{ marginBottom: 20 }}>
              <button className={`btn${tab === "local" ? " active" : ""}`} onClick={() => setTab("local")}>
                Local AI
              </button>
              <button
                className={`btn${tab === "provider" ? " active" : ""}`}
                onClick={() => setTab("provider")}
                style={{ opacity: 0.7 }}
              >
                Provider Key
              </button>
            </div>

            {/* ???? LOCAL AI TAB ???? */}
            {tab === "local" && (
              <div>

                {uiState === "CHECKING" && (
                  <div>
                    <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.7)", margin: "0 0 6px" }}>
                      Checking your local AI&hellip;
                    </p>
                    <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.4)", margin: 0 }}>{statusMsg}</p>
                  </div>
                )}

                {uiState === "COMPANION_NOT_RUNNING" && (
                  <div>
                    <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.85)", margin: "0 0 8px", fontWeight: 500 }}>
                      NEXIS Companion is not running.
                    </p>
                    <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.5)", margin: "0 0 16px" }}>
                      The NEXIS Companion is a small program that enables local AI on your computer.
                      Download and run it once, then come back here.
                    </p>
                    <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                      <button
                        className="btn primary"
                        style={{ padding: "6px 14px", fontSize: "0.85rem" }}
                        onClick={() => { setModalOpen(false); setCompanionOverlayOpen(true); }}
                      >
                        Open Companion Setup
                      </button>
                      <button className="btn" style={{ padding: "6px 14px", fontSize: "0.85rem" }}
                        onClick={() => runDetection(localEndpoint, selectedModel)}>
                        Recheck
                      </button>
                    </div>
                    <p style={{ margin: "6px 0 0", fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>
                      {companionDl.supported ? `Detected platform: ${companionDl.platform}` : "Unsupported platform"}
                    </p>
                  </div>
                )}

                {uiState === "CHECK_FAILED_TEMP" && (
                  <div>
                    <p style={{ fontSize: "0.9rem", color: "#f59e0b", margin: "0 0 8px" }}>
                      Models could not be checked right now.
                    </p>
                    <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.5)", margin: "0 0 16px" }}>{statusMsg}</p>
                    <div className="row" style={{ gap: 8 }}>
                      <button className="btn" style={{ padding: "6px 14px", fontSize: "0.85rem" }}
                        onClick={() => runDetection(localEndpoint, selectedModel)}>Recheck</button>
                      <button className="btn" style={{ padding: "6px 14px", fontSize: "0.85rem" }}
                        onClick={handleRestartOllama}>Restart Ollama</button>
                    </div>
                  </div>
                )}

                {uiState === "OLLAMA_NOT_INSTALLED" && (
                  <div>
                    <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.85)", margin: "0 0 8px", fontWeight: 500 }}>
                      Ollama is not installed.
                    </p>
                    <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.5)", margin: "0 0 16px" }}>
                      Ollama is the free, open-source program that runs AI models on your computer.
                      Install it, then come back here.
                    </p>
                    <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                      <a href="https://ollama.com/download" target="_blank" rel="noreferrer"
                        className="btn primary"
                        style={{ textDecoration: "none", padding: "6px 14px", fontSize: "0.85rem" }}>
                        Install Ollama
                      </a>
                      <button className="btn" style={{ padding: "6px 14px", fontSize: "0.85rem" }}
                        onClick={() => runDetection(localEndpoint, selectedModel)}>Recheck</button>
                    </div>
                  </div>
                )}

                {uiState === "OLLAMA_NOT_RUNNING" && (
                  <div>
                    <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.85)", margin: "0 0 8px", fontWeight: 500 }}>
                      Ollama is installed but not open.
                    </p>
                    <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.5)", margin: "0 0 16px" }}>{statusMsg}</p>
                    <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                      <button className="btn primary" style={{ padding: "6px 14px", fontSize: "0.85rem" }}
                        onClick={handleStartOllama}>Start Ollama</button>
                      <button className="btn" style={{ padding: "6px 14px", fontSize: "0.85rem" }}
                        onClick={() => runDetection(localEndpoint, selectedModel)}>Recheck</button>
                    </div>
                  </div>
                )}

                {uiState === "OLLAMA_STARTING" && (
                  <div>
                    <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.7)", margin: "0 0 6px" }}>
                      Ollama is starting&hellip;
                    </p>
                    <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.4)", margin: 0 }}>{statusMsg}</p>
                  </div>
                )}

                {uiState === "OLLAMA_HUNG" && (
                  <div>
                    <p style={{ fontSize: "0.9rem", color: "#f59e0b", margin: "0 0 8px", fontWeight: 500 }}>
                      Ollama appears to be stuck.
                    </p>
                    <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.5)", margin: "0 0 16px" }}>{statusMsg}</p>
                    <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                      <button className="btn primary" style={{ padding: "6px 14px", fontSize: "0.85rem" }}
                        onClick={handleRestartOllama}>Restart Ollama</button>
                      <button className="btn" style={{ padding: "6px 14px", fontSize: "0.85rem" }}
                        onClick={() => runDetection(localEndpoint, selectedModel)}>Recheck</button>
                    </div>
                  </div>
                )}

                {uiState === "NO_MODELS" && (
                  <div>
                    <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.85)", margin: "0 0 8px", fontWeight: 500 }}>
                      No AI model found.
                    </p>
                    <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.5)", margin: "0 0 4px" }}>
                      NEXIS will download the recommended model ({pullModel_}) automatically.
                    </p>
                    {statusMsg && (
                      <p style={{ fontSize: "0.78rem", color: "#f59e0b", margin: "0 0 12px" }}>{statusMsg}</p>
                    )}
                    <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                      <button className="btn primary" style={{ padding: "6px 14px", fontSize: "0.85rem" }}
                        onClick={handleDownloadModel}>Download Recommended Model</button>
                      <button className="btn" style={{ padding: "6px 14px", fontSize: "0.85rem" }}
                        onClick={() => runDetection(localEndpoint, selectedModel)}>Recheck</button>
                    </div>
                  </div>
                )}

                {uiState === "PULLING_MODEL" && (
                  <div>
                    <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.85)", margin: "0 0 4px", fontWeight: 500 }}>
                      Downloading AI model&hellip;
                    </p>
                    <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.45)", margin: "0 0 8px" }}>
                      {pullModel_} &mdash; this may take several minutes depending on your internet speed.
                    </p>
                    <PullProgressBar percent={pullPercent} status={pullStatus} />
                    <button className="btn" style={{ marginTop: 14, padding: "5px 12px", fontSize: "0.82rem" }}
                      onClick={handleCancelPull}>Cancel</button>
                  </div>
                )}

                {uiState === "PULL_FAILED" && (
                  <div>
                    <p style={{ fontSize: "0.9rem", color: "rgba(239,68,68,0.9)", margin: "0 0 8px", fontWeight: 500 }}>
                      Download failed.
                    </p>
                    <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.5)", margin: "0 0 16px" }}>{statusMsg}</p>
                    <div className="row" style={{ gap: 8 }}>
                      <button className="btn primary" style={{ padding: "6px 14px", fontSize: "0.85rem" }}
                        onClick={handleDownloadModel}>Try Again</button>
                      <button className="btn" style={{ padding: "6px 14px", fontSize: "0.85rem" }}
                        onClick={() => runDetection(localEndpoint, selectedModel)}>Recheck</button>
                    </div>
                  </div>
                )}

                {uiState === "MODEL_READY" && (
                  <div>
                    <p style={{ fontSize: "0.9rem", color: "var(--arc-accent)", margin: "0 0 4px", fontWeight: 500 }}>
                      Local AI is ready.
                    </p>
                    <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.4)", margin: "0 0 14px" }}>
                      {availableModels.length} model{availableModels.length !== 1 ? "s" : ""} available.
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                      {availableModels.map((m) => (
                        <button
                          key={m}
                          className={`btn${selectedModel === m ? " active" : ""}`}
                          style={{ textAlign: "left", padding: "6px 12px", fontSize: "0.85rem", justifyContent: "flex-start" }}
                          onClick={() => setSelectedModel(m)}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                    <SystemBadge diag={diagInfo} />
                    <button className="btn" style={{ marginTop: 14, padding: "5px 12px", fontSize: "0.82rem" }}
                      onClick={() => runDetection(localEndpoint, selectedModel)} disabled={isBusy}>
                      Recheck
                    </button>
                  </div>
                )}

                {/* ???? Advanced ???? */}
                <div style={{ marginTop: 22, borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 14 }}>
                  <button
                    style={{ all: "unset", cursor: "pointer", fontSize: "0.78rem", color: "rgba(255,255,255,0.3)", textDecoration: "underline", textUnderlineOffset: 3 }}
                    onClick={() => setShowAdvanced((v) => !v)}
                  >
                    {showAdvanced ? "\u25be Hide Advanced" : "\u25b8 Advanced"}
                  </button>

                  {showAdvanced && (
                    <div style={{ marginTop: 10 }}>
                      <label style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 5 }}>
                        NEXIS Companion URL
                      </label>
                      <input
                        value={localEndpoint}
                        onChange={(e) => {
                          setLocalEndpoint(e.target.value);
                          setUiState(null);
                          setAvailableModels([]);
                          setSelectedModel("");
                        }}
                        placeholder={BRIDGE_DEFAULT_URL}
                        style={{ marginBottom: 6, fontSize: "0.82rem" }}
                      />
                      <p className="subtle" style={{ fontSize: "0.75rem", margin: "0 0 10px" }}>
                        Default: {BRIDGE_DEFAULT_URL}. Change only if you run the companion on a custom port.
                      </p>
                      <button className="btn" style={{ padding: "4px 12px", fontSize: "0.8rem" }}
                        onClick={() => runDetection(localEndpoint, selectedModel)} disabled={isBusy}>
                        Recheck with this URL
                      </button>

                      <div style={{ marginTop: 14 }}>
                        <button
                          style={{ all: "unset", cursor: "pointer", fontSize: "0.75rem", color: "rgba(255,255,255,0.25)", textDecoration: "underline", textUnderlineOffset: 3 }}
                          onClick={() => setShowTroubleshooting((v) => !v)}
                        >
                          {showTroubleshooting ? "\u25be Hide Troubleshooting" : "\u25b8 Troubleshooting"}
                        </button>

                        {showTroubleshooting && (
                          <div style={{ marginTop: 10, padding: "10px 12px", background: "rgba(255,255,255,0.04)", borderRadius: 6 }}>
                            {diagInfo && (
                              <div style={{ marginBottom: 10 }}>
                                <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", margin: "0 0 3px" }}>
                                  Companion v{diagInfo.bridge_version || "\u2014"} &middot; {diagInfo.platform || "\u2014"} &middot; {diagInfo.cpu_count || 0} CPUs
                                </p>
                                <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", margin: "0 0 3px" }}>
                                  Ollama path: {diagInfo.ollama_path || "not found"}
                                </p>
                                <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", margin: 0 }}>
                                  Model storage: {diagInfo.model_storage || "\u2014"}
                                </p>
                              </div>
                            )}
                            <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.25)", margin: "0 0 8px" }}>
                              Open a terminal only if NEXIS support has asked you to.
                            </p>
                            <button className="btn"
                              style={{ padding: "4px 12px", fontSize: "0.78rem", color: "rgba(255,255,255,0.4)" }}
                              onClick={handleOpenTerminal} disabled={terminalOpening}>
                              {terminalOpening ? "Opening\u2026" : "Open Command Prompt"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* ???? Save / Clear ???? */}
                <div className="row" style={{ marginTop: 20, justifyContent: "flex-end" }}>
                  {config && (
                    <button className="btn"
                      style={{ color: "rgba(239,68,68,0.7)", borderColor: "rgba(239,68,68,0.4)" }}
                      onClick={handleClear}>
                      Clear
                    </button>
                  )}
                  <button className="btn primary" onClick={handleSaveLocal}
                    disabled={!selectedModel || uiState !== "MODEL_READY"}>
                    Save
                  </button>
                </div>
              </div>
            )}

            {/* ???? PROVIDER KEY TAB ???? */}
            {tab === "provider" && (
              <div>
                <p className="subtle" style={{ fontSize: "0.82rem", marginBottom: 14 }}>
                  Use a provider API key (e.g. OpenAI, Anthropic) via the hosted backend.
                  Local AI mode is recommended for privacy and offline use.
                </p>
                <label style={{ fontSize: "0.82rem", display: "block", marginBottom: 6 }}>Provider Name</label>
                <input
                  value={providerName}
                  onChange={(e) => setProviderName(e.target.value)}
                  placeholder="e.g. OpenAI, Anthropic"
                  style={{ marginBottom: 10 }}
                />
                <label style={{ fontSize: "0.82rem", display: "block", marginBottom: 6 }}>API Key</label>
                <input
                  type="password"
                  value={providerKey}
                  onChange={(e) => setProviderKey(e.target.value)}
                  placeholder="Paste your API key"
                  style={{ marginBottom: 10 }}
                />
                <p className="subtle" style={{ fontSize: "0.78rem", marginBottom: 16 }}>
                  Key is stored locally. Do not use on shared devices.
                </p>
                <div className="row" style={{ justifyContent: "flex-end" }}>
                  {config && (
                    <button className="btn"
                      style={{ color: "rgba(239,68,68,0.7)", borderColor: "rgba(239,68,68,0.4)" }}
                      onClick={handleClear}>Clear</button>
                  )}
                  <button className="btn primary" onClick={handleSaveProvider}
                    disabled={!providerName.trim() || !providerKey.trim()}>
                    Save
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}
