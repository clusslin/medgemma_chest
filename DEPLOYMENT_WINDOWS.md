# MedGemma Chest X-Ray System - Windows 部署指南

本指南適用於在 Windows 10/11 系統上部署 MedGemma Chest X-Ray 自動化系統。

## 系統需求

### 硬體需求
- **CPU**: Intel Core i7 或 AMD Ryzen 7（8 核心或以上推薦）
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
- **作業系統**: Windows 10 Pro/Enterprise（版本 2004 或更新）或 Windows 11
- **WSL 2** (Windows Subsystem for Linux 2)
- **Docker Desktop for Windows**: 4.25 或以上
- **NVIDIA Driver**: 版本 527.x 或以上（如使用 GPU）
- **CUDA**: 12.0 或以上（如使用 GPU）

### 重要前提
- 必須啟用 **Hyper-V** 和 **虛擬化**
- Windows 10 需要 Pro 或 Enterprise 版本（Home 版本需要額外配置）
- 必須以管理員身份執行部分安裝步驟

## 安裝步驟

### 步驟 1: 啟用 WSL 2

#### 1.1 以管理員身份開啟 PowerShell

```powershell
# 啟用 WSL
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart

# 啟用虛擬機器平台
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
```

#### 1.2 重新啟動電腦

```powershell
Restart-Computer
```

#### 1.3 設定 WSL 2 為預設版本

重啟後，再次以管理員身份開啟 PowerShell：

```powershell
# 設定 WSL 2 為預設
wsl --set-default-version 2

# 安裝 Ubuntu（推薦）
wsl --install -d Ubuntu-22.04
```

#### 1.4 配置 Ubuntu

首次啟動 Ubuntu 時，會要求您創建用戶名和密碼。

### 步驟 2: 安裝 NVIDIA 驅動（GPU 用戶）

#### 2.1 安裝或更新 NVIDIA 驅動

1. 前往 [NVIDIA 官方網站](https://www.nvidia.com/Download/index.aspx)
2. 選擇您的 GPU 型號
3. 下載並安裝最新的 Game Ready 或 Studio 驅動（版本 527.x 或更新）
4. 重新啟動電腦

#### 2.2 驗證驅動安裝

在命令提示字元或 PowerShell 中執行：

```cmd
nvidia-smi
```

應該會顯示您的 GPU 資訊和驅動版本。

**注意**: 在 WSL 2 中使用 GPU，**不需要**在 WSL 內安裝 CUDA。Windows 上的 NVIDIA 驅動會自動提供 WSL 2 的 GPU 支援。

### 步驟 3: 安裝 Docker Desktop

#### 3.1 下載 Docker Desktop

1. 前往 [Docker Desktop 官方網站](https://www.docker.com/products/docker-desktop)
2. 下載 Windows 版本安裝程式
3. 執行安裝程式

#### 3.2 配置 Docker Desktop

安裝完成後：
1. 啟動 Docker Desktop
2. 前往 Settings（設定）
3. 確認以下設定：
   - **General**:
     - ✅ Use the WSL 2 based engine
   - **Resources > WSL Integration**:
     - ✅ Enable integration with my default WSL distro
     - ✅ 選擇 Ubuntu-22.04

4. 點擊 "Apply & Restart"

#### 3.3 驗證 Docker 安裝

在 WSL Ubuntu 終端中執行：

```bash
docker --version
docker compose version
```

### 步驟 4: 驗證 GPU 支援（GPU 用戶）

在 WSL Ubuntu 終端中執行：

```bash
docker run --rm --gpus all nvidia/cuda:12.2.0-base-ubuntu22.04 nvidia-smi
```

如果成功，應該會顯示 GPU 資訊。

### 步驟 5: 下載專案

在 WSL Ubuntu 終端中：

```bash
# Clone repository
git clone https://github.com/clusslin/medgemma_chest.git
cd medgemma_chest

# 切換到穩定分支（如果需要）
# git checkout main
```

### 步驟 6: 配置環境

```bash
# 複製環境變數範例檔案
cp .env.example .env

# 使用 nano 或 vim 編輯
nano .env
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
ALLOWED_HOSTS=localhost,127.0.0.1

# AI Model Settings
MODEL_PATH=/app/models/medgemma
ENABLE_GPU=True  # 如果有 GPU 設為 True，否則設為 False
```

**GPU 配置** (如果使用 GPU):
```env
# GPU Settings
CUDA_VISIBLE_DEVICES=0  # 使用第一張 GPU
GPU_MEMORY_FRACTION=0.8  # 限制使用 80% GPU 記憶體
```

### 步驟 7: 啟用 GPU 支援（GPU 用戶）

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
```

### 步驟 8: 啟動系統

```bash
# 確保腳本有執行權限
chmod +x scripts/start.sh

# 執行啟動腳本
./scripts/start.sh
```

腳本會自動：
1. 創建必要的資料目錄
2. 拉取 Docker 映像檔
3. 構建自訂映像檔
4. 啟動所有服務
5. 初始化資料庫

### 步驟 9: 驗證部署

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

系統啟動後，可以在 Windows 瀏覽器中訪問：

- **主要 Web 介面**: http://localhost:8081
- **Frontend**: http://localhost:3000
- **Backend API 文檔**: http://localhost:8000/docs
- **RabbitMQ 管理介面**: http://localhost:15672
  - 預設帳號: guest
  - 預設密碼: guest

## Windows 特定配置

### WSL 2 資源限制

WSL 2 預設會使用最多 50% 的系統記憶體。如需調整，創建 `.wslconfig` 檔案：

```powershell
# 在 Windows 使用者目錄創建 .wslconfig
notepad $env:USERPROFILE\.wslconfig
```

添加以下內容：

```ini
[wsl2]
memory=48GB  # 限制 WSL 使用最多 48GB RAM
processors=12  # 限制使用 12 個 CPU 核心
swap=16GB  # 設定 16GB swap
localhostForwarding=true
```

儲存後重啟 WSL：

```powershell
wsl --shutdown
```

### 文件系統性能優化

為獲得最佳性能，建議將專案檔案存放在 WSL 文件系統中（`/home/username/`），而不是 Windows 文件系統（`/mnt/c/`）。

### 防火牆配置

如需從其他裝置訪問，需要在 Windows 防火牆中開放端口：

1. 開啟 "Windows Defender 防火牆"
2. 點擊 "進階設定"
3. 選擇 "輸入規則" > "新增規則"
4. 選擇 "連接埠"，輸入需要開放的端口（例如：8081, 8000, 3000）
5. 允許連線

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

### 在 Windows 中監控 GPU

在 Windows 命令提示字元中：

```cmd
# 實時監控 GPU
nvidia-smi -l 1
```

或使用 Task Manager（工作管理員）> Performance（效能）> GPU

## 常見問題排除

### 問題 1: WSL 2 未正確安裝

**解決方案**:
```powershell
# 檢查 WSL 版本
wsl -l -v

# 如果版本是 1，升級到 2
wsl --set-version Ubuntu-22.04 2
```

### 問題 2: Docker Desktop 無法啟動

**解決方案**:
1. 確認 Hyper-V 已啟用
2. 確認 BIOS 中已啟用虛擬化（VT-x/AMD-V）
3. 重新安裝 Docker Desktop
4. 檢查 Windows 更新

### 問題 3: GPU 未被識別

**解決方案**:
```powershell
# 在 Windows 中檢查驅動
nvidia-smi

# 確認 WSL 2 核心版本
wsl cat /proc/version

# 更新 WSL 2 核心
wsl --update
```

### 問題 4: 容器無法訪問 GPU

**錯誤**: `could not select device driver "" with capabilities: [[gpu]]`

**解決方案**:
1. 確認 NVIDIA 驅動版本 >= 527.x
2. 重啟 Docker Desktop
3. 驗證 GPU 支援:
   ```bash
   docker run --rm --gpus all nvidia/cuda:12.2.0-base-ubuntu22.04 nvidia-smi
   ```

### 問題 5: 端口無法訪問

**解決方案**:
1. 確認 Docker Desktop 中已啟用 "Expose daemon on tcp://localhost:2375"（不安全，僅測試用）
2. 檢查 Windows 防火牆設定
3. 確認容器正在運行: `docker ps`

### 問題 6: 性能緩慢

**解決方案**:
1. 將專案移至 WSL 文件系統（`/home/username/`）
2. 調整 `.wslconfig` 增加記憶體限制
3. 在 Docker Desktop 中增加資源配置

### 問題 7: 文件權限問題

```bash
# 在 WSL 中修正權限
sudo chown -R $USER:$USER ~/medgemma_chest
chmod +x scripts/*.sh
```

## 系統維護

### 更新系統

在 WSL Ubuntu 終端中：

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

### 清理 WSL 磁碟空間

WSL 2 的虛擬硬碟會自動增長，但不會自動縮小。定期清理：

```powershell
# 在 PowerShell 中（管理員）
# 關閉 WSL
wsl --shutdown

# 找到 WSL 虛擬硬碟位置（通常在）
# C:\Users\<username>\AppData\Local\Packages\CanonicalGroupLimited.Ubuntu22.04LTS_*\LocalState\ext4.vhdx

# 使用 diskpart 壓縮（替換為實際路徑）
diskpart
select vdisk file="C:\Users\<username>\AppData\Local\Packages\CanonicalGroupLimited.Ubuntu22.04LTS_*\LocalState\ext4.vhdx"
compact vdisk
exit
```

## 性能調優

### Docker Desktop 資源配置

1. 開啟 Docker Desktop Settings
2. Resources
3. 調整：
   - **CPUs**: 建議至少 8 核心
   - **Memory**: 建議至少 16GB（系統有 32GB 時）
   - **Swap**: 4GB
   - **Disk image size**: 根據需求調整

### 多 GPU 配置

如果您有多張 GPU：

```yaml
# docker-compose.yml
  worker_dicom:
    # ... 其他配置 ...
    environment:
      - NVIDIA_VISIBLE_DEVICES=0,1  # 使用兩張 GPU
    deploy:
      replicas: 2  # 啟動兩個實例
```

## Windows 特定最佳實踐

1. **使用 WSL 文件系統**: 專案放在 `/home/username/` 而非 `/mnt/c/`
2. **定期更新**: 保持 Windows、WSL、Docker Desktop 和 NVIDIA 驅動為最新版本
3. **資源監控**: 使用 Windows Task Manager 監控資源使用
4. **備份策略**: 定期備份 WSL 發行版：
   ```powershell
   wsl --export Ubuntu-22.04 D:\backup\ubuntu-backup.tar
   ```

## 支援的 GPU 型號

### 消費級 GPU
- **RTX 20 系列**: RTX 2060, RTX 2070, RTX 2080, RTX 2080 Ti
- **RTX 30 系列**: RTX 3060, RTX 3070, RTX 3080, RTX 3090
- **RTX 40 系列**: RTX 4060, RTX 4070, RTX 4080, RTX 4090
- **RTX 50 系列**: 所有型號

### 專業/資料中心 GPU
- **RTX 系列**: RTX 4000, RTX 5000, RTX 6000, RTX A4000, RTX A5000, RTX A6000
- **A 系列**: A4000, A5000, A6000

### 最低要求
- **VRAM**: 8GB（推薦 16GB 或以上）
- **CUDA Compute Capability**: 7.5 或以上
- **驅動版本**: 527.x 或以上

### 已測試配置

✅ **已驗證可運行**:
- Windows 11 Pro + RTX 3090 (24GB)
- Windows 10 Pro (21H2) + RTX 3080 (10GB)
- Windows 11 Pro + RTX 4080 (16GB)
- Windows 10 Enterprise + RTX A4000 (16GB)

## 開發環境設定

如需在 Windows 上進行開發：

### 推薦工具
- **IDE**: Visual Studio Code with WSL extension
- **終端**: Windows Terminal
- **Git**: Git for Windows（或在 WSL 內使用）

### VS Code 配置

1. 安裝 "Remote - WSL" 擴展
2. 在 WSL 中打開專案：
   ```bash
   cd ~/medgemma_chest
   code .
   ```

3. VS Code 會在 WSL 模式下打開，提供完整的開發體驗

## 技術支援

如遇到問題，請：
1. 查看日誌: `docker compose logs -f`
2. 檢查 WSL 狀態: `wsl -l -v`
3. 檢查 Docker 狀態: Docker Desktop dashboard
4. 查看 GitHub Issues: https://github.com/clusslin/medgemma_chest/issues
5. 提供詳細的錯誤訊息、Windows 版本和 GPU 型號資訊

## 授權

本專案遵循 MIT 授權條款。詳見 LICENSE 文件。
