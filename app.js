// 自動判斷環境：本機用 localhost API，其他（GitHub Pages / 手機）用 Zeabur
const isLocalhost = ["localhost", "127.0.0.1", "::1", ""].includes(
  window.location.hostname
);

const API_BASE = isLocalhost
  ? "http://localhost:3000"
  : "https://practice-rings-backend.zeabur.app";

// 全域狀態
const state = {
  isAuthenticated: false,
  token: "",
  manualTime: {
    coding: { start: "", end: "" },
    reading: { start: "", end: "" },
    writing: { start: "", end: "" },
  },

  currentDate: "",
  currentMode: null, // 'coding' | 'reading' | 'writing' | null
  timerRunning: false,
  timerStartTime: null,
  timerIntervalId: null,
  timerPausedElapsedMs: 0, // 暫停前累積毫秒
  todayMinutes: {
    coding: 0,
    reading: 0,
    writing: 0,
  },
  goals: {
    coding: 180,
    reading: 90,
    writing: 30,
  },
  note: "",
  recentRecords: [],
  historyViewMode: "week", // 'week' | 'month'
};

// 勉勵台詞資料
const messages = {
  total: {
    zero: [
      "哎呀呀，今天的學習道具還沒啟動呢！快讓我看看你要從哪裡開始吧〜！",
      "什麼？今天還沒動工？大雄都比你積極的時候我可要緊張囉！",
    ],
    low: [
      "嗯～已經邁出一步啦，再多一點點就能啟動『幹勁加倍燈』囉！",
      "今天的你已經開始轉動齒輪了，再推一下就會跑起來的！",
    ],
    medium: [
      "哦哦！看得出來你努力的影子囉！再加把勁就能讓哆啦A夢驕傲啦〜！",
      "已經做到這樣很棒了！再往前一步，就能看到新風景喔！",
    ],
    high: [
      "哇—進度好快！再一口氣，你就會像搭上時光機一樣直衝目標啦！",
      "這股幹勁真不錯，再小小努力一下就能達成今天的冒險任務囉！",
    ],
    maxed: [
      "太～～厲害了！今天的你根本是未來世界的超級工程師！",
      "完成啦！哆啦A夢要頒給你一個『今日成就滿點章』！",
      "呼哇！全滿！這種成就感比空氣砲直接命中還要爽快吧！",
    ],
  },

  coding: {
    zero: [
      "今天還沒動手敲程式嗎？要不要叫出『自動寫程式機』……欸不對，你自己寫才會成長啦！",
      "程式碼區還空空的耶，要不要開始敲一行給我看看嘛？",
    ],
    low: [
      "嗯！已經開始動腦了，再敲幾行你就會進入『專注模式』囉！",
      "手指動起來！你已經有點熱身感覺了，再來一點！",
    ],
    medium: [
      "看起來你的腦袋齒輪正在快速運轉中呢！這個氣勢不錯喔！",
      "這進度就像把竹蜻蜓開到中速，再推一下就能升空啦！",
    ],
    high: [
      "哇！程式碼噼哩啪啦地冒出來了！你今天超有效率耶！",
      "再一點點就能觸發『程式天才模式』啦，衝刺吧！",
    ],
    maxed: [
      "滿分！你今天的 Coding 火力全開！簡直像拿到道具一樣順！",
      "好耶！你今天寫的程式碼連未來世界的我都想收藏！",
    ],
  },

  reading: {
    zero: [
      "嗯？今天還沒翻開技術書嗎？來嘛～看個一頁也好呀！",
      "要不要我用『翻頁幫手機』幫你翻第一頁？…啊，不行，你自己翻比較厲害啦！",
    ],
    low: [
      "好耶，開始吸收新知識了！這樣才能進化成超級工程師！",
      "閱讀的第一步最重要，你已經成功踏出去了！",
    ],
    medium: [
      "讀到這裡很不錯喔！再多吸收一點技術力會更強！",
      "你的腦袋正在閃閃發亮呢！繼續保持這個節奏吧！",
    ],
    high: [
      "哇～你今天的閱讀量好像開了『知識加速器』一樣耶！",
      "再看一點就能觸發「哆啦A夢讚嘆模式」囉！",
    ],
    maxed: [
      "知識全滿！你今天的腦容量升級成功！",
      "你的閱讀量比大雄考試前念的還多十倍！太棒啦！",
    ],
  },

  writing: {
    zero: [
      "今天還沒寫筆記嗎？我準備好任意筆記本等你開工囉！",
      "來嘛～記一兩句也好，想法不寫下來會飛走的喔！",
    ],
    low: [
      "嗯嗯～開始動筆了喔！技術整理就是一步一步累積的！",
      "只要寫下一點點，未來的你就會感謝現在的你！",
    ],
    medium: [
      "這篇筆記開始有模有樣囉！繼續寫你會更清楚自己的想法！",
      "很好很好，再補幾句就會變成超實用的知識寶藏！",
    ],
    high: [
      "快完成啦！今天的你寫筆記像哆啦A夢講故事一樣流暢！",
      "哇～筆記快要成形了，這份內容未來一定會救你一命！",
    ],
    maxed: [
      "滿分！今日技術筆記完成！你根本是自己的迷你哆啦A夢！",
      "太棒了！這份筆記會像法寶一樣在未來幫你解決大麻煩！",
    ],
  },
};

// DOM 取得
const loginSectionEl = document.getElementById("loginSection");
const appSectionEl = document.getElementById("appSection");
const loginPasswordInput = document.getElementById("loginPassword");
const loginButton = document.getElementById("loginButton");

const loadingEl = document.getElementById("loading");
const mainContentEl = document.getElementById("mainContent");
const headerDateEl = document.getElementById("headerDate");

const modeCodingButton = document.getElementById("modeCodingButton");
const modeReadingButton = document.getElementById("modeReadingButton");
const modeWritingButton = document.getElementById("modeWritingButton");

const currentModeLabelEl = document.getElementById("currentModeLabel");
const timerClockEl = document.getElementById("timerClock");
const timerStartButton = document.getElementById("timerStartButton");
const timerPauseButton = document.getElementById("timerPauseButton");
const timerResetButton = document.getElementById("timerResetButton");

const codingTextEl = document.getElementById("codingText");
const readingTextEl = document.getElementById("readingText");
const writingTextEl = document.getElementById("writingText");

const codingMinutesDisplayEl = document.getElementById("codingMinutesDisplay");
const readingMinutesDisplayEl = document.getElementById(
  "readingMinutesDisplay"
);
const writingMinutesDisplayEl = document.getElementById(
  "writingMinutesDisplay"
);

const todayNoteEl = document.getElementById("todayNote");
const saveTodayButton = document.getElementById("saveTodayButton");

const historyListEl = document.getElementById("historyList");

// 手動時間輸入
const codingStartTimeInput = document.getElementById("codingStartTime");
const codingEndTimeInput = document.getElementById("codingEndTime");
const codingAddTimeButton = document.getElementById("codingAddTimeButton");

const readingStartTimeInput = document.getElementById("readingStartTime");
const readingEndTimeInput = document.getElementById("readingEndTime");
const readingAddTimeButton = document.getElementById("readingAddTimeButton");

const writingStartTimeInput = document.getElementById("writingStartTime");
const writingEndTimeInput = document.getElementById("writingEndTime");
const writingAddTimeButton = document.getElementById("writingAddTimeButton");

// === 當日卡片 Modal ===

const dayCardModal = document.getElementById("dayCardModal");
const dayCardContent = document.getElementById("dayCardContent");
const dayCardClose = document.getElementById("dayCardClose");
const dayCardPrev = document.getElementById("dayCardPrev");
const dayCardNext = document.getElementById("dayCardNext");

let currentViewDate = ""; // 目前 Modal 顯示的日期
let currentMonthDate = new Date(); // 控制月檢視顯示哪個月

const dayCardCalendarToggle = document.getElementById('dayCardCalendarToggle');

// 日期字串：YYYY-MM-DD
function getTodayString() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Header 顯示今天日期
function renderHeaderDate() {
  const d = new Date();
  const month = d.getMonth() + 1;
  const date = d.getDate();
  const dayIndex = d.getDay();
  const days = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];
  headerDateEl.textContent = `${month} 月 ${date} 日（${days[dayIndex]}）`;
}

// 格式化時間 HH:MM:SS
function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function parseTimeToMinutes(value) {
  if (!value) return null;
  const [hh, mm] = value.split(":").map((v) => Number(v));
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  return hh * 60 + mm;
}

// 包裝 headers，統一帶 token
function buildHeaders(extra = {}) {
  const headers = { ...extra };
  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }
  return headers;
}

// === 登入 ===
async function login(password) {
  const res = await fetch(`${API_BASE}/api/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password }),
  });

  if (!res.ok) {
    // 嘗試讀一下錯誤訊息（可選）
    let errorMessage = "登入失敗";
    try {
      const errorBody = await res.json();
      if (errorBody && errorBody.error) {
        errorMessage = errorBody.error;
      }
    } catch (_) {
      // ignore
    }
    throw new Error(errorMessage);
  }

  const data = await res.json();
  if (!data.token) {
    throw new Error("登入失敗：缺少 token");
  }

  state.token = data.token;
  state.isAuthenticated = true;

  // 將 token 存到 localStorage
  // localStorage.setItem('practiceRingsToken', data.token);
}

// === API 呼叫 ===
async function fetchSettings() {
  const res = await fetch(`${API_BASE}/api/settings`, {
    headers: buildHeaders(),
  });
  if (!res.ok) throw new Error("無法取得設定");
  const data = await res.json();
  state.goals = {
    coding: Number(data.codingGoalMinutes) || state.goals.coding,
    reading: Number(data.readingGoalMinutes) || state.goals.reading,
    writing: Number(data.writingGoalMinutes) || state.goals.writing,
  };
}

async function fetchTodayProgress() {
  const res = await fetch(
    `${API_BASE}/api/progress?date=${encodeURIComponent(state.currentDate)}`,
    {
      headers: buildHeaders(),
    }
  );
  if (!res.ok) throw new Error("無法取得今日進度");
  const data = await res.json();
  state.todayMinutes = {
    coding: Number(data.codingMinutes) || 0,
    reading: Number(data.readingMinutes) || 0,
    writing: Number(data.writingMinutes) || 0,
  };
  updateProgressUI();
  state.note = data.note || "";
}

async function fetchRecentProgress(days = 7) {
  const res = await fetch(
    `${API_BASE}/api/progress/recent?days=${encodeURIComponent(days)}`,
    {
      headers: buildHeaders(),
    }
  );
  if (!res.ok) throw new Error("無法取得歷史紀錄");
  const data = await res.json();
  state.recentRecords = Array.isArray(data.records) ? data.records : [];
}

async function saveTodayFull() {
  const body = {
    date: state.currentDate,
    codingMinutes: state.todayMinutes.coding,
    readingMinutes: state.todayMinutes.reading,
    writingMinutes: state.todayMinutes.writing,
    note: state.note,
  };

  const res = await fetch(`${API_BASE}/api/progress`, {
    method: "POST",
    headers: buildHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error("儲存失敗");
}

async function saveTodayMinutesOnly() {
  const body = {
    date: state.currentDate,
    codingMinutes: state.todayMinutes.coding,
    readingMinutes: state.todayMinutes.reading,
    writingMinutes: state.todayMinutes.writing,
    // 不傳 note，後端會保留原本的 note
  };

  const res = await fetch(`${API_BASE}/api/progress`, {
    method: "POST",
    headers: buildHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error("儲存時間失敗");
}

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.style.display = "block";
  setTimeout(() => {
    toast.style.display = "none";
  }, 3000);
}

// === 模式與計時器邏輯 ===
function modeLabel(mode) {
  if (mode === "coding") return "刷題 Coding";
  if (mode === "reading") return "閱讀 Reading";
  if (mode === "writing") return "筆記 Writing";
  return "尚未開始";
}

function highlightModeButtons() {
  const buttons = [modeCodingButton, modeReadingButton, modeWritingButton];
  buttons.forEach((btn) => {
    const mode = btn.dataset.mode;
    if (mode === state.currentMode) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

// 切換模式：如果之前有在跑或暫停中的計時，先結束並累加到 minutes
function setMode(mode) {
  // 若有未結束的計時（正在跑或暫停中），先將其結束
  if (state.timerRunning || state.timerPausedElapsedMs > 0) {
    pauseOrStopTimer(); // 第二段邏輯會把時間加進 todayMinutes
  }

  state.currentMode = mode;
  state.timerPausedElapsedMs = 0;
  state.timerRunning = false;
  state.timerStartTime = null;
  clearInterval(state.timerIntervalId);
  state.timerIntervalId = null;

  currentModeLabelEl.textContent = `目前模式：${modeLabel(mode)}`;
  timerClockEl.textContent = "00:00:00";
  timerPauseButton.textContent = "暫停 Pause";
  highlightModeButtons();
}

// 開始計時
function startTimer() {
  if (!state.currentMode) {
    showToast("請先選擇一個模式");
    return;
  }
  if (state.timerRunning) {
    return;
  }
  state.timerRunning = true;
  state.timerStartTime = Date.now();
  state.timerIntervalId = setInterval(updateTimerDisplay, 1000);
  timerPauseButton.textContent = "暫停 Pause";
  currentModeLabelEl.textContent = `計時中：${modeLabel(state.currentMode)}`;
}

// 更新畫面上的計時顯示
function updateTimerDisplay() {
  if (!state.timerRunning || !state.timerStartTime) return;
  const now = Date.now();
  const elapsedMs = state.timerPausedElapsedMs + (now - state.timerStartTime);
  timerClockEl.textContent = formatTime(elapsedMs);
}

// 暫停或結束：
// - 正在跑 -> 按一下 = 暫停
// - 已暫停 -> 再按一次 = 結束這段計時並累加到 minutes
function pauseOrStopTimer() {
  // 尚未開始任何模式與計時
  if (
    !state.currentMode &&
    !state.timerRunning &&
    state.timerPausedElapsedMs === 0
  ) {
    return;
  }

  // 正在跑 -> 暫停
  if (state.timerRunning) {
    const now = Date.now();
    const thisRoundMs = now - state.timerStartTime;
    state.timerPausedElapsedMs += thisRoundMs;

    state.timerRunning = false;
    state.timerStartTime = null;
    clearInterval(state.timerIntervalId);
    state.timerIntervalId = null;

    timerClockEl.textContent = formatTime(state.timerPausedElapsedMs);
    currentModeLabelEl.textContent = `暫停中：${modeLabel(state.currentMode)}`;
    timerPauseButton.textContent = "結束 Stop"; // 下一次按下去會結束
    return;
  }

  // 已暫停狀態 -> 結束並累加
  if (
    !state.timerRunning &&
    state.currentMode &&
    state.timerPausedElapsedMs > 0
  ) {
    const elapsedMinutes = Math.floor(state.timerPausedElapsedMs / 60000);
    if (elapsedMinutes > 0) {
      state.todayMinutes[state.currentMode] += elapsedMinutes;
      updateProgressUI();
    }

    // 自動儲存目前累積時間（不含 note）
    saveTodayMinutesOnly().catch((err) => {
      console.error(err);
      showToast("自動儲存時間失敗，下次結束計時時會再試一次。");
    });

    // 重置計時狀態
    state.timerPausedElapsedMs = 0;
    state.currentMode = null;
    state.timerRunning = false;
    state.timerStartTime = null;
    clearInterval(state.timerIntervalId);
    state.timerIntervalId = null;

    timerClockEl.textContent = "00:00:00";
    currentModeLabelEl.textContent = "尚未開始";
    timerPauseButton.textContent = "暫停 Pause";
    highlightModeButtons();
    renderTodayNumbers();
    renderRings();
  }
}

// 只重設計時器畫面與狀態，不動今天已累積分鐘
function resetTimerOnly() {
  state.timerRunning = false;
  state.timerStartTime = null;
  state.timerPausedElapsedMs = 0;
  clearInterval(state.timerIntervalId);
  state.timerIntervalId = null;
  timerClockEl.textContent = "00:00:00";
  currentModeLabelEl.textContent = "尚未開始";
  timerPauseButton.textContent = "暫停 Pause";
}

// 手動輸入時間
async function addManualTime(mode, startValue, endValue) {
  const start = parseTimeToMinutes(startValue);
  const end = parseTimeToMinutes(endValue);

  if (start === null || end === null) {
    showToast("請輸入有效時間（HH:MM）");
    return;
  }

  if (end <= start) {
    showToast("結束時間必須晚於開始時間");
    return;
  }

  const delta = end - start; // 差值就是分鐘數

  state.todayMinutes[mode] += delta;
  updateProgressUI();

  try {
    await saveTodayMinutesOnly();
    showToast("已加入本日時間並自動儲存");

    // ✅ 成功後清空 state.manualTime
    if (state.manualTime && state.manualTime[mode]) {
      state.manualTime[mode] = { start: "", end: "" };
    }

    // ✅ 成功後清空對應 input 欄位
    const inputIds = {
      coding: { start: "codingStartTime", end: "codingEndTime" },
      reading: { start: "readingStartTime", end: "readingEndTime" },
      writing: { start: "writingStartTime", end: "writingEndTime" },
    };

    const ids = inputIds[mode];
    if (ids) {
      const startInput = document.getElementById(ids.start);
      const endInput = document.getElementById(ids.end);
      if (startInput) startInput.value = "";
      if (endInput) endInput.value = "";
    }
  } catch (err) {
    console.error(err);
    showToast("手動時間儲存失敗，下次操作時會再嘗試");
  }
}

// 隨機取勉勵台詞
function pickRandom(arr) {
  const index = Math.floor(Math.random() * arr.length);
  return arr[index];
}

// 根據總完成百分比設定 key
function getLevelKey(percentage) {
  if (percentage === 0) return "zero";
  if (percentage < 30) return "low";
  if (percentage < 70) return "medium";
  if (percentage < 100) return "high";
  return "maxed";
}

// 取得台詞內容
function getTotalMessage(totalMinutes) {
  const percentage = (totalMinutes / 360) * 100;
  const levelKey = getLevelKey(percentage);
  const pool = messages.total[levelKey];
  return pickRandom(pool);
}

function getModeMessage(mode, minutes, goalMinutes) {
  const percentage = (minutes / goalMinutes) * 100;
  const levelKey = getLevelKey(percentage);
  const pool = messages[mode][levelKey];
  return pickRandom(pool);
}

/**
 * 打開當日卡片 Modal
 * @param {string} dateStr - 格式：YYYY-MM-DD
 */
async function openDayCard(dateStr) {
  currentViewDate = dateStr;
  dayCardModal.style.display = "flex";

  try {
    await renderDayCard(dateStr);
  } catch (err) {
    console.error(err);
    showToast("無法載入該日紀錄");
    closeDayCard();
  }
}

/**
 * 關閉當日卡片 Modal
 */
function closeDayCard() {
  dayCardModal.style.display = "none";
  currentViewDate = "";
  document.body.style.overflow = ''; // 回復背景捲動
}

function openMonthView(focusDateStr) {
  document.body.style.overflow = 'hidden'; // 鎖背景捲動
  // 隱藏行事曆按鈕（進入月檢視後不需要了）
  const calendarBtn = document.getElementById('dayCardCalendarToggle');
  if (calendarBtn) {
    calendarBtn.style.display = 'none';
  }

  // 以目前卡片日期為中心月份
  const [y, m] = focusDateStr.split('-').map((v) => Number(v));
  currentMonthDate = new Date(y, m - 1, 1);

  renderMonthView();
}

// === Render ===
function renderRings() {
  renderRing(
    "codingRing",
    "ring-coding",
    state.todayMinutes.coding,
    state.goals.coding
  );
  renderRing(
    "readingRing",
    "ring-reading",
    state.todayMinutes.reading,
    state.goals.reading
  );
  renderRing(
    "writingRing",
    "ring-writing",
    state.todayMinutes.writing,
    state.goals.writing
  );

  codingTextEl.textContent = `${state.todayMinutes.coding} / ${state.goals.coding} 分鐘`;
  readingTextEl.textContent = `${state.todayMinutes.reading} / ${state.goals.reading} 分鐘`;
  writingTextEl.textContent = `${state.todayMinutes.writing} / ${state.goals.writing} 分鐘`;
}

function renderRing(containerId, ringClass, current, goal) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const progress = goal > 0 ? Math.min(current / goal, 1) : 0;
  const deg = progress * 360;

  container.innerHTML = `
    <div class="ring-circle ${ringClass}" style="--ring-percent: ${deg}deg;">
      <div class="ring-circle-inner">
        <span class="ring-percent-text">${Math.round(progress * 100)}%</span>
      </div>
    </div>
  `;
}

function updateSaveButtonLabel() {
  const trimmed = (state.note || "").trim();
  if (trimmed.length === 0) {
    saveTodayButton.textContent = "儲存今天 Save Today";
  } else {
    saveTodayButton.textContent = "修改並儲存 Update & Save";
  }
}

function renderTodayNumbers() {
  codingMinutesDisplayEl.textContent = `${state.todayMinutes.coding} 分鐘`;
  readingMinutesDisplayEl.textContent = `${state.todayMinutes.reading} 分鐘`;
  writingMinutesDisplayEl.textContent = `${state.todayMinutes.writing} 分鐘`;
  todayNoteEl.value = state.note || "";
  updateSaveButtonLabel();
}

function updateProgressUI() {
  renderTodayNumbers();
  renderRings();
  renderEncouragement();
}

function renderHistory() {
  historyListEl.innerHTML = "";
  if (!state.recentRecords.length) {
    historyListEl.innerHTML = '<div class="history-empty">尚無最近紀錄</div>';
    return;
  }

  state.recentRecords.forEach((r) => {
    const codingP =
      state.goals.coding > 0
        ? Math.min((r.codingMinutes || 0) / state.goals.coding, 1)
        : 0;
    const readingP =
      state.goals.reading > 0
        ? Math.min((r.readingMinutes || 0) / state.goals.reading, 1)
        : 0;
    const writingP =
      state.goals.writing > 0
        ? Math.min((r.writingMinutes || 0) / state.goals.writing, 1)
        : 0;

    const codingDeg = codingP * 360;
    const readingDeg = readingP * 360;
    const writingDeg = writingP * 360;

    const item = document.createElement("div");
    item.className = "history-day";
    item.dataset.date = r.date;

    // 日期只顯示「MM-DD」比較不占空間
    let dateLabel = r.date || "";
    if (dateLabel.includes("-")) {
      const parts = dateLabel.split("-");
      dateLabel = `${parts[1]}-${parts[2]}`;
    }

    item.innerHTML = `
      <div class="history-day-date">${dateLabel}</div>
      <div class="history-rings">
        <div class="history-ring-outer" style="--ring-percent: ${codingDeg}deg;"></div>
        <div class="history-ring-middle" style="--ring-percent: ${readingDeg}deg;"></div>
        <div class="history-ring-inner" style="--ring-percent: ${writingDeg}deg;"></div>
        <div class="history-ring-center"></div>
      </div>
    `;

    // ✅ 點擊整個小卡片 → 開啟單日卡片
    item.addEventListener("click", () => {
      const dateStr = item.dataset.date;
      if (dateStr) {
        openDayCard(dateStr);
      }
    });

    historyListEl.appendChild(item);
  });
}

function renderAll() {
  renderHeaderDate();
  renderTodayNumbers();
  renderRings();
  renderHistory();
}

function renderEncouragement() {
  const totalEl = document.getElementById("totalMessageText");
  const codingEl = document.getElementById("codingMessageText");
  const readingEl = document.getElementById("readingMessageText");
  const writingEl = document.getElementById("writingMessageText");

  const totalLabelEl = document.getElementById("totalProgressLabel");
  const codingBarEl = document.getElementById("totalCodingBar");
  const readingBarEl = document.getElementById("totalReadingBar");
  const writingBarEl = document.getElementById("totalWritingBar");

  if (!totalEl || !codingEl || !readingEl || !writingEl) {
    return;
  }

  const { coding, reading, writing } = state.todayMinutes;
  const {
    coding: codingGoal,
    reading: readingGoal,
    writing: writingGoal,
  } = state.goals;

  const totalMinutes = coding + reading + writing;
  const base = 360;
  const cappedTotal = Math.min(totalMinutes, base);
  const totalPercent = Math.min(Math.round((totalMinutes / base) * 100), 999);

  const totalMessage = getTotalMessage(totalMinutes);
  const codingMessage = getModeMessage("coding", coding, codingGoal);
  const readingMessage = getModeMessage("reading", reading, readingGoal);
  const writingMessage = getModeMessage("writing", writing, writingGoal);

  // --- 計算三段寬度（百分比） ---
  let codingWidth = 0;
  let readingWidth = 0;
  let writingWidth = 0;

  if (totalMinutes <= base) {
    // 情境 1：未超過今日目標，直接用「自己 / 360」
    codingWidth = (coding / base) * 100;
    readingWidth = (reading / base) * 100;
    writingWidth = (writing / base) * 100;
  } else {
    // 情境 2：超過 360，改用「自己 / 總分鐘」比例，整條滿 100%
    const safeTotal = totalMinutes || 1; // 避免 0 分鐘除以 0
    codingWidth = (coding / safeTotal) * 100;
    readingWidth = (reading / safeTotal) * 100;
    writingWidth = (writing / safeTotal) * 100;
  }

  codingBarEl.style.width = `${codingWidth}%`;
  readingBarEl.style.width = `${readingWidth}%`;
  writingBarEl.style.width = `${writingWidth}%`;

  // ✅ 進度條中央的文字：總分鐘 + 百分比
  totalLabelEl.textContent = `${totalMinutes} 分鐘・${totalPercent}%`;

  // ✅ 底下只顯示 Doraemon 台詞，不再重複數字
  totalEl.textContent = `${totalMessage}`;

  // 各圈圈卡片下方：顯示專屬台詞
  codingEl.textContent = `${codingMessage}`;
  readingEl.textContent = `${readingMessage}`;
  writingEl.textContent = `${writingMessage}`;
}

/**
 * 渲染當日卡片內容
 * @param {string} dateStr - 格式：YYYY-MM-DD
 */
async function renderDayCard(dateStr) {
  // 顯示行事曆按鈕（回到日檢視時需要）
  const calendarBtn = document.getElementById('dayCardCalendarToggle');
  if (calendarBtn) {
    calendarBtn.style.display = 'flex';
  }
  // 呼叫 API 取得該日資料
  const res = await fetch(
    `${API_BASE}/api/progress?date=${encodeURIComponent(dateStr)}`,
    { headers: buildHeaders() }
  );

  if (!res.ok) throw new Error("無法取得該日紀錄");

  const data = await res.json();

  const codingMinutes = Number(data.codingMinutes) || 0;
  const readingMinutes = Number(data.readingMinutes) || 0;
  const writingMinutes = Number(data.writingMinutes) || 0;
  const note = data.note || "（無筆記）";

  // 格式化日期顯示
  const dateObj = new Date(dateStr + "T00:00:00");
  const month = dateObj.getMonth() + 1;
  const date = dateObj.getDate();
  const dayIndex = dateObj.getDay();
  const days = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];
  const dateLabel = `${month} 月 ${date} 日（${days[dayIndex]}）`;

  // 計算完成度
  const codingP =
    state.goals.coding > 0
      ? Math.min(codingMinutes / state.goals.coding, 1)
      : 0;
  const readingP =
    state.goals.reading > 0
      ? Math.min(readingMinutes / state.goals.reading, 1)
      : 0;
  const writingP =
    state.goals.writing > 0
      ? Math.min(writingMinutes / state.goals.writing, 1)
      : 0;

  const codingDeg = codingP * 360;
  const readingDeg = readingP * 360;
  const writingDeg = writingP * 360;

  // 填入 HTML
  dayCardContent.innerHTML = `
    <div class="day-card-header">
    <div class="day-card-header-left">
      <div class="day-card-date">${dateLabel}</div>
      <div class="day-card-subtitle">今日練習圈圈</div>
    </div>
  </div>

  <div class="day-card-main">
    <div class="day-card-rings">
  <div class="day-card-rings-outer" style="--ring-percent: ${codingDeg}deg;"></div>
  <div class="day-card-rings-middle" style="--ring-percent: ${readingDeg}deg;"></div>
  <div class="day-card-rings-inner" style="--ring-percent: ${writingDeg}deg;"></div>
  <div class="day-card-rings-center"></div>
</div>

    <div class="day-card-text">
      <div class="day-card-row day-card-row-coding">
        <span class="day-card-label">刷題 Coding</span>
        <span class="day-card-value">${codingMinutes} / ${state.goals.coding} 分鐘</span>
      </div>
      <div class="day-card-row day-card-row-reading">
        <span class="day-card-label">閱讀 Reading</span>
        <span class="day-card-value">${readingMinutes} / ${state.goals.reading} 分鐘</span>
      </div>
      <div class="day-card-row day-card-row-writing">
        <span class="day-card-label">筆記 Writing</span>
        <span class="day-card-value">${writingMinutes} / ${state.goals.writing} 分鐘</span>
      </div>
    </div>
  </div>

  <div class="day-card-note">
    <div class="day-card-note-title">📝 當日筆記</div>
    <div class="day-card-note-body">${note}</div>
  </div>

  <div class="day-card-nav">
    <button id="dayCardPrev" class="secondary-button">← 前一天</button>
    <button id="dayCardNext" class="secondary-button">後一天 →</button>
  </div>
`;

// 綁定事件
const prevBtn = document.getElementById('dayCardPrev');
const nextBtn = document.getElementById('dayCardNext');

if (prevBtn) prevBtn.addEventListener('click', showPrevDay);
if (nextBtn) nextBtn.addEventListener('click', showNextDay);

  // 更新導航按鈕狀態
  updateDayCardNav(dateStr);

}

/**
 * 更新導航按鈕狀態（前一天/後一天）
 * @param {string} dateStr - 格式：YYYY-MM-DD
 */
function updateDayCardNav(dateStr) {
  const prevBtn = document.getElementById('dayCardPrev');
  const nextBtn = document.getElementById('dayCardNext');

  // 若目前不是日檢視（按鈕不存在），就不用處理
  if (!prevBtn || !nextBtn) {
    return;
  }

  const today = getTodayString();

  // 先確保 recentRecords 依日期由新到舊排序
  if (Array.isArray(state.recentRecords) && state.recentRecords.length > 0) {
    state.recentRecords.sort((a, b) => (a.date > b.date ? -1 : 1));
  }

  const dates = Array.isArray(state.recentRecords)
    ? state.recentRecords.map((r) => r.date)
    : [];

  const earliestDate = dates.length ? dates[dates.length - 1] : dateStr;

  // 字串 YYYY-MM-DD 可以直接安全比較
  prevBtn.disabled = dateStr <= earliestDate;
  nextBtn.disabled = dateStr >= today;
}


function shiftDateString(dateStr, offsetDays) {
  const [y, m, d] = dateStr.split('-').map((v) => Number(v));
  const base = new Date(y, m - 1, d);
  base.setDate(base.getDate() + offsetDays);
  const yyyy = base.getFullYear();
  const mm = String(base.getMonth() + 1).padStart(2, '0');
  const dd = String(base.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

async function showPrevDay() {
  if (!currentViewDate) return;

  const prev = shiftDateString(currentViewDate, -1);

  currentViewDate = prev;
  await renderDayCard(prev);
}

async function showNextDay() {
  if (!currentViewDate) return;

  const next = shiftDateString(currentViewDate, 1);

  currentViewDate = next;
  await renderDayCard(next);
}

function renderMonthView() {
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth(); // 0-based

  const monthLabel = `${year} 年 ${month + 1} 月`;

  // 當月第一天是星期幾（週一為 1，週日為 7）
  const firstDay = new Date(year, month, 1);
  let startWeekday = firstDay.getDay(); // 0(日)~6(六)
  startWeekday = startWeekday === 0 ? 7 : startWeekday; // 改成 1~7，週一=1

  // 當月天數
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells = [];

  // 前面補上個月的尾巴
  for (let i = startWeekday - 2; i >= 0; i -= 1) {
    const day = daysInPrevMonth - i;
    const cellDate = new Date(year, month - 1, day);
    cells.push({ date: cellDate, inMonth: false });
  }

  // 本月
  for (let d = 1; d <= daysInMonth; d += 1) {
    const cellDate = new Date(year, month, d);
    cells.push({ date: cellDate, inMonth: true });
  }

  // 後面補下個月開頭，湊滿 6 列 * 7 欄 = 42 格
  while (cells.length < 42) {
    const last = cells[cells.length - 1].date;
    const next = new Date(last);
    next.setDate(last.getDate() + 1);
    cells.push({ date: next, inMonth: false });
  }

  // 把 recentRecords 變成以 YYYY-MM-DD 為 key 的 map，方便查詢
  const recordMap = {};
  state.recentRecords.forEach((r) => {
    recordMap[r.date] = r;
  });

  // 產生星期標題
  const weekHeaderHtml = `
    <div class="month-week-row">
      <div>一</div>
      <div>二</div>
      <div>三</div>
      <div>四</div>
      <div>五</div>
      <div>六</div>
      <div>日</div>
    </div>
  `;

  // 日期格子
  let gridHtml = '<div class="month-grid">';
  cells.forEach(({ date, inMonth }) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const key = `${yyyy}-${mm}-${dd}`;
    const displayDay = date.getDate();

    const rec = recordMap[key];

    const codingMinutes = rec ? Number(rec.codingMinutes) || 0 : 0;
    const readingMinutes = rec ? Number(rec.readingMinutes) || 0 : 0;
    const writingMinutes = rec ? Number(rec.writingMinutes) || 0 : 0;

    const codingP =
      state.goals.coding > 0
        ? Math.min(codingMinutes / state.goals.coding, 1)
        : 0;
    const readingP =
      state.goals.reading > 0
        ? Math.min(readingMinutes / state.goals.reading, 1)
        : 0;
    const writingP =
      state.goals.writing > 0
        ? Math.min(writingMinutes / state.goals.writing, 1)
        : 0;

    const codingDeg = codingP * 360;
    const readingDeg = readingP * 360;
    const writingDeg = writingP * 360;

    gridHtml += `
      <div class="month-cell ${inMonth ? '' : 'month-cell-outside'}" data-date="${key}">
        <div class="month-cell-day">${displayDay}</div>
        <div class="month-cell-rings">
          <div class="month-ring-outer" style="--ring-percent: ${codingDeg}deg;"></div>
          <div class="month-ring-middle" style="--ring-percent: ${readingDeg}deg;"></div>
          <div class="month-ring-inner" style="--ring-percent: ${writingDeg}deg;"></div>
          <div class="month-ring-center"></div>
        </div>
      </div>
    `;
  });
  gridHtml += '</div>';

dayCardContent.innerHTML = `
  <div class="month-view-header">
    <button class="day-card-calendar-button" id="monthBackToDay" aria-label="回到日檢視">←</button>
    <div class="month-view-title">${monthLabel}</div>
    <div></div>
  </div>
  ${weekHeaderHtml}
  ${gridHtml}
  <div class="month-view-nav">
    <button id="monthPrevBtn" class="secondary-button">← 上月</button>
    <button id="monthNextBtn" class="secondary-button">下月 →</button>
  </div>
`;

  // 綁定事件：返回日檢視 / 上月 / 下月 / 點日期
  const backBtn = document.getElementById('monthBackToDay');
  const prevBtn = document.getElementById('monthPrevBtn');
  const nextBtn = document.getElementById('monthNextBtn');

  if (backBtn) {
    backBtn.addEventListener('click', () => {
      // 回到目前 currentViewDate 的日檢視
      if (currentViewDate) {
        renderDayCard(currentViewDate);
      }
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      currentMonthDate = new Date(year, month - 1, 1);
      renderMonthView();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      currentMonthDate = new Date(year, month + 1, 1);
      renderMonthView();
    });
  }

  document.querySelectorAll('.month-cell').forEach((cell) => {
    cell.addEventListener('click', () => {
      const dateStr = cell.dataset.date;
      if (!dateStr) return;
      // 更新目前查看日期並回到日檢視卡片
      currentViewDate = dateStr;
      renderDayCard(dateStr);
    });
  });

  function attachMonthSwipeHandlers() {
  const contentEl = document.querySelector('.month-grid')
  if (!contentEl) return;

  let touchStartY = 0;
  let touchEndY = 0;
  const SWIPE_THRESHOLD = 50; // 觸發最小距離（px）

  function handleTouchStart(e) {
    if (!e.changedTouches || e.changedTouches.length === 0) return;
    touchStartY = e.changedTouches[0].clientY;
  }

  function handleTouchEnd(e) {
    if (!e.changedTouches || e.changedTouches.length === 0) return;
    touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchEndY - touchStartY;

    // 僅在螢幕較窄時啟用（手機）
    if (window.innerWidth > 768) return;

    // 向上滑（往上拖） → 下一個月
    if (deltaY < -SWIPE_THRESHOLD) {
      const nextBtn = document.getElementById('monthNextBtn');
      if (nextBtn) nextBtn.click();
    }

    // 向下滑 → 上一個月
    if (deltaY > SWIPE_THRESHOLD) {
      const prevBtn = document.getElementById('monthPrevBtn');
      if (prevBtn) prevBtn.click();
    }
  }

  contentEl.addEventListener('touchstart', handleTouchStart, { passive: true });
  contentEl.addEventListener('touchend', handleTouchEnd, { passive: true });
}
  attachMonthSwipeHandlers();
}

// === 初始化 ===
async function init() {
  try {
    if (!state.isAuthenticated) {
      // 還沒登入，只顯示登入區
      loadingEl.style.display = "none";
      loginSectionEl.style.display = "block";
      appSectionEl.style.display = "none";
      return;
    }

    state.currentDate = getTodayString();
    await fetchSettings();
    await fetchTodayProgress();
    await fetchRecentProgress(7);
    renderAll();
    renderEncouragement(); // ✅ 根據目前 todayMinutes + goals 顯示文案

    loadingEl.style.display = "none";
    loginSectionEl.style.display = "none";
    appSectionEl.style.display = "block";
  } catch (err) {
    console.error(err);
    loadingEl.style.display = "none";
    showToast("初始化失敗，請重新整理或檢查登入狀態");
  }
}

// === 事件綁定 ===
// 按鈕點擊登入
loginButton.addEventListener("click", async () => {
  const pwd = loginPasswordInput.value.trim();
  if (!pwd) {
    showToast("請先輸入密碼");
    return;
  }

  // 一開始就打開 loading、隱藏其它區塊
  loadingEl.style.display = "flex";
  loginSectionEl.style.display = "none";
  if (appSectionEl) {
    appSectionEl.style.display = "none";
  }

  try {
    await login(pwd); // 設定 state.token, state.isAuthenticated
    await init(); // 由 init 來關閉 loading、顯示 app 或登入區
  } catch (err) {
    console.error(err);

    // 登入或初始化失敗 → 關掉 loading、回登入畫面
    loadingEl.style.display = "none";
    loginSectionEl.style.display = "block";
    if (appSectionEl) {
      appSectionEl.style.display = "none";
    }

    showToast("登入失敗，請確認密碼是否正確");
    state.isAuthenticated = false;
    state.token = "";
  } finally {
    loginPasswordInput.value = "";
  }
});

// 按 Enter 登入
loginPasswordInput.addEventListener("keydown", async (event) => {
  if (event.key !== "Enter") return;

  event.preventDefault();
  const pwd = loginPasswordInput.value.trim();
  if (!pwd) {
    showToast("請先輸入密碼");
    return;
  }

  loadingEl.style.display = "flex";
  loginSectionEl.style.display = "none";
  if (appSectionEl) {
    appSectionEl.style.display = "none";
  }

  try {
    await login(pwd);
    await init();
  } catch (err) {
    console.error(err);

    loadingEl.style.display = "none";
    loginSectionEl.style.display = "block";
    if (appSectionEl) {
      appSectionEl.style.display = "none";
    }

    showToast("登入失敗，請確認密碼是否正確");
    state.isAuthenticated = false;
    state.token = "";
  } finally {
    loginPasswordInput.value = "";
  }
});

modeCodingButton.addEventListener("click", () => setMode("coding"));
modeReadingButton.addEventListener("click", () => setMode("reading"));
modeWritingButton.addEventListener("click", () => setMode("writing"));

timerStartButton.addEventListener("click", startTimer);
timerPauseButton.addEventListener("click", pauseOrStopTimer);
timerResetButton.addEventListener("click", resetTimerOnly);

todayNoteEl.addEventListener("input", (e) => {
  state.note = e.target.value;
  updateSaveButtonLabel();
});

saveTodayButton.addEventListener("click", async () => {
  try {
    // 若有未結束/暫停的計時，先結束並累加
    if (state.timerRunning || state.timerPausedElapsedMs > 0) {
      pauseOrStopTimer();
    }
    await saveTodayFull();
    await fetchRecentProgress(7);
    renderHistory();

    showToast("今天的修煉已儲存 ✨");
  } catch (err) {
    console.error(err);
    showToast("儲存失敗，請稍後再試");
  }
});

codingAddTimeButton.addEventListener("click", () => {
  addManualTime("coding", codingStartTimeInput.value, codingEndTimeInput.value);
});

readingAddTimeButton.addEventListener("click", () => {
  addManualTime(
    "reading",
    readingStartTimeInput.value,
    readingEndTimeInput.value
  );
});

writingAddTimeButton.addEventListener("click", () => {
  addManualTime(
    "writing",
    writingStartTimeInput.value,
    writingEndTimeInput.value
  );
});

// 檢視歷史單日記錄卡片 modal
dayCardClose.addEventListener("click", closeDayCard);

// 點擊遮罩關閉
dayCardModal.addEventListener("click", (e) => {
  if (e.target === dayCardModal) {
    closeDayCard();
  }
});

// 切換月檢視卡片
if (dayCardCalendarToggle) {
  dayCardCalendarToggle.addEventListener('click', () => {
    if (currentViewDate) {
      openMonthView(currentViewDate);
    } else {
      openMonthView(state.currentDate); // 退而求其次用今天
    }
  });
}


document.addEventListener("DOMContentLoaded", init);
