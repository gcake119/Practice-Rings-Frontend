# 自動備份 progress.json 方案

## 推薦方案：GitHub Actions 定期備份

### 設置步驟

1. **在倉庫中創建 `.github/workflows/backup.yml`**

```yaml
name: Backup progress.json

on:
  schedule:
    # UTC 時間，每天 19:00（台灣時間 03:00）執行
    - cron: '0 19 * * *'
  workflow_dispatch: # 允許手動觸發備份

permissions:
  contents: write

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 1
      
      - name: Create backup directory
        run: mkdir -p backups
      
      - name: Download and backup progress.json
        env:
          ZEABUR_API: ${{ secrets.ZEABUR_API_URL }}
          API_PASSWORD: ${{ secrets.API_PASSWORD }}
        run: |
          # 取得 token
          TOKEN=$(curl -s "$ZEABUR_API/api/login" \
            -X POST \
            -H "Content-Type: application/json" \
            -d "{\"password\":\"$API_PASSWORD\"}" \
            | grep -o '"token":"[^"]*' | cut -d'"' -f4)
          
          # 備份檔案
          curl -s "$ZEABUR_API/api/export" \
            -H "Authorization: Bearer $TOKEN" \
            -o "backups/progress-$(date -u +%Y%m%d-%H%M%S).json"
          
          # 保留最近 30 個備份
          cd backups
          ls -t progress-*.json | tail -n +31 | xargs -r rm
      
      - name: Commit and push backup
        run: |
          git config --global user.name "GitHub Backup Bot"
          git config --global user.email "noreply@github.com"
          git add backups/
          git diff --quiet && git diff --staged --quiet || (git commit -m "chore: auto backup progress.json [$(date -u +%Y-%m-%d)]" && git push)
```

2. **在 GitHub Secrets 中添加環境變數**

   - `ZEABUR_API_URL`: `https://practice-rings-backend.zeabur.app`
   - `API_PASSWORD`: 你的 API 密碼

3. **設定備份保留政策**（可選）

   在 `backups` 目錄添加 `.gitignore` 保留大備份：
   
   ```
   # 只保留最近 30 天的備份
   progress-*.json
   ```

## 其他備份方案

### 方案 A: Google Drive 備份

使用 GitHub Actions + Google Drive API：

```bash
# 需要設置 Google Service Account 和相應的 Secrets
```

### 方案 B: AWS S3 備份

```yaml
- name: Upload to S3
  env:
    AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
    AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
  run: |
    aws s3 cp "backups/progress-$(date -u +%Y%m%d-%H%M%S).json" \
      s3://your-bucket-name/backups/
```

### 方案 C: 手動備份腳本

本地運行備份：

```bash
#!/bin/bash
BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"

# 獲取 token
TOKEN=$(curl -s "https://practice-rings-backend.zeabur.app/api/login" \
  -X POST \
  -H "Content-Type: application/json" \
  -d "{\"password\":\"YOUR_PASSWORD\"}" \
  | jq -r '.token')

# 備份
curl -s "https://practice-rings-backend.zeabur.app/api/export" \
  -H "Authorization: Bearer $TOKEN" \
  -o "$BACKUP_DIR/progress-$(date +%Y%m%d-%H%M%S).json"

echo "✅ Backup completed"
```

## 前端手動備份按鈕（補充）

在前端添加下載按鈕，讓用戶隨時可以手動備份：

```javascript
async function downloadBackup() {
  const res = await fetch(`${API_BASE}/api/export`, {
    headers: buildHeaders(),
  });
  
  if (!res.ok) {
    alert('備份失敗');
    return;
  }
  
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `progress-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
```

## 恢復備份

如需恢復，可以：

1. 使用舊的 `progress.json` 替換
2. 手動編輯 Zeabur 上的環境變數存儲的備份
3. 添加後端恢復端點（需謹慎）

```javascript
app.post('/api/restore', authMiddleware, (req, res) => {
  // 僅在需要時實現
  // 確保有適當的權限檢查
});
```

## 監控和告警

- 添加 GitHub Actions 失敗通知（可在 GitHub 設定中配置）
- 定期檢查 `backups/` 目錄是否有最新備份
- 可選：添加自動檢查每週是否成功備份
