@echo off
echo Building NEXIS Local Companion for Windows...
if not exist go.mod go mod init nexis-bridge
go build -ldflags="-s -w" -o nexis-bridge.exe .
if %ERRORLEVEL% == 0 (
    echo.
    echo Build successful: nexis-bridge.exe
    echo Double-click nexis-bridge.exe to start the local companion.
) else (
    echo.
    echo Build failed. Make sure Go is installed: https://go.dev/dl/
)
pause
