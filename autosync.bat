@echo off
setlocal

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0autosync.ps1"
if errorlevel 1 (
	echo.
	echo Autosync stopped with an error.
	pause
)

endlocal