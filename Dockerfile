### Multi-stage Dockerfile for smaller, secure production image
FROM node:18 AS build
WORKDIR /app

# Install dev dependencies to allow builds if needed
COPY package*.json ./
RUN npm ci --production=false

# Copy source and build (if you have a build step)
COPY . .
RUN npm run build --if-present || true

### Production image: use slimmer runtime
FROM node:18-alpine AS runtime
WORKDIR /app

# Create a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy only production deps and built files from build stage
COPY --from=build /app/package*.json ./
RUN npm ci --production
COPY --from=build /app .

ENV NODE_ENV=production

EXPOSE 5000

USER appuser

CMD ["node", "server.js"]
