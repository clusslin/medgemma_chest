# MedGemma 胸部 X 光系統 - Ubuntu + NVIDIA A4000 雙顯卡部署指南

## 硬體環境

- **作業系統**: Ubuntu 22.04 LTS
- **顯示卡**: NVIDIA A4000 (16GB VRAM) × 2
- **建議記憶體**: 64GB RAM
- **建議儲存**: 1TB NVMe SSD

---

## 系統準備

### 1. 更新系統

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential curl wget git vim
```

### 2. 安裝 NVIDIA 驅動程式

```bash
# 檢查推薦的驅動版本
ubuntu-drivers devices

# 安裝推薦的驅動（或選擇特定版本）
sudo ubuntu-drivers autoinstall

# 或手動安裝特定版本（建議 535 或更新版本）
sudo apt install -y nvidia-driver-535

# 重新啟動
sudo reboot

# 驗證安裝
nvidia-smi
```

**預期輸出**：應該看到兩張 A4000 顯卡

```
+-----------------------------------------------------------------------------+
| NVIDIA-SMI 535.xx.xx    Driver Version: 535.xx.xx    CUDA Version: 12.2     |
|-------------------------------+----------------------+----------------------+
| GPU  Name        Persistence-M| Bus-Id        Disp.A | Volatile Uncorr. ECC |
| Fan  Temp  Perf  Pwr:Usage/Cap|         Memory-Usage | GPU-Util  Compute M. |
|===============================+======================+======================|
|   0  NVIDIA A4000        Off  | 00000000:01:00.0 Off |                  Off |
| 41%   30C    P8    18W / 140W |      0MiB / 16376MiB |      0%      Default |
+-------------------------------+----------------------+----------------------+
|   1  NVIDIA A4000        Off  | 00000000:02:00.0 Off |                  Off |
| 41%   31C    P8    19W / 140W |      0MiB / 16376MiB |      0%      Default |
+-------------------------------+----------------------+----------------------+
```

### 3. 安裝 Docker

```bash
# 安裝 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 將當前使用者加入 docker 群組
sudo usermod -aG docker $USER

# 安裝 Docker Compose Plugin
sudo apt install -y docker-compose-plugin

# 登出後重新登入，或執行
newgrp docker

# 驗證安裝
docker --version
docker compose version
```

### 4. 安裝 NVIDIA Container Toolkit

```bash
# 設定套件庫
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | \
    sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg

curl -s -L https://nvidia.github.io/libnvidia-container/$distribution/libnvidia-container.list | \
    sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
    sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list

# 安裝
sudo apt update
sudo apt install -y nvidia-container-toolkit

# 設定 Docker 使用 NVIDIA runtime
sudo nvidia-ctk runtime configure --runtime=docker
sudo systemctl restart docker

# 驗證 GPU 可在容器中使用
docker run --rm --gpus all nvidia/cuda:12.1.0-base-ubuntu22.04 nvidia-smi
```

---

## 專案部署

### 1. 下載專案

```bash
# 建立專案目錄
sudo mkdir -p /opt/medgemma_chest
cd /opt/medgemma_chest

# 複製專案（請替換為實際的 Git URL）
sudo git clone <your-git-repo-url> .

# 設定權限
sudo chown -R $USER:$USER /opt/medgemma_chest
```

### 2. 環境變數設定

建立 `.env` 檔案：

```bash
cp .env.example .env
nano .env
```

**重要設定（針對雙 A4000 優化）**：

```ini
# ============================================
# 應用程式設定
# ============================================
DEBUG=false
LOG_LEVEL=INFO
APP_NAME=MedGemma Chest X-Ray System

# ============================================
# 資料庫設定
# ============================================
# 請使用強密碼！
POSTGRES_USER=postgres
POSTGRES_PASSWORD=你的強密碼_請修改
POSTGRES_DB=medgemma_chest
DATABASE_URL=postgresql://postgres:你的強密碼_請修改@postgres:5432/medgemma_chest

# ============================================
# 安全性設定
# ============================================
# 產生密鑰：openssl rand -hex 32
SECRET_KEY=請執行上述指令產生密鑰並貼在這裡

# ============================================
# DICOM 設定
# ============================================
DICOM_AE_TITLE=MEDGEMMA_SCP
DICOM_PORT=11112
DICOM_HOST=0.0.0.0

# 接受的研究描述（胸部 X 光）
ALLOWED_STUDY_DESCRIPTIONS=Chest,CXR,Chest PA,Chest AP,Chest Lateral,胸部X光

# 最小年齡限制
MIN_AGE=20

# ============================================
# AI 模型設定（針對 A4000 優化）
# ============================================
MODEL_NAME=google/medgemma-27b-it
MODEL_DEVICE=cuda
MODEL_LOAD_IN_8BIT=true
MODEL_MAX_LENGTH=2048

# GPU 記憶體設定
PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:512

# ============================================
# RabbitMQ 設定
# ============================================
RABBITMQ_USER=admin
RABBITMQ_PASSWORD=你的RabbitMQ密碼_請修改
RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672

# ============================================
# Redis 設定
# ============================================
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=你的Redis密碼_請修改

# ============================================
# API 設定
# ============================================
# 請替換為實際的網域
CORS_ORIGINS=["http://localhost","http://192.168.1.100","https://yourdomain.com"]
API_PREFIX=/api/v1

# ============================================
# Worker 設定（雙 GPU 配置）
# ============================================
# 每個 GPU 執行一個 worker
WORKER_CONCURRENCY=1
MAX_WORKERS=2

# ============================================
# 檔案傳輸設定（選用）
# ============================================
SSH_ENABLED=false
SSH_HOST=ris.hospital.com
SSH_PORT=22
SSH_USER=medgemma
SSH_KEY_PATH=/app/.ssh/id_rsa
FTP_ENABLED=false
```

### 3. Docker Compose 設定（雙 GPU 優化）

建立或修改 `docker-compose.override.yml`：

```yaml
version: '3.8'

services:
  # Worker 1 - 使用 GPU 0
  worker_dicom_gpu0:
    extends:
      service: worker_dicom
    environment:
      - CUDA_VISIBLE_DEVICES=0
      - WORKER_NAME=worker_dicom_gpu0
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              device_ids: ['0']
              capabilities: [gpu]

  # Worker 2 - 使用 GPU 1
  worker_dicom_gpu1:
    extends:
      service: worker_dicom
    environment:
      - CUDA_VISIBLE_DEVICES=1
      - WORKER_NAME=worker_dicom_gpu1
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              device_ids: ['1']
              capabilities: [gpu]

  # Report Worker（不需要 GPU）
  worker_report:
    environment:
      - WORKER_CONCURRENCY=4
```

**或者直接修改主要的 `docker-compose.yml`**，將 `worker_dicom` 服務改為：

```yaml
  worker_dicom:
    build:
      context: ./backend
      dockerfile: Dockerfile
    command: celery -A app.celery_app worker --loglevel=info -Q dicom_queue --concurrency=1
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - RABBITMQ_HOST=${RABBITMQ_HOST}
      - REDIS_HOST=${REDIS_HOST}
      - MODEL_NAME=${MODEL_NAME}
      - MODEL_DEVICE=cuda
      - MODEL_LOAD_IN_8BIT=true
    volumes:
      - ./backend:/app
      - ./data:/data
    depends_on:
      - postgres
      - rabbitmq
      - redis
    networks:
      - medgemma_network
    deploy:
      replicas: 2  # 啟動兩個 workers
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 2
              capabilities: [gpu]
```

### 4. 啟動系統

```bash
# 建構映像檔
docker compose build

# 啟動所有服務
docker compose up -d

# 查看服務狀態
docker compose ps

# 查看日誌
docker compose logs -f

# 特別查看 worker 日誌
docker compose logs -f worker_dicom
```

### 5. 驗證雙 GPU 使用

```bash
# 監控 GPU 使用狀況
watch -n 1 nvidia-smi

# 或使用更詳細的監控
nvidia-smi dmon -s pucvmet

# 檢查 Docker 容器使用的 GPU
docker ps --format "table {{.Names}}\t{{.Status}}"
docker exec <worker容器名稱> nvidia-smi
```

---

## 效能優化

### 1. PostgreSQL 優化（針對 64GB RAM）

建立 `docker/postgres/postgresql.conf`：

```ini
# 記憶體設定
shared_buffers = 16GB
effective_cache_size = 48GB
work_mem = 128MB
maintenance_work_mem = 4GB

# 連線設定
max_connections = 200

# WAL 設定
wal_buffers = 32MB
checkpoint_completion_target = 0.9
max_wal_size = 4GB
min_wal_size = 1GB

# 查詢規劃
random_page_cost = 1.1
effective_io_concurrency = 200

# 平行處理
max_parallel_workers_per_gather = 4
max_parallel_workers = 8
max_worker_processes = 8
```

掛載設定檔：

```yaml
# 在 docker-compose.yml 的 postgres 服務中加入
postgres:
  volumes:
    - ./docker/postgres/postgresql.conf:/etc/postgresql/postgresql.conf
  command: postgres -c config_file=/etc/postgresql/postgresql.conf
```

### 2. 系統層級優化

```bash
# 增加檔案描述符限制
sudo tee -a /etc/security/limits.conf << EOF
* soft nofile 65535
* hard nofile 65535
EOF

# 優化網路設定
sudo tee -a /etc/sysctl.conf << EOF
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 8192
net.core.netdev_max_backlog = 5000
EOF

sudo sysctl -p
```

### 3. Docker 資源限制

在 `docker-compose.yml` 中設定資源限制：

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 8G
        reservations:
          cpus: '2'
          memory: 4G

  worker_dicom:
    deploy:
      resources:
        limits:
          cpus: '8'
          memory: 24G
        reservations:
          cpus: '4'
          memory: 16G
```

---

## 監控與維護

### 1. 建立監控腳本

```bash
sudo mkdir -p /opt/medgemma_chest/scripts
sudo nano /opt/medgemma_chest/scripts/monitor_gpu.sh
```

```bash
#!/bin/bash

# GPU 監控腳本
LOG_FILE="/var/log/medgemma/gpu_monitor.log"
mkdir -p /var/log/medgemma

echo "=== GPU Status at $(date) ===" >> $LOG_FILE
nvidia-smi --query-gpu=index,name,temperature.gpu,utilization.gpu,utilization.memory,memory.used,memory.total \
    --format=csv,noheader >> $LOG_FILE

# 檢查 GPU 溫度
TEMP0=$(nvidia-smi --query-gpu=temperature.gpu --format=csv,noheader -i 0)
TEMP1=$(nvidia-smi --query-gpu=temperature.gpu --format=csv,noheader -i 1)

if [ $TEMP0 -gt 80 ] || [ $TEMP1 -gt 80 ]; then
    echo "WARNING: GPU temperature too high! GPU0: ${TEMP0}°C, GPU1: ${TEMP1}°C" >> $LOG_FILE
    # 可加入通知機制
fi

# 檢查 GPU 記憶體使用
MEM0=$(nvidia-smi --query-gpu=memory.used --format=csv,noheader,nounits -i 0)
MEM1=$(nvidia-smi --query-gpu=memory.used --format=csv,noheader,nounits -i 1)

if [ $MEM0 -gt 15000 ] || [ $MEM1 -gt 15000 ]; then
    echo "WARNING: GPU memory usage high! GPU0: ${MEM0}MB, GPU1: ${MEM1}MB" >> $LOG_FILE
fi
```

```bash
sudo chmod +x /opt/medgemma_chest/scripts/monitor_gpu.sh
```

加入 crontab：

```bash
crontab -e

# 每 5 分鐘監控一次
*/5 * * * * /opt/medgemma_chest/scripts/monitor_gpu.sh
```

### 2. 系統健康檢查

```bash
sudo nano /opt/medgemma_chest/scripts/health_check.sh
```

```bash
#!/bin/bash

SERVICES="postgres rabbitmq redis backend dicom_scp worker_dicom frontend nginx"
cd /opt/medgemma_chest

for service in $SERVICES; do
    if ! docker compose ps | grep -q "$service.*Up"; then
        echo "ALERT: Service $service is down at $(date)" | tee -a /var/log/medgemma/health.log
        # 嘗試重啟
        docker compose restart $service
    fi
done

# 檢查磁碟空間
USAGE=$(df -h /opt/medgemma_chest | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $USAGE -gt 80 ]; then
    echo "WARNING: Disk usage at ${USAGE}% at $(date)" | tee -a /var/log/medgemma/health.log
fi

# 檢查 Docker 磁碟空間
docker system df
```

```bash
sudo chmod +x /opt/medgemma_chest/scripts/health_check.sh

# 加入 crontab（每 5 分鐘檢查）
*/5 * * * * /opt/medgemma_chest/scripts/health_check.sh
```

---

## Systemd 服務設定

建立自動啟動服務：

```bash
sudo nano /etc/systemd/system/medgemma-chest.service
```

```ini
[Unit]
Description=MedGemma Chest X-Ray Analysis System
Requires=docker.service
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/medgemma_chest
ExecStartPre=/usr/bin/docker compose pull
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
ExecReload=/usr/bin/docker compose restart
TimeoutStartSec=300
TimeoutStopSec=120
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

啟用服務：

```bash
sudo systemctl daemon-reload
sudo systemctl enable medgemma-chest.service
sudo systemctl start medgemma-chest.service

# 檢查狀態
sudo systemctl status medgemma-chest.service
```

---

## 備份策略

### 自動備份腳本

```bash
sudo nano /opt/medgemma_chest/scripts/backup.sh
```

```bash
#!/bin/bash

BACKUP_DIR="/backup/medgemma"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

mkdir -p $BACKUP_DIR

cd /opt/medgemma_chest

# 備份資料庫
echo "Backing up database..."
docker compose exec -T postgres pg_dump -U postgres medgemma_chest | \
    gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# 備份 DICOM 資料
echo "Backing up DICOM data..."
tar -czf $BACKUP_DIR/dicom_data_$DATE.tar.gz data/dicom/

# 備份設定檔
echo "Backing up configurations..."
tar -czf $BACKUP_DIR/config_$DATE.tar.gz .env docker-compose.yml docker/

# 刪除舊備份
echo "Cleaning old backups..."
find $BACKUP_DIR -type f -mtime +$RETENTION_DAYS -delete

echo "Backup completed at $(date)" >> $BACKUP_DIR/backup.log
```

```bash
sudo chmod +x /opt/medgemma_chest/scripts/backup.sh

# 每天凌晨 2 點備份
crontab -e
0 2 * * * /opt/medgemma_chest/scripts/backup.sh
```

---

## 疑難排解

### 1. GPU 記憶體不足

**症狀**：Worker 容器崩潰，日誌顯示 CUDA out of memory

**解決方案**：

```bash
# 確認 8-bit 量化已啟用
grep MODEL_LOAD_IN_8BIT .env
# 應該顯示: MODEL_LOAD_IN_8BIT=true

# 調整 PyTorch 記憶體配置
echo "PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:256" >> .env

# 重啟 workers
docker compose restart worker_dicom
```

### 2. 雙 GPU 未平均使用

**檢查**：

```bash
# 即時監控
watch -n 1 'nvidia-smi --query-gpu=index,utilization.gpu,memory.used --format=csv'

# 檢查 worker 分配
docker compose ps | grep worker
```

**調整**：確保兩個 worker 都在運行，並且正確分配到不同的 GPU。

### 3. 處理速度慢

```bash
# 檢查 RabbitMQ 佇列
docker compose exec rabbitmq rabbitmqctl list_queues

# 檢查 worker 狀態
docker compose logs worker_dicom | tail -50

# 增加 worker 並行度（如果 GPU 記憶體充足）
# 在 .env 中調整：
WORKER_CONCURRENCY=2
```

---

## 效能基準測試

在雙 A4000 配置下的預期效能：

- **單張影像處理時間**：30-60 秒
- **並行處理能力**：2-4 張影像同時處理
- **每日處理容量**：2000-4000 張影像
- **GPU 利用率**：60-80%
- **GPU 記憶體使用**：每個 GPU 約 12-14GB

---

## 安全性設定

### 防火牆設定

```bash
sudo ufw allow 22/tcp     # SSH
sudo ufw allow 80/tcp     # HTTP
sudo ufw allow 443/tcp    # HTTPS
sudo ufw allow 11112/tcp  # DICOM SCP
sudo ufw enable
```

### SSL 憑證設定

```bash
# 安裝 Certbot
sudo apt install -y certbot

# 取得憑證
sudo certbot certonly --standalone -d medgemma.yourdomain.com

# 設定自動更新
sudo systemctl enable certbot.timer
```

---

## 維護檢查清單

### 每日
- [ ] 檢查 GPU 溫度與使用率
- [ ] 檢查系統日誌
- [ ] 檢查處理佇列

### 每週
- [ ] 檢視備份完整性
- [ ] 檢查磁碟空間
- [ ] 查看錯誤日誌

### 每月
- [ ] 更新系統套件
- [ ] 更新 Docker 映像
- [ ] 檢視效能指標
- [ ] 測試還原程序

---

**文件版本**: 1.0.0
**最後更新**: 2025-11-20
**適用硬體**: Ubuntu 22.04 + NVIDIA A4000 × 2
