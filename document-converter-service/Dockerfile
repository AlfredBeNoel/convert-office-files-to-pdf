# Build stage
FROM node:18-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for building)
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript to JavaScript
RUN npm run build

# Production stage
FROM node:18-bullseye-slim AS production

WORKDIR /app

# Install LibreOffice with explicit PPTX/DOCX support + tini for zombie reaping
RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice-core \
    libreoffice-impress \
    libreoffice-writer \
    fonts-dejavu-core \
    fontconfig \
    tini \
    && rm -rf /var/lib/apt/lists/*

# Ensure LibreOffice has a writable home directory
# (prevents failures when container runs as non-root)
ENV HOME=/tmp/libreoffice-home
RUN mkdir -p /tmp/libreoffice-home

# Validate LibreOffice installation at build time
RUN soffice --headless --version

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy compiled JavaScript from builder stage
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Use tini as PID 1 to reap zombie LibreOffice processes
ENTRYPOINT ["tini", "--"]
CMD ["node", "dist/server.js"]

