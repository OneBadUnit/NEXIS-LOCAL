// +build !windows

package main

import (
	"os/exec"
	"syscall"
)

// sysProcAttrDetach returns a SysProcAttr that detaches the child process
// from the parent's process group on Unix-like systems.
func sysProcAttrDetach() *syscall.SysProcAttr {
	return &syscall.SysProcAttr{Setsid: true}
}

// killOllama terminates any running ollama process.
func killOllama() error {
	cmd := exec.Command("pkill", "-x", "ollama")
	return cmd.Run()
}
