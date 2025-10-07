@echo off
echo ====================================
echo   🚀 Launching Semester Dashboard...
echo ====================================

rem You can pass a port as first argument: run_dashboard.bat 8000
set PORT=%1
if "%PORT%"=="" set PORT=8000

rem Start the PowerShell server (visible window so you can see logs)
start "" powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start_server.ps1" -Port %PORT%

rem Give it a few seconds to start
timeout /t 2 >nul

rem Open the dashboard in the default browser
start http://localhost:%PORT%/index.html

echo ✅ Dashboard launched! 
echo (Leave this window open if you want the server running.)
pause
