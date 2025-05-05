# Deployment Instructions for IGNITE Sleep Lounge and Zen Zone

This document provides step-by-step instructions for deploying the IGNITE Sleep Lounge and Zen Zone application to a production environment. Follow these guidelines to ensure a secure and reliable deployment.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Server Setup](#server-setup)
- [Database Setup](#database-setup)
- [Application Deployment](#application-deployment)
- [Environment Configuration](#environment-configuration)
- [SSL/HTTPS Configuration](#sslhttps-configuration)
- [Process Management](#process-management)
- [Backup Strategy](#backup-strategy)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before beginning the deployment process, ensure you have the following:

- A Linux server (Ubuntu 20.04 LTS or later recommended)
- Domain name configured with DNS pointing to your server IP
- SSH access to the server with sudo privileges
- PostgreSQL 13+ database server
- Node.js 16+ and npm installed
- Git installed

## Server Setup

### Update System Packages

```bash
sudo apt update
sudo apt upgrade -y
```

### Install Required Dependencies

```bash
# Install Node.js and npm if not already installed
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx as reverse proxy
sudo apt install -y nginx

# Install PM2 for process management
sudo npm install -g pm2
```

### Configure Firewall

```bash
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw allow 5432/tcp  # PostgreSQL (only if remote access is needed)
sudo ufw enable
```

## Database Setup

### Create Database User and Database

```bash
# Switch to postgres user
sudo -i -u postgres

# Create user and database
createuser --interactive --pwprompt sleep_lounge_user
# Enter a strong password when prompted
# Answer "n" to superuser, "y" to create DB, and "n" to create more roles

# Create database
createdb --owner=sleep_lounge_user sleep_lounge_db

# Exit postgres user shell
exit
```

### Configure PostgreSQL for Remote Access (Optional)

If your database is on a separate server, edit the PostgreSQL configuration:

```bash
sudo nano /etc/postgresql/13/main/postgresql.conf
```

Change the listen_addresses line to:
```
listen_addresses = '*'  # Listen on all interfaces
```

Edit the authentication file:
```bash
sudo nano /etc/postgresql/13/main/pg_hba.conf
```

Add this line to allow specific IP addresses:
```
host    sleep_lounge_db    sleep_lounge_user    YOUR_APP_SERVER_IP/32    md5
```

Restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

## Application Deployment

### Clone Repository

```bash
# Create directory for application
sudo mkdir -p /var/www/sleep-lounge
sudo chown $USER:$USER /var/www/sleep-lounge

# Clone repository
cd /var/www/sleep-lounge
git clone https://github.com/yourusername/sleep-lounge.git .
```

### Install Dependencies

```bash
npm install --production
```

### Build Frontend (If Needed)

If you have a build step for frontend assets:

```bash
npm run build
```

## Environment Configuration

### Create Environment File

```bash
nano /var/www/sleep-lounge/.env
```

Add the following configuration (replace with your actual values):

```
NODE_ENV=production
PORT=5020
DB_HOST=localhost
DB_USER=sleep_lounge_user
DB_PASSWORD=your_strong_password
DB_NAME=sleep_lounge_db
DB_PORT=5432
JWT_SECRET=your_very_long_random_jwt_secret_key
JWT_EXPIRE=7d
```

Generate a strong JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Initialize Database

```bash
cd /var/www/sleep-lounge
npm run db:init
```

## SSL/HTTPS Configuration

### Install Certbot for Let's Encrypt SSL

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Obtain SSL Certificate

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts to complete the SSL certificate setup.

### Configure Nginx as Reverse Proxy

Create an Nginx configuration file:

```bash
sudo nano /etc/nginx/sites-available/sleep-lounge
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect all HTTP traffic to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL configuration (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Content-Type-Options "nosniff";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Root directory
    root /var/www/sleep-lounge;
    
    # Index file
    index Index.html;
    
    # Static file caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|webp)$ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000";
    }
    
    # API requests proxy to Node.js application
    location /api {
        proxy_pass http://localhost:5020;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Serve static assets and HTML
    location / {
        try_files $uri $uri/ /Index.html;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/sleep-lounge /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

## Process Management

### Set Up PM2 for Node.js Application

```bash
cd /var/www/sleep-lounge
pm2 start server/server.js --name "sleep-lounge" --env production

# Save PM2 configuration
pm2 save

# Set up PM2 to start on system boot
pm2 startup
# Run the command that PM2 outputs
```

### Monitoring with PM2

```bash
# Monitor application
pm2 monit

# View logs
pm2 logs sleep-lounge

# Restart application
pm2 restart sleep-lounge
```

## Backup Strategy

### Database Backups

Create a backup script:

```bash
sudo nano /usr/local/bin/backup-sleep-lounge-db.sh
```

Add the following content:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/sleep-lounge"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/sleep_lounge_db_$TIMESTAMP.sql"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Create PostgreSQL backup
PGPASSWORD="your_db_password" pg_dump -h localhost -U sleep_lounge_user -d sleep_lounge_db -F c -f $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Remove backups older than 30 days
find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +30 -delete
```

Make the script executable:

```bash
sudo chmod +x /usr/local/bin/backup-sleep-lounge-db.sh
```

Set up a cron job for automatic backups:

```bash
sudo crontab -e
```

Add the following line to run the backup daily at 2 AM:

```
0 2 * * * /usr/local/bin/backup-sleep-lounge-db.sh
```

### Application Code Backups

The application code should be backed up through version control (Git). Ensure all important changes are committed and pushed to your repository.

## Monitoring

### Set Up Application Monitoring

Consider using a monitoring service like New Relic, Datadog, or PM2 Plus for comprehensive monitoring:

```bash
# For basic uptime monitoring with PM2
pm2 install pm2-server-monit
```

### Log Rotation

Configure logrotate for PM2 logs:

```bash
sudo nano /etc/logrotate.d/pm2-sleep-lounge
```

Add the following:

```
/home/ubuntu/.pm2/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 ubuntu ubuntu
}
```

## Troubleshooting

### Check Application Logs

```bash
pm2 logs sleep-lounge
```

### Check Nginx Logs

```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Check Database Connection

```bash
cd /var/www/sleep-lounge
node -e "const { Pool } = require('pg'); const pool = new Pool({ connectionString: 'postgresql://sleep_lounge_user:your_password@localhost:5432/sleep_lounge_db' }); pool.query('SELECT NOW()', (err, res) => { console.log(err ? err : res.rows[0]); pool.end(); });"
```

### Restart Services

```bash
# Restart Node.js application
pm2 restart sleep-lounge

# Restart Nginx
sudo systemctl restart nginx

# Restart PostgreSQL
sudo systemctl restart postgresql
```

## Security Considerations

### Regular Updates

Keep your server and application dependencies up to date:

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update npm packages
cd /var/www/sleep-lounge
npm outdated  # Check for outdated packages
npm update    # Update packages to latest compatible versions
```

### Database Security

- Use strong passwords
- Limit database access to only the application server IP
- Use least privilege principles for database users
- Regularly audit database access logs

### Application Security

- Keep all npm packages updated
- Implement rate limiting for authentication endpoints
- Use secure HTTP headers
- Validate all user inputs
- Sanitize data before displaying it to users
- Use HTTPS for all communications
- Store JWT secrets securely and rotate them periodically

## Additional Recommendations

1. Consider setting up a staging environment that mirrors production
2. Implement a CI/CD pipeline for automated testing and deployment
3. Set up alerting for critical errors and performance issues
4. Create a disaster recovery plan
5. Document all custom configurations and changes

This deployment guide should be reviewed and updated as the application evolves.