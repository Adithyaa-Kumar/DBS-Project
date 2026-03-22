@echo off
REM Setup script for Data Dependency Tracker
REM Installs dependencies for both frontend and backend

echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║  Data Dependency Tracker - Setup Script               ║
echo ║  Installing dependencies...                            ║
echo ╚════════════════════════════════════════════════════════╝
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed. Please install it from https://nodejs.org/
    exit /b 1
)

echo ✓ Node.js is installed
echo.

REM Install backend dependencies
echo Installing backend dependencies...
cd backend
call npm install
if errorlevel 1 (
    echo Error: Backend installation failed
    cd ..
    exit /b 1
)
cd ..
echo ✓ Backend dependencies installed
echo.

REM Install frontend dependencies
echo Installing frontend dependencies...
cd frontend
call npm install
if errorlevel 1 (
    echo Error: Frontend installation failed
    cd ..
    exit /b 1
)
cd ..
echo ✓ Frontend dependencies installed
echo.

echo ╔════════════════════════════════════════════════════════╗
echo ║  Setup Complete!                                      ║
echo ║                                                        ║
echo ║  Next steps:                                           ║
echo ║  1. Open Terminal 1: cd backend && npm start          ║
echo ║  2. Open Terminal 2: cd frontend && npm run dev       ║
echo ║  3. Visit http://localhost:3000                       ║
echo ║                                                        ║
echo ║  See README.md for detailed usage instructions        ║
echo ╚════════════════════════════════════════════════════════╝
echo.
