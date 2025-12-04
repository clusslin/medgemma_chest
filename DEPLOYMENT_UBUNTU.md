# MedGemma Chest X-Ray System - Ubuntu 部署指南

本指南適用於在 Ubuntu 系統上部署 MedGemma Chest X-Ray 自動化系統。

## 系統需求

### 硬體需求
- **CPU**: 8 核心或以上（推薦）
- **RAM**: 32GB 或以上（推薦 64GB）
- **儲存空間**: 500GB 可用空間（用於 DICOM 影像和模型）
- **GPU** (可選，但強烈推薦用於 AI 推理):
  - NVIDIA RTX 2060 或以上（RTX 20 系列）
  - NVIDIA RTX 3060 或以上（RTX 30 系列）
  - NVIDIA RTX 4060 或以上（RTX 40 系列）
  - NVIDIA RTX 50 系列
  - NVIDIA RTX 4000/6000 系列（專業卡）
  - NVIDIA A4000/A6000 系列（資料中心卡）
  - 至少 8GB VRAM（推薦 16GB 或以上）

### 軟體需求
- **作業系統**: Ubuntu 20.04 LTS、22.04 LTS 或 24.04 LTS
- **Docker**: 24.0 或以上
- **Docker Compose**: 2.20 或以上
- **NVIDIA Driver**: 525.x 或以上（如使用 GPU）
- **NVIDIA Container Toolkit**（如使用 GPU）

## 安裝步驟

### 步驟 1: 更新系統

```bash
sudo apt update
sudo apt upgrade -y
```

### 步驟 2: 安裝 Docker

```bash
# 安裝必要的依賴
sudo apt install -y ca-certificates curl gnupg lsb-release

# 添加 Docker 的官方 GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# 設置 Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安裝 Docker Engine 和 Docker Compose
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 將當前用戶添加到 docker 群組
sudo usermod -aG docker $USER

# 啟動並啟用 Docker 服務
sudo systemctl enable docker
sudo systemctl start docker

# 驗證安裝
docker --version
docker compose version
```

**重要**: 執行 `usermod` 後，需要登出再登入才能生效，或執行：
```bash
newgrp docker
```

### 步驟 3: 安裝 NVIDIA 驅動和 Container Toolkit（GPU 用戶）

#### 3.1 安裝 NVIDIA 驅動

```bash
# 檢查是否已安裝驅動
nvidia-smi

# 如果未安裝，執行以下命令
# 對於 Ubuntu 22.04/24.04
sudo apt install -y nvidia-driver-535

# 或安裝最新版本
sudo ubuntu-drivers autoinstall

# 重新啟動系統
sudo reboot
```

重啟後驗證：
```bash
nvidia-smi
```

#### 3.2 安裝 NVIDIA Container Toolkit

```bash
# 添加 NVIDIA Container Toolkit repository
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg

curl -s -L https://nvidia.github.io/libnvidia-container/$distribution/libnvidia-container.list | \
    sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
    sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list

# 安裝 NVIDIA Container Toolkit
sudo apt update
sudo apt install -y nvidia-container-toolkit

# 配置 Docker 使用 NVIDIA runtime
sudo nvidia-ctk runtime configure --runtime=docker
sudo systemctl restart docker

# 測試 GPU 支援
docker run --rm --gpus all nvidia/cuda:12.2.0-base-ubuntu22.04 nvidia-smi
```

### 步驟 4: 下載專案

```bash
# Clone repository
git clone https://github.com/clusslin/medgemma_chest.git
cd medgemma_chest

# 切換到穩定分支（如果需要）
# git checkout main
```

### 步驟 5: 配置環境

```bash
# 複製環境變數範例檔案
cp .env.example .env

# 編輯 .env 檔案
nano .env  # 或使用 vim
```

#### 環境變數配置範例

**基本配置**:
```env
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=medgemma_chest

# RabbitMQ
RABBITMQ_DEFAULT_USER=admin
RABBITMQ_DEFAULT_PASS=your_secure_password_here

# Backend
SECRET_KEY=your_secret_key_here_minimum_32_chars
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1,your-server-ip

# AI Model Settings
MODEL_PATH=/app/models/medgemma
ENABLE_GPU=True  # 如果有 GPU 設為 True，否則設為 False
```

**GPU 配置** (如果使用 GPU):
```env
# GPU Settings
CUDA_VISIBLE_DEVICES=0  # 使用第一張 GPU，多卡可設為 0,1
GPU_MEMORY_FRACTION=0.8  # 限制使用 80% GPU 記憶體
```

### 步驟 6: 啟用 GPU 支援（GPU 用戶）

如果您有 GPU 並想使用 GPU 加速，需要修改 `docker-compose.yml`:

```bash
nano docker-compose.yml
```

找到 `worker_dicom` 服務，取消註解或添加以下配置：

```yaml
  worker_dicom:
    # ... 其他配置 ...
    runtime: nvidia
    environment:
      - NVIDIA_VISIBLE_DEVICES=all
      # 或指定特定 GPU: NVIDIA_VISIBLE_DEVICES=0,1
```

### 步驟 7: 啟動系統

```bash
# 執行啟動腳本
./scripts/start.sh
```

腳本會自動：
1. 創建必要的資料目錄
2. 拉取 Docker 映像檔
3. 構建自訂映像檔
4. 啟動所有服務
5. 初始化資料庫

### 步驟 8: 驗證部署

```bash
# 查看所有容器狀態
docker ps

# 查看服務日誌
docker compose logs -f

# 檢查特定服務
docker compose logs -f backend
docker compose logs -f worker_dicom
```

確認所有服務都在運行：
- ✅ medgemma_postgres
- ✅ medgemma_rabbitmq
- ✅ medgemma_redis
- ✅ medgemma_backend
- ✅ medgemma_dicom_scp
- ✅ medgemma_worker_dicom
- ✅ medgemma_worker_report
- ✅ medgemma_frontend
- ✅ medgemma_nginx

## 訪問系統

系統啟動後，可以通過以下地址訪問：

- **主要 Web 介面**: http://your-server-ip:8081
- **Frontend**: http://your-server-ip:3000
- **Backend API 文檔**: http://your-server-ip:8000/docs
- **RabbitMQ 管理介面**: http://your-server-ip:15672
  - 預設帳號: guest
  - 預設密碼: guest

## GPU 性能驗證

### 檢查 GPU 是否被 Docker 容器使用

```bash
# 進入 worker 容器
docker exec -it medgemma_worker_dicom bash

# 在容器內執行
nvidia-smi

# 或直接從外部執行
docker exec medgemma_worker_dicom nvidia-smi
```

### 監控 GPU 使用情況

```bash
# 實時監控 GPU
watch -n 1 nvidia-smi
```

## 常見問題排除

### 問題 1: Docker 權限錯誤

**錯誤**: `permission denied while trying to connect to the Docker daemon socket`

**解決方案**:
```bash
sudo usermod -aG docker $USER
newgrp docker
```

### 問題 2: GPU 未被識別

**解決方案**:
```bash
# 檢查驅動安裝
nvidia-smi

# 檢查 NVIDIA Container Toolkit
docker run --rm --gpus all nvidia/cuda:12.2.0-base-ubuntu22.04 nvidia-smi

# 重新配置 Docker runtime
sudo nvidia-ctk runtime configure --runtime=docker
sudo systemctl restart docker
```

### 問題 3: 端口被佔用

**錯誤**: `port is already allocated`

**解決方案**: 修改 `docker-compose.yml` 中的端口映射，避免使用已被佔用的端口。

### 問題 4: 記憶體不足

**解決方案**:
1. 減少 GPU 記憶體使用比例（在 .env 中設定 `GPU_MEMORY_FRACTION=0.6`）
2. 增加系統 swap 空間
3. 關閉不必要的服務

### 問題 5: 容器無法啟動

```bash
# 查看詳細日誌
docker compose logs [service_name]

# 重建容器
docker compose down
docker compose up -d --build
```

## 系統維護

### 更新系統

```bash
# 拉取最新代碼
git pull origin main

# 重建並重啟容器
docker compose down
docker compose up -d --build
```

### 備份資料

```bash
# 備份 PostgreSQL 資料庫
docker exec medgemma_postgres pg_dump -U postgres medgemma_chest > backup_$(date +%Y%m%d).sql

# 備份 DICOM 資料
tar -czf dicom_backup_$(date +%Y%m%d).tar.gz ./data/dicom_storage
```

### 清理舊資料

```bash
# 清理未使用的 Docker 資源
docker system prune -a

# 清理舊的 DICOM 檔案（請小心使用）
find ./data/dicom_storage -mtime +30 -type f -delete
```

## 性能調優

### 多 GPU 配置

如果您有多張 GPU，可以配置負載平衡：

```yaml
# docker-compose.yml
  worker_dicom:
    # ... 其他配置 ...
    environment:
      - NVIDIA_VISIBLE_DEVICES=0,1  # 使用兩張 GPU
    deploy:
      replicas: 2  # 啟動兩個實例
```

### 資料庫優化

修改 PostgreSQL 配置以提升性能：

```yaml
# docker-compose.yml
  postgres:
    # ... 其他配置 ...
    command:
      - "postgres"
      - "-c"
      - "max_connections=200"
      - "-c"
      - "shared_buffers=256MB"
      - "-c"
      - "effective_cache_size=1GB"
```

## 安全建議

1. **修改預設密碼**: 務必在 `.env` 中設定強密碼
2. **防火牆設定**:
   ```bash
   sudo ufw allow 8081/tcp  # Web UI
   sudo ufw allow 11112/tcp  # DICOM SCP
   sudo ufw enable
   ```
3. **定期更新**: 定期更新系統和 Docker 映像檔
4. **啟用 HTTPS**: 建議使用 nginx 反向代理並配置 SSL/TLS 證書

## 支援的 GPU 型號

### 消費級 GPU
- **RTX 20 系列**: RTX 2060, RTX 2070, RTX 2080, RTX 2080 Ti
- **RTX 30 系列**: RTX 3060, RTX 3070, RTX 3080, RTX 3090
- **RTX 40 系列**: RTX 4060, RTX 4070, RTX 4080, RTX 4090
- **RTX 50 系列**: 所有型號

### 專業/資料中心 GPU
- **RTX 系列**: RTX 4000, RTX 5000, RTX 6000, RTX A4000, RTX A5000, RTX A6000
- **A 系列**: A4000, A5000, A6000, A100, A30, A10

### 最低要求
- **VRAM**: 8GB（推薦 16GB 或以上）
- **CUDA Compute Capability**: 7.5 或以上

## 技術支援

如遇到問題，請：
1. 查看日誌: `docker compose logs -f`
2. 檢查 GitHub Issues: https://github.com/clusslin/medgemma_chest/issues
3. 提供詳細的錯誤訊息和系統資訊

## 授權

本專案遵循 MIT 授權條款。詳見 LICENSE 文件。
