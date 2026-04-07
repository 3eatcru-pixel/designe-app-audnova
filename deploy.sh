#!/bin/bash
# Quick Deploy Script for AudNova V22.0

set -e

echo "🚀 Iniciando deploy do AudNova V22.0..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Clean & Build
echo -e "${YELLOW}📦 Limpando e compilando...${NC}"
rm -rf dist
npm run build

# 2. Validar build
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Build falhou!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build completado com sucesso!${NC}"

# 3. Mostrar stats
echo -e "\n${YELLOW}📊 Tamanho do Bundle:${NC}"
du -sh dist/
echo "HTML: $(ls -lh dist/index.html | awk '{print $5}')"
echo "CSS: $(ls -lh dist/assets/*.css | awk '{print $5}')"
echo "JS: $(ls -lh dist/assets/*.js | awk '{print $5}')"

# 4. Opcoes de deploy
echo -e "\n${YELLOW}🌐 Escolha uma plataforma de deploy:${NC}"
echo -e "${GREEN}1${NC}) Vercel (Recomendado)"
echo -e "${GREEN}2${NC}) GitHub Pages"
echo -e "${GREEN}3${NC}) Netlify"
echo -e "${GREEN}4${NC}) Cloudflare Pages"
echo -e "${YELLOW}5${NC}) Nenhum (só build)"

read -p "Escolha [1-5]: " choice

case $choice in
    1)
        echo -e "\n${YELLOW}📡 Deploying para Vercel...${NC}"
        if ! command -v vercel &> /dev/null; then
            echo "Instalando Vercel CLI..."
            npm install -g vercel
        fi
        vercel --prod
        ;;
    2)
        echo -e "\n${YELLOW}📡 Deploying para GitHub Pages...${NC}"
        if ! command -v gh-pages &> /dev/null; then
            echo "Instalando gh-pages..."
            npm install gh-pages --save-dev
        fi
        npx gh-pages -d dist
        echo -e "${GREEN}✅ Deploy concluído!${NC}"
        ;;
    3)
        echo -e "\n${YELLOW}📡 Deploying para Netlify...${NC}"
        if ! command -v netlify &> /dev/null; then
            echo "Instalando Netlify CLI..."
            npm install -g netlify-cli
        fi
        netlify deploy --prod --dir=dist
        ;;
    4)
        echo -e "\n${YELLOW}📡 Deploying para Cloudflare Pages...${NC}"
        if ! command -v wrangler &> /dev/null; then
            echo "Instalando Wrangler..."
            npm install -g wrangler
        fi
        wrangler pages deploy dist
        ;;
    5)
        echo -e "\n${YELLOW}Build pronto em ./dist${NC}"
        ;;
    *)
        echo -e "${RED}Opção inválida${NC}"
        exit 1
        ;;
esac

echo -e "\n${GREEN}🎉 Deploy script concluído!${NC}"
