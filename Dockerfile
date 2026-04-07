FROM node:20 AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY .npmrc* ./
RUN npm ci --omit=dev
COPY . .
RUN npm run build

FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
# Copy runtime server and built assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY package.json package-lock.json* ./
# Install only production deps
RUN npm ci --omit=dev

EXPOSE ${PORT}
CMD ["node", "server/index.cjs"]
