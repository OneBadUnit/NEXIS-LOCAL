#!/usr/bin/env bash
set -e
echo "Building NEXIS Local Companion..."
go build -ldflags="-s -w" -o nexis-bridge nexis_bridge.go
echo ""
echo "Build successful: ./nexis-bridge"
echo "Run with: ./nexis-bridge"
