// +build windows

package main

import (
	"os/exec"
	"syscall"
)

// sysProcAttrDetach is a no-op on Windows — detaching is handled via
// "cmd /C start ..." in the caller, which already creates a new window.
func sysProcAttrDetach() *syscall.SysProcAttr {
	return &syscall.SysProcAttr{}
}

// killOllama terminates any running ollama.exe process on Windows.
func killOllama() error {
	cmd := exec.Command("taskkill", "/F", "/IM", "ollama.exe")
	return cmd.Run()
}
