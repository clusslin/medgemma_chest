# MedGemma 胸部 X 光系統 - 使用者手冊

## 目錄

1. [系統簡介](#系統簡介)
2. [開始使用](#開始使用)
3. [儀表板 (Dashboard)](#儀表板-dashboard)
4. [處理清單 (Processing List)](#處理清單-processing-list)
5. [結果清單 (Result List)](#結果清單-result-list)
6. [DICOM 設定](#dicom-設定)
7. [Prompt 設定](#prompt-設定)
8. [常見操作](#常見操作)
9. [疑難排解](#疑難排解)

---

## 系統簡介

MedGemma 胸部 X 光系統是一個自動化的醫學影像分析平台，專門用於胸部 X 光片的 AI 輔助診斷。

### 主要功能

- 🔄 **自動接收 DICOM 影像**：支援從 PACS 系統自動接收胸部 X 光影像
- 🤖 **AI 智能分析**：使用 Google MedGemma 27B 模型進行影像分析
- 📊 **即時監控**：即時查看影像處理狀態與結果
- 📋 **報告生成**：自動產生 DICOM SR 結構化報告
- 🔍 **分類系統**：四級分類（正常、異常、危急、緊急）
- 🌓 **深色模式**：支援深色/淺色主題切換

### 支援的檢查類型

- 胸部 X 光後前位（Chest PA）
- 胸部 X 光前後位（Chest AP）
- 胸部 X 光側位（Chest Lateral）

### 年齡限制

系統僅接受 20 歲以上成人的胸部 X 光影像。

---

## 開始使用

### 登入系統

1. 開啟瀏覽器
2. 輸入系統網址（例如：`https://medgemma.hospital.com`）
3. 系統會自動載入儀表板

### 系統介面

#### 側邊欄導覽

系統左側為主要導覽列，包含：

- 📊 **Dashboard**：系統總覽與統計
- ⚙️ **DICOM Settings**：DICOM 節點設定
- 📝 **Processing List**：處理中影像清單
- 📈 **Result List**：分析結果清單
- 💬 **Prompt Settings**：AI 提示詞設定

#### 主題切換

點擊側邊欄右上角的 🌙/☀️ 圖示可切換深色/淺色主題。

---

## 儀表板 (Dashboard)

儀表板提供系統整體狀態的即時概覽。

### 關鍵指標

#### 成功率
- 顯示系統處理成功率百分比
- 包含進度條視覺化
- 顯示成功處理與總處理數量

#### 正常病例
- 顯示無顯著異常的病例數量
- 包含佔總數的比例視覺化

#### 緊急病例
- 顯示需要立即關注的病例數量（危急 + 緊急）
- 包含佔總數的比例視覺化

### 處理狀態

顯示各種處理狀態的統計：

- **Total Studies**：總研究數量
- **Received**：已接收
- **Processing**：處理中
- **Completed**：已完成
- **Failed**：失敗
- **Sent**：已發送

**狀態分佈圓環圖**：以視覺化方式顯示各狀態的比例

### 分類結果

顯示 AI 分類結果的統計：

- **Normal**：正常（無顯著異常）
- **Abnormal**：異常（需要進一步檢查）
- **Critical**：危急（需要緊急處理）
- **Emergency**：緊急（需要立即處理）

**分類分佈圓環圖**：以視覺化方式顯示各分類的比例

### 自動刷新

儀表板每 5 秒自動刷新一次，確保資料即時更新。

---

## 處理清單 (Processing List)

顯示所有正在處理或等待處理的影像清單。

### 頁面功能

#### 篩選器

1. **狀態篩選**
   - All：顯示所有狀態
   - Received：僅顯示已接收
   - Processing：僅顯示處理中
   - Completed：僅顯示已完成
   - Failed：僅顯示失敗

2. **搜尋功能**
   - 可搜尋病患 ID、研究 UID、檢查描述

#### 資料表欄位

- **Patient ID**：病患識別碼
- **Study UID**：研究唯一識別碼
- **Study Description**：檢查描述
- **Status**：當前處理狀態
- **Received At**：接收時間
- **Updated At**：最後更新時間

#### 狀態標籤

每個狀態都有對應的顏色標籤：

- 🔵 Received：藍色
- 🟣 Processing：紫色
- 🟢 Completed：綠色
- 🔴 Failed：紅色
- 🟦 Sent：青色

### 分頁控制

- 每頁顯示 20 筆資料
- 可透過底部分頁器切換頁面
- 顯示總筆數與當前頁數

### 自動刷新

清單每 3 秒自動刷新一次。

---

## 結果清單 (Result List)

顯示所有已完成分析的影像結果。

### 頁面功能

#### 篩選器

1. **分類篩選**
   - All：顯示所有分類
   - Normal：僅顯示正常
   - Abnormal：僅顯示異常
   - Critical：僅顯示危急
   - Emergency：僅顯示緊急

2. **搜尋功能**
   - 可搜尋病患 ID、研究 UID、發現、印象

#### 結果卡片

每個結果以卡片形式顯示，包含：

1. **標題列**
   - 病患 ID
   - 分類標籤（Normal/Abnormal/Critical/Emergency）
   - 信心分數（0-100%）
   - 信心分數進度條

2. **基本資訊**
   - 研究描述
   - 分析時間

3. **展開內容**（點擊「查看詳細」）
   - **Findings**：詳細發現
   - **Impression**：診斷印象
   - **Study Information**：
     - Study UID
     - Patient ID
     - 研究描述
     - 分析時間

#### 分類標籤顏色

- 🟢 **Normal**：綠色
- 🟡 **Abnormal**：黃色
- 🟠 **Critical**：橘色
- 🔴 **Emergency**：紅色

### 操作按鈕

- **查看詳細 / 收起詳細**：展開或收起完整報告內容

### 自動刷新

清單每 5 秒自動刷新一次。

---

## DICOM 設定

管理與 PACS 系統或其他 DICOM 節點的連線設定。

### 新增 DICOM 節點

1. 點擊右上角「Add DICOM Node」按鈕
2. 填寫節點資訊：
   - **AE Title**：應用實體標題（Application Entity Title）
   - **IP Address**：節點 IP 位址
   - **Port**：DICOM 通訊埠（預設 104）
   - **Node Type**：節點類型
     - Local：本地節點
     - Source：來源節點（從此接收）
     - Destination：目標節點（發送至此）
   - **Description**：節點描述（選填）
   - **Active**：是否啟用

3. 點擊「Create」建立節點

### 編輯 DICOM 節點

1. 點擊節點卡片右側的 ✏️ 編輯圖示
2. 修改節點資訊
3. 點擊「Update」更新設定

### 刪除 DICOM 節點

1. 點擊節點卡片右側的 🗑️ 刪除圖示
2. 確認刪除操作

### 測試連線

1. 點擊節點卡片底部的「Test Connection」按鈕
2. 系統會執行 DICOM Echo（C-ECHO）測試
3. 測試結果會透過通知顯示：
   - ✅ 連線成功
   - ❌ 連線失敗（含錯誤訊息）

### 節點資訊卡片

每個節點以卡片形式顯示：

- **標題區域**
  - AE Title
  - 節點類型標籤
  - 狀態標籤（Active/Inactive）
  - 描述（如有）

- **資訊面板**
  - IP Address
  - Port

- **操作區域**
  - Test Connection 按鈕
  - 編輯按鈕
  - 刪除按鈕

---

## Prompt 設定

管理 AI 模型使用的提示詞模板。

### Prompt 類型

系統支援四種提示詞類型：

1. **System**：系統層級提示詞
2. **Findings**：發現內容產生提示詞
3. **Impression**：診斷印象產生提示詞
4. **Classification**：分類判斷提示詞

### 新增 Prompt 模板

1. 點擊右上角「Add Prompt Template」按鈕
2. 填寫模板資訊：
   - **Name**：模板名稱
   - **Description**：模板描述（選填）
   - **Template Type**：模板類型（選擇上述四種之一）
   - **Prompt Text**：提示詞內容
   - **Display Order**：顯示順序（數字）
   - **Active**：是否啟用
   - **Set as Default**：設為預設模板

3. 點擊「Create」建立模板

### 可用變數

在提示詞中可使用以下變數：

- `{patient_age}`：病患年齡
- `{patient_sex}`：病患性別
- `{study_description}`：檢查描述
- `{patient_name}`：病患姓名
- `{patient_id}`：病患 ID

**使用範例**：
```
請分析此 {study_description} 影像，病患為 {patient_age} 歲 {patient_sex}。
```

### 編輯 Prompt 模板

1. 點擊模板卡片右側的 ✏️ 編輯圖示
2. 修改模板內容
3. 點擊「Update」更新模板

### 刪除 Prompt 模板

1. 點擊模板卡片右側的 🗑️ 刪除圖示
2. 確認刪除操作

### 設定預設模板

1. 點擊模板卡片右側的 ⭐ 星號圖示
2. 該模板會被標記為預設模板
3. 系統會優先使用預設模板進行分析

### Prompt 卡片

每個提示詞模板以卡片形式顯示：

- **標題區域**
  - 模板名稱
  - 類型標籤
  - 預設標記（如為預設）
  - 狀態標籤（Active/Inactive）
  - 描述（如有）

- **內容預覽**
  - 提示詞內容（最多顯示 3 行）
  - 字元數統計
  - 捲動查看完整內容

- **操作區域**
  - 設為預設按鈕（⭐）
  - 編輯按鈕（✏️）
  - 刪除按鈕（🗑️）

---

## 常見操作

### 1. 監控系統狀態

**步驟**：
1. 進入 Dashboard
2. 查看關鍵指標與圖表
3. 注意異常狀態或失敗案例

**檢查項目**：
- 成功率是否正常（建議 > 95%）
- 是否有大量失敗案例
- 處理速度是否符合預期

### 2. 查看處理進度

**步驟**：
1. 進入 Processing List
2. 使用狀態篩選器選擇「Processing」
3. 查看當前正在處理的影像

**注意事項**：
- 一般處理時間：1-3 分鐘/影像
- 如長時間停留在 Processing 狀態，可能需要檢查系統

### 3. 檢視分析結果

**步驟**：
1. 進入 Result List
2. 使用搜尋功能找到特定病患
3. 點擊「查看詳細」展開完整報告

**可檢視內容**：
- 分類結果與信心分數
- 詳細發現（Findings）
- 診斷印象（Impression）
- 研究資訊

### 4. 設定 DICOM 連線

**步驟**：
1. 進入 DICOM Settings
2. 點擊「Add DICOM Node」
3. 填寫 PACS 系統資訊
4. 點擊「Test Connection」驗證連線
5. 確認連線成功後啟用節點

**注意事項**：
- 確保網路連通性
- 確認 AE Title 正確
- 測試連線成功後再啟用

### 5. 自訂 AI 提示詞

**步驟**：
1. 進入 Prompt Settings
2. 點擊「Add Prompt Template」
3. 選擇適當的模板類型
4. 撰寫提示詞內容（可使用變數）
5. 設為預設模板

**最佳實踐**：
- 使用清晰、具體的指示
- 適當使用變數提供病患資訊
- 測試不同提示詞的效果

---

## 疑難排解

### 常見問題

#### 1. 無法接收 DICOM 影像

**可能原因**：
- DICOM 節點設定錯誤
- 網路連線問題
- AE Title 不匹配

**解決方法**：
1. 檢查 DICOM Settings 中的節點設定
2. 使用「Test Connection」測試連線
3. 確認 PACS 系統的 AE Title 設定
4. 檢查防火牆設定（Port 11112）

#### 2. 影像一直處於 Processing 狀態

**可能原因**：
- GPU 記憶體不足
- Worker 服務停止
- 模型載入失敗

**解決方法**：
1. 檢查系統資源使用情況
2. 查看 Docker 容器狀態：`docker-compose ps`
3. 查看 worker 日誌：`docker-compose logs worker_dicom`
4. 重啟 worker：`docker-compose restart worker_dicom`

#### 3. 分析結果不準確

**可能原因**：
- Prompt 提示詞不適當
- 影像品質問題
- 模型需要調整

**解決方法**：
1. 檢查並優化 Prompt 設定
2. 確認影像品質符合要求
3. 調整提示詞以獲得更好的結果
4. 收集反饋以改進系統

#### 4. 通知不顯示

**可能原因**：
- 瀏覽器快取問題
- JavaScript 錯誤

**解決方法**：
1. 重新整理頁面（F5）
2. 清除瀏覽器快取
3. 使用瀏覽器開發者工具檢查錯誤
4. 嘗試其他瀏覽器

#### 5. 深色模式不切換

**可能原因**：
- 主題設定未儲存
- 瀏覽器不支援 localStorage

**解決方法**：
1. 確認瀏覽器允許 localStorage
2. 清除瀏覽器快取
3. 重新登入系統

### 效能優化建議

1. **定期清理舊資料**
   - 刪除不需要的舊研究
   - 備份重要資料

2. **監控系統資源**
   - 檢查 GPU 使用率
   - 監控記憶體使用
   - 注意磁碟空間

3. **最佳化設定**
   - 調整 worker 數量
   - 優化資料庫查詢
   - 啟用快取

---

## 聯絡支援

如果您遇到無法解決的問題，請聯繫技術支援：

- **電子郵件**：support@medgemma.com
- **技術文件**：參閱 DEPLOYMENT_GUIDE_ZH-TW.md
- **GitHub Issues**：https://github.com/your-repo/issues

---

## 附錄

### 鍵盤快捷鍵

目前系統不支援鍵盤快捷鍵，未來版本將會加入。

### 瀏覽器支援

**建議瀏覽器**：
- Google Chrome 90+
- Mozilla Firefox 88+
- Microsoft Edge 90+
- Safari 14+

**不支援**：
- Internet Explorer（任何版本）

### 系統需求

**客戶端**：
- 現代化網頁瀏覽器
- 1920x1080 或更高解析度
- 穩定的網路連線

**伺服器端**：
- 參閱 DEPLOYMENT_GUIDE_ZH-TW.md

---

**文件建立日期**：2025-11-20
**最後更新**：2025-11-20
**版本**：1.0.0
**語言**：繁體中文
