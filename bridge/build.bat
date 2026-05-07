@echo off
setlocal

echo ================================================
echo  NEXIS Companion - Windows Build
echo ================================================
echo.
echo  This script builds NEXIS Companion.exe from source.
echo  Go is required only to BUILD the companion.
echo  Normal users do NOT need Go to run NEXIS Companion.
echo.

if not exist go.mod go mod init nexis-bridge

if not exist dist\windows mkdir dist\windows

set GOOS=windows
set GOARCH=amd64

go build -ldflags="-s -w" -o "dist\windows\NEXIS Companion.exe" .

if %ERRORLEVEL% == 0 (
    echo.
    echo  Build successful:
    echo    dist\windows\NEXIS Companion.exe
    echo.
    echo  Distribute NEXIS Companion.exe to Windows users.
    echo  They double-click it -- no installation needed.
) else (
    echo.
    echo  Build FAILED.
    echo.
    echo  Go is not installed or not on PATH.
    echo.
    echo  To build NEXIS Companion you need Go installed on YOUR machine.
    echo  Normal end-users do NOT need Go -- only developers building from source.
    echo.
    echo  Install Go from:  https://go.dev/dl/
    echo  After installing, close this window and run build.bat again.
    echo.
    echo  Opening the Go download page now...
    start https://go.dev/dl/
)

echo.
pause
endlocal
