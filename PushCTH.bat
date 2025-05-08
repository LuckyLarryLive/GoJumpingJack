@echo off
echo Starting Git push process for CryptoTeaHouse...

:: Change to the project directory
cd /d "C:\Users\Larry\CTH"

:: Check if Git is installed
where git >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: Git is not installed or not in PATH
    echo Please install Git from https://git-scm.com/downloads
    pause
    exit /b 1
)

:: Check if this is a git repository
git rev-parse --is-inside-work-tree >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: This directory is not a git repository
    pause
    exit /b 1
)

:: Get commit message
set /p msg=Enter commit message: 

:: Add all changes
echo Adding changes...
git add .
if %ERRORLEVEL% neq 0 (
    echo Error: Failed to add changes
    pause
    exit /b 1
)

:: Commit changes
echo Committing changes...
git commit -m "%msg%"
if %ERRORLEVEL% neq 0 (
    echo Error: Failed to commit changes
    pause
    exit /b 1
)

:: Push changes
echo Pushing to remote repository...
git push
if %ERRORLEVEL% neq 0 (
    echo Error: Failed to push changes
    pause
    exit /b 1
)

echo Successfully pushed changes to GitHub!
pause 