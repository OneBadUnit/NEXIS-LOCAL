#!/usr/bin/env bash
set -e

echo "================================================"
echo " NEXIS Companion - Multi-Platform Build"
echo "================================================"
echo ""
echo " This script builds NEXIS Companion from source."
echo " Go is required only to BUILD -- end-users do not need Go."
echo ""

[ -f go.mod ] || go mod init nexis-bridge

mkdir -p dist/windows dist/macos dist/linux

echo " Building: Windows (amd64)..."
GOOS=windows GOARCH=amd64 go build -ldflags="-s -w" -o "dist/windows/NEXIS Companion.exe" .

echo " Building: macOS (amd64)..."
GOOS=darwin  GOARCH=amd64 go build -ldflags="-s -w" -o dist/macos/nexis-bridge .

echo " Building: Linux (amd64)..."
GOOS=linux   GOARCH=amd64 go build -ldflags="-s -w" -o dist/linux/nexis-bridge .

chmod +x dist/macos/nexis-bridge dist/linux/nexis-bridge

echo ""
echo " Done."
echo "   dist/windows/NEXIS Companion.exe"
echo "   dist/macos/nexis-bridge"
echo "   dist/linux/nexis-bridge"
echo ""
echo " Windows : distribute dist/windows/NEXIS Companion.exe"
echo " Mac     : distribute dist/macos/nexis-bridge"
echo " Linux   : distribute dist/linux/nexis-bridge"
echo ""
echo " If Go is not installed: https://go.dev/dl/"
