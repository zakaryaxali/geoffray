#!/bin/bash

# Generate Self-Signed SSL Certificate for IP Address
# This script creates SSL certificates for staging environments using IP addresses

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SERVER_IP=${1:-"91.98.207.252"}
CERT_DIR="/opt/geoffray/nginx/ssl"
CERT_FILE="$CERT_DIR/cert.pem"
KEY_FILE="$CERT_DIR/private.key"
DAYS_VALID=365

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Create SSL directory
create_ssl_directory() {
    log_info "Creating SSL certificate directory..."
    mkdir -p "$CERT_DIR"
}

# Generate self-signed certificate
generate_certificate() {
    log_info "Generating self-signed SSL certificate for IP: $SERVER_IP"
    
    # Create OpenSSL configuration for IP address
    cat > "$CERT_DIR/openssl.conf" <<EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
C = DE
ST = Germany  
L = Nuremberg
O = Geoffray Staging
OU = IT Department
CN = $SERVER_IP

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
IP.1 = $SERVER_IP
EOF

    # Generate private key
    openssl genrsa -out "$KEY_FILE" 2048
    
    # Generate certificate signing request and self-signed certificate
    openssl req -new -x509 -key "$KEY_FILE" -out "$CERT_FILE" \
        -days $DAYS_VALID -config "$CERT_DIR/openssl.conf" \
        -extensions v3_req
    
    # Set proper permissions
    chmod 600 "$KEY_FILE"
    chmod 644 "$CERT_FILE"
    
    # Clean up config file
    rm "$CERT_DIR/openssl.conf"
    
    log_info "SSL certificate generated successfully!"
}

# Verify certificate
verify_certificate() {
    log_info "Verifying generated certificate..."
    
    # Check if files exist
    if [[ ! -f "$CERT_FILE" || ! -f "$KEY_FILE" ]]; then
        echo "Error: Certificate files not found!"
        exit 1
    fi
    
    # Verify certificate details
    echo ""
    echo "Certificate details:"
    openssl x509 -in "$CERT_FILE" -text -noout | grep -E "(Subject:|DNS:|IP Address:|Not Before|Not After)"
    echo ""
    
    log_info "Certificate verification completed"
}

# Show certificate information
show_certificate_info() {
    echo ""
    log_info "=== SSL Certificate Information ==="
    echo "Certificate file: $CERT_FILE"
    echo "Private key file: $KEY_FILE"
    echo "Valid for: $DAYS_VALID days"
    echo "Server IP: $SERVER_IP"
    echo ""
    log_warning "This is a self-signed certificate - browsers will show a security warning"
    log_warning "For staging purposes, you can safely proceed through the warning"
    echo ""
    echo "Access your application at: https://$SERVER_IP"
    echo ""
}

# Main execution
main() {
    echo "Generating self-signed SSL certificate for Geoffray staging..."
    echo ""
    
    create_ssl_directory
    generate_certificate
    verify_certificate
    show_certificate_info
    
    log_info "SSL certificate generation completed!"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
    echo "This script should be run as root for proper file permissions"
    echo "Usage: sudo $0 [IP_ADDRESS]"
    exit 1
fi

# Run main function
main "$@"