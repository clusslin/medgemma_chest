# MedGemma 胸部 X 光系統 - Windows 11 + RTX 3090 部署指南

## 硬體環境

- **作業系統**: Windows 11 Pro（必須是 Pro 或 Enterprise 版本以支援 WSL2）
- **顯示卡**: NVIDIA GeForce RTX 3090 (24GB VRAM)
- **建議記憶體**: 32GB RAM
- **建議儲存**: 500GB NVMe SSD

---

## 系統準備

### 1. 啟用 WSL2（Windows Subsystem for Linux 2）

開啟 PowerShell（**以系統管理員身分執行**）：

```powershell
# 啟用 WSL 和虛擬機器平台
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

# 重新啟動電腦
Restart-Computer
```

重新啟動後，再次開啟 PowerShell（**以系統管理員身分**）：

```powershell
# 設定 WSL 2 為預設版本
wsl --set-default-version 2

# 安裝 Ubuntu 22.04
wsl --install -d Ubuntu-22.04

# 等待安裝完成，設定使用者名稱和密碼
```

### 2. 安裝 NVIDIA CUDA on WSL2 驅動程式

1. 前往 NVIDIA 官網下載 **CUDA on WSL2 驅動程式**：
   https://developer.nvidia.com/cuda/wsl

2. 下載並安裝適用於 Windows 的驅動程式（**不是** Linux 驅動）

3. **不要**在 WSL2 內安裝 NVIDIA 驅動程式

4. 重新啟動電腦

5. 驗證安裝（在 WSL2 Ubuntu 內）：

```bash
# 啟動 WSL2 Ubuntu
wsl

# 檢查 GPU
nvidia-smi
```

**預期輸出**：應該看到 RTX 3090

```
+-----------------------------------------------------------------------------+
| NVIDIA-SMI 545.xx.xx    Driver Version: 545.xx.xx    CUDA Version: 12.3     |
|-------------------------------+----------------------+----------------------+
| GPU  Name        Persistence-M| Bus-Id        Disp.A | Volatile Uncorr. ECC |
| Fan  Temp  Perf  Pwr:Usage/Cap|         Memory-Usage | GPU-Util  Compute M. |
|===============================+======================+======================|
|   0  NVIDIA GeForce...   On   | 00000000:01:00.0  On |                  N/A |
| 30%   45C    P8    28W / 350W |    856MiB / 24576MiB |      2%      Default |
+-------------------------------+----------------------+----------------------+
```

### 3. 安裝 Docker Desktop for Windows

1. 下載 Docker Desktop：
   https://www.docker.com/products/docker-desktop/

2. 安裝時確保勾選：
   - ✅ Use WSL 2 instead of Hyper-V
   - ✅ Install required Windows components for WSL 2

3. 重新啟動電腦

4. 啟動 Docker Desktop，確保設定中：
   - Settings → General → Use the WSL 2 based engine ✅
   - Settings → Resources → WSL Integration → Enable integration with my default WSL distro ✅

5. 驗證安裝（在 WSL2 Ubuntu 內）：

```bash
docker --version
docker compose version
```

### 4. 安裝 NVIDIA Container Toolkit（在 WSL2 內）

```bash
# 進入 WSL2 Ubuntu
wsl

# 設定套件庫
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg

curl -s -L https://nvidia.github.io/libnvidia-container/$distribution/libnvidia-container.list | \
    sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
    sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list

# 安裝
sudo apt update
sudo apt install -y nvidia-container-toolkit

# 驗證 GPU 在容器中可用
docker run --rm --gpus all nvidia/cuda:12.1.0-base-ubuntu22.04 nvidia-smi
```

---

## 專案部署

### 1. 設定 WSL2 檔案系統

建議將專案放在 WSL2 檔案系統中（而非 Windows 檔案系統），以獲得更好的效能。

```bash
# 在 WSL2 Ubuntu 中建立專案目錄
cd ~
mkdir -p projects/medgemma_chest
cd projects/medgemma_chest

# 或使用 /opt（需要 sudo）
sudo mkdir -p /opt/medgemma_chest
cd /opt/medgemma_chest
sudo chown -R $USER:$USER .
```

**注意**：WSL2 路徑對應關係
- WSL2: `/home/username/projects`
- Windows: `\\wsl$\Ubuntu-22.04\home\username\projects`

### 2. 下載專案

```bash
# 複製專案（請替換為實際的 Git URL）
git clone <your-git-repo-url> .

# 或從 Windows 複製專案到 WSL2
# 在 Windows PowerShell 中：
# wsl cp -r "C:\path\to\project" ~/projects/medgemma_chest
```

### 3. 環境變數設定

建立 `.env` 檔案：

```bash
cp .env.example .env
nano .env  # 或使用 vim, 或在 Windows 中使用 VSCode 編輯
```

**Windows 專用設定**：

```ini
# ============================================
# 應用程式設定
# ============================================
DEBUG=false
LOG_LEVEL=INFO

# ============================================
# 資料庫設定
# ============================================
POSTGRES_USER=postgres
POSTGRES_PASSWORD=你的強密碼_請修改
POSTGRES_DB=medgemma_chest
DATABASE_URL=postgresql://postgres:你的強密碼_請修改@postgres:5432/medgemma_chest

# ============================================
# 安全性設定
# ============================================
# Windows PowerShell 產生密鑰：
# [System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
SECRET_KEY=請將上面產生的密鑰貼在這裡

# ============================================
# DICOM 設定
# ============================================
DICOM_AE_TITLE=MEDGEMMA_SCP
DICOM_PORT=11112
DICOM_HOST=0.0.0.0
ALLOWED_STUDY_DESCRIPTIONS=Chest,CXR,Chest PA,Chest AP,Chest Lateral,胸部X光
MIN_AGE=20

# ============================================
# AI 模型設定（針對 RTX 3090 優化）
# ============================================
MODEL_NAME=google/medgemma-27b-it
MODEL_DEVICE=cuda
# RTX 3090 有 24GB VRAM，可以考慮不使用 8-bit 量化以獲得更好效能
MODEL_LOAD_IN_8BIT=false
# 或使用 8-bit 以節省記憶體並執行多個並行任務
# MODEL_LOAD_IN_8BIT=true

MODEL_MAX_LENGTH=2048
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
# Windows 本機 IP（可在 cmd 執行 ipconfig 查看）
CORS_ORIGINS=["http://localhost","http://127.0.0.1","http://192.168.1.100"]

# ============================================
# Worker 設定（單 GPU 配置）
# ============================================
# RTX 3090 記憶體充足，可增加並行度
WORKER_CONCURRENCY=2
MAX_WORKERS=2

# ============================================
# Windows 特定設定
# ============================================
# WSL2 時區設定
TZ=Asia/Taipei
```

### 4. Docker Compose 設定（WSL2 優化）

建立 `docker-compose.override.yml`：

```yaml
version: '3.8'

services:
  # PostgreSQL - Windows 路徑掛載優化
  postgres:
    volumes:
      - postgres_data:/var/lib/postgresql/data
    shm_size: 2gb

  # Worker - RTX 3090 優化
  worker_dicom:
    deploy:
      resources:
        limits:
          cpus: '8'
          memory: 16G
        reservations:
          cpus: '4'
          memory: 8G
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    environment:
      # RTX 3090 特定優化
      - CUDA_VISIBLE_DEVICES=0
      - NVIDIA_VISIBLE_DEVICES=all

  # Frontend - Windows 網路設定
  frontend:
    environment:
      - VITE_API_URL=http://localhost:8000

volumes:
  postgres_data:
    driver: local
```

### 5. 啟動系統

在 WSL2 Ubuntu 中：

```bash
# 確保 Docker Desktop 正在運行

# 建構映像
docker compose build

# 啟動所有服務
docker compose up -d

# 查看狀態
docker compose ps

# 查看日誌
docker compose logs -f

# GPU 使用監控
watch -n 1 nvidia-smi
```

### 6. 在 Windows 中存取

開啟瀏覽器，訪問：
- **前端網頁**: http://localhost
- **API 文件**: http://localhost:8000/docs
- **健康檢查**: http://localhost:8000/health

---

## Windows 特定設定

### 1. WSL2 資源限制

建立 `.wslconfig` 檔案（在 Windows 使用者目錄下）：

位置：`C:\Users\你的使用者名稱\.wslconfig`

```ini
[wsl2]
# 記憶體限制（建議設定為實體記憶體的 50-75%）
memory=24GB

# CPU 核心數限制
processors=8

# Swap 空間
swap=8GB

# 啟用 GPU 直通
gpuSupport=true

# 啟用 Nested Virtualization
nestedVirtualization=true

# 網路模式
networkingMode=NAT
```

**修改後需重啟 WSL2**：

```powershell
# 在 Windows PowerShell 中執行
wsl --shutdown
# 等待幾秒後重新啟動 WSL
wsl
```

### 2. 防火牆設定

開啟 Windows PowerShell（**以系統管理員身分**）：

```powershell
# 允許 DICOM 埠（11112）
New-NetFirewallRule -DisplayName "MedGemma DICOM SCP" -Direction Inbound -Protocol TCP -LocalPort 11112 -Action Allow

# 允許 HTTP（80）
New-NetFirewallRule -DisplayName "MedGemma HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow

# 允許 HTTPS（443）
New-NetFirewallRule -DisplayName "MedGemma HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow

# 允許 API（8000）
New-NetFirewallRule -DisplayName "MedGemma API" -Direction Inbound -Protocol TCP -LocalPort 8000 -Action Allow
```

### 3. 開機自動啟動

建立啟動腳本：

**方法 1：使用 Windows 工作排程器**

1. 建立批次檔 `C:\MedGemma\start.bat`：

```batch
@echo off
wsl -d Ubuntu-22.04 -u root service docker start
timeout /t 5
wsl -d Ubuntu-22.04 -e bash -c "cd /opt/medgemma_chest && docker compose up -d"
```

2. 開啟「工作排程器」（Task Scheduler）
3. 建立基本工作
   - 名稱：MedGemma Chest Auto Start
   - 觸發程序：電腦啟動時
   - 動作：啟動程式
     - 程式：`C:\MedGemma\start.bat`
   - 完成

**方法 2：使用 WSL2 自動啟動（推薦）**

建立 Windows 快捷方式：
- 右鍵桌面 → 新增 → 捷徑
- 位置：`wsl -d Ubuntu-22.04 -e bash -c "cd ~/projects/medgemma_chest && docker compose up -d"`
- 名稱：啟動 MedGemma

將此捷徑放到啟動資料夾：
`C:\Users\你的使用者名稱\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup`

---

## 效能優化

### 1. WSL2 磁碟效能優化

```bash
# 在 WSL2 中執行
# 清理 Docker 暫存
docker system prune -af --volumes

# 壓縮 WSL2 虛擬硬碟（在 Windows PowerShell 中執行）
wsl --shutdown
Optimize-VHD -Path "$env:LOCALAPPDATA\Packages\CanonicalGroupLimited.Ubuntu22.04LTS_*\LocalState\ext4.vhdx" -Mode Full
```

### 2. RTX 3090 最佳設定

編輯 `.env`：

```ini
# 因為 RTX 3090 有 24GB VRAM，可以使用完整精度
MODEL_LOAD_IN_8BIT=false

# 增加批次大小（如果記憶體充足）
WORKER_CONCURRENCY=3

# GPU 記憶體管理
PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:512
```

### 3. Docker Desktop 設定

在 Docker Desktop 中：
- Settings → Resources → Advanced
  - CPUs: 8
  - Memory: 16 GB
  - Swap: 4 GB
  - Disk image size: 200 GB

---

## 監控與維護

### 1. GPU 監控（在 WSL2 中）

```bash
# 即時監控
watch -n 1 nvidia-smi

# 詳細監控
nvidia-smi dmon -s pucvmet

# 儲存監控日誌
nvidia-smi --query-gpu=timestamp,name,temperature.gpu,utilization.gpu,memory.used,memory.total \
    --format=csv -l 5 > ~/gpu_monitor.csv
```

### 2. 系統監控腳本

建立 `~/scripts/monitor.sh`：

```bash
#!/bin/bash

echo "=== System Status at $(date) ===" >> ~/medgemma_monitor.log

# Docker 容器狀態
echo "--- Docker Containers ---" >> ~/medgemma_monitor.log
docker compose ps >> ~/medgemma_monitor.log

# GPU 狀態
echo "--- GPU Status ---" >> ~/medgemma_monitor.log
nvidia-smi --query-gpu=name,temperature.gpu,utilization.gpu,memory.used,memory.total \
    --format=csv,noheader >> ~/medgemma_monitor.log

# 磁碟空間
echo "--- Disk Usage ---" >> ~/medgemma_monitor.log
df -h >> ~/medgemma_monitor.log

echo "" >> ~/medgemma_monitor.log
```

### 3. 自動備份（Windows PowerShell 腳本）

建立 `C:\MedGemma\backup.ps1`：

```powershell
# 設定變數
$BackupDir = "D:\Backup\MedGemma"
$Date = Get-Date -Format "yyyyMMdd_HHmmss"

# 建立備份目錄
New-Item -ItemType Directory -Force -Path $BackupDir

# 備份資料庫（透過 WSL2）
Write-Host "Backing up database..."
wsl -d Ubuntu-22.04 -e bash -c "cd ~/projects/medgemma_chest && docker compose exec -T postgres pg_dump -U postgres medgemma_chest | gzip > /tmp/db_backup.sql.gz"

# 複製到 Windows
wsl cp /tmp/db_backup.sql.gz /mnt/d/Backup/MedGemma/db_backup_$Date.sql.gz

# 備份設定檔
Write-Host "Backing up configurations..."
wsl tar -czf /mnt/d/Backup/MedGemma/config_$Date.tar.gz -C ~/projects/medgemma_chest .env docker-compose.yml

# 清理舊備份（保留 30 天）
Get-ChildItem $BackupDir -Recurse | Where-Object {$_.LastWriteTime -lt (Get-Date).AddDays(-30)} | Remove-Item

Write-Host "Backup completed at $(Get-Date)"
```

使用 Windows 工作排程器設定自動執行。

---

## 疑難排解

### 1. WSL2 無法啟動

```powershell
# 檢查 WSL 版本
wsl --list --verbose

# 確保使用 WSL 2
wsl --set-version Ubuntu-22.04 2

# 重啟 WSL
wsl --shutdown
wsl
```

### 2. Docker 無法存取 GPU

```bash
# 在 WSL2 中檢查
nvidia-smi

# 重新安裝 NVIDIA Container Toolkit
sudo apt remove --purge nvidia-container-toolkit
sudo apt update
sudo apt install -y nvidia-container-toolkit

# 重啟 Docker Desktop（在 Windows 中）
```

### 3. 效能問題

```bash
# 檢查 WSL2 資源使用
# 在 Windows PowerShell 中
wsl -e bash -c "free -h && df -h"

# 檢查 Docker 資源
docker stats

# 清理 WSL2 快取
wsl --shutdown
# 等待 8 秒
timeout 8
wsl
```

### 4. 網路連線問題

```bash
# 重設 WSL2 網路
# 在 Windows PowerShell（系統管理員）
wsl --shutdown
netsh winsock reset
netsh int ip reset
ipconfig /flushdns

# 重啟電腦
Restart-Computer
```

### 5. DICOM 無法接收影像

```bash
# 檢查防火牆（Windows PowerShell 系統管理員）
Get-NetFirewallRule -DisplayName "MedGemma*"

# 測試 DICOM 連接（在 WSL2 中）
sudo apt install -y dcmtk
echoscu localhost 11112 -aec MEDGEMMA_SCP
```

---

## Windows 專用工具

### 1. 使用 Windows Terminal 管理

建議安裝 Windows Terminal 以獲得更好的操作體驗：
https://aka.ms/terminal

設定自訂設定檔：

```json
{
  "name": "MedGemma WSL",
  "commandline": "wsl -d Ubuntu-22.04 -e bash -c 'cd ~/projects/medgemma_chest && bash'",
  "startingDirectory": "//wsl$/Ubuntu-22.04/home/username/projects/medgemma_chest",
  "icon": "🏥"
}
```

### 2. 使用 VS Code 遠端開發

1. 安裝 VS Code
2. 安裝擴充功能：
   - Remote - WSL
   - Docker
   - Python

3. 在 VS Code 中：
   - 按 F1
   - 輸入 "WSL: Connect to WSL"
   - 開啟專案資料夾

---

## 效能基準測試

在 RTX 3090 + Windows 11 配置下的預期效能：

- **單張影像處理時間**：
  - 使用 8-bit 量化：40-70 秒
  - 不使用量化（完整精度）：50-90 秒

- **並行處理能力**：
  - 8-bit 模式：2-3 張影像同時處理
  - 完整精度：1-2 張影像同時處理

- **每日處理容量**：
  - 8-bit 模式：1500-2500 張影像
  - 完整精度：1000-1800 張影像

- **GPU 利用率**：70-90%
- **GPU 記憶體使用**：
  - 8-bit 模式：10-14GB
  - 完整精度：18-22GB

---

## 注意事項

### WSL2 限制

1. **檔案系統效能**
   - 專案應放在 WSL2 檔案系統（`/home/user`）而非 Windows 檔案系統（`/mnt/c`）
   - 跨系統存取會嚴重影響效能

2. **記憶體管理**
   - WSL2 會動態使用記憶體，可能占用大量 RAM
   - 使用 `.wslconfig` 限制資源使用

3. **網路設定**
   - WSL2 使用 NAT 網路，可能需要設定埠轉發
   - 無法直接從外部網路存取（需設定 Hyper-V 網路）

### 建議配置

- **開發/測試環境**：使用 Windows 11 + WSL2
- **生產環境**：建議使用原生 Ubuntu Linux 以獲得最佳效能

---

**文件版本**: 1.0.0
**最後更新**: 2025-11-20
**適用環境**: Windows 11 Pro + WSL2 + NVIDIA GeForce RTX 3090
