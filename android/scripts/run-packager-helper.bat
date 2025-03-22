@echo off
setlocal

set "THIS_DIR=%~dp0"

:: Run Metro packager with --reset-cache
node "%THIS_DIR%\..\..\node_modules\react-native\scripts\packager-reporter.js" --reset-cache

endlocal