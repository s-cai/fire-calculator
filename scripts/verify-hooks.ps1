# PowerShell script to verify and install Husky hooks
# Run this script to ensure hooks are properly installed

Write-Host "🔍 Checking Husky hook installation..." -ForegroundColor Cyan

# Check if .husky directory exists
if (-not (Test-Path ".husky")) {
    Write-Host "❌ .husky directory not found!" -ForegroundColor Red
    exit 1
}

# Check if hook files exist
$preCommitHook = ".husky/pre-commit"
$prePushHook = ".husky/pre-push"

if (-not (Test-Path $preCommitHook)) {
    Write-Host "❌ $preCommitHook not found!" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $prePushHook)) {
    Write-Host "❌ $prePushHook not found!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Husky hook files exist" -ForegroundColor Green

# Check if hooks are installed in .git/hooks
$gitPreCommit = ".git/hooks/pre-commit"
$gitPrePush = ".git/hooks/pre-push"

$hooksInstalled = $true

if (-not (Test-Path $gitPreCommit)) {
    Write-Host "⚠️  $gitPreCommit not found - hooks not installed" -ForegroundColor Yellow
    $hooksInstalled = $false
}

if (-not (Test-Path $gitPrePush)) {
    Write-Host "⚠️  $gitPrePush not found - hooks not installed" -ForegroundColor Yellow
    $hooksInstalled = $false
}

if ($hooksInstalled) {
    Write-Host "✅ Git hooks are installed" -ForegroundColor Green
    Write-Host ""
    Write-Host "Verifying hook contents..." -ForegroundColor Cyan
    
    # Check if hooks point to Husky
    $preCommitContent = Get-Content $gitPreCommit -Raw
    if ($preCommitContent -match "husky") {
        Write-Host "✅ pre-commit hook is properly configured" -ForegroundColor Green
    } else {
        Write-Host "⚠️  pre-commit hook may not be using Husky" -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "📦 Installing Husky hooks..." -ForegroundColor Cyan
    Write-Host "Run: npm run prepare" -ForegroundColor Yellow
    Write-Host "Or: npx husky install" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Testing if npm/typecheck would work..." -ForegroundColor Cyan

# Try to find npm
$npmPath = Get-Command npm -ErrorAction SilentlyContinue
if ($npmPath) {
    Write-Host "✅ npm found at: $($npmPath.Source)" -ForegroundColor Green
    
    # Try running typecheck
    Write-Host "Running: npm run typecheck" -ForegroundColor Cyan
    $result = & npm run typecheck 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ TypeScript typecheck passed" -ForegroundColor Green
    } else {
        Write-Host "❌ TypeScript typecheck failed:" -ForegroundColor Red
        Write-Host $result
    }
} else {
    Write-Host "⚠️  npm not found in PATH" -ForegroundColor Yellow
    Write-Host "   Hooks will work once npm is available" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  - Husky files: ✅" -ForegroundColor Green
if ($hooksInstalled) {
    Write-Host "  - Git hooks installed: ✅" -ForegroundColor Green
} else {
    Write-Host "  - Git hooks installed: ❌ (run 'npm run prepare')" -ForegroundColor Red
}
if ($npmPath) {
    Write-Host "  - npm available: ✅" -ForegroundColor Green
} else {
    Write-Host "  - npm available: ❌" -ForegroundColor Red
}

