### Production Dockerfile
### Use Debian-based image to avoid native module issues (e.g., sqlite3) on Alpine.
FROM node:18-slim

WORKDIR /app

# Install production dependencies first (better caching)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy app source
COPY . .

# Create a non-root user
RUN groupadd -r appgroup && useradd -r -g appgroup -m appuser \
	&& mkdir -p /data \
	&& chown -R appuser:appgroup /data /app

ENV NODE_ENV=production

EXPOSE 8080

USER appuser

CMD ["node", "server.js"]
