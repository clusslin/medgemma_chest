# MedGemma 胸部 X 光自動化分析系統

<div align="center">

![MedGemma Logo](https://img.shields.io/badge/MedGemma-27B-blue?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.10+-green?style=for-the-badge&logo=python)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

**基於 Google MedGemma 27B 的智能胸部 X 光 DICOM 影像自動分析系統**

[English](README.md) | [繁體中文](README_ZH-TW.md)

</div>

---

## 📋 目錄

- [系統簡介](#-系統簡介)
- [主要功能](#-主要功能)
- [系統架構](#-系統架構)
- [技術棧](#-技術棧)
- [快速開始](#-快速開始)
- [使用說明](#-使用說明)
- [API 文件](#-api-文件)
- [部署指南](#-部署指南)
- [開發指南](#-開發指南)
- [常見問題](#-常見問題)
- [授權條款](#-授權條款)

---

## 🌟 系統簡介

MedGemma 胸部 X 光自動化分析系統是一個完整的醫學影像處理解決方案，整合了 DICOM 影像接收、AI 智能分析、結構化報告生成與結果管理功能。

### 核心特色

- 🤖 **AI 智能分析**：採用 Google MedGemma 27B 大型語言模型
- 🏥 **DICOM 完全相容**：支援 DICOM SCP、SR 報告生成
- ⚡ **即時處理**：非同步訊息佇列架構，高效能處理
- 🎨 **現代化介面**：React + Tailwind CSS，支援深色模式
- 📊 **數據可視化**：圓環圖、進度條、即時統計
- 🔔 **智能通知**：Toast 通知系統，即時回饋
- 🌐 **國際化支援**：多語言介面（規劃中）
- 🔐 **企業級安全**：完整的認證與授權機制

---

## ✨ 主要功能

### 1. DICOM 影像處理

- ✅ **自動接收**：透過 DICOM SCP 自動接收胸部 X 光影像
- ✅ **智能篩選**：
  - 年齡過濾（僅接受 20 歲以上成人）
  - 檢查類型過濾（Chest PA/AP/Lateral）
- ✅ **結構化報告**：自動生成 DICOM SR（Structured Report）
- ✅ **報告匯出**：支援 JSON 格式，可透過 SSH/FTP 傳送至 RIS 系統

### 2. AI 分析引擎

採用 **Google MedGemma 27B** 模型進行影像分析：

- 🔍 **詳細發現（Findings）**：描述影像中觀察到的病變
- 💡 **診斷印象（Impression）**：提供診斷建議
- 🏷️ **智能分類**：四級分類系統
  - **Normal**：正常，無顯著異常
  - **Abnormal**：異常，需進一步檢查
  - **Critical**：危急，需緊急處理
  - **Emergency**：緊急，需立即處理
- 📊 **信心分數**：0-100% 信心度評分

### 3. 網頁管理介面

#### Dashboard（儀表板）
- 📈 即時系統統計
- 📊 圓環圖視覺化（狀態分佈、分類分佈）
- 📉 進度條顯示關鍵指標
- ⏱️ 自動刷新（每 5 秒）

#### Processing List（處理清單）
- 📝 影像處理狀態追蹤
- 🔍 搜尋與篩選功能
- ⏱️ 自動刷新（每 3 秒）
- 📄 分頁顯示

#### Result List（結果清單）
- 📋 分析結果展示
- 🎯 分類篩選
- 📊 信心分數視覺化
- 📑 可展開的詳細報告

#### DICOM Settings（DICOM 設定）
- ⚙️ DICOM 節點管理
- 🔌 連線測試功能
- 📇 卡片式佈局
- ➕ 新增/編輯/刪除節點

#### Prompt Settings（提示詞設定）
- 💬 AI 提示詞模板管理
- 📝 變數支援（病患資訊、檢查資訊）
- ⭐ 預設模板設定
- 📊 字元數統計

### 4. 系統特性

- 🌓 **深色模式**：完整的深色主題支援
- 🔔 **Toast 通知**：優雅的通知系統（成功、錯誤、警告、資訊）
- 📱 **響應式設計**：完美支援桌面、平板、手機
- ♿ **無障礙設計**：符合 WCAG AA 標準
- 🚀 **效能優化**：React Query 智能快取、GPU 加速動畫

---

## 🏗️ 系統架構

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (React)                     │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐  │
│  │Dashboard │Processing│ Results  │  DICOM   │ Prompts  │  │
│  │          │   List   │   List   │ Settings │ Settings │  │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS/REST API
┌────────────────────────┴────────────────────────────────────┐
│                      Backend (FastAPI)                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  REST API  │  Authentication  │  Database ORM        │  │
│  └──────────────────────────────────────────────────────┘  │
└───┬──────────┬─────────────┬────────────┬──────────────┬───┘
    │          │             │            │              │
┌───┴───┐  ┌───┴───┐  ┌──────┴─────┐  ┌──┴────┐  ┌──────┴─────┐
│ DICOM │  │Worker │  │  MedGemma  │  │RabbitMQ│  │ PostgreSQL │
│  SCP  │  │Process│  │    27B     │  │ Queue │  │  Database  │
└───────┘  └───────┘  └────────────┘  └────────┘  └────────────┘
```

### 核心元件

1. **Frontend**（前端）
   - React 18 + Vite
   - Tailwind CSS
   - React Query（資料管理）
   - Context API（狀態管理）

2. **Backend API**（後端 API）
   - FastAPI（Python 網頁框架）
   - SQLAlchemy ORM
   - Pydantic（資料驗證）

3. **DICOM SCP**（DICOM 接收服務）
   - PyNetDICOM
   - 自動影像接收與篩選
   - RabbitMQ 訊息佇列整合

4. **AI Worker**（AI 處理服務）
   - MedGemma 27B 模型
   - 8-bit 量化（節省記憶體）
   - GPU 加速

5. **Report Worker**（報告生成服務）
   - DICOM SR 生成
   - JSON 報告匯出
   - SSH/FTP 傳輸

6. **資料庫與訊息佇列**
   - PostgreSQL（主要資料庫）
   - Redis（快取）
   - RabbitMQ（訊息佇列）

---

## 🛠️ 技術棧

### 後端技術

| 技術 | 版本 | 用途 |
|------|------|------|
| Python | 3.10+ | 主要程式語言 |
| FastAPI | 0.104+ | Web 框架 |
| SQLAlchemy | 2.0+ | ORM |
| PyDICOM | 2.4+ | DICOM 處理 |
| PyNetDICOM | 2.0+ | DICOM 網路通訊 |
| Transformers | 4.35+ | AI 模型載入 |
| PyTorch | 2.1+ | 深度學習框架 |
| RabbitMQ | 3.12+ | 訊息佇列 |
| PostgreSQL | 15+ | 資料庫 |
| Redis | 7.0+ | 快取 |

### 前端技術

| 技術 | 版本 | 用途 |
|------|------|------|
| React | 18.2+ | UI 框架 |
| Vite | 5.0+ | 建構工具 |
| Tailwind CSS | 3.3+ | CSS 框架 |
| React Query | 5.0+ | 資料管理 |
| React Router | 6.20+ | 路由管理 |
| Heroicons | 2.0+ | 圖示庫 |
| Day.js | 1.11+ | 日期處理 |

### DevOps

| 技術 | 用途 |
|------|------|
| Docker | 容器化 |
| Docker Compose | 服務編排 |
| Nginx | 反向代理 |
| Let's Encrypt | SSL 憑證 |

---

## 🚀 快速開始

### 前置需求

#### 硬體需求（開發環境）
- CPU：4 核心以上
- RAM：16GB 以上
- GPU：NVIDIA GPU（8GB+ VRAM，建議）
- 儲存：100GB 以上可用空間

#### 軟體需求
- Docker Desktop 或 Docker Engine 20.10+
- Docker Compose 2.0+
- NVIDIA Container Toolkit（如使用 GPU）
- Git

### 安裝步驟

#### 1. 複製專案

```bash
git clone https://github.com/your-repo/medgemma_chest.git
cd medgemma_chest
```

#### 2. 設定環境變數

```bash
cp .env.example .env
nano .env  # 編輯環境變數
```

#### 3. 啟動服務

```bash
# 使用腳本啟動（推薦）
./scripts/start.sh

# 或手動啟動
docker-compose up -d
```

#### 4. 驗證安裝

```bash
# 檢查服務狀態
docker-compose ps

# 查看日誌
docker-compose logs -f

# 測試 API
curl http://localhost:8000/health

# 存取網頁介面
# http://localhost
```

### 初始化資料

```bash
# 建立預設 Prompt 模板
docker-compose exec backend python scripts/init_prompts.py

# 建立測試資料（選用）
docker-compose exec backend python scripts/create_test_data.py
```

---

## 📖 使用說明

### 基本操作流程

1. **設定 DICOM 節點**
   - 進入「DICOM Settings」
   - 新增 PACS 系統節點
   - 測試連線確認設定正確

2. **設定 AI 提示詞**（選用）
   - 進入「Prompt Settings」
   - 自訂或使用預設提示詞模板

3. **接收 DICOM 影像**
   - 從 PACS 系統發送胸部 X 光影像
   - 系統自動接收並加入處理佇列

4. **監控處理進度**
   - 在「Processing List」查看處理狀態
   - 在「Dashboard」查看整體統計

5. **查看分析結果**
   - 在「Result List」查看完整報告
   - 可依分類篩選或搜尋特定病患

### DICOM 影像發送範例

使用 `storescu` 工具發送影像：

```bash
storescu localhost 11112 \
  -aec MEDGEMMA_SCP \
  -aet PACS_SCU \
  chest_xray.dcm
```

---

## 📚 API 文件

### REST API 端點

#### 研究（Studies）

```
GET    /api/v1/studies              # 取得研究清單
GET    /api/v1/studies/{uid}        # 取得單一研究
GET    /api/v1/studies/stats        # 取得統計資料
DELETE /api/v1/studies/{uid}        # 刪除研究
POST   /api/v1/studies/{uid}/reprocess  # 重新處理
```

#### DICOM 節點（DICOM Nodes）

```
GET    /api/v1/dicom-nodes          # 取得節點清單
GET    /api/v1/dicom-nodes/{id}     # 取得單一節點
POST   /api/v1/dicom-nodes          # 建立節點
PUT    /api/v1/dicom-nodes/{id}     # 更新節點
DELETE /api/v1/dicom-nodes/{id}     # 刪除節點
POST   /api/v1/dicom-nodes/{id}/test  # 測試連線
```

#### 提示詞（Prompts）

```
GET    /api/v1/prompts              # 取得提示詞清單
GET    /api/v1/prompts/{id}         # 取得單一提示詞
POST   /api/v1/prompts              # 建立提示詞
PUT    /api/v1/prompts/{id}         # 更新提示詞
DELETE /api/v1/prompts/{id}         # 刪除提示詞
POST   /api/v1/prompts/{id}/set-default  # 設為預設
```

### API 文件瀏覽

啟動服務後，可透過以下網址查看完整 API 文件：

- **Swagger UI**：http://localhost:8000/docs
- **ReDoc**：http://localhost:8000/redoc

---

## 🌐 部署指南

詳細部署說明請參閱：
- [英文版部署指南](DEPLOYMENT_GUIDE.md)
- [繁體中文版部署指南](DEPLOYMENT_GUIDE_ZH-TW.md)

### 快速部署步驟

1. **準備伺服器**（Ubuntu 22.04 LTS）
2. **安裝 Docker 與 NVIDIA Container Toolkit**
3. **複製專案並設定環境變數**
4. **設定 SSL 憑證**（使用 Let's Encrypt）
5. **啟動服務**
6. **設定防火牆**
7. **設定 Systemd 服務**（開機自動啟動）
8. **設定備份與監控**

### 生產環境檢查清單

- [ ] 已更改所有預設密碼
- [ ] 已設定 SSL/TLS 憑證
- [ ] 已設定防火牆規則
- [ ] 已設定自動備份
- [ ] 已設定監控與警報
- [ ] 已測試 DICOM 連線
- [ ] 已測試 AI 分析功能
- [ ] 已設定日誌輪替
- [ ] 已設定 Systemd 服務

---

## 💻 開發指南

### 本地開發環境設定

#### 後端開發

```bash
cd backend

# 建立虛擬環境
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate  # Windows

# 安裝依賴
pip install -r requirements.txt

# 執行開發伺服器
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### 前端開發

```bash
cd frontend

# 安裝依賴
npm install

# 執行開發伺服器
npm run dev

# 建構生產版本
npm run build
```

### 程式碼規範

- **Python**：遵循 PEP 8
- **JavaScript**：使用 ESLint + Prettier
- **Git Commit**：使用 Conventional Commits

### 測試

```bash
# 後端測試
cd backend
pytest

# 前端測試
cd frontend
npm run test
```

---

## ❓ 常見問題

### Q1：系統支援哪些 DICOM 影像？

**A**：目前僅支援胸部 X 光影像（Chest PA、AP、Lateral），病患年齡需 20 歲以上。

### Q2：如何調整 AI 模型的記憶體使用？

**A**：可在 `.env` 檔案中設定 `MODEL_LOAD_IN_8BIT=true` 啟用 8-bit 量化，大幅降低記憶體需求。

### Q3：可以同時處理多張影像嗎？

**A**：可以。系統使用 RabbitMQ 訊息佇列，支援非同步並行處理。可透過增加 worker 數量來提升處理速度。

### Q4：報告可以匯出到 PACS 系統嗎？

**A**：可以。系統會自動生成 DICOM SR 報告，並可透過 DICOM C-STORE 發送至指定節點。

### Q5：如何更新 AI 模型？

**A**：修改 `.env` 檔案中的 `MODEL_NAME` 參數，然後重啟 worker 服務。

### Q6：支援多語言介面嗎？

**A**：目前介面為英文，繁體中文多語言支援已規劃在 Phase 2。

### Q7：系統需要多少儲存空間？

**A**：取決於處理量。建議預留：
- 開發環境：100GB
- 生產環境：500GB+（含影像儲存與備份）

### Q8：可以在沒有 GPU 的環境執行嗎？

**A**：可以，但處理速度會大幅降低。強烈建議使用 NVIDIA GPU（16GB+ VRAM）。

---

## 📄 相關文件

### 繁體中文文件
- [部署指南（繁體中文）](DEPLOYMENT_GUIDE_ZH-TW.md)
- [使用者手冊（繁體中文）](USER_MANUAL_ZH-TW.md)
- [Phase 1 完成報告](PHASE1_COMPLETE.md)

### 英文文件
- [Deployment Guide (English)](DEPLOYMENT_GUIDE.md)
- [Frontend Improvements](FRONTEND_IMPROVEMENTS.md)
- [Frontend Complete](FRONTEND_COMPLETE.md)

---

## 🤝 貢獻指南

歡迎貢獻！請遵循以下步驟：

1. Fork 本專案
2. 建立功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交變更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

### 開發規範

- 遵循現有程式碼風格
- 新增功能需包含測試
- 更新相關文件
- 確保所有測試通過

---

## 📝 版本歷史

### v1.0.0 (2025-11-20)

**Phase 1 完成**
- ✅ Toast 通知系統
- ✅ 深色模式支援
- ✅ DICOM Settings 頁面增強
- ✅ Prompt Settings 頁面增強
- ✅ Dashboard 數據可視化增強

**核心功能**
- ✅ DICOM SCP 影像接收
- ✅ MedGemma 27B AI 分析
- ✅ DICOM SR 報告生成
- ✅ 網頁管理介面
- ✅ REST API
- ✅ Docker 部署

**詳細變更記錄**：參閱 [PHASE1_COMPLETE.md](PHASE1_COMPLETE.md)

---

## 📜 授權條款

本專案採用 MIT License - 詳見 [LICENSE](LICENSE) 檔案。

---

## 🙏 致謝

- **Google**：提供 MedGemma 27B 模型
- **PyDICOM**：DICOM 處理函式庫
- **FastAPI**：現代化 Python Web 框架
- **React**：強大的 UI 函式庫

---

## 📮 聯絡方式

- **專案維護者**：Your Name
- **電子郵件**：your.email@example.com
- **專案網址**：https://github.com/your-repo/medgemma_chest
- **問題回報**：https://github.com/your-repo/medgemma_chest/issues

---

## 🔮 未來規劃

### Phase 2（2-4 週）
- [ ] 多語言支援（繁體中文、英文）
- [ ] 進階搜尋功能
- [ ] 數據可視化增強（趨勢圖表）

### Phase 3（1-2 個月）
- [ ] PWA 支援
- [ ] DICOM 影像查看器
- [ ] LINE 通知整合（危急病例通知）

### 長期規劃
- [ ] 支援更多影像類型
- [ ] 多模態 AI 模型整合
- [ ] 與 RIS/HIS 系統深度整合
- [ ] 移動應用程式

---

<div align="center">

**⭐ 如果這個專案對您有幫助，請給我們一個 Star！**

Made with ❤️ by the MedGemma Team

</div>
