#!/bin/bash

# Geoffray Deployment Script
# This script deploys the application to a Hetzner Cloud VM

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOMAIN=${DOMAIN:-"yourdomain.com"}
EMAIL=${EMAIL:-"your-email@example.com"}
DEPLOY_DIR="/opt/geoffray"
REPO_URL=${REPO_URL:-"https://github.com/yourusername/geoffray.git"}
BRANCH=${BRANCH:-"main"}

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root"
    fi
}

# Pull latest code
pull_code() {
    log_info "Pulling latest code from repository..."
    
    if [ -d "$DEPLOY_DIR" ]; then
        cd "$DEPLOY_DIR"
        git fetch origin
        git checkout $BRANCH
        git pull origin $BRANCH
    else
        git clone -b $BRANCH "$REPO_URL" "$DEPLOY_DIR"
        cd "$DEPLOY_DIR"
    fi
}

# Setup environment variables
setup_env() {
    log_info "Setting up environment variables..."
    
    if [ ! -f "$DEPLOY_DIR/.env" ]; then
        if [ -f "$DEPLOY_DIR/.env.production.example" ]; then
            cp "$DEPLOY_DIR/.env.production.example" "$DEPLOY_DIR/.env"
            log_warning "Created .env from .env.production.example - Please edit with your values"
            log_warning "Edit the file at: $DEPLOY_DIR/.env"
            read -p "Press enter to continue after editing .env file..."
        else
            log_error "No .env.production.example file found"
        fi
    fi
    
    # Update domain in nginx config
    if [ "$DOMAIN" != "yourdomain.com" ]; then
        sed -i "s/yourdomain.com/$DOMAIN/g" "$DEPLOY_DIR/nginx/conf.d/geoffray.conf"
    fi
}

# Setup SSL certificates
setup_ssl() {
    log_info "Setting up SSL certificates..."
    
    # Check if certificates already exist
    if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
        log_info "SSL certificates already exist for $DOMAIN"
        return
    fi
    
    # Start nginx temporarily for cert generation
    docker run -d --name nginx-temp \
        -p 80:80 \
        -v "$DEPLOY_DIR/nginx/certbot/www:/var/www/certbot" \
        nginx:alpine
    
    sleep 5
    
    # Generate certificates
    docker run --rm \
        -v "$DEPLOY_DIR/nginx/certbot/conf:/etc/letsencrypt" \
        -v "$DEPLOY_DIR/nginx/certbot/www:/var/www/certbot" \
        certbot/certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        -d "$DOMAIN" \
        -d "www.$DOMAIN"
    
    # Stop temporary nginx
    docker stop nginx-temp && docker rm nginx-temp
    
    log_info "SSL certificates generated successfully"
}

# Build and deploy with Docker Compose
deploy_app() {
    log_info "Building and deploying application..."
    
    cd "$DEPLOY_DIR"
    
    # Load environment variables
    export $(cat .env | grep -v '^#' | xargs)
    
    # Pull latest images
    docker compose -f docker-compose.prod.yml pull
    
    # Build images
    docker compose -f docker-compose.prod.yml build --no-cache
    
    # Stop existing containers
    docker compose -f docker-compose.prod.yml down
    
    # Start services
    docker compose -f docker-compose.prod.yml up -d
    
    # Wait for services to be healthy
    log_info "Waiting for services to be healthy..."
    sleep 30
    
    # Check service health
    docker compose -f docker-compose.prod.yml ps
}

# Health check
health_check() {
    log_info "Performing health check..."
    
    # Check backend health
    if curl -f -s "http://localhost:8080/health" > /dev/null; then
        log_info "Backend is healthy"
    else
        log_error "Backend health check failed"
    fi
    
    # Check if nginx is running
    if docker compose -f docker-compose.prod.yml ps | grep -q "nginx.*Up"; then
        log_info "Nginx is running"
    else
        log_error "Nginx is not running"
    fi
    
    # Check if postgres is running
    if docker compose -f docker-compose.prod.yml ps | grep -q "postgres.*Up"; then
        log_info "PostgreSQL is running"
    else
        log_error "PostgreSQL is not running"
    fi
    
    log_info "All services are healthy!"
}

# Setup cron jobs
setup_cron() {
    log_info "Setting up cron jobs..."
    
    # SSL renewal cron job
    if ! crontab -l 2>/dev/null | grep -q "certbot renew"; then
        (crontab -l 2>/dev/null; echo "0 12 * * * cd $DEPLOY_DIR && docker compose -f docker-compose.prod.yml exec certbot certbot renew --quiet") | crontab -
        log_info "SSL renewal cron job added"
    fi
    
    # Docker cleanup cron job
    if ! crontab -l 2>/dev/null | grep -q "docker system prune"; then
        (crontab -l 2>/dev/null; echo "0 2 * * 0 docker system prune -af --volumes") | crontab -
        log_info "Docker cleanup cron job added"
    fi
}

# Main deployment flow
main() {
    log_info "Starting Geoffray deployment..."
    
    check_root
    pull_code
    setup_env
    
    # Only setup SSL if domain is configured
    if [ "$DOMAIN" != "yourdomain.com" ]; then
        setup_ssl
    else
        log_warning "Skipping SSL setup - domain not configured"
    fi
    
    deploy_app
    health_check
    setup_cron
    
    log_info "==================================="
    log_info "Deployment completed successfully!"
    log_info "==================================="
    log_info "Application is running at:"
    log_info "  HTTP:  http://$DOMAIN"
    if [ "$DOMAIN" != "yourdomain.com" ]; then
        log_info "  HTTPS: https://$DOMAIN"
    fi
    log_info "==================================="
    log_info "Useful commands:"
    log_info "  View logs: docker compose -f docker-compose.prod.yml logs -f"
    log_info "  Restart:   docker compose -f docker-compose.prod.yml restart"
    log_info "  Stop:      docker compose -f docker-compose.prod.yml down"
}

# Handle script arguments
case "${1:-}" in
    update)
        log_info "Updating application..."
        check_root
        cd "$DEPLOY_DIR"
        pull_code
        docker compose -f docker-compose.prod.yml build
        docker compose -f docker-compose.prod.yml up -d
        health_check
        ;;
    restart)
        log_info "Restarting application..."
        check_root
        cd "$DEPLOY_DIR"
        docker compose -f docker-compose.prod.yml restart
        health_check
        ;;
    stop)
        log_info "Stopping application..."
        check_root
        cd "$DEPLOY_DIR"
        docker compose -f docker-compose.prod.yml down
        ;;
    logs)
        cd "$DEPLOY_DIR"
        docker compose -f docker-compose.prod.yml logs -f
        ;;
    *)
        main
        ;;
esac