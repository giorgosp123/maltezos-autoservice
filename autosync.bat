@echo off
setlocal

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0autosync.ps1"

endlocal