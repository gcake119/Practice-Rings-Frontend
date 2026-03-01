# Practice Rings 公開版 SDD

**Version:** 1.4.0 (Public)
**Last Updated:** 2025-12-12
**Scope:** 公開版僅涵蓋對外功能、API 合約與前端行為；不含環境變數值、部署路徑、密鑰與內部營運細節。

---

## 1. 專案概述
- 目標：以三個圈圈（Coding / Reading / Writing）追蹤每日學習投入，靈感來自 Apple Watch 活動圈圈。
- 角色：單人使用者；透過登入保護後端紀錄。
- 技術棧：前端純 HTML/CSS/JavaScript；後端 Node.js + Express；資料存放 JSON 檔（未來可換成其他儲存）。

## 2. 功能摘要
- 登入：前端輸入密碼 → `POST /api/login` → 取得 token 後才可讀寫進度與設定。
- 今日追蹤：三圈圈顯示各模式完成度；模式計時器 Start/Pause/Stop；手動輸入時間區間；今日 note；儲存今天。
- 勵志文案：以 360 分鐘為 100% 總目標，依完成度顯示 Doraemon 風格文案。
- 歷史檢視：最近 7 天小圈圈卡片；可切換月檢視（行事曆格）。
- 目標設定：三模式獨立目標分鐘（目前由設定 API 或前端 state 提供）。

## 3. 資料模型（進度檔）
```json
{
  "settings": {
    "codingGoalMinutes": 180,
    "readingGoalMinutes": 90,
    "writingGoalMinutes": 30
  },
  "records": {
    "YYYY-MM-DD": {
      "codingMinutes": 0,
      "readingMinutes": 0,
      "writingMinutes": 0,
      "note": ""
    }
  }
}
```

## 4. API 合約（公開版）
Base URL 依部署環境決定（本機如 `http://localhost:3000`）。所有受保護路由需 `Authorization: Bearer <token>`。

### 4.1 Auth
- `POST /api/login`
  - Body: `{ "password": "..." }`
  - 200: `{ "token": "<signed-token>" }`
  - 錯誤：401 未授權

### 4.2 設定
- `GET /api/settings`
  - 200: `{ codingGoalMinutes, readingGoalMinutes, writingGoalMinutes }`
- `POST /api/settings`
  - Body: 與回傳欄位同結構
  - 200: `{ "success": true }`

### 4.3 進度
- `GET /api/progress?date=YYYY-MM-DD`
  - 200: `{ date, codingMinutes, readingMinutes, writingMinutes, note }`
- `GET /api/progress/recent?days=7`
  - 200: `{ "records": [{ date, codingMinutes, readingMinutes, writingMinutes, note? }] }`
- `POST /api/progress`
  - Body（含 note 或僅分鐘數皆可）：`{ date, codingMinutes, readingMinutes, writingMinutes, note? }`
  - 200: `{ "success": true }`

## 5. 前端行為重點
- 狀態：`state.todayMinutes`、`state.goals`、`state.note`、`state.recentRecords`、`state.isAuthenticated`、`state.token`、`state.manualTime`、`state.historyViewMode`。
- 登入流程：按登入 → 顯示 loading → 呼叫 `/api/login` → 成功後 `init()` 依序抓設定、今日進度、最近 7 天，再渲染畫面；失敗顯示 toast 並停留登入區。
- 計時器：Start → Pause → Stop；Stop 時把本段分鐘累加當日該模式並自動 `POST /api/progress`（不含 note）。
- 手動時間：輸入開始/結束時間，驗證 end > start；成功累加分鐘並呼叫 `POST /api/progress`；成功後清空輸入並用 toast 提示。
- 儲存今天：將今日分鐘＋note 一次寫回；按鈕文案依 note 是否為空在「儲存今天 / 修改並儲存」間切換。
- 歷史檢視：`recent7` 模式顯示 7 顆小圈圈；`calendar` 模式以行事曆格展示，支援月份切換與日期點選。
- Toast：所有成功/錯誤/資訊提示皆使用 toast（不使用 `alert`）。

## 6. 非功能性
- RWD：以手機直向優先，桌機置中；Doraemon 蠟筆風格，粉圓體字型（jf-openhuninn）。
- 部署：前端可 GitHub Pages；後端可雲端（需持久化 JSON 儲存）。
- 安全：所有進度/設定路由需 Bearer token；請勿在公開文件放置密碼、token、域名、Volume 路徑等敏感資訊。

## 7. 未來擴充（公開版摘要）
- 前端目標設定 UI（透過 `/api/settings`）。
- 多使用者登入流程（保持現有 API 兼容）。
- 資料儲存抽換（如 Google Sheets）。
