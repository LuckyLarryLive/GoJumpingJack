@echo off
echo Starting CryptoTeaHouse development server...

:: Change to the project directory
cd /d "C:\Users\Larry\CTH"

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Check if node_modules exists, if not install dependencies
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo Error: Failed to install dependencies
        pause
        exit /b 1
    )
)

:: Start the development server
echo Starting development server...
call npm run dev

:: If the server fails to start
if %ERRORLEVEL% neq 0 (
    echo Error: Failed to start development server
    pause
    exit /b 1
)

pause 