@echo off
echo ====================================
echo   🚀 Launching Ultimate Pong (local server)
echo ====================================

rem Usage: run_pong.bat [port]
set PORT=%1
if "%PORT%"=="" set PORT=8000

rem Start the PowerShell server (visible window so you can see logs)
start "" powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start_pong_server.ps1" -Port %PORT%

rem Give it a brief moment to start
timeout /t 2 >nul

rem Open the game in the default browser
start http://localhost:%PORT%/index.html

echo ✅ Ultimate Pong launched on http://localhost:%PORT%/index.html
echo (Leave the PowerShell server window open to keep the server running.)
pause
