#!/bin/bash

# Setup script for Data Dependency Tracker
# Installs dependencies for both frontend and backend

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║  Data Dependency Tracker - Setup Script               ║"
echo "║  Installing dependencies...                            ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install it from https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js is installed"
echo ""

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend || exit 1
npm install
if [ $? -ne 0 ]; then
    echo "Error: Backend installation failed"
    cd ..
    exit 1
fi
cd ..
echo "✓ Backend dependencies installed"
echo ""

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend || exit 1
npm install
if [ $? -ne 0 ]; then
    echo "Error: Frontend installation failed"
    cd ..
    exit 1
fi
cd ..
echo "✓ Frontend dependencies installed"
echo ""

echo "╔════════════════════════════════════════════════════════╗"
echo "║  Setup Complete!                                      ║"
echo "║                                                        ║"
echo "║  Next steps:                                           ║"
echo "║  1. Open Terminal 1: cd backend && npm start          ║"
echo "║  2. Open Terminal 2: cd frontend && npm run dev       ║"
echo "║  3. Visit http://localhost:3000                       ║"
echo "║                                                        ║"
echo "║  See README.md for detailed usage instructions        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
