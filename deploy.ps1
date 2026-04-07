#!/usr/bin/env pwsh
# Quick Deploy Script for AudNova V22.0 (Windows)

Write-Host "🚀 Iniciando deploy do AudNova V22.0..." -ForegroundColor Cyan

# 1. Clean & Build
Write-Host "`n📦 Limpando e compilando..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Remove-Item -Recurse -Force dist
}

try {
    npm run build
} catch {
    Write-Host "❌ Build falhou!" -ForegroundColor Red
    exit 1
}

# 2. Validar build
if (-Not (Test-Path "dist")) {
    Write-Host "❌ Build falhou!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build completado com sucesso!" -ForegroundColor Green

# 3. Mostrar stats
Write-Host "`n📊 Tamanho do Bundle:" -ForegroundColor Yellow
Get-ChildItem -Recurse dist | Measure-Object -Property Length -Sum | ForEach-Object {
    $totalSize = $_.Sum / 1MB
    Write-Host "Total: $totalSize MB"
}

$htmlSize = (Get-Item dist/index.html).Length / 1KB
$cssFiles = Get-ChildItem dist/assets/*.css -ErrorAction SilentlyContinue
$jsFiles = Get-ChildItem dist/assets/*.js -ErrorAction SilentlyContinue

Write-Host "HTML: $htmlSize KB"
if ($cssFiles) {
    foreach ($file in $cssFiles) {
        $size = $file.Length / 1KB
        Write-Host "CSS: $size KB"
    }
}
if ($jsFiles) {
    foreach ($file in $jsFiles) {
        $size = $file.Length / 1KB
        Write-Host "JS: $size KB"
    }
}

# 4. Menu de deploy
Write-Host "`n🌐 Escolha uma plataforma de deploy:" -ForegroundColor Yellow
Write-Host "1) Vercel (Recomendado)" -ForegroundColor Green
Write-Host "2) GitHub Pages" -ForegroundColor Green
Write-Host "3) Netlify" -ForegroundColor Green
Write-Host "4) Cloudflare Pages" -ForegroundColor Green
Write-Host "5) Nenhum (só build)" -ForegroundColor Yellow

$choice = Read-Host "Escolha [1-5]"

switch ($choice) {
    "1" {
        Write-Host "`n📡 Deploying para Vercel..." -ForegroundColor Yellow
        
        if (-Not (Get-Command vercel -ErrorAction SilentlyContinue)) {
            Write-Host "Instalando Vercel CLI..."
            npm install -g vercel
        }
        
        vercel --prod
    }
    "2" {
        Write-Host "`n📡 Deploying para GitHub Pages..." -ForegroundColor Yellow
        
        if (-Not (Get-Command npx -ErrorAction SilentlyContinue)) {
            Write-Host "gh-pages será instalado via npm"
        }
        
        npx gh-pages -d dist
        Write-Host "✅ Deploy concluído!" -ForegroundColor Green
    }
    "3" {
        Write-Host "`n📡 Deploying para Netlify..." -ForegroundColor Yellow
        
        if (-Not (Get-Command netlify -ErrorAction SilentlyContinue)) {
            Write-Host "Instalando Netlify CLI..."
            npm install -g netlify-cli
        }
        
        netlify deploy --prod --dir=dist
    }
    "4" {
        Write-Host "`n📡 Deploying para Cloudflare Pages..." -ForegroundColor Yellow
        
        if (-Not (Get-Command wrangler -ErrorAction SilentlyContinue)) {
            Write-Host "Instalando Wrangler..."
            npm install -g wrangler
        }
        
        wrangler pages deploy dist
    }
    "5" {
        Write-Host "`nBuild pronto em ./dist" -ForegroundColor Yellow
    }
    default {
        Write-Host "Opção inválida" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n🎉 Deploy script concluído!" -ForegroundColor Green
Write-Host "For more information, read DEPLOYMENT_GUIDE.md" -ForegroundColor Cyan
