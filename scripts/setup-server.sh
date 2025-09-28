#!/bin/bash

# Hetzner Cloud Server Setup Script (Simplified for Staging)
# This script prepares a fresh Ubuntu server for Geoffray staging deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration (simplified for staging)

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

log_section() {
    echo -e "\n${BLUE}=== $1 ===${NC}\n"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root"
    fi
}

# Update system packages
update_system() {
    log_section "Updating System Packages"
    
    apt-get update
    apt-get upgrade -y
    apt-get dist-upgrade -y
    apt-get autoremove -y
    apt-get autoclean
    
    log_info "System packages updated"
}

# Install essential packages
install_essentials() {
    log_section "Installing Essential Packages"
    
    apt-get install -y \
        curl \
        wget \
        git \
        vim \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        gnupg \
        lsb-release
    
    log_info "Essential packages installed"
}

# Setup timezone
setup_timezone() {
    log_section "Setting Timezone"
    
    timedatectl set-timezone UTC
    log_info "Timezone set to UTC"
}

# Configure swap
configure_swap() {
    log_section "Configuring Swap Space"
    
    # Check if swap already exists
    if [ $(swapon -s | wc -l) -gt 1 ]; then
        log_info "Swap already configured"
        return
    fi
    
    # Create 2GB swap file
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    
    # Make swap permanent
    echo "/swapfile none swap sw 0 0" >> /etc/fstab
    
    # Configure swappiness
    echo "vm.swappiness=10" >> /etc/sysctl.conf
    sysctl -p
    
    log_info "2GB swap space configured"
}

# Install Docker
install_docker() {
    log_section "Installing Docker"
    
    # Check if Docker is already installed
    if command -v docker &> /dev/null; then
        log_info "Docker is already installed"
        return
    fi
    
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Set up the stable repository
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker Engine
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Enable Docker service
    systemctl enable docker
    systemctl start docker
    
    # Install Docker Compose v2
    apt-get install -y docker-compose-plugin
    
    log_info "Docker and Docker Compose installed"
}

# Note: Deploy user creation removed - using root for staging simplicity

# Note: Firewall configuration removed - using Hetzner Cloud Firewall instead
# Note: Fail2ban configuration removed - relying on SSH key authentication

# Note: SSH hardening removed - keeping default SSH settings for staging

# Note: Kernel parameter tuning removed - using system defaults for staging

# Note: Monitoring tools removed - use 'docker stats' for basic monitoring

# Note: Log rotation removed - Docker handles its own log management

# Create basic directory
create_directories() {
    log_section "Creating Application Directory"
    
    mkdir -p /opt/geoffray
    
    log_info "Application directory created"
}

# Note: Certbot removed - SSL not required for staging

# Final setup message
show_final_message() {
    log_section "Server Setup Complete!"
    
    echo -e "${GREEN}Server has been successfully prepared for Geoffray deployment!${NC}\n"
    echo "Next steps:"
    echo "1. Clone your repository: git clone <repo-url> /opt/geoffray"
    echo "2. Configure environment variables in /opt/geoffray/.env"
    echo "3. Deploy: cd /opt/geoffray && docker compose -f docker-compose.prod.yml up -d --build"
    echo ""
    echo "Security Notes:"
    echo "- Using Hetzner Cloud Firewall (configure in Hetzner console)"
    echo "- For production, consider additional hardening"
    echo ""
    echo "Note: This is a simplified setup suitable for staging environments"
}

# Main execution
main() {
    log_section "Starting Simplified Server Setup for Staging"
    
    check_root
    update_system
    install_essentials
    setup_timezone
    configure_swap
    install_docker
    create_directories
    show_final_message
}

# Run main function
main "$@"