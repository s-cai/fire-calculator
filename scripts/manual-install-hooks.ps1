# Manual Husky Hook Installation Script for Windows
# This script manually creates the Git hooks that Husky would normally create

Write-Host "🔧 Manually installing Husky hooks..." -ForegroundColor Cyan

$hooksDir = ".git/hooks"
$huskyDir = ".husky"

# Check if .husky exists
if (-not (Test-Path $huskyDir)) {
    Write-Host "❌ .husky directory not found!" -ForegroundColor Red
    exit 1
}

# Check if .git/hooks exists
if (-not (Test-Path $hooksDir)) {
    Write-Host "❌ .git/hooks directory not found!" -ForegroundColor Red
    exit 1
}

# Get the absolute path to the project root
$projectRoot = (Get-Location).Path
$huskyPreCommit = Join-Path $projectRoot ".husky\pre-commit"
$huskyPrePush = Join-Path $projectRoot ".husky\pre-push"

# Create pre-commit hook
$preCommitHook = Join-Path $hooksDir "pre-commit"
$preCommitContent = @"
#!/bin/sh
. "$(dirname "$0")/../$huskyDir/_/husky.sh"

"$huskyPreCommit"
"@

Set-Content -Path $preCommitHook -Value $preCommitContent -Encoding UTF8
Write-Host "✅ Created $preCommitHook" -ForegroundColor Green

# Create pre-push hook
$prePushHook = Join-Path $hooksDir "pre-push"
$prePushContent = @"
#!/bin/sh
. "$(dirname "$0")/../$huskyDir/_/husky.sh"

"$huskyPrePush"
"@

Set-Content -Path $prePushHook -Value $prePushContent -Encoding UTF8
Write-Host "✅ Created $prePushHook" -ForegroundColor Green

Write-Host ""
Write-Host "⚠️  Note: This is a manual workaround." -ForegroundColor Yellow
Write-Host "   For proper installation, run: npm run prepare" -ForegroundColor Yellow
Write-Host ""
Write-Host "✅ Hooks created. They should work now!" -ForegroundColor Green

