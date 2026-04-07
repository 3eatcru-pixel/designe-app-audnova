#!/bin/bash
# AudNova V22.0 - Development & Production Setup
# Run this script to set up and start the project

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "🚀 AudNova V22.0 Setup"
echo "Project Directory: $PROJECT_DIR"
echo "============================================"

# Check Node.js version
echo "📦 Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✅ Node.js $NODE_VERSION found"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed!"
    exit 1
fi

NPM_VERSION=$(npm -v)
echo "✅ npm $NPM_VERSION found"

cd "$PROJECT_DIR"

# Install dependencies
echo ""
echo "📥 Installing dependencies..."
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "✅ Dependencies already installed"
fi

# Validate project
echo ""
echo "🔍 Validating project structure..."
node build.js

# Type checking
echo ""
echo "🔎 Running TypeScript check..."
npx tsc --noEmit 2>&1 | grep -i error || echo "✅ No TypeScript errors found"

# Show available commands
echo ""
echo "============================================"
echo "✅ Setup Complete!"
echo "============================================"
echo ""
echo "📚 Available Commands:"
echo "  npm run dev          - Start development server (port 3000)"
echo "  npm run build        - Build for production"
echo "  npm run preview      - Preview production build"
echo "  npm run lint         - Run TypeScript check"
echo "  npm run docker:build - Build Docker image"
echo "  npm run clean        - Clean build artifacts"
echo ""
echo "🚀 Quick Start:"
echo "  npm run dev"
echo ""
echo "📖 Documentation:"
echo "  - BUILD_REPORT.md - Detailed build report"
echo "  - PROJECT_COMPLETION_SUMMARY.md - Full architecture"
echo "  - QUICK_REFERENCE.md - API reference"
echo "  - src/services/TRANSPORT_GUIDE.md - Transport documentation"
echo ""
