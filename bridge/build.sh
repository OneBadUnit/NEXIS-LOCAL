#!/usr/bin/env bash
set -e
echo "Building NEXIS Local Companion..."
[ -f go.mod ] || go mod init nexis-bridge
go build -ldflags="-s -w" -o nexis-bridge .
echo ""
echo "Build successful: ./nexis-bridge"
echo "Run with: ./nexis-bridge"
