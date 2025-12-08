# HuggingFace 設定指南

MedGemma 是 Google 開發的醫療 AI 模型，託管在 HuggingFace 上。由於這是一個受限制的 gated model，您需要完成以下步驟才能使用。

## 步驟 1: 註冊 HuggingFace 帳號

1. 前往 https://huggingface.co/join
2. 註冊一個免費帳號
3. 驗證您的電子郵件地址

## 步驟 2: 申請 MedGemma 訪問權限

1. 前往 MedGemma 模型頁面：https://huggingface.co/google/medgemma-27b-it
2. 點擊頁面上的 **"Request access"** 按鈕
3. 填寫申請表格（通常需要說明使用目的）
4. 等待 Google 審核（通常在 24-48 小時內批准）
5. 收到批准通知後即可繼續下一步

## 步驟 3: 創建 HuggingFace Access Token

1. 登入 HuggingFace
2. 前往設定頁面：https://huggingface.co/settings/tokens
3. 點擊 **"New token"** 按鈕
4. 設定 Token 資訊：
   - **Name**: 例如 "medgemma-chest-xray"
   - **Type**: 選擇 **"Read"** （讀取權限即可）
5. 點擊 **"Generate token"**
6. **重要**: 複製生成的 token（只會顯示一次）

Token 格式範例：
```
hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 步驟 4: 配置 Token

### 方法 1: 使用環境變數檔案（推薦）

1. 編輯 `.env` 檔案：
   ```bash
   nano .env
   ```

2. 找到 `HF_TOKEN=` 這一行，填入您的 token：
   ```
   HF_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

3. 儲存並關閉檔案

### 方法 2: 直接在 Docker Compose 中設定

編輯 `docker-compose.yml`，在 worker 服務中添加環境變數：

```yaml
worker_dicom:
  environment:
    - HF_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 步驟 5: 重啟容器

```bash
# 停止所有容器
docker compose down

# 重啟所有服務
docker compose up -d

# 檢查 worker 日誌，確認模型下載成功
docker compose logs -f worker_dicom
```

## 驗證設定

如果設定正確，您應該在 worker 日誌中看到：

```
Downloading model google/medgemma-27b-it...
Loading model configuration...
Model loaded successfully
```

## 常見問題

### Q: Token 無效或沒有權限？
**A**: 確認您已經：
1. 完成 MedGemma 訪問權限申請並獲得批准
2. Token 類型為 "Read" 或更高權限
3. Token 沒有過期

### Q: 模型下載速度很慢？
**A**: MedGemma-27B 模型大小約 15-20GB，首次下載需要一些時間。下載完成後會快取在 `./models` 目錄中。

### Q: 如何檢查是否有 MedGemma 訪問權限？
**A**:
1. 登入 HuggingFace
2. 訪問 https://huggingface.co/google/medgemma-27b-it
3. 如果您有訪問權限，會看到完整的模型頁面而不是 "Request access" 按鈕

## 安全提示

⚠️ **重要**: 不要將您的 HuggingFace Token 提交到 Git！

- `.env` 檔案已經在 `.gitignore` 中
- 永遠不要在公開的程式碼中硬編碼 token
- 定期更換 token
- 如果 token 洩漏，立即到 HuggingFace 設定頁面撤銷它

## 支援

如果遇到問題：

1. 檢查 worker 容器日誌：
   ```bash
   docker compose logs worker_dicom
   ```

2. 驗證 token 是否正確設定：
   ```bash
   docker exec medgemma_worker_dicom env | grep HF_TOKEN
   ```

3. 確認網路連接正常，可以訪問 HuggingFace：
   ```bash
   curl -I https://huggingface.co
   ```

## 相關連結

- HuggingFace 主頁: https://huggingface.co
- MedGemma 模型: https://huggingface.co/google/medgemma-27b-it
- Token 管理: https://huggingface.co/settings/tokens
- HuggingFace 文檔: https://huggingface.co/docs
