# MedGemma Chest X-Ray System - Deployment Guide

## Production Deployment

### Prerequisites

1. **Server Requirements**
   - Ubuntu 22.04 LTS or similar
   - 32GB+ RAM
   - NVIDIA GPU with 16GB+ VRAM
   - 500GB+ storage (SSD recommended)
   - Static IP address
   - Domain name (optional, for HTTPS)

2. **Software Installation**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin

# Install NVIDIA Container Toolkit
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | \
  sudo tee /etc/apt/sources.list.d/nvidia-docker.list

sudo apt update
sudo apt install -y nvidia-container-toolkit
sudo systemctl restart docker

# Verify GPU access
docker run --rm --gpus all nvidia/cuda:12.1.0-base-ubuntu22.04 nvidia-smi
```

### Step-by-Step Deployment

#### 1. Clone and Configure

```bash
# Clone repository
cd /opt
sudo git clone <repository-url> medgemma_chest
cd medgemma_chest
sudo chown -R $USER:$USER .

# Create environment file
cp .env.example .env
nano .env
```

#### 2. Production Configuration

Edit `.env` with production values:

```ini
# Application
DEBUG=false
LOG_LEVEL=INFO

# Database - Use strong password
DATABASE_URL=postgresql://postgres:STRONG_PASSWORD_HERE@postgres:5432/medgemma_chest

# Security - Generate strong secret key
SECRET_KEY=$(openssl rand -hex 32)

# DICOM
DICOM_AE_TITLE=MEDGEMMA_SCP
DICOM_PORT=11112
DICOM_HOST=0.0.0.0

# Model
MODEL_NAME=google/medgemma-27b-it
MODEL_LOAD_IN_8BIT=true
MODEL_DEVICE=cuda

# RabbitMQ - Change credentials
RABBITMQ_USER=admin
RABBITMQ_PASSWORD=STRONG_PASSWORD_HERE

# Redis - Enable password
REDIS_PASSWORD=STRONG_PASSWORD_HERE

# API
CORS_ORIGINS=["https://yourdomain.com"]

# File Transfer (if using)
SSH_ENABLED=true
SSH_HOST=ris.hospital.com
SSH_PORT=22
SSH_USER=medgemma
SSH_KEY_PATH=/app/.ssh/id_rsa
```

#### 3. SSL/TLS Configuration (HTTPS)

Create SSL certificates (using Let's Encrypt):

```bash
# Install Certbot
sudo apt install certbot

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com
```

Update `docker/nginx.conf`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # ... rest of configuration
}
```

Update `docker-compose.yml` to mount certificates:

```yaml
nginx:
  volumes:
    - ./docker/nginx.conf:/etc/nginx/nginx.conf:ro
    - /etc/letsencrypt:/etc/letsencrypt:ro
```

#### 4. SSH Key Setup (for report export)

```bash
# Generate SSH key
mkdir -p .ssh
ssh-keygen -t rsa -b 4096 -f .ssh/id_rsa -N ""

# Copy public key to destination server
ssh-copy-id -i .ssh/id_rsa.pub user@ris.hospital.com

# Update docker-compose.yml to mount SSH key
```

#### 5. Initialize and Start

```bash
# Start the system
./scripts/start.sh

# Verify all services are running
docker-compose ps

# Check logs
docker-compose logs -f
```

#### 6. Verify Installation

```bash
# Test health endpoint
curl http://localhost/health

# Test DICOM SCP
echoscu localhost 11112 -aec MEDGEMMA_SCP

# Access web interface
# https://yourdomain.com
```

### Firewall Configuration

```bash
# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow DICOM SCP
sudo ufw allow 11112/tcp

# Allow SSH
sudo ufw allow 22/tcp

# Enable firewall
sudo ufw enable
```

### Systemd Service (Auto-start on Boot)

Create `/etc/systemd/system/medgemma-chest.service`:

```ini
[Unit]
Description=MedGemma Chest X-Ray Automation
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/medgemma_chest
ExecStart=/usr/bin/docker-compose up -d
ExecStop=/usr/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable medgemma-chest
sudo systemctl start medgemma-chest
```

### Monitoring and Logging

#### 1. Log Rotation

Create `/etc/logrotate.d/medgemma-chest`:

```
/opt/medgemma_chest/data/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 root root
    sharedscripts
}
```

#### 2. Health Monitoring

Create monitoring script `/opt/medgemma_chest/scripts/health_check.sh`:

```bash
#!/bin/bash

# Check if all services are running
SERVICES="postgres rabbitmq redis backend dicom_scp worker_dicom worker_report frontend nginx"

for service in $SERVICES; do
    if ! docker-compose ps | grep -q "$service.*Up"; then
        echo "ALERT: Service $service is down!"
        # Send alert (email, SMS, etc.)
    fi
done

# Check disk space
USAGE=$(df -h /opt/medgemma_chest | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $USAGE -gt 80 ]; then
    echo "ALERT: Disk usage is at ${USAGE}%"
fi
```

Add to crontab:

```bash
# Edit crontab
crontab -e

# Add monitoring (runs every 5 minutes)
*/5 * * * * /opt/medgemma_chest/scripts/health_check.sh
```

### Backup Strategy

#### 1. Database Backup

Create backup script `/opt/medgemma_chest/scripts/backup.sh`:

```bash
#!/bin/bash

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/medgemma"
mkdir -p $BACKUP_DIR

# Backup database
docker-compose exec -T postgres pg_dump -U postgres medgemma_chest | \
    gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Backup data directory
tar -czf $BACKUP_DIR/data_backup_$DATE.tar.gz data/

# Keep only last 30 days
find $BACKUP_DIR -type f -mtime +30 -delete

echo "Backup completed: $DATE"
```

Add to crontab:

```bash
# Daily backup at 2 AM
0 2 * * * /opt/medgemma_chest/scripts/backup.sh
```

#### 2. Restore Procedure

```bash
# Restore database
gunzip < backup.sql.gz | \
    docker-compose exec -T postgres psql -U postgres medgemma_chest

# Restore data
tar -xzf data_backup.tar.gz
```

### Performance Tuning

#### 1. PostgreSQL Tuning

Create `docker/postgres.conf`:

```ini
# Memory
shared_buffers = 8GB
effective_cache_size = 24GB
work_mem = 64MB
maintenance_work_mem = 2GB

# Connections
max_connections = 100

# Checkpoints
checkpoint_completion_target = 0.9
wal_buffers = 16MB

# Query Planning
random_page_cost = 1.1
effective_io_concurrency = 200
```

Mount in `docker-compose.yml`:

```yaml
postgres:
  volumes:
    - ./docker/postgres.conf:/etc/postgresql/postgresql.conf
  command: postgres -c config_file=/etc/postgresql/postgresql.conf
```

#### 2. RabbitMQ Tuning

Configure in `docker-compose.yml`:

```yaml
rabbitmq:
  environment:
    RABBITMQ_VM_MEMORY_HIGH_WATERMARK: 0.7
    RABBITMQ_DISK_FREE_LIMIT: 10GB
```

#### 3. Worker Scaling

Scale based on GPU and workload:

```bash
# For systems with multiple GPUs
docker-compose up -d --scale worker_dicom=2
```

### Security Hardening

#### 1. Network Isolation

Update `docker-compose.yml`:

```yaml
networks:
  medgemma_network:
    driver: bridge
    internal: false  # Set to true if no external access needed
```

#### 2. Secrets Management

Use Docker secrets instead of environment variables:

```bash
# Create secrets
echo "strong_password" | docker secret create postgres_password -
echo "secret_key" | docker secret create app_secret_key -
```

#### 3. Regular Updates

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker-compose pull
docker-compose up -d
```

### Troubleshooting

#### Common Issues

1. **Out of Memory**
   - Enable 8-bit quantization
   - Reduce worker count
   - Increase swap space

2. **Slow Processing**
   - Check GPU utilization: `nvidia-smi`
   - Verify GPU is being used
   - Scale workers

3. **DICOM Connection Failures**
   - Check firewall rules
   - Verify AE title configuration
   - Test with `echoscu`

4. **Database Connection Errors**
   - Check PostgreSQL logs
   - Verify credentials
   - Increase connection pool

### Support and Maintenance

#### Regular Maintenance Tasks

- Daily: Check logs for errors
- Weekly: Review disk space and performance
- Monthly: Update system and Docker images
- Quarterly: Review and update security settings

#### Performance Monitoring

```bash
# View resource usage
docker stats

# Check processing queue
docker-compose exec rabbitmq rabbitmqctl list_queues

# Monitor GPU
watch -n 1 nvidia-smi
```

### Scaling to Multiple Servers

For high-volume deployments:

1. **Separate Database Server**
   - Move PostgreSQL to dedicated server
   - Update DATABASE_URL in .env

2. **Load Balancing**
   - Deploy multiple frontend/backend instances
   - Use external load balancer (nginx, HAProxy)

3. **Distributed Workers**
   - Deploy workers on multiple GPU servers
   - Share RabbitMQ and database

4. **High Availability**
   - PostgreSQL replication
   - RabbitMQ clustering
   - Redis clustering

## Conclusion

This deployment guide covers production deployment, security, monitoring, and maintenance. Adjust configurations based on your specific requirements and infrastructure.

For issues or questions, refer to the main README or contact support.
