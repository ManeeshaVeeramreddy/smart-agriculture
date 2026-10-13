@echo off
title Push SAMS to GitHub (ManeeshaVeeramreddy)
color 0B
echo ===============================================================================
echo            SMART AGRICULTURE MONITORING SYSTEM (SAMS) - GITHUB PUSHER
echo ===============================================================================
echo.
echo GitHub Account: ManeeshaVeeramreddy
echo Remote Target:  https://github.com/ManeeshaVeeramreddy/smart-agriculture.git
echo Target Branch:  main
echo.
echo IMPORTANT PREREQUISITE:
echo 1. Open your browser and go to: https://github.com/new
echo 2. Set 'Repository name' to: smart-agriculture
echo 3. Keep it Public (or Private) and DO NOT check 'Add a README file'
echo 4. Click 'Create repository'
echo.
echo ===============================================================================
set /p CONTINUE="Press Enter once you have created the empty repository on GitHub..."

echo.
echo [1/4] Staging updated files...
git add .

echo [2/4] Committing updates...
git commit -m "Final project release with complete docs, Docker, and author attribution" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo   + New commit created.
) else (
    echo   + Working tree already clean.
)

echo [3/4] Ensuring branch is 'main'...
git branch -M main

echo [4/4] Pushing to origin main...
echo.
git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===============================================================================
    echo SUCCESS: Project pushed successfully to:
    echo https://github.com/ManeeshaVeeramreddy/smart-agriculture
    echo ===============================================================================
) else (
    echo.
    echo ===============================================================================
    echo NOTE: If you saw an error above:
    echo 1. Verify you created the repo at https://github.com/new named 'smart-agriculture'
    echo 2. If prompted for GitHub login, sign in as ManeeshaVeeramreddy
    echo 3. If using Personal Access Token (PAT), paste it when prompted for password.
    echo ===============================================================================
)

pause
