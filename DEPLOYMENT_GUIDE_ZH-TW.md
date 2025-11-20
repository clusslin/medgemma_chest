# MedGemma 胸部 X 光系統 - 部署指南

## 生產環境部署

### 系統需求

1. **伺服器硬體需求**
   - Ubuntu 22.04 LTS 或相似系統
   - 32GB 以上記憶體
   - NVIDIA GPU（16GB 以上 VRAM）
   - 500GB 以上儲存空間（建議使用 SSD）
   - 固定 IP 位址
   - 網域名稱（選用，用於 HTTPS）

2. **軟體安裝**

```bash
# 更新系統
sudo apt update && sudo apt upgrade -y

# 安裝 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 安裝 Docker Compose
sudo apt install docker-compose-plugin

# 安裝 NVIDIA Container Toolkit
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | \
  sudo tee /etc/apt/sources.list.d/nvidia-docker.list

sudo apt update
sudo apt install -y nvidia-container-toolkit
sudo systemctl restart docker

# 驗證 GPU 存取
docker run --rm --gpus all nvidia/cuda:12.1.0-base-ubuntu22.04 nvidia-smi
```

### 逐步部署流程

#### 1. 下載與設定

```bash
# 複製儲存庫
cd /opt
sudo git clone <repository-url> medgemma_chest
cd medgemma_chest
sudo chown -R $USER:$USER .

# 建立環境設定檔
cp .env.example .env
nano .env
```

#### 2. 生產環境設定

編輯 `.env` 檔案，設定生產環境數值：

```ini
# 應用程式設定
DEBUG=false
LOG_LEVEL=INFO

# 資料庫 - 使用強密碼
DATABASE_URL=postgresql://postgres:強密碼請改這裡@postgres:5432/medgemma_chest

# 安全性 - 產生強密鑰
SECRET_KEY=$(openssl rand -hex 32)

# DICOM 設定
DICOM_AE_TITLE=MEDGEMMA_SCP
DICOM_PORT=11112
DICOM_HOST=0.0.0.0

# AI 模型設定
MODEL_NAME=google/medgemma-27b-it
MODEL_LOAD_IN_8BIT=true
MODEL_DEVICE=cuda

# RabbitMQ - 更改預設認證
RABBITMQ_USER=admin
RABBITMQ_PASSWORD=強密碼請改這裡

# Redis - 啟用密碼
REDIS_PASSWORD=強密碼請改這裡

# API 設定
CORS_ORIGINS=["https://yourdomain.com"]

# 檔案傳輸設定（選用）
SSH_ENABLED=true
SSH_HOST=ris.hospital.com
SSH_PORT=22
SSH_USER=medgemma
SSH_KEY_PATH=/app/.ssh/id_rsa
```

#### 3. SSL/TLS 設定（HTTPS）

使用 Let's Encrypt 建立 SSL 憑證：

```bash
# 安裝 Certbot
sudo apt install certbot

# 取得憑證
sudo certbot certonly --standalone -d yourdomain.com
```

更新 `docker/nginx.conf`：

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

    # ... 其他設定
}
```

更新 `docker-compose.yml` 掛載憑證：

```yaml
nginx:
  volumes:
    - ./docker/nginx.conf:/etc/nginx/nginx.conf:ro
    - /etc/letsencrypt:/etc/letsencrypt:ro
```

#### 4. SSH 金鑰設定（用於報告匯出）

```bash
# 產生 SSH 金鑰
mkdir -p .ssh
ssh-keygen -t rsa -b 4096 -f .ssh/id_rsa -N ""

# 複製公鑰到目標伺服器
ssh-copy-id -i .ssh/id_rsa.pub user@ris.hospital.com

# 更新 docker-compose.yml 掛載 SSH 金鑰
```

#### 5. 初始化與啟動

```bash
# 啟動系統
./scripts/start.sh

# 驗證所有服務正在執行
docker-compose ps

# 查看日誌
docker-compose logs -f
```

#### 6. 驗證安裝

```bash
# 測試健康狀態端點
curl http://localhost/health

# 測試 DICOM SCP
echoscu localhost 11112 -aec MEDGEMMA_SCP

# 存取網頁介面
# https://yourdomain.com
```

### 防火牆設定

```bash
# 允許 HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 允許 DICOM SCP
sudo ufw allow 11112/tcp

# 允許 SSH
sudo ufw allow 22/tcp

# 啟用防火牆
sudo ufw enable
```

### Systemd 服務（開機自動啟動）

建立 `/etc/systemd/system/medgemma-chest.service`：

```ini
[Unit]
Description=MedGemma 胸部 X 光自動化系統
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

啟用並啟動服務：

```bash
sudo systemctl daemon-reload
sudo systemctl enable medgemma-chest
sudo systemctl start medgemma-chest
```

### 監控與日誌

#### 1. 日誌輪替

建立 `/etc/logrotate.d/medgemma-chest`：

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

#### 2. 健康狀態監控

建立監控腳本 `/opt/medgemma_chest/scripts/health_check.sh`：

```bash
#!/bin/bash

# 檢查所有服務是否正在執行
SERVICES="postgres rabbitmq redis backend dicom_scp worker_dicom worker_report frontend nginx"

for service in $SERVICES; do
    if ! docker-compose ps | grep -q "$service.*Up"; then
        echo "警告：服務 $service 已停止！"
        # 發送警報（電子郵件、簡訊等）
    fi
done

# 檢查磁碟空間
USAGE=$(df -h /opt/medgemma_chest | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $USAGE -gt 80 ]; then
    echo "警告：磁碟使用率已達 ${USAGE}%"
fi
```

加入 crontab：

```bash
# 編輯 crontab
crontab -e

# 新增監控（每 5 分鐘執行一次）
*/5 * * * * /opt/medgemma_chest/scripts/health_check.sh
```

### 備份策略

#### 1. 資料庫備份

建立備份腳本 `/opt/medgemma_chest/scripts/backup.sh`：

```bash
#!/bin/bash

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/medgemma"
mkdir -p $BACKUP_DIR

# 備份資料庫
docker-compose exec -T postgres pg_dump -U postgres medgemma_chest | \
    gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# 備份資料目錄
tar -czf $BACKUP_DIR/data_backup_$DATE.tar.gz data/

# 只保留最近 30 天的備份
find $BACKUP_DIR -type f -mtime +30 -delete

echo "備份完成：$DATE"
```

加入 crontab：

```bash
# 每天凌晨 2 點備份
0 2 * * * /opt/medgemma_chest/scripts/backup.sh
```

#### 2. 還原程序

```bash
# 還原資料庫
gunzip < backup.sql.gz | \
    docker-compose exec -T postgres psql -U postgres medgemma_chest

# 還原資料
tar -xzf data_backup.tar.gz
```

### 效能調校

#### 1. PostgreSQL 調校

建立 `docker/postgres.conf`：

```ini
# 記憶體設定
shared_buffers = 8GB
effective_cache_size = 24GB
work_mem = 64MB
maintenance_work_mem = 2GB

# 連線設定
max_connections = 100

# 檢查點設定
checkpoint_completion_target = 0.9
wal_buffers = 16MB

# 查詢規劃
random_page_cost = 1.1
effective_io_concurrency = 200
```

在 `docker-compose.yml` 中掛載：

```yaml
postgres:
  volumes:
    - ./docker/postgres.conf:/etc/postgresql/postgresql.conf
  command: postgres -c config_file=/etc/postgresql/postgresql.conf
```

#### 2. RabbitMQ 調校

在 `docker-compose.yml` 中設定：

```yaml
rabbitmq:
  environment:
    RABBITMQ_VM_MEMORY_HIGH_WATERMARK: 0.7
    RABBITMQ_DISK_FREE_LIMIT: 10GB
```

#### 3. Worker 擴展

根據 GPU 和工作負載進行擴展：

```bash
# 對於擁有多個 GPU 的系統
docker-compose up -d --scale worker_dicom=2
```

### 安全性強化

#### 1. 網路隔離

更新 `docker-compose.yml`：

```yaml
networks:
  medgemma_network:
    driver: bridge
    internal: false  # 如不需外部存取可設為 true
```

#### 2. 密鑰管理

使用 Docker secrets 而非環境變數：

```bash
# 建立 secrets
echo "強密碼" | docker secret create postgres_password -
echo "密鑰" | docker secret create app_secret_key -
```

#### 3. 定期更新

```bash
# 更新系統套件
sudo apt update && sudo apt upgrade -y

# 更新 Docker 映像檔
docker-compose pull
docker-compose up -d
```

### 疑難排解

#### 常見問題

1. **記憶體不足**
   - 啟用 8-bit 量化
   - 減少 worker 數量
   - 增加 swap 空間

2. **處理速度緩慢**
   - 檢查 GPU 使用率：`nvidia-smi`
   - 驗證是否正在使用 GPU
   - 擴展 workers

3. **DICOM 連線失敗**
   - 檢查防火牆規則
   - 驗證 AE Title 設定
   - 使用 `echoscu` 測試

4. **資料庫連線錯誤**
   - 檢查 PostgreSQL 日誌
   - 驗證認證資訊
   - 增加連線池大小

### 支援與維護

#### 定期維護任務

- 每日：檢查日誌是否有錯誤
- 每週：檢視磁碟空間與效能
- 每月：更新系統與 Docker 映像檔
- 每季：檢視並更新安全性設定

#### 效能監控

```bash
# 查看資源使用情況
docker stats

# 檢查處理佇列
docker-compose exec rabbitmq rabbitmqctl list_queues

# 監控 GPU
watch -n 1 nvidia-smi
```

### 多伺服器擴展

對於大量部署：

1. **獨立資料庫伺服器**
   - 將 PostgreSQL 移至專用伺服器
   - 更新 .env 中的 DATABASE_URL

2. **負載平衡**
   - 部署多個前端/後端實例
   - 使用外部負載平衡器（nginx、HAProxy）

3. **分散式 Workers**
   - 在多個 GPU 伺服器上部署 workers
   - 共享 RabbitMQ 與資料庫

4. **高可用性**
   - PostgreSQL 複寫
   - RabbitMQ 叢集
   - Redis 叢集

## 結論

本部署指南涵蓋生產環境部署、安全性、監控與維護。請根據您的特定需求和基礎設施調整設定。

如有問題或疑問，請參閱主要 README 或聯繫技術支援。

---

**文件建立日期**：2025-11-20
**最後更新**：2025-11-20
**版本**：1.0.0
**語言**：繁體中文
