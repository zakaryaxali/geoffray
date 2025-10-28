# Multi-stage build for Expo Web application
FROM node:20-alpine AS builder

# Accept build arguments for environment configuration
ARG ENV=development
ARG EXPO_PUBLIC_API_URL

# Set environment variables for build
ENV ENV=${ENV}
ENV EXPO_PUBLIC_API_URL=${EXPO_PUBLIC_API_URL}

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy all source files
COPY . .

# Build Expo web application with environment configuration
RUN npx expo export --platform web --output-dir dist

# Production stage with Nginx
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost || exit 1

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]