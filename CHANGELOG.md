# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2025-12-04

### Added
- 新增 toast 通知系統，將關鍵操作（初始化失敗、儲存成功 / 失敗、手動時間錯誤）改為非阻斷式提示。
- 在「今日摘要」區新增總時數三色進度條，以 360 分鐘為 100% 目標，並顯示總分鐘與完成百分比。
- 導入 Doraemon 風格勵志台詞 messages，依總進度與各模式完成度動態顯示鼓勵文案。
- 手動輸入時間功能完成：輸入後驗證時間區間、累加至對應模式，並在成功後自動清空欄位與 state。
- 在圈圈卡片下方顯示各模式專屬勵志台詞，加強每一圈的回饋感。
- 新增登入流程整合 loading 畫面與 toast 錯誤提示：
  - 按下登入按鈕或在密碼欄按 Enter 時顯示 loading。
  - 登入與後續初始化任一步驟失敗時，關閉 loading 並以 toast 告知錯誤原因。

### Changed
- 今日摘要版面重構：保留三項目分鐘數，將總體資訊改為「進度條＋短台詞」，減少文字擁擠。
- 手動時間輸入區 RWD 調整：手機版改為「起訖時間同排、按鈕獨立下一排滿版」，避免超出螢幕寬度。
- Toast 位置與樣式調整：桌機與手機皆置中顯示，採 Doraemon 主題色與膠囊按鈕風格。
- 勵志台詞更新邏輯改為由 `updateProgressUI()` 統一管理：
  - 任何更新 `state.todayMinutes` 的操作（計時器結束、手動時間加入、重新載入今日紀錄）都會同時刷新圈圈、數字與勵志台詞。
  - 移除將 `renderEncouragement()` 綁定在「儲存今天」按鈕上的依賴，避免文案與實際進度不同步。

### Fixed
- 修正 iPhone 螢幕上手動輸入區造成 X 軸捲動的問題。
- 修正初始載入後勵志文案與時間數據不同步的情況（統一由 renderEncouragement() 根據 state 計算）。
- 移除重複宣告的舊版 `renderEncouragement()`，保留單一來源版本，避免未來維護時邏輯不一致。
- 確認所有互動提示均改為 `showToast()`，專案中不再使用 `alert()` 對話框。
