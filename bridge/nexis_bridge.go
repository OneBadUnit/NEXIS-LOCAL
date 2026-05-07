// ============================================================
// NEXIS LOCAL COMPANION — Bridge Server
// File: bridge/nexis_bridge.go
// Version: 001
//
// Single-binary HTTP bridge between the NEXIS frontend and a
// locally running Ollama instance.
//
// Why this exists:
//   Browsers cannot call http://localhost:11434 from a hosted
//   origin (e.g. https://nexis-psi.vercel.app) due to CORS.
//   This bridge runs on the user's machine, sets safe CORS
//   headers, and proxies requests to Ollama.
//
// Build:
//   go build -o nexis-bridge.exe   (Windows)
//   go build -o nexis-bridge       (Mac / Linux)
//
// Run:
//   Double-click nexis-bridge.exe  (Windows)
//   ./nexis-bridge                 (Mac / Linux)
//
// Endpoints:
//   GET  /health    — bridge + Ollama status
//   GET  /models    — list models available in Ollama
//   POST /generate  — run a prompt through Ollama
//   GET  /system    — system + Ollama diagnostic info
//
// Uses Go stdlib only — no external modules required.
// ============================================================

package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"os/exec"
	"runtime"
	"strings"
	"time"
)

// ── Constants ─────────────────────────────────────────────────────────────

const (
	bridgeVersion = "1.0.0"
	bridgePort    = "8765"
	ollamaBase    = "http://localhost:11434"
	httpTimeout   = 180 * time.Second // generous — large models can be slow
)

// Trusted frontend origins allowed to call this bridge.
// Wildcard suffix matching is used for *.vercel.app previews.
var trustedOrigins = []string{
	"https://nexis-psi.vercel.app",
	"http://localhost:3000",
	"http://localhost:5173",
	"http://127.0.0.1:3000",
	"http://127.0.0.1:5173",
}

const vercelPreviewSuffix = ".vercel.app"

// ── CORS helper ────────────────────────────────────────────────────────────

// isAllowedOrigin returns true when the request origin is in the whitelist
// or matches the *.vercel.app pattern.
func isAllowedOrigin(origin string) bool {
	for _, o := range trustedOrigins {
		if strings.EqualFold(origin, o) {
			return true
		}
	}
	// Allow all Vercel preview deployments
	lower := strings.ToLower(origin)
	if strings.HasPrefix(lower, "https://") && strings.HasSuffix(lower, vercelPreviewSuffix) {
		return true
	}
	return false
}

// setCORSHeaders writes CORS response headers when the request origin is trusted.
// Always handles preflight OPTIONS requests so the browser never gets a blocked
// preflight response.
func setCORSHeaders(w http.ResponseWriter, r *http.Request) {
	origin := r.Header.Get("Origin")
	if origin == "" {
		// Direct curl / non-browser request — allow without CORS headers
		return
	}
	if isAllowedOrigin(origin) {
		w.Header().Set("Access-Control-Allow-Origin", origin)
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.Header().Set("Vary", "Origin")
	}
}

// handlePreflight answers OPTIONS preflight and returns true when the request
// was a preflight (caller should return immediately).
func handlePreflight(w http.ResponseWriter, r *http.Request) bool {
	if r.Method != http.MethodOptions {
		return false
	}
	setCORSHeaders(w, r)
	w.WriteHeader(http.StatusNoContent)
	return true
}

// ── Ollama helpers ─────────────────────────────────────────────────────────

// ollamaReachable returns true when Ollama's /api/tags endpoint answers.
func ollamaReachable() bool {
	client := &http.Client{Timeout: 3 * time.Second}
	resp, err := client.Get(ollamaBase + "/api/tags")
	if err != nil {
		return false
	}
	resp.Body.Close()
	return resp.StatusCode == http.StatusOK
}

// ollamaInstalled returns true when the `ollama` binary is findable in PATH.
func ollamaInstalled() bool {
	_, err := exec.LookPath("ollama")
	return err == nil
}

// listModels fetches the model list from Ollama and returns model name strings.
// Returns an empty slice (never nil) on any error.
func listModels() []string {
	client := &http.Client{Timeout: 6 * time.Second}
	resp, err := client.Get(ollamaBase + "/api/tags")
	if err != nil {
		return []string{}
	}
	defer resp.Body.Close()

	var body struct {
		Models []struct {
			Name string `json:"name"`
		} `json:"models"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		return []string{}
	}

	names := make([]string, 0, len(body.Models))
	for _, m := range body.Models {
		if m.Name != "" {
			names = append(names, m.Name)
		}
	}
	return names
}

// ── Request / response types ───────────────────────────────────────────────

type generateRequest struct {
	Model  string `json:"model"`
	Prompt string `json:"prompt"`
}

type errorResponse struct {
	Error string `json:"error"`
	Code  string `json:"code"`
}

// writeJSON serialises v as JSON with the given status code.
func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

// writeError writes a structured error JSON body.
func writeError(w http.ResponseWriter, status int, msg, code string) {
	writeJSON(w, status, errorResponse{Error: msg, Code: code})
}

// ── Handlers ───────────────────────────────────────────────────────────────

// GET /health
// Returns bridge liveness and whether Ollama is reachable right now.
func healthHandler(w http.ResponseWriter, r *http.Request) {
	if handlePreflight(w, r) {
		return
	}
	setCORSHeaders(w, r)

	reachable := ollamaReachable()
	writeJSON(w, http.StatusOK, map[string]any{
		"status":           "ok",
		"bridge_version":   bridgeVersion,
		"ollama_reachable": reachable,
	})
}

// GET /models
// Returns the list of models currently available in Ollama.
func modelsHandler(w http.ResponseWriter, r *http.Request) {
	if handlePreflight(w, r) {
		return
	}
	setCORSHeaders(w, r)

	if !ollamaReachable() {
		if ollamaInstalled() {
			writeError(w, http.StatusServiceUnavailable,
				"Ollama is installed but not running.",
				"OLLAMA_NOT_RUNNING")
		} else {
			writeError(w, http.StatusServiceUnavailable,
				"Ollama is not installed.",
				"OLLAMA_NOT_INSTALLED")
		}
		return
	}

	models := listModels()
	if len(models) == 0 {
		writeError(w, http.StatusServiceUnavailable,
			"Ollama is running but no models are installed.",
			"NO_MODELS")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"models": models,
	})
}

// POST /generate
// Body: { "model": "llama3.1:8b", "prompt": "..." }
// Proxies to Ollama /api/generate and returns { "output": "..." }.
func generateHandler(w http.ResponseWriter, r *http.Request) {
	if handlePreflight(w, r) {
		return
	}
	setCORSHeaders(w, r)

	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "POST required", "METHOD_NOT_ALLOWED")
		return
	}

	// ── Parse request ──────────────────────────────────────────
	var req generateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid JSON body", "BAD_REQUEST")
		return
	}
	if req.Model == "" || req.Prompt == "" {
		writeError(w, http.StatusBadRequest, "model and prompt are required", "BAD_REQUEST")
		return
	}

	// ── Ollama availability guard ──────────────────────────────
	if !ollamaReachable() {
		if ollamaInstalled() {
			writeError(w, http.StatusServiceUnavailable,
				"Ollama is installed but not running.",
				"OLLAMA_NOT_RUNNING")
		} else {
			writeError(w, http.StatusServiceUnavailable,
				"Ollama is not installed.",
				"OLLAMA_NOT_INSTALLED")
		}
		return
	}

	// ── Model availability guard ───────────────────────────────
	models := listModels()
	modelFound := false
	for _, m := range models {
		if strings.EqualFold(m, req.Model) || strings.HasPrefix(strings.ToLower(m), strings.ToLower(strings.Split(req.Model, ":")[0])) {
			modelFound = true
			break
		}
	}
	if !modelFound {
		writeError(w, http.StatusNotFound,
			fmt.Sprintf("Model '%s' is not available in Ollama.", req.Model),
			"MODEL_NOT_AVAILABLE")
		return
	}

	// ── Proxy to Ollama ────────────────────────────────────────
	ollamaPayload := map[string]any{
		"model":  req.Model,
		"prompt": req.Prompt,
		"stream": false,
		"options": map[string]any{
			"temperature": 0.2,
			"top_p":       0.9,
		},
	}
	body, _ := json.Marshal(ollamaPayload)

	client := &http.Client{Timeout: httpTimeout}
	ollamaResp, err := client.Post(
		ollamaBase+"/api/generate",
		"application/json",
		bytes.NewReader(body),
	)
	if err != nil {
		writeError(w, http.StatusBadGateway,
			"Could not reach Ollama for generation.",
			"GENERATION_FAILED")
		return
	}
	defer ollamaResp.Body.Close()

	if ollamaResp.StatusCode != http.StatusOK {
		raw, _ := io.ReadAll(ollamaResp.Body)
		writeError(w, http.StatusBadGateway,
			fmt.Sprintf("Ollama returned %d: %s", ollamaResp.StatusCode, strings.TrimSpace(string(raw))),
			"GENERATION_FAILED")
		return
	}

	var result struct {
		Response string `json:"response"`
	}
	if err := json.NewDecoder(ollamaResp.Body).Decode(&result); err != nil {
		writeError(w, http.StatusBadGateway, "Invalid response from Ollama", "GENERATION_FAILED")
		return
	}

	output := strings.TrimSpace(result.Response)
	if output == "" {
		writeError(w, http.StatusBadGateway, "Empty response from Ollama", "GENERATION_FAILED")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"output": output,
	})
}

// GET /system
// Returns Ollama status, available models, and basic system info.
func systemHandler(w http.ResponseWriter, r *http.Request) {
	if handlePreflight(w, r) {
		return
	}
	setCORSHeaders(w, r)

	installed := ollamaInstalled()
	running := ollamaReachable()
	var models []string
	if running {
		models = listModels()
	} else {
		models = []string{}
	}

	// CPU count
	cpuCount := runtime.NumCPU()

	// Best-effort: check for NVIDIA GPU via nvidia-smi presence
	_, nvidiaSmiErr := exec.LookPath("nvidia-smi")
	hasNvidiaGPU := nvidiaSmiErr == nil

	writeJSON(w, http.StatusOK, map[string]any{
		"ollama_installed": installed,
		"ollama_running":   running,
		"models":           models,
		"platform":         runtime.GOOS,
		"cpu_count":        cpuCount,
		"has_nvidia_gpu":   hasNvidiaGPU,
	})
}

// ── Startup diagnostics ────────────────────────────────────────────────────

func printStartupStatus() {
	fmt.Println("=======================================================")
	fmt.Printf("  NEXIS Local Companion  v%s\n", bridgeVersion)
	fmt.Println("=======================================================")
	fmt.Printf("  Listening on  http://localhost:%s\n", bridgePort)
	fmt.Println()

	if ollamaInstalled() {
		fmt.Println("  Ollama        installed ✓")
	} else {
		fmt.Println("  Ollama        NOT FOUND — download at ollama.com/download")
	}

	if ollamaReachable() {
		models := listModels()
		fmt.Printf("  Ollama        running ✓\n")
		if len(models) == 0 {
			fmt.Println("  Models        none found — open Ollama and pull a model")
		} else {
			fmt.Printf("  Models        %s\n", strings.Join(models, ", "))
		}
	} else {
		fmt.Println("  Ollama        not running — open the Ollama app to start it")
	}

	fmt.Println()
	fmt.Println("  Keep this window open while using NEXIS.")
	fmt.Println("  You can minimise it — it does not need to be visible.")
	fmt.Println("=======================================================")
}

// ── Main ───────────────────────────────────────────────────────────────────

func main() {
	// Check port is not already in use
	ln, err := net.Listen("tcp", ":"+bridgePort)
	if err != nil {
		fmt.Printf("\n  ERROR: Port %s is already in use.\n", bridgePort)
		fmt.Println("  Another instance of the NEXIS Local Companion may already be running.")
		fmt.Println("  Close it and try again.")
		fmt.Println()
		fmt.Println("  Press Enter to exit.")
		fmt.Scanln()
		os.Exit(1)
	}
	ln.Close()

	printStartupStatus()

	mux := http.NewServeMux()
	mux.HandleFunc("/health", healthHandler)
	mux.HandleFunc("/models", modelsHandler)
	mux.HandleFunc("/generate", generateHandler)
	mux.HandleFunc("/system", systemHandler)

	server := &http.Server{
		Addr:         ":" + bridgePort,
		Handler:      mux,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: httpTimeout + 5*time.Second,
		IdleTimeout:  120 * time.Second,
	}

	if err := server.ListenAndServe(); err != nil {
		fmt.Fprintf(os.Stderr, "Server error: %v\n", err)
		os.Exit(1)
	}
}
