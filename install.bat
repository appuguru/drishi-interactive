@echo off
title AnimPMS Install

echo.
echo =============================================
echo   AnimPMS - Animation Production Manager
echo          One-Click Install (Windows)
echo =============================================
echo.

:: Check Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found.
    echo Please install Node.js 20+ from https://nodejs.org
    pause & exit /b 1
)

for /f "tokens=1 delims=v." %%a in ('node -v') do set NODE_MAJOR=%%a
echo [OK] Node.js found

echo.
echo [1/2] Installing npm dependencies...
call npm install
if %errorlevel% neq 0 ( echo [ERROR] npm install failed & pause & exit /b 1 )
echo [OK] Dependencies installed

echo.
if not exist ".env.local" (
    copy .env.example .env.local >nul
    echo [OK] .env.local created from template
    echo.
    echo =============================================
    echo   ACTION REQUIRED: Edit .env.local now!
    echo =============================================
    echo.
    echo  Fill in your API keys in .env.local:
    echo   - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    echo   - CLERK_SECRET_KEY
    echo   - NEXT_PUBLIC_SUPABASE_URL
    echo   - NEXT_PUBLIC_SUPABASE_ANON_KEY
    echo   - SUPABASE_SERVICE_ROLE_KEY
    echo   - OPENAI_API_KEY
    echo.
    echo  Then run: npm run dev
    echo  Or double-click: start-dev.bat
    echo.
) else (
    echo [OK] .env.local found
    echo.
    echo [2/2] Starting development server...
    echo.
    echo  Open browser at: http://localhost:3000
    echo.
    call npm run dev
)

pause
