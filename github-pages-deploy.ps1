#!/usr/bin/env pwsh
# GitHub Pages Deploy Script for AudNova V22.0

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 GitHub Pages Deploy - AudNova V22.0" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Step 1: Build
Write-Host "Step 1: Building project..." -ForegroundColor Yellow
npm run build

if (-Not (Test-Path "dist")) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful!`n" -ForegroundColor Green

# Step 2: Stage and Commit
Write-Host "Step 2: Committing files to Git..." -ForegroundColor Yellow

$changedFiles = git status --porcelain
if ($changedFiles) {
    git add .
    git commit -m "Build: Production dist for GitHub Pages deploy - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
    Write-Host "✅ Files committed`n" -ForegroundColor Green
}
else {
    Write-Host "ℹ️  No changes to commit`n" -ForegroundColor Yellow
}

# Step 3: Push to GitHub
Write-Host "Step 3: Pushing to GitHub (main branch)..." -ForegroundColor Yellow
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Pushed to GitHub`n" -ForegroundColor Green
}
else {
    Write-Host "⚠️  Push may have skipped (no changes)" -ForegroundColor Yellow
}

# Step 4: Deploy to GitHub Pages
Write-Host "Step 4: Deploying to GitHub Pages (gh-pages)..." -ForegroundColor Yellow

# Check if gh-pages is installed
$ghPagesInstalled = npm list gh-pages 2>$null | Select-String "gh-pages"

if (-Not $ghPagesInstalled) {
    Write-Host "ℹ️  Installing gh-pages CLI..." -ForegroundColor Yellow
    npm install --save-dev gh-pages
}

# Deploy
npx gh-pages -d dist

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deployed to GitHub Pages!`n" -ForegroundColor Green
}
else {
    Write-Host "❌ Deploy failed!" -ForegroundColor Red
    exit 1
}

# Step 5: Show instructions
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "✨ Deployment Complete!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "📱 Your site will be available at:" -ForegroundColor Yellow
Write-Host "   https://<your-github-username>.github.io/designe-app-audnova" -ForegroundColor Cyan
Write-Host "`nNote: It may take 1-5 minutes to activate.`n" -ForegroundColor White

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Go to your Repository Settings" -ForegroundColor White
Write-Host "2. Pages → Ensure 'gh-pages' branch is selected" -ForegroundColor White
Write-Host "3. Wait 1-5 minutes for GitHub to build & deploy" -ForegroundColor White
Write-Host "4. Visit your live URL above`n" -ForegroundColor White

Write-Host "Repository link:" -ForegroundColor Yellow
Write-Host "   https://github.com/your-username/designe-app-audnova" -ForegroundColor Cyan

Write-Host "`n🎉 Done! Your AudNova is now live on GitHub Pages!" -ForegroundColor Green
