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

├─ index.html # 單頁應用主畫面
├─ style.css # Doraemon 蠟筆手繪風樣式與圈圈 UI
├─ app.js # 前端狀態管理、計時器邏輯、API 串接
├─ apple-touch-icon.png
├─ favicon-32.png
├─ favicon-16.png
└─ docs/

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

## 未來規劃（前端）

- 加入目標設定 UI，透過 `/api/settings` 直接調整每日目標。
- 支援多使用者登入後的 user 狀態顯示。
- 加入簡易離線提示與 localStorage 暫存。