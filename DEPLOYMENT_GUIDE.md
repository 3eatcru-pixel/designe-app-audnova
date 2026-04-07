# AudNova V22.0 - Deployment Guide

Complete guide for deploying AudNova to production.

---

## 📋 Pre-Deployment Checklist

### Development
- [ ] All features tested locally
- [ ] No TypeScript errors (`npm run lint`)
- [ ] All tests passing
- [ ] Build succeeds (`npm run build`)
- [ ] No console errors or warnings
- [ ] Environment variables configured

### Security
- [ ] Security audit completed
- [ ] Encryption validated
- [ ] Key management reviewed
- [ ] HTTPS enforced
- [ ] CORS properly configured
- [ ] Rate limiting enabled

### Performance
- [ ] Load tested with 50+ simultaneous users
- [ ] BLE/WiFi connectivity verified
- [ ] Memory usage monitored
- [ ] Database optimized (if applicable)
- [ ] CDN configured
- [ ] Caching strategy implemented

### Infrastructure
- [ ] Server(s) provisioned
- [ ] Database (if needed) set up
- [ ] DNS configured
- [ ] SSL certificates issued
- [ ] Backups enabled
- [ ] Monitoring configured

---

## 🚀 Deployment Options

### Option 1: Vercel (Recommended for Frontend)

**Pros**: Zero-config deployment, automatic scaling, HTTPS, CDN

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Or connect GitHub repo for auto-deployment
# https://vercel.com/new
```

**Environment Variables** (if needed):
```
VITE_API_URL=https://api.audnova.app
VITE_WS_URL=wss://api.audnova.app
```

### Option 2: Netlify

**Pros**: Easy setup, free tier available, great for static sites

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build
npm run build

# Deploy
netlify deploy --prod --dir=dist
```

### Option 3: Docker + Docker Compose

**Build Docker Image**:
```bash
npm run docker:build
```

**Docker Compose** (`docker-compose.yml`):
```yaml
version: '3.8'

services:
  audnova:
    image: audnova-app:latest
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      VITE_API_URL: ${API_URL}
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Optional: Node.js backend
  api:
    image: node:20-alpine
    working_dir: /app
    volumes:
      - ./server:/app
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: production
    restart: always
```

**Deploy**:
```bash
docker-compose up -d
```

### Option 4: Traditional Server (VPS)

**Prerequisites**:
- Ubuntu 20.04+ or similar
- Node.js 18+
- Nginx or Apache
- SSL certificate

**Steps**:

1. **SSH into server**:
```bash
ssh user@your-server.com
```

2. **Install dependencies**:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo apt-get install -y nginx
```

3. **Clone repository**:
```bash
cd /var/www
git clone https://github.com/yourusername/audnova.git
cd audnova
npm install
```

4. **Build**:
```bash
npm run build
```

5. **Configure Nginx**:
```nginx
server {
    listen 443 ssl;
    server_name audnova.app;

    ssl_certificate /etc/letsencrypt/live/audnova.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/audnova.app/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support (for real-time)
    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }
}

server {
    listen 80;
    server_name audnova.app;
    return 301 https://$server_name$request_uri;
}
```

6. **Start with PM2** (process manager):
```bash
npm install -g pm2
pm2 start "npm run dev" --name audnova
pm2 save
pm2 startup
```

---

## 🔐 Environment Configuration

Create `.env.production`:

```env
# API
VITE_API_URL=https://api.audnova.app
VITE_WS_URL=wss://api.audnova.app

# Security
VITE_ENABLE_HTTPS=true
VITE_STRICT_SECURITY=true

# Features
VITE_ENABLE_BLE=true
VITE_ENABLE_WIFI=true
VITE_MAX_PEERS=200

# Analytics (optional)
VITE_ANALYTICS_ID=GA-123456
VITE_SENTRY_DSN=https://...
```

---

## 📊 Monitoring & Logging

### Application Monitoring

**Sentry (Error Tracking)**:
```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: "production",
  tracesSampleRate: 0.1,
});
```

**Custom Logging**:
```typescript
const log = {
  info: (msg: string, data?: any) => {
    console.log(`[INFO] ${msg}`, data);
    // Send to logging service
  },
  error: (msg: string, error?: Error) => {
    console.error(`[ERROR] ${msg}`, error);
    // Send to error tracking
  },
};
```

### Infrastructure Monitoring

- **Uptime Monitoring**: UptimeRobot, Pingdom
- **Performance**: New Relic, Datadog, CloudWatch
- **Logs**: ELK Stack, Splunk, CloudWatch Logs

---

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm install

      - name: Type check
        run: npm run lint

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

      - name: Deploy to Vercel
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
        run: npx vercel --prod --token=$VERCEL_TOKEN
```

---

## 🚨 Post-Deployment

### Health Checks

```bash
# Check if app is running
curl -I https://audnova.app

# Check service health
curl -s https://audnova.app/health | jq .

# Monitor logs
tail -f /var/log/audnova.log
```

### Performance Benchmarks

```bash
# Load test
ab -n 1000 -c 100 https://audnova.app

# Check response time
curl -w "Time: %{time_total}s\n" https://audnova.app
```

### Backup Strategy

```bash
# Daily backup
0 2 * * * /usr/local/bin/audnova-backup.sh

# Database backup (if applicable)
0 3 * * * pg_dump audnova > /backups/audnova-$(date +%Y%m%d).sql
```

---

## 🔄 Rollback Procedure

**If deployment fails:**

```bash
# Rollback to previous version
git revert HEAD
npm run build
# Redeploy

# Or use deployment history
vercel --prod --alias old-version
```

---

## 📈 Scaling Considerations

### Horizontal Scaling (Multiple Servers)

```yaml
# Load balance with Nginx
upstream audnova {
    server app1.internal:3000;
    server app2.internal:3000;
    server app3.internal:3000;
}

server {
    listen 443;
    location / {
        proxy_pass http://audnova;
    }
}
```

### Vertical Scaling (Bigger Server)

- Upgrade server RAM: 2GB → 8GB+
- Upgrade CPU: 1 core → 4 cores+
- Use SSD storage for better I/O

### Database Scaling (if needed)

- Read replicas for load distribution
- Sharding for large datasets
- Caching layer (Redis)

---

## 🛡️ Security Hardening

### Before Going Live

- [ ] Update all dependencies: `npm audit fix`
- [ ] Enable HTTPS only
- [ ] Set security headers:
  ```
  Strict-Transport-Security: max-age=31536000
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Content-Security-Policy: default-src 'self'
  ```
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Set up WAF (Web Application Firewall)

---

## 📞 Support & Troubleshooting

### Common Issues

**High Memory Usage**:
```bash
# Monitor memory
node --max-old-space-size=4096 build.js

# Profile heap
node --inspect build.js
```

**Slow Response Times**:
```bash
# Check bottlenecks
node --prof build.js
node --prof-process isolate-*.log > profile.txt

# Optimize bundle
npm run build -- --analyze
```

**WebSocket Connection Issues**:
```bash
# Verify WebSocket support
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" https://audnova.app/ws
```

---

## 📚 Additional Resources

- [Vercel Deployment](https://vercel.com/docs)
- [Netlify Deployment](https://docs.netlify.com/)
- [Docker & Compose](https://docs.docker.com/)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [Security Headers](https://securityheaders.com/)

---

*Last Updated: April 7, 2026*
