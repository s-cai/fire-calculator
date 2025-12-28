#!/bin/sh
# Shell script to install Husky hooks
# This is what Husky v9 uses internally

echo "🔍 Checking Husky setup..."

# Check if .husky directory exists
if [ ! -d ".husky" ]; then
    echo "❌ .husky directory not found!"
    exit 1
fi

# Check if node_modules exists (needed for husky command)
if [ ! -d "node_modules" ]; then
    echo "⚠️  node_modules not found. Run 'npm install' first."
    exit 1
fi

echo "📦 Installing Husky hooks..."
npm run prepare

if [ $? -eq 0 ]; then
    echo "✅ Husky hooks installed successfully"
    
    # Verify installation
    if [ -f ".git/hooks/pre-commit" ]; then
        echo "✅ pre-commit hook installed"
    else
        echo "⚠️  pre-commit hook not found after installation"
    fi
    
    if [ -f ".git/hooks/pre-push" ]; then
        echo "✅ pre-push hook installed"
    else
        echo "⚠️  pre-push hook not found after installation"
    fi
else
    echo "❌ Failed to install Husky hooks"
    exit 1
fi

