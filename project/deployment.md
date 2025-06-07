# Deployment Guide

This document provides instructions for deploying the Journal App microservice to various environments.

## Prerequisites

- Node.js (v14+)
- npm or yarn
- Git (optional)

## Option 1: Deploy to a VPS or Cloud VM

### Step 1: Provision a Server

1. Set up a Virtual Private Server (VPS) with providers like DigitalOcean, AWS EC2, or Google Cloud Compute Engine
2. Choose an Ubuntu 20.04 or similar Linux distribution
3. Ensure at least 1GB RAM and 10GB storage

### Step 2: Install Dependencies

```bash
# Update package lists
sudo apt update

# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 (process manager)
sudo npm install -g pm2
```

### Step 3: Deploy Application

```bash
# Clone repository (if using Git)
git clone <repository-url> journal-app
cd journal-app

# OR upload files via SFTP/SCP

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with appropriate values

# Seed database
node src/database/seeders/index.js

# Start application with PM2
pm2 start src/index.js --name journal-app

# Configure PM2 to start on system boot
pm2 startup
pm2 save
```

### Step 4: Set Up Nginx (Optional)

```bash
# Install Nginx
sudo apt install -y nginx

# Configure Nginx as reverse proxy
sudo nano /etc/nginx/sites-available/journal-app
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/journal-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 5: Set Up SSL with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Option 2: Deploy Using Docker

### Step 1: Build Docker Image

```bash
docker build -t journal-app .
```

### Step 2: Run Container

```bash
# Create a volume for persistent data
docker volume create journal-app-data

# Run the container
docker run -d \
  --name journal-app \
  -p 3000:3000 \
  -v journal-app-data:/app/uploads \
  -e JWT_SECRET=your_secret_key \
  -e NODE_ENV=production \
  journal-app
```

### Step 3: Deploy to Cloud Container Services

The Docker image can be deployed to:
- AWS Elastic Container Service (ECS)
- Google Cloud Run
- Azure Container Instances
- Kubernetes (EKS, GKE, AKS)

## Option 3: Deploy to Heroku

### Step 1: Install Heroku CLI

```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login to Heroku
heroku login
```

### Step 2: Create Heroku App

```bash
# Create app
heroku create journal-app-service

# Add PostgreSQL addon (instead of SQLite)
heroku addons:create heroku-postgresql:hobby-dev
```

Note: You would need to modify the database configuration to use PostgreSQL instead of SQLite.

### Step 3: Deploy to Heroku

```bash
# Push code to Heroku
git push heroku main

# Run database seed
heroku run node src/database/seeders/index.js

# Open the app
heroku open
```

## Environment Variables

Ensure these environment variables are set in your deployment environment:

```
PORT=3000
NODE_ENV=production
JWT_SECRET=your_strong_secret_key
JWT_EXPIRES_IN=24h
```

## Health Monitoring

Set up health checks using the `/api/health` endpoint to monitor the service's status.

## Backup Strategy

For production deployments, set up a regular backup strategy for the database:

```bash
# Example for SQLite backup
mkdir -p backups
cp database.sqlite backups/database-$(date +%Y-%m-%d).sqlite
```

Consider automating this with a cron job.

## Security Considerations

1. Use environment variables for sensitive information
2. Set up a firewall (ufw on Ubuntu)
3. Keep the server and Node.js updated
4. Implement rate limiting
5. Use HTTPS only in production
6. Regularly audit dependencies for vulnerabilities with `npm audit`