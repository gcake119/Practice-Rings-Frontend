# Practice Rings Frontend

Practice Rings（修煉圈圈）是一個用三個圈圈追蹤每日學習投入的練功小工具，靈感來自 Apple Watch 活動圈圈。

這個 repo 只包含「前端靜態網頁」，負責：
- 顯示三個主圈圈（Coding / Reading / Writing）的完成度。
- 模式計時器（選擇模式 → 開始 → 暫停 → 結束）。
- 今日摘要（分鐘數＋今日重點 note）。
- 最近 7 天的小型同心圓紀錄列。
- 呼叫後端 API 讀寫每日進度與目標設定。

完整系統規格請參考後端 repo 的 `docs/SDD.md`。

## Tech Stack

- HTML / CSS / 原生 JavaScript（無框架）
- Fetch API 呼叫後端 RESTful API
- 部署目標：GitHub Pages

## 專案結構

````text
├─ index.html # 單頁應用主畫面
├─ style.css # Doraemon 蠟筆手繪風樣式與圈圈 UI
├─ app.js # 前端狀態管理、計時器邏輯、API 串接
├─ apple-touch-icon.png
├─ favicon-32.png
├─ favicon-16.png
└─ docs/
````

## 功能摘要

- 模式計時器：
- Coding / Reading / Writing 三種模式。
- 開始 → 暫停 → 結束，結束時會：
 - 將本段分鐘數累加到今天的 minutes。
 - 自動呼叫後端儲存目前累積時間。
- 三個主圈圈：
- 外觀類似 Apple Watch rings。
- 顯示百分比與 `current / goal` 分鐘。
- 今日摘要：
- 顯示三種模式累積分鐘數。
- 今日重點 note 可自由輸入。
- 儲存按鈕會依 note 是否為空顯示：
 - 「儲存今天 Save Today」或「修改並儲存 Update & Save」。
- 最近 7 天紀錄：
- 以 7 個小同心圓呈現，外中內圈分別代表三種模式完成度。
- 登入與載入流程：
  - 使用者必須先輸入修煉密碼並按下「登入 Login」，後端驗證成功後才會載入每日目標與歷史紀錄。
  - 登入過程會顯示鈴鐺轉圈圈的 loading 畫面，若登入或初始化失敗，會以 toast 顯示錯誤訊息並回到登入畫面。
- 鼓勵與總體進度：
  - 今日摘要下方提供總時數三色進度條（Coding / Reading / Writing），以 360 分鐘為 100% 目標，顯示「總分鐘・完成百分比」。
  - 勵志台詞區塊會根據 `state.todayMinutes` 與 `state.goals` 即時計算：
    - 計時器結束一段修煉。
    - 成功加入一段手動時間。
    - 重新載入當日紀錄（從後端取得 today progress）。
  - 使用者不需要按「儲存今天」也會看到最新的進度與勵志文案。

## 未來規劃（前端）

- 加入目標設定 UI，透過 `/api/settings` 直接調整每日目標，並即時影響圈圈百分比與勵志台詞的計算。
- 支援多使用者登入後的 user 狀態顯示。