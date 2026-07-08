@echo off
setlocal

set MSG=%*
if "%MSG%"=="" set MSG=update %date% %time%

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0publish.ps1" -Message "%MSG%"

endlocal
