@echo off
echo ========================================
echo   ARC NEXUS - NEXIS Startup
echo ========================================
echo.

REM Project root (folder containing this BAT)
set "ROOT=%~dp0"

echo Clearing NEXIS ports...

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000" ^| findstr "LISTENING"') do (
echo Killing backend PID %%a
taskkill /PID %%a /F >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
echo Killing frontend PID %%a
taskkill /PID %%a /F >nul 2>&1
)

timeout /t 2 >nul

echo.
echo Checking Ollama...
curl http://localhost:11434/ >nul 2>&1
if errorlevel 1 (
echo.
echo WARNING: Ollama does not appear to be running.
echo Start Ollama from the Start Menu or run:
echo     ollama serve
echo.
) else (
echo Ollama is running.
)

echo.
echo Starting NEXIS Backend...
if exist "%ROOT%backend\venv\Scripts\python.exe" (
    start "NEXIS Backend" cmd /k "cd /d "%ROOT%backend" && "%ROOT%backend\venv\Scripts\python.exe" -m uvicorn app.main:app --reload --host localhost --port 8000"
) else (
    start "NEXIS Backend" cmd /k "cd /d "%ROOT%backend" && python -m uvicorn app.main:app --reload --host localhost --port 8000"
)

timeout /t 3 >nul

echo.
echo Starting NEXIS Frontend...
start "NEXIS Frontend" cmd /k "cd /d "%ROOT%frontend" && set BROWSER=none&& npm start"

timeout /t 4 >nul

echo.
echo Opening NEXIS in browser...
start "" "http://localhost:3000"

echo.
echo Startup complete.
