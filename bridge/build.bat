@echo off
echo Building NEXIS Local Companion for Windows...
go build -ldflags="-s -w" -o nexis-bridge.exe nexis_bridge.go
if %ERRORLEVEL% == 0 (
    echo.
    echo Build successful: nexis-bridge.exe
    echo Double-click nexis-bridge.exe to start the local companion.
) else (
    echo.
    echo Build failed. Make sure Go is installed: https://go.dev/dl/
)
pause
