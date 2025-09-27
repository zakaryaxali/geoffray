#!/bin/bash

# Geoffray Staging Deployment Script
# This script deploys the application to staging with self-signed SSL

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SERVER_IP=${SERVER_IP:-"91.98.207.252"}
DEPLOY_DIR="/opt/geoffray"
COMPOSE_FILE="docker-compose.staging.yml"

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
    
    if [ -d "$DEPLOY_DIR/.git" ]; then
        cd "$DEPLOY_DIR"
        git fetch origin
        git pull origin main
    else
        log_warning "Not a git repository. Make sure code is up to date."
        cd "$DEPLOY_DIR"
    fi
}

# Setup environment variables
setup_env() {
    log_info "Setting up environment variables..."
    
    if [ ! -f "$DEPLOY_DIR/.env" ]; then
        if [ -f "$DEPLOY_DIR/.env.production.example" ]; then
            cp "$DEPLOY_DIR/.env.production.example" "$DEPLOY_DIR/.env"
            log_warning "Created .env from .env.production.example"
            log_warning "Please edit the file at: $DEPLOY_DIR/.env"
            log_warning "Set SERVER_IP=$SERVER_IP for staging"
            read -p "Press enter to continue after editing .env file..."
        else
            log_error "No .env.production.example file found"
        fi
    fi
    
    # Ensure SERVER_IP is set in environment
    if ! grep -q "SERVER_IP=" "$DEPLOY_DIR/.env"; then
        echo "SERVER_IP=$SERVER_IP" >> "$DEPLOY_DIR/.env"
        log_info "Added SERVER_IP to .env file"
    fi
}

# Generate SSL certificates
generate_ssl() {
    log_info "Generating self-signed SSL certificates..."
    
    # Check if certificates already exist
    if [ -f "$DEPLOY_DIR/nginx/ssl/cert.pem" ] && [ -f "$DEPLOY_DIR/nginx/ssl/private.key" ]; then
        log_info "SSL certificates already exist"
        return
    fi
    
    # Run the SSL generation script
    if [ -f "$DEPLOY_DIR/scripts/generate-ssl-cert.sh" ]; then
        chmod +x "$DEPLOY_DIR/scripts/generate-ssl-cert.sh"
        "$DEPLOY_DIR/scripts/generate-ssl-cert.sh" "$SERVER_IP"
    else
        log_error "SSL certificate generation script not found"
    fi
    
    log_info "SSL certificates generated successfully"
}

# Build and deploy with Docker Compose
deploy_app() {
    log_info "Building and deploying application..."
    
    cd "$DEPLOY_DIR"
    
    # Load environment variables
    export $(cat .env | grep -v '^#' | xargs)
    export SERVER_IP="$SERVER_IP"
    
    # Stop existing containers
    if [ -f "$COMPOSE_FILE" ]; then
        docker compose -f "$COMPOSE_FILE" down
    fi
    
    # Build and start services
    docker compose -f "$COMPOSE_FILE" build --no-cache
    docker compose -f "$COMPOSE_FILE" up -d
    
    # Wait for services to be healthy
    log_info "Waiting for services to be healthy..."
    sleep 30
    
    # Check service health
    docker compose -f "$COMPOSE_FILE" ps
}

# Health check
health_check() {
    log_info "Performing health check..."
    
    # Check backend health (HTTP first, then HTTPS)
    if curl -k -f -s "https://$SERVER_IP/health" > /dev/null; then
        log_info "HTTPS health check passed"
    elif curl -f -s "http://$SERVER_IP:8080/health" > /dev/null; then
        log_info "Backend is healthy (direct port)"
    else
        log_error "Health check failed"
    fi
    
    # Check if nginx is running
    if docker compose -f "$COMPOSE_FILE" ps | grep -q "nginx.*Up"; then
        log_info "Nginx is running"
    else
        log_error "Nginx is not running"
    fi
    
    # Check if postgres is running
    if docker compose -f "$COMPOSE_FILE" ps | grep -q "postgres.*Up"; then
        log_info "PostgreSQL is running"
    else
        log_error "PostgreSQL is not running"
    fi
    
    log_info "All services are healthy!"
}

# Show completion message
show_completion() {
    log_info "==================================="
    log_info "Staging deployment completed!"
    log_info "==================================="
    log_info "Application is running at:"
    log_info "  HTTP:  http://$SERVER_IP (redirects to HTTPS)"
    log_info "  HTTPS: https://$SERVER_IP"
    log_info "  API:   https://$SERVER_IP/api/"
    log_info "  Health: https://$SERVER_IP/health"
    log_info "==================================="
    log_warning "Note: Self-signed certificate will show browser warning"
    log_warning "This is normal for staging - click 'Advanced' and 'Proceed'"
    log_info "==================================="
    log_info "Useful commands:"
    log_info "  View logs: docker compose -f $COMPOSE_FILE logs -f"
    log_info "  Restart:   docker compose -f $COMPOSE_FILE restart"
    log_info "  Stop:      docker compose -f $COMPOSE_FILE down"
}

# Main deployment flow
main() {
    log_info "Starting Geoffray staging deployment..."
    
    check_root
    pull_code
    setup_env
    generate_ssl
    deploy_app
    health_check
    show_completion
}

# Handle script arguments
case "${1:-}" in
    update)
        log_info "Updating staging application..."
        check_root
        cd "$DEPLOY_DIR"
        pull_code
        docker compose -f "$COMPOSE_FILE" build
        docker compose -f "$COMPOSE_FILE" up -d
        health_check
        ;;
    restart)
        log_info "Restarting staging application..."
        check_root
        cd "$DEPLOY_DIR"
        docker compose -f "$COMPOSE_FILE" restart
        health_check
        ;;
    stop)
        log_info "Stopping staging application..."
        check_root
        cd "$DEPLOY_DIR"
        docker compose -f "$COMPOSE_FILE" down
        ;;
    logs)
        cd "$DEPLOY_DIR"
        docker compose -f "$COMPOSE_FILE" logs -f
        ;;
    ssl)
        log_info "Regenerating SSL certificates..."
        check_root
        rm -f "$DEPLOY_DIR/nginx/ssl/cert.pem" "$DEPLOY_DIR/nginx/ssl/private.key"
        generate_ssl
        cd "$DEPLOY_DIR"
        docker compose -f "$COMPOSE_FILE" restart nginx
        ;;
    *)
        main
        ;;
esac