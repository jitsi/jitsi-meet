@echo off
setlocal enabledelayedexpansion

:: Set default Metro port if not already set
if "%RCT_METRO_PORT%"=="" set RCT_METRO_PORT=8081

:: Create a .packager.env file similar to the bash script
echo export RCT_METRO_PORT=%RCT_METRO_PORT% > "%~dp0\..\..\node_modules\react-native\scripts\.packager.env"

:: Reverse ADB port
adb reverse tcp:%RCT_METRO_PORT% tcp:%RCT_METRO_PORT%

:: Check if port is in use
for /f %%a in ('netstat -ano ^| findstr :%RCT_METRO_PORT% ^| findstr LISTENING') do (
    :: Attempt to check packager status
    for /f %%b in ('curl -s http://localhost:%RCT_METRO_PORT%/status ^| findstr "packager-status:running"') do (
        if "%%b"=="" (
            echo Port %RCT_METRO_PORT% already in use, packager is either not running or not running correctly
            exit /b 2
        )
    )
)

:: If no packager is running, attempt to launch
start "" "%~dp0\run-packager-helper.bat"