# Geoffray Deployment Guide

This guide walks you through deploying Geoffray to a Hetzner Cloud VM using Docker.

## Prerequisites

- Hetzner Cloud account  
- Domain name (optional, for SSL in production)
- GitHub account (for CI/CD)
- API keys for external services (Mistral, Stripe - optional)

**Note**: This guide is optimized for staging environments. For production, additional security hardening is recommended.

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

SSH into your new server as root and run the setup script:

```bash
# Download and run the setup script
wget https://raw.githubusercontent.com/yourusername/geoffray/main/scripts/setup-server.sh
chmod +x setup-server.sh
./setup-server.sh
```

This simplified script will:
- Update system packages
- Install Docker and Docker Compose
- Configure swap space
- Create basic directory structure
- Set timezone to UTC

### 3. Manual Deployment

After server setup, clone the repository and deploy:

```bash
# Clone repository (as root)
cd /opt
git clone https://github.com/yourusername/geoffray.git geoffray
cd geoffray

# Copy and edit environment variables
cp .env.production.example .env
nano .env  # Edit with your values

# For staging without SSL:
docker compose -f docker-compose.prod.yml up -d --build

# Or with SSL:
DOMAIN=yourdomain.com EMAIL=admin@yourdomain.com ./scripts/deploy.sh
```

### 4. Automated Deployment with GitHub Actions

Configure the following secrets in your GitHub repository (Settings > Secrets):

- `SERVER_HOST`: Your server IP address
- `SERVER_USER`: root
- `SERVER_SSH_KEY`: Private SSH key for root user
- `DOMAIN`: Your domain name
- `EMAIL`: Email for SSL certificates
- `DB_USER`: Database username
- `DB_PASSWORD`: Database password
- `DB_NAME`: Database name
- `JWT_SECRET`: Random JWT secret
- `MISTRAL_API_KEY`: (Optional) Mistral AI API key
- `STRIPE_SECRET_KEY`: (Optional) Stripe secret key
- `SLACK_WEBHOOK_URL`: (Optional) Slack webhook for notifications

Push to main branch to trigger automatic deployment.

## Environment Configuration

Edit `.env` file with your production values:

```bash
# Required
DB_USER=geoffray_user
DB_PASSWORD=your_secure_password
DB_NAME=geoffray_production
JWT_SECRET=your_very_long_random_jwt_secret

# Domain (for SSL)
DOMAIN=yourdomain.com
EMAIL=admin@yourdomain.com

# Optional API Keys
MISTRAL_API_KEY=...
STRIPE_SECRET_KEY=...
```

## SSL Configuration

SSL certificates are automatically generated using Let's Encrypt if a valid domain is configured.

For manual SSL setup:

```bash
cd /opt/geoffray
sudo docker compose -f docker-compose.prod.yml run --rm certbot certonly \
  --webroot --webroot-path=/var/www/certbot \
  --email admin@yourdomain.com \
  --agree-tos --no-eff-email \
  -d yourdomain.com -d www.yourdomain.com
```

## Maintenance Commands

```bash
# View logs
docker compose -f docker-compose.prod.yml logs -f

# Restart services
docker compose -f docker-compose.prod.yml restart

# Update application
./scripts/deploy.sh update

# Stop services
docker compose -f docker-compose.prod.yml down

# Database backup
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U $DB_USER $DB_NAME > backup.sql

# Clean up Docker
docker system prune -af --volumes
```

## Monitoring

- **Health Check**: https://yourdomain.com/health or http://server-ip:8080/health
- **Docker Stats**: `docker stats`
- **Container Logs**: `docker compose logs -f`
- **System Resources**: `htop` (if installed) or `top`

## Troubleshooting

### Container not starting
```bash
# Check logs
docker compose -f docker-compose.prod.yml logs backend
docker compose -f docker-compose.prod.yml logs postgres

# Verify environment variables
docker compose -f docker-compose.prod.yml config
```

### Database connection issues
```bash
# Check if PostgreSQL is running
docker compose -f docker-compose.prod.yml ps postgres

# Test connection
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U $DB_USER -d $DB_NAME -c "SELECT 1"
```

### SSL certificate issues
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

1. **Database Tuning**: Adjust PostgreSQL settings in `postgres.conf`

2. **Nginx Caching**: Enable caching for static assets

3. **Docker Resources**: Set resource limits in docker-compose.yml

4. **CDN**: Consider using Cloudflare for static assets

## Support

For issues or questions:
- Create an issue on GitHub
- Check logs in `/opt/geoffray/logs/`
- Review Docker container status