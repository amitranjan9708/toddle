# Deployment Guide

## Overview

This guide covers deploying the Virtual Classroom API to various platforms and environments.

## Prerequisites

- Node.js >= 16.0.0
- npm >= 8.0.0
- Git
- Database (SQLite for development, PostgreSQL/MySQL for production)

## Environment Setup

### 1. Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=4000
NODE_ENV=production

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
JWT_EXPIRES_IN=24h

# Database Configuration (Production)
DB_DIALECT=postgres
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=virtual_classroom
DB_USERNAME=your-db-username
DB_PASSWORD=your-db-password

# Logging
LOG_LEVEL=info

# Security
CORS_ORIGIN=https://yourdomain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@yourdomain.com
```

### 2. Database Setup

#### PostgreSQL (Recommended for Production)

```sql
-- Create database
CREATE DATABASE virtual_classroom;

-- Create user
CREATE USER classroom_user WITH PASSWORD 'secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE virtual_classroom TO classroom_user;
```

#### MySQL

```sql
-- Create database
CREATE DATABASE virtual_classroom;

-- Create user
CREATE USER 'classroom_user'@'localhost' IDENTIFIED BY 'secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON virtual_classroom.* TO 'classroom_user'@'localhost';
FLUSH PRIVILEGES;
```

## Deployment Options

### 1. Heroku Deployment

#### Prerequisites
- Heroku CLI installed
- Heroku account

#### Steps

1. **Install Heroku CLI**
   ```bash
   # macOS
   brew tap heroku/brew && brew install heroku
   
   # Ubuntu/Debian
   sudo snap install --classic heroku
   ```

2. **Login to Heroku**
   ```bash
   heroku login
   ```

3. **Create Heroku App**
   ```bash
   heroku create your-app-name
   ```

4. **Add PostgreSQL Add-on**
   ```bash
   heroku addons:create heroku-postgresql:hobby-dev
   ```

5. **Set Environment Variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your-super-secret-jwt-key
   heroku config:set CORS_ORIGIN=https://your-app-name.herokuapp.com
   ```

6. **Deploy**
   ```bash
   git add .
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```

7. **Run Database Migrations**
   ```bash
   heroku run npm run migrate
   ```

#### Heroku-specific Files

Create `Procfile`:
```
web: npm start
```

Create `app.json`:
```json
{
  "name": "virtual-classroom-api",
  "description": "Virtual Classroom API with REST and GraphQL endpoints",
  "repository": "https://github.com/yourusername/virtual-classroom-api",
  "logo": "https://node-js-sample.herokuapp.com/node.png",
  "keywords": ["node", "express", "api", "graphql"],
  "image": "heroku/nodejs"
}
```

### 2. AWS Deployment

#### Using AWS Elastic Beanstalk

1. **Install EB CLI**
   ```bash
   pip install awsebcli
   ```

2. **Initialize EB Application**
   ```bash
   eb init
   ```

3. **Create Environment**
   ```bash
   eb create production
   ```

4. **Deploy**
   ```bash
   eb deploy
   ```

#### Using AWS EC2

1. **Launch EC2 Instance**
   - Choose Ubuntu 20.04 LTS
   - Configure security groups (port 22, 80, 443, 4000)
   - Create key pair

2. **Connect to Instance**
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   ```

3. **Install Dependencies**
   ```bash
   sudo apt update
   sudo apt install nodejs npm nginx postgresql
   ```

4. **Setup Application**
   ```bash
   git clone your-repo
   cd virtual-classroom-api
   npm install
   npm run build
   ```

5. **Setup PM2**
   ```bash
   sudo npm install -g pm2
   pm2 start src/server.js --name "virtual-classroom"
   pm2 startup
   pm2 save
   ```

6. **Setup Nginx**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:4000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### 3. Docker Deployment

#### Create Dockerfile

```dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4000/api/health || exit 1

# Start application
CMD ["npm", "start"]
```

#### Create docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
      - DB_DIALECT=postgres
      - DB_HOST=postgres
      - DB_NAME=virtual_classroom
      - DB_USERNAME=postgres
      - DB_PASSWORD=password
    depends_on:
      - postgres
      - redis
    volumes:
      - ./logs:/app/logs

  postgres:
    image: postgres:13
    environment:
      - POSTGRES_DB=virtual_classroom
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app

volumes:
  postgres_data:
  redis_data:
```

#### Deploy with Docker

```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f app

# Scale application
docker-compose up -d --scale app=3
```

### 4. DigitalOcean Deployment

#### Using DigitalOcean App Platform

1. **Connect Repository**
   - Go to DigitalOcean App Platform
   - Connect your GitHub repository

2. **Configure App**
   ```yaml
   name: virtual-classroom-api
   services:
   - name: api
     source_dir: /
     github:
       repo: yourusername/virtual-classroom-api
       branch: main
     run_command: npm start
     environment_slug: node-js
     instance_count: 1
     instance_size_slug: basic-xxs
     envs:
     - key: NODE_ENV
       value: production
     - key: JWT_SECRET
       value: your-secret-key
   databases:
   - name: db
     engine: PG
     version: "13"
   ```

3. **Deploy**
   - Click "Create Resources"
   - Wait for deployment to complete

#### Using DigitalOcean Droplets

1. **Create Droplet**
   - Choose Ubuntu 20.04
   - Select size (1GB RAM minimum)
   - Add SSH keys

2. **Setup Server**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2
   sudo npm install -g pm2
   
   # Install Nginx
   sudo apt install nginx
   
   # Install PostgreSQL
   sudo apt install postgresql postgresql-contrib
   ```

3. **Deploy Application**
   ```bash
   # Clone repository
   git clone your-repo
   cd virtual-classroom-api
   
   # Install dependencies
   npm install
   
   # Start with PM2
   pm2 start src/server.js --name "virtual-classroom"
   pm2 startup
   pm2 save
   ```

## SSL/HTTPS Setup

### Using Let's Encrypt (Free SSL)

1. **Install Certbot**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   ```

2. **Get SSL Certificate**
   ```bash
   sudo certbot --nginx -d yourdomain.com
   ```

3. **Auto-renewal**
   ```bash
   sudo crontab -e
   # Add: 0 12 * * * /usr/bin/certbot renew --quiet
   ```

### Using Cloudflare (Recommended)

1. **Add Domain to Cloudflare**
2. **Update Nameservers**
3. **Enable SSL/TLS**
4. **Configure Page Rules**

## Monitoring and Logging

### 1. Application Monitoring

#### Using PM2 Monitoring
```bash
# Install PM2 Plus
pm2 install pm2-server-monit

# View monitoring dashboard
pm2 monit
```

#### Using New Relic
```bash
npm install newrelic
```

Create `newrelic.js`:
```javascript
exports.config = {
  app_name: ['Virtual Classroom API'],
  license_key: 'your-license-key',
  logging: {
    level: 'info'
  }
};
```

### 2. Log Management

#### Using Winston with Log Rotation
```javascript
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

const logger = winston.createLogger({
  transports: [
    new DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d'
    })
  ]
});
```

#### Using LogDNA
```bash
npm install logdna-winston
```

### 3. Health Checks

#### Application Health Endpoint
```javascript
app.get('/api/health', async (req, res) => {
  const healthcheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    checks: {
      database: await checkDatabase(),
      memory: process.memoryUsage(),
      disk: await checkDiskSpace()
    }
  };
  
  res.status(200).json(healthcheck);
});
```

## Performance Optimization

### 1. Database Optimization

#### Indexes
```sql
-- Add indexes for better performance
CREATE INDEX idx_assignments_tutor ON Assignments(tutorId);
CREATE INDEX idx_assignments_published ON Assignments(publishedAt);
CREATE INDEX idx_submissions_student ON Submissions(studentId);
CREATE INDEX idx_submissions_assignment ON Submissions(assignmentId);
```

#### Connection Pooling
```javascript
const sequelize = new Sequelize(database, username, password, {
  dialect: 'postgres',
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});
```

### 2. Caching

#### Redis Caching
```javascript
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);

// Cache assignment feed
app.get('/api/assignments/feed', async (req, res) => {
  const cacheKey = `feed:${req.user.id}:${JSON.stringify(req.query)}`;
  const cached = await client.get(cacheKey);
  
  if (cached) {
    return res.json(JSON.parse(cached));
  }
  
  const feed = await AssignmentService.getAssignmentFeed(req.user.id, req.user.role, req.query);
  await client.setex(cacheKey, 300, JSON.stringify(feed)); // Cache for 5 minutes
  
  res.json(feed);
});
```

### 3. Load Balancing

#### Using Nginx
```nginx
upstream app_servers {
    server 127.0.0.1:4000;
    server 127.0.0.1:4001;
    server 127.0.0.1:4002;
}

server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://app_servers;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Backup and Recovery

### 1. Database Backup

#### PostgreSQL Backup
```bash
# Create backup
pg_dump -h localhost -U postgres virtual_classroom > backup.sql

# Restore backup
psql -h localhost -U postgres virtual_classroom < backup.sql

# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -h localhost -U postgres virtual_classroom > /backups/backup_$DATE.sql
find /backups -name "backup_*.sql" -mtime +7 -delete
```

### 2. Application Backup

#### File Backup
```bash
# Backup application files
tar -czf app_backup_$(date +%Y%m%d).tar.gz /path/to/app

# Backup logs
tar -czf logs_backup_$(date +%Y%m%d).tar.gz /path/to/logs
```

## Security Checklist

### Production Security

- [ ] Change default JWT secret
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable security headers
- [ ] Use environment variables for secrets
- [ ] Regular security updates
- [ ] Database access restrictions
- [ ] Firewall configuration
- [ ] Regular backups
- [ ] Monitor logs for suspicious activity
- [ ] Use non-root user for application
- [ ] Keep dependencies updated
- [ ] Enable audit logging

### Environment Variables Security

```bash
# Never commit .env files
echo ".env" >> .gitignore
echo "*.env" >> .gitignore

# Use different secrets for different environments
# Development: Use simple secrets
# Staging: Use complex secrets
# Production: Use very complex secrets with rotation
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Find process using port
   lsof -i :4000
   
   # Kill process
   kill -9 <PID>
   ```

2. **Database Connection Issues**
   ```bash
   # Check database status
   sudo systemctl status postgresql
   
   # Check connection
   psql -h localhost -U postgres -d virtual_classroom
   ```

3. **Memory Issues**
   ```bash
   # Check memory usage
   free -h
   
   # Restart application
   pm2 restart virtual-classroom
   ```

4. **SSL Certificate Issues**
   ```bash
   # Check certificate
   openssl x509 -in /etc/ssl/certs/yourdomain.com.crt -text -noout
   
   # Renew certificate
   sudo certbot renew
   ```

## Support

For deployment issues:
- Check application logs: `pm2 logs virtual-classroom`
- Check system logs: `journalctl -u nginx`
- Monitor resources: `htop`, `df -h`
- Database logs: `sudo tail -f /var/log/postgresql/postgresql-13-main.log`

## Cost Optimization

### AWS Cost Optimization
- Use reserved instances for predictable workloads
- Enable auto-scaling
- Use CloudWatch for monitoring
- Set up billing alerts

### Heroku Cost Optimization
- Use hobby dynos for development
- Enable dyno sleeping
- Use add-on credits
- Monitor usage

### DigitalOcean Cost Optimization
- Use smaller droplets initially
- Enable monitoring
- Use object storage for files
- Set up alerts

This deployment guide provides comprehensive instructions for deploying the Virtual Classroom API across various platforms and environments.
