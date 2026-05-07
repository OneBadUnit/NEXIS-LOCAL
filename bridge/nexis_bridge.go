// ============================================================
// NEXIS LOCAL COMPANION — Health Manager + Bridge Server
// File: bridge/nexis_bridge.go
// Version: 002 (user-first: start/restart Ollama, pull models)
//
// Purpose:
//   This is not just a proxy. It is the local AI health
//   manager for NEXIS. It detects Ollama, starts/restarts it,
//   pulls models, reports progress, and provides diagnostics —
//   so normal users never need a terminal.
//
// Build:
//   go build -ldflags="-s -w" -o nexis-bridge.exe nexis_bridge.go  (Windows)
//   go build -ldflags="-s -w" -o nexis-bridge       nexis_bridge.go  (Mac/Linux)
//
// Endpoints:
//   GET  /health                          — companion + Ollama status
//   GET  /diagnostics                     — full system state snapshot
//   GET  /ollama/find                     — search known install paths
//   POST /ollama/start                    — start Ollama if installed
//   POST /ollama/restart                  — kill + restart Ollama
//   GET  /models                          — list available models
//   POST /models/pull                     — start async model pull
//   GET  /models/pull/progress?job=<id>  — SSE stream of pull progress
//   POST /generate                        — run prompt through Ollama
//   GET  /system                          — system info (CPU, GPU, paths)
//   POST /diagnostics/open-terminal       — last resort: open OS terminal
//
// Uses Go stdlib only — no external modules required.
// ============================================================

package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"time"
)

// ── Constants ─────────────────────────────────────────────────────────────

const (
	bridgeVersion    = "2.0.0"
	bridgePort       = "8765"
	ollamaBase       = "http://localhost:11434"
	httpTimeout      = 180 * time.Second
	ollamaStartWait  = 20 * time.Second // max time to wait for ollama to come up
	recommendedModel = "llama3.1:8b"
)

// Trusted frontend origins.
var trustedOrigins = []string{
	"https://nexis-psi.vercel.app",
	"http://localhost:3000",
	"http://localhost:5173",
	"http://127.0.0.1:3000",
	"http://127.0.0.1:5173",
}

const vercelPreviewSuffix = ".vercel.app"

// Known Ollama install paths per platform.
var ollamaSearchPaths = func() []string {
	switch runtime.GOOS {
	case "windows":
		home, _ := os.UserHomeDir()
		return []string{
			filepath.Join(home, "AppData", "Local", "Programs", "Ollama", "ollama.exe"),
			`C:\Program Files\Ollama\ollama.exe`,
			`C:\Program Files (x86)\Ollama\ollama.exe`,
		}
	case "darwin":
		return []string{
			"/usr/local/bin/ollama",
			"/opt/homebrew/bin/ollama",
			"/Applications/Ollama.app/Contents/MacOS/ollama",
		}
	default: // linux
		return []string{
			"/usr/local/bin/ollama",
			"/usr/bin/ollama",
		}
	}
}()

// ── Pull job tracking ──────────────────────────────────────────────────────

type pullEvent struct {
	Status    string `json:"status"`
	Completed int64  `json:"completed,omitempty"`
	Total     int64  `json:"total,omitempty"`
	Done      bool   `json:"done,omitempty"`
	Error     string `json:"error,omitempty"`
}

type pullJob struct {
	mu     sync.Mutex
	events []pullEvent
	done   bool
}

var (
	pullJobsMu sync.Mutex
	pullJobs   = map[string]*pullJob{}
	pullJobSeq int
)

func newPullJob() (string, *pullJob) {
	pullJobsMu.Lock()
	defer pullJobsMu.Unlock()
	pullJobSeq++
	id := fmt.Sprintf("pull_%d_%d", pullJobSeq, time.Now().UnixNano())
	j := &pullJob{}
	pullJobs[id] = j
	return id, j
}

func (j *pullJob) append(ev pullEvent) {
	j.mu.Lock()
	defer j.mu.Unlock()
	j.events = append(j.events, ev)
	if ev.Done || ev.Error != "" {
		j.done = true
	}
}

func (j *pullJob) snapshot() ([]pullEvent, bool) {
	j.mu.Lock()
	defer j.mu.Unlock()
	cp := make([]pullEvent, len(j.events))
	copy(cp, j.events)
	return cp, j.done
}

// ── CORS ──────────────────────────────────────────────────────────────────

func isAllowedOrigin(origin string) bool {
	for _, o := range trustedOrigins {
		if strings.EqualFold(origin, o) {
			return true
		}
	}
	lower := strings.ToLower(origin)
	return strings.HasPrefix(lower, "https://") && strings.HasSuffix(lower, vercelPreviewSuffix)
}

func setCORSHeaders(w http.ResponseWriter, r *http.Request) {
	origin := r.Header.Get("Origin")
	if origin == "" {
		return
	}
	if isAllowedOrigin(origin) {
		w.Header().Set("Access-Control-Allow-Origin", origin)
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.Header().Set("Vary", "Origin")
	}
}

func handlePreflight(w http.ResponseWriter, r *http.Request) bool {
	if r.Method != http.MethodOptions {
		return false
	}
	setCORSHeaders(w, r)
	w.WriteHeader(http.StatusNoContent)
	return true
}

// ── Ollama helpers ─────────────────────────────────────────────────────────

// ollamaReachable checks if Ollama answers /api/tags within 3s.
func ollamaReachable() bool {
	client := &http.Client{Timeout: 3 * time.Second}
	resp, err := client.Get(ollamaBase + "/api/tags")
	if err != nil {
		return false
	}
	resp.Body.Close()
	return resp.StatusCode == http.StatusOK
}

// ollamaReachableWithRetry polls until Ollama responds or timeout elapses.
func ollamaReachableWithRetry(timeout time.Duration) bool {
	deadline := time.Now().Add(timeout)
	for time.Now().Before(deadline) {
		if ollamaReachable() {
			return true
		}
		time.Sleep(1 * time.Second)
	}
	return false
}

// findOllamaPath returns the path to the ollama binary.
// Tries PATH first, then known install directories.
func findOllamaPath() string {
	// PATH first
	if p, err := exec.LookPath("ollama"); err == nil {
		return p
	}
	// Known paths
	for _, p := range ollamaSearchPaths {
		if _, err := os.Stat(p); err == nil {
			return p
		}
	}
	return ""
}

func ollamaInstalled() bool {
	return findOllamaPath() != ""
}

// modelStoragePath returns the directory where Ollama stores models.
func modelStoragePath() string {
	if v := os.Getenv("OLLAMA_MODELS"); v != "" {
		return v
	}
	home, _ := os.UserHomeDir()
	switch runtime.GOOS {
	case "windows":
		return filepath.Join(home, ".ollama", "models")
	default:
		return filepath.Join(home, ".ollama", "models")
	}
}

// listModels fetches available model names from Ollama.
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

// ── JSON helpers ───────────────────────────────────────────────────────────

type errorResponse struct {
	Error string `json:"error"`
	Code  string `json:"code"`
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg, code string) {
	writeJSON(w, status, errorResponse{Error: msg, Code: code})
}

// ── GET /health ────────────────────────────────────────────────────────────

func healthHandler(w http.ResponseWriter, r *http.Request) {
	if handlePreflight(w, r) {
		return
	}
	setCORSHeaders(w, r)

	installed := ollamaInstalled()
	running := ollamaReachable()
	ollamaPath := findOllamaPath()

	writeJSON(w, http.StatusOK, map[string]any{
		"status":           "ok",
		"bridge_version":   bridgeVersion,
		"ollama_installed": installed,
		"ollama_path":      ollamaPath,
		"ollama_reachable": running,
		"model_storage":    modelStoragePath(),
		"recommended_model": recommendedModel,
	})
}

// ── GET /diagnostics ───────────────────────────────────────────────────────

func diagnosticsHandler(w http.ResponseWriter, r *http.Request) {
	if handlePreflight(w, r) {
		return
	}
	setCORSHeaders(w, r)

	installed := ollamaInstalled()
	running := ollamaReachable()
	ollamaPath := findOllamaPath()

	var models []string
	if running {
		models = listModels()
	}

	// Ollama version (best-effort)
	ollamaVersion := ""
	if installed {
		if out, err := exec.Command(ollamaPath, "--version").Output(); err == nil {
			ollamaVersion = strings.TrimSpace(string(out))
		}
	}

	_, nvidiaSmiErr := exec.LookPath("nvidia-smi")
	hasNvidiaGPU := nvidiaSmiErr == nil

	writeJSON(w, http.StatusOK, map[string]any{
		"companion_ok":     true,
		"bridge_version":   bridgeVersion,
		"ollama_installed": installed,
		"ollama_path":      ollamaPath,
		"ollama_running":   running,
		"ollama_version":   ollamaVersion,
		"models":           models,
		"model_storage":    modelStoragePath(),
		"has_nvidia_gpu":   hasNvidiaGPU,
		"cpu_count":        runtime.NumCPU(),
		"platform":         runtime.GOOS,
		"recommended_model": recommendedModel,
	})
}

// ── GET /ollama/find ───────────────────────────────────────────────────────

func ollamaFindHandler(w http.ResponseWriter, r *http.Request) {
	if handlePreflight(w, r) {
		return
	}
	setCORSHeaders(w, r)

	path := findOllamaPath()
	searched := make([]string, len(ollamaSearchPaths))
	copy(searched, ollamaSearchPaths)

	writeJSON(w, http.StatusOK, map[string]any{
		"found":          path != "",
		"path":           path,
		"searched_paths": searched,
	})
}

// ── POST /ollama/start ────────────────────────────────────────────────────

func ollamaStartHandler(w http.ResponseWriter, r *http.Request) {
	if handlePreflight(w, r) {
		return
	}
	setCORSHeaders(w, r)
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "POST required", "METHOD_NOT_ALLOWED")
		return
	}

	// Already running?
	if ollamaReachable() {
		writeJSON(w, http.StatusOK, map[string]any{
			"started":          false,
			"already_running":  true,
			"ollama_now_running": true,
			"waited_ms":        0,
		})
		return
	}

	ollamaPath := findOllamaPath()
	if ollamaPath == "" {
		writeError(w, http.StatusServiceUnavailable,
			"Ollama is not installed. Download it at ollama.com/download.",
			"OLLAMA_NOT_INSTALLED")
		return
	}

	// Start ollama serve detached
	var cmd *exec.Cmd
	if runtime.GOOS == "windows" {
		// On Windows use START to detach from the console
		cmd = exec.Command("cmd", "/C", "start", "", ollamaPath, "serve")
	} else {
		cmd = exec.Command(ollamaPath, "serve")
		cmd.SysProcAttr = sysProcAttrDetach()
	}
	cmd.Stdout = nil
	cmd.Stderr = nil
	if err := cmd.Start(); err != nil {
		writeError(w, http.StatusInternalServerError,
			"Could not start Ollama. Try opening it manually.",
			"START_FAILED")
		return
	}

	// Poll until reachable or timeout
	start := time.Now()
	nowRunning := ollamaReachableWithRetry(ollamaStartWait)
	waitedMs := time.Since(start).Milliseconds()

	writeJSON(w, http.StatusOK, map[string]any{
		"started":           true,
		"already_running":   false,
		"ollama_now_running": nowRunning,
		"waited_ms":         waitedMs,
	})
}

// ── POST /ollama/restart ──────────────────────────────────────────────────

func ollamaRestartHandler(w http.ResponseWriter, r *http.Request) {
	if handlePreflight(w, r) {
		return
	}
	setCORSHeaders(w, r)
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "POST required", "METHOD_NOT_ALLOWED")
		return
	}

	ollamaPath := findOllamaPath()
	if ollamaPath == "" {
		writeError(w, http.StatusServiceUnavailable,
			"Ollama is not installed.",
			"OLLAMA_NOT_INSTALLED")
		return
	}

	// Kill existing Ollama process
	killErr := killOllama()
	if killErr != nil {
		// Non-fatal: it may not have been running; proceed to start anyway.
		fmt.Fprintf(os.Stderr, "[companion] kill ollama: %v\n", killErr)
	}

	// Brief pause to let the port free up
	time.Sleep(1 * time.Second)

	// Start fresh
	var cmd *exec.Cmd
	if runtime.GOOS == "windows" {
		cmd = exec.Command("cmd", "/C", "start", "", ollamaPath, "serve")
	} else {
		cmd = exec.Command(ollamaPath, "serve")
		cmd.SysProcAttr = sysProcAttrDetach()
	}
	if err := cmd.Start(); err != nil {
		writeError(w, http.StatusInternalServerError,
			"Could not restart Ollama. Try opening it manually.",
			"START_FAILED")
		return
	}

	start := time.Now()
	nowRunning := ollamaReachableWithRetry(ollamaStartWait)
	waitedMs := time.Since(start).Milliseconds()

	writeJSON(w, http.StatusOK, map[string]any{
		"restarted":          true,
		"ollama_now_running": nowRunning,
		"waited_ms":          waitedMs,
	})
}

// ── GET /models ───────────────────────────────────────────────────────────

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
		"models":           models,
		"recommended_model": recommendedModel,
	})
}

// ── POST /models/pull ─────────────────────────────────────────────────────

func modelsPullHandler(w http.ResponseWriter, r *http.Request) {
	if handlePreflight(w, r) {
		return
	}
	setCORSHeaders(w, r)
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "POST required", "METHOD_NOT_ALLOWED")
		return
	}

	if !ollamaReachable() {
		writeError(w, http.StatusServiceUnavailable,
			"Ollama is not running. Start it first.",
			"OLLAMA_NOT_RUNNING")
		return
	}

	var req struct {
		Model string `json:"model"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Model == "" {
		req.Model = recommendedModel
	}

	jobID, job := newPullJob()

	// Run pull in background goroutine
	go func() {
		client := &http.Client{Timeout: 60 * time.Minute}
		payload, _ := json.Marshal(map[string]any{
			"name":   req.Model,
			"stream": true,
		})
		resp, err := client.Post(ollamaBase+"/api/pull", "application/json", bytes.NewReader(payload))
		if err != nil {
			job.append(pullEvent{Status: "error", Error: "Could not reach Ollama.", Done: true})
			return
		}
		defer resp.Body.Close()

		scanner := bufio.NewScanner(resp.Body)
		for scanner.Scan() {
			line := scanner.Text()
			if line == "" {
				continue
			}
			var ev struct {
				Status    string `json:"status"`
				Completed int64  `json:"completed"`
				Total     int64  `json:"total"`
				Error     string `json:"error"`
			}
			if jsonErr := json.Unmarshal([]byte(line), &ev); jsonErr != nil {
				continue
			}
			done := ev.Status == "success" || ev.Error != ""
			job.append(pullEvent{
				Status:    ev.Status,
				Completed: ev.Completed,
				Total:     ev.Total,
				Error:     ev.Error,
				Done:      done,
			})
			if done {
				return
			}
		}
		// Scanner ended without success — mark done
		job.append(pullEvent{Status: "done", Done: true})
	}()

	writeJSON(w, http.StatusOK, map[string]any{
		"job_id":  jobID,
		"model":   req.Model,
		"started": true,
	})
}

// ── GET /models/pull/progress ─────────────────────────────────────────────
// SSE stream: sends events as they accumulate, then closes when done.

func modelsPullProgressHandler(w http.ResponseWriter, r *http.Request) {
	if handlePreflight(w, r) {
		return
	}
	setCORSHeaders(w, r)

	jobID := r.URL.Query().Get("job")
	if jobID == "" {
		writeError(w, http.StatusBadRequest, "job query param required", "BAD_REQUEST")
		return
	}

	pullJobsMu.Lock()
	job, ok := pullJobs[jobID]
	pullJobsMu.Unlock()
	if !ok {
		writeError(w, http.StatusNotFound, "Job not found", "NOT_FOUND")
		return
	}

	// SSE headers
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	// CORS already set above
	flusher, canFlush := w.(http.Flusher)

	sent := 0
	for {
		events, done := job.snapshot()
		for ; sent < len(events); sent++ {
			data, _ := json.Marshal(events[sent])
			fmt.Fprintf(w, "data: %s\n\n", data)
			if canFlush {
				flusher.Flush()
			}
		}
		if done {
			return
		}
		time.Sleep(300 * time.Millisecond)
	}
}

// ── POST /generate ────────────────────────────────────────────────────────

type generateRequest struct {
	Model  string `json:"model"`
	Prompt string `json:"prompt"`
}

func generateHandler(w http.ResponseWriter, r *http.Request) {
	if handlePreflight(w, r) {
		return
	}
	setCORSHeaders(w, r)

	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "POST required", "METHOD_NOT_ALLOWED")
		return
	}

	var req generateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid JSON body", "BAD_REQUEST")
		return
	}
	if req.Model == "" || req.Prompt == "" {
		writeError(w, http.StatusBadRequest, "model and prompt are required", "BAD_REQUEST")
		return
	}

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
	modelFound := false
	for _, m := range models {
		if strings.EqualFold(m, req.Model) ||
			strings.HasPrefix(strings.ToLower(m), strings.ToLower(strings.Split(req.Model, ":")[0])) {
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

	payload, _ := json.Marshal(map[string]any{
		"model":  req.Model,
		"prompt": req.Prompt,
		"stream": false,
		"options": map[string]any{
			"temperature": 0.2,
			"top_p":       0.9,
		},
	})

	client := &http.Client{Timeout: httpTimeout}
	ollamaResp, err := client.Post(ollamaBase+"/api/generate", "application/json", bytes.NewReader(payload))
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

	writeJSON(w, http.StatusOK, map[string]any{"output": output})
}

// ── GET /system ───────────────────────────────────────────────────────────

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

	_, nvidiaSmiErr := exec.LookPath("nvidia-smi")
	hasNvidiaGPU := nvidiaSmiErr == nil

	writeJSON(w, http.StatusOK, map[string]any{
		"ollama_installed": installed,
		"ollama_path":      findOllamaPath(),
		"ollama_running":   running,
		"models":           models,
		"model_storage":    modelStoragePath(),
		"platform":         runtime.GOOS,
		"cpu_count":        runtime.NumCPU(),
		"has_nvidia_gpu":   hasNvidiaGPU,
	})
}

// ── POST /diagnostics/open-terminal ──────────────────────────────────────
// LAST RESORT ONLY — gated in frontend under Advanced > Troubleshooting.
// Opens the OS default terminal for the user.

func openTerminalHandler(w http.ResponseWriter, r *http.Request) {
	if handlePreflight(w, r) {
		return
	}
	setCORSHeaders(w, r)
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "POST required", "METHOD_NOT_ALLOWED")
		return
	}

	var shell string
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "windows":
		shell = "cmd"
		cmd = exec.Command("cmd", "/C", "start", "cmd")
	case "darwin":
		shell = "Terminal"
		cmd = exec.Command("open", "-a", "Terminal")
	default:
		// Try common Linux terminal emulators
		shell = "terminal"
		for _, t := range []string{"gnome-terminal", "xterm", "konsole", "xfce4-terminal"} {
			if p, err := exec.LookPath(t); err == nil {
				cmd = exec.Command(p)
				shell = t
				break
			}
		}
		if cmd == nil {
			writeError(w, http.StatusServiceUnavailable,
				"No terminal emulator found on this system.",
				"NO_TERMINAL")
			return
		}
	}

	if err := cmd.Start(); err != nil {
		writeError(w, http.StatusInternalServerError,
			"Could not open terminal.",
			"OPEN_TERMINAL_FAILED")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"opened": true,
		"shell":  shell,
	})
}

// ── Startup status ─────────────────────────────────────────────────────────

func printStartupStatus() {
	fmt.Println("=======================================================")
	fmt.Printf("  NEXIS Local Companion  v%s\n", bridgeVersion)
	fmt.Println("=======================================================")
	fmt.Printf("  Listening on  http://localhost:%s\n", bridgePort)
	fmt.Println()

	path := findOllamaPath()
	if path != "" {
		fmt.Printf("  Ollama        found at %s\n", path)
	} else {
		fmt.Println("  Ollama        NOT FOUND — download at ollama.com/download")
	}

	if ollamaReachable() {
		models := listModels()
		fmt.Println("  Ollama        running ✓")
		if len(models) == 0 {
			fmt.Println("  Models        none — NEXIS will offer to download one")
		} else {
			fmt.Printf("  Models        %s\n", strings.Join(models, ", "))
		}
	} else if path != "" {
		fmt.Println("  Ollama        installed but not running")
		fmt.Println("                NEXIS will offer to start it for you")
	}

	fmt.Printf("  Model storage %s\n", modelStoragePath())
	fmt.Println()
	fmt.Println("  Keep this window open while using NEXIS.")
	fmt.Println("  You can minimise it — it does not need to be visible.")
	fmt.Println("=======================================================")
}

// ── Main ───────────────────────────────────────────────────────────────────

func main() {
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
	mux.HandleFunc("/diagnostics", diagnosticsHandler)
	mux.HandleFunc("/ollama/find", ollamaFindHandler)
	mux.HandleFunc("/ollama/start", ollamaStartHandler)
	mux.HandleFunc("/ollama/restart", ollamaRestartHandler)
	mux.HandleFunc("/models", modelsHandler)
	mux.HandleFunc("/models/pull", modelsPullHandler)
	mux.HandleFunc("/models/pull/progress", modelsPullProgressHandler)
	mux.HandleFunc("/generate", generateHandler)
	mux.HandleFunc("/system", systemHandler)
	mux.HandleFunc("/diagnostics/open-terminal", openTerminalHandler)

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
