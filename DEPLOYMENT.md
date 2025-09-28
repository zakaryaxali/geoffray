# Geoffray Deployment Guide

This guide walks you through deploying Geoffray to a Hetzner Cloud VM using Docker, with support for both staging and production environments.

## Prerequisites

- Hetzner Cloud account  
- Domain name managed through Cloudflare (required for staging/production)
- GitHub account (for CI/CD)
- API keys for external services (Mistral, Stripe - optional)

**Note**: This guide covers both staging (HTTP with Cloudflare) and production (HTTPS with Let's Encrypt) environments.

## Deployment Steps

### 1. Provision Hetzner Cloud Server

1. Log into [Hetzner Cloud Console](https://console.hetzner.cloud)
2. Create a new server:
   - **OS**: Ubuntu 22.04
   - **Type**: CX22 (2 vCPU, 4GB RAM) or larger
   - **Location**: Choose closest to your users
   - **SSH Key**: Add your public SSH key
   - **Firewall**: Create rules for ports 22, 80, 443

### 2. Initial Server Setup

SSH into your new server as root and set it up manually:

```bash
# Update system packages
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose-plugin -y

# Create swap file (optional for better performance)
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Set timezone
timedatectl set-timezone UTC
```

### 3. Cloudflare DNS Setup

Before deploying, configure your domain in Cloudflare:

1. **Add DNS Records** in your Cloudflare dashboard:
   - **A Record**: `staging` → `YOUR_SERVER_IP` (for staging.yourdomain.com)
   - **A Record**: `@` → `YOUR_SERVER_IP` (for production)
   - **CNAME Record**: `www` → `yourdomain.com` (optional)

2. **SSL/TLS Configuration** (for staging):
   - Go to SSL/TLS → Overview
   - Set encryption mode to **"Flexible"** for HTTP-only backend
   - For production, use **"Full"** or **"Full (Strict)"**

### 4. Manual Deployment

After server setup and DNS configuration, clone the repository and deploy:

```bash
# Clone repository (as root)
cd /opt
git clone https://github.com/yourusername/geoffray.git geoffray
cd geoffray

# Copy and edit environment variables
cp .env.example .env
nano .env  # Edit with your values

# For staging deployment (HTTP with Cloudflare):
docker compose -f docker-compose.staging.yml up -d --build

# For production deployment (HTTPS with Let's Encrypt):
docker compose -f docker-compose.prod.yml up -d --build
```

### 5. Automated Deployment with GitHub Actions

Configure the following secrets in your GitHub repository (Settings > Secrets):

- `SERVER_HOST`: Your server IP address
- `SERVER_USER`: root
- `SERVER_SSH_KEY`: Private SSH key for root user
- `DOMAIN`: Your domain name (e.g., geoffray.xyz)
- `EMAIL`: Email for SSL certificates
- `DB_USER`: Database username
- `DB_PASSWORD`: Database password
- `DB_NAME`: Database name
- `JWT_SECRET`: Random JWT secret (minimum 32 characters)
- `MISTRAL_API_KEY`: (Optional) Mistral AI API key
- `MISTRAL_AGENT_ID`: (Optional) Mistral AI agent ID
- `STRIPE_SECRET_KEY`: (Optional) Stripe secret key
- `STRIPE_WEBHOOK_SECRET`: (Optional) Stripe webhook secret
- `SLACK_WEBHOOK_URL`: (Optional) Slack webhook for notifications

Push to main branch to trigger automatic deployment.

## Database Migrations

The application uses golang-migrate for database schema management:

### Migration System

- **Migration files**: Located in `be-geoffray/db/migrations/`
- **Embedded migrations**: SQL files are embedded in the Go binary
- **Automatic execution**: Migrations run automatically on application startup
- **Version tracking**: Current migration version is stored in `schema_migrations` table

### Migration Commands

```bash
# Check current migration status
docker compose exec backend go run cmd/main.go --check-migrations

# View migration logs
docker compose logs backend | grep -i migration

# Manual migration (if needed)
docker compose exec postgres psql -U $DB_USER -d $DB_NAME -c "SELECT version, dirty FROM schema_migrations;"
```

### Adding New Migrations

1. Create new migration files in `be-geoffray/db/migrations/`:
   ```bash
   # Example: Add new table
   000006_add_notifications.up.sql
   000006_add_notifications.down.sql
   ```

2. Migrations are automatically applied on next deployment

## Environment Configuration

### Staging Environment (.env for staging)

```bash
# Environment
ENV=staging

# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_USER=geoffray_user
DB_PASSWORD=your_secure_password
DB_NAME=geoffray_staging

# Authentication
JWT_SECRET=your_very_long_random_jwt_secret_minimum_32_chars
JWT_EXPIRATION=24h

# Optional API Keys
MISTRAL_API_KEY=your_mistral_api_key
MISTRAL_API_URL=https://api.mistral.ai/
MISTRAL_AGENT_ID=your_mistral_agent_id
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Production Environment (.env for production)

```bash
# Environment
ENV=production

# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_USER=geoffray_user
DB_PASSWORD=your_secure_production_password
DB_NAME=geoffray_production

# Authentication
JWT_SECRET=your_very_long_random_jwt_secret_minimum_32_chars
JWT_EXPIRATION=24h

# SSL Configuration (for Let's Encrypt)
DOMAIN=yourdomain.com
EMAIL=admin@yourdomain.com

# API Keys (production)
MISTRAL_API_KEY=your_production_mistral_api_key
MISTRAL_API_URL=https://api.mistral.ai/
MISTRAL_AGENT_ID=your_production_mistral_agent_id
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Cloudflare Integration

### SSL/TLS Encryption Modes

**Flexible SSL** (Staging):
- User ← HTTPS → Cloudflare ← HTTP → Your Server
- Good for: Staging environments, HTTP-only backends
- Security: Encryption between user and Cloudflare only

**Full SSL** (Recommended for Production):
- User ← HTTPS → Cloudflare ← HTTPS → Your Server
- Good for: Production with self-signed certificates
- Security: End-to-end encryption

**Full (Strict) SSL** (Most Secure):
- User ← HTTPS → Cloudflare ← HTTPS → Your Server (with valid certificate)
- Good for: Production with Let's Encrypt certificates
- Security: End-to-end encryption with certificate validation

### Configuration Steps

1. **In Cloudflare Dashboard**:
   - Go to SSL/TLS → Overview
   - Choose encryption mode:
     - **Staging**: Select "Flexible"
     - **Production**: Select "Full" or "Full (Strict)"

2. **DNS Records**:
   - Ensure your domain's nameservers point to Cloudflare
   - Add A records for your subdomains

3. **Troubleshooting HTTPS Redirects**:
   If Cloudflare automatically redirects HTTP to HTTPS but your backend only supports HTTP:
   - Use "Flexible" SSL mode for staging
   - Or configure HTTPS in your backend for production

## SSL Configuration (Production Only)

For production with Let's Encrypt certificates (used with "Full (Strict)" SSL mode):

```bash
cd /opt/geoffray
sudo docker compose -f docker-compose.prod.yml run --rm certbot certonly \
  --webroot --webroot-path=/var/www/certbot \
  --email admin@yourdomain.com \
  --agree-tos --no-eff-email \
  -d yourdomain.com -d www.yourdomain.com
```

## Maintenance Commands

### Staging Environment

```bash
# View logs
docker compose -f docker-compose.staging.yml logs -f

# View specific service logs
docker compose -f docker-compose.staging.yml logs -f backend
docker compose -f docker-compose.staging.yml logs -f postgres

# Restart services
docker compose -f docker-compose.staging.yml restart

# Stop services
docker compose -f docker-compose.staging.yml down

# Update staging deployment
cd /opt/geoffray
git pull origin main
docker compose -f docker-compose.staging.yml up -d --build
```

### Production Environment

```bash
# View logs
docker compose -f docker-compose.prod.yml logs -f

# Restart services
docker compose -f docker-compose.prod.yml restart

# Stop services
docker compose -f docker-compose.prod.yml down

# Update production deployment
cd /opt/geoffray
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build
```

### Database Operations

```bash
# Database backup (staging)
docker compose -f docker-compose.staging.yml exec postgres \
  pg_dump -U $DB_USER $DB_NAME > backup_staging_$(date +%Y%m%d).sql

# Database backup (production)
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U $DB_USER $DB_NAME > backup_prod_$(date +%Y%m%d).sql

# Check migration status
docker compose logs backend | grep -i migration

# Access database directly
docker compose exec postgres psql -U $DB_USER -d $DB_NAME
```

### System Maintenance

```bash
# Clean up Docker
docker system prune -af --volumes

# View system resources
docker stats
htop
```

## Monitoring

- **Health Check**: https://yourdomain.com/health or http://server-ip:8080/health
- **Docker Stats**: `docker stats`
- **Container Logs**: `docker compose logs -f`
- **System Resources**: `htop` (if installed) or `top`

## Troubleshooting

### Container not starting
```bash
# Check logs (staging)
docker compose -f docker-compose.staging.yml logs backend
docker compose -f docker-compose.staging.yml logs postgres

# Check logs (production)
docker compose -f docker-compose.prod.yml logs backend
docker compose -f docker-compose.prod.yml logs postgres

# Verify environment variables
docker compose -f docker-compose.staging.yml config
```

### Database connection issues
```bash
# Check if PostgreSQL is running (staging)
docker compose -f docker-compose.staging.yml ps postgres

# Test connection (staging)
docker compose -f docker-compose.staging.yml exec postgres \
  psql -U $DB_USER -d $DB_NAME -c "SELECT 1"

# Check migration status
docker compose logs backend | grep migration
```

### Cloudflare SSL issues
```bash
# Check Cloudflare SSL mode in dashboard:
# SSL/TLS → Overview → Encryption mode

# For "Web server is down" errors:
# 1. Verify server is running: docker compose ps
# 2. Check nginx logs: docker compose logs nginx
# 3. Ensure correct SSL mode (Flexible for HTTP backend)
```

### SSL certificate issues (Production only)
```bash
# Renew certificates manually
docker compose -f docker-compose.prod.yml run --rm certbot renew

# Check certificate expiry
docker compose -f docker-compose.prod.yml run --rm certbot certificates
```

### Port conflicts
```bash
# Check what's using ports
sudo netstat -tulpn | grep -E ':(80|443|5432)'

# Kill conflicting processes
sudo fuser -k 80/tcp
```

## Security Considerations

1. **Regular Updates**: Run system updates weekly
   ```bash
   apt update && apt upgrade -y
   ```

2. **Backup Strategy**: Set up automated backups to Hetzner backup storage

3. **Secrets Management**: Never commit `.env` files to git

4. **Hetzner Cloud Firewall**: Configure firewall rules in Hetzner Console (ports 22, 80, 443)

5. **SSH Keys**: Use strong SSH keys for authentication

6. **For Production**: Consider additional hardening (fail2ban, SSH restrictions, monitoring)

## Performance Optimization

### Database Optimization

1. **PostgreSQL Configuration**: Tune settings for your server size
   ```bash
   # Add to docker-compose.yml postgres service
   command: postgres -c shared_preload_libraries=pg_stat_statements -c pg_stat_statements.track=all
   ```

2. **Connection Pooling**: Already configured in `be-geoffray/db/init.go`
   - Max open connections: 25
   - Max idle connections: 5
   - Connection max lifetime: 5 minutes

### Frontend Optimization

1. **Cloudflare CDN**: Already provides global CDN for static assets

2. **Image Optimization**: Use Cloudflare Image Resizing (optional)

3. **Caching**: Nginx already configured with 1-year cache for static assets

### Backend Optimization

1. **Go Binary**: Compiled binary runs efficiently in production

2. **Gin Framework**: Set to release mode in production (`GIN_MODE=release`)

3. **Resource Limits**: Consider adding to docker-compose.yml:
   ```yaml
   deploy:
     resources:
       limits:
         memory: 512M
         cpus: '0.5'
   ```

## Support

For issues or questions:
- Create an issue on GitHub
- Check logs in `/opt/geoffray/logs/`
- Review Docker container status