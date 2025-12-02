// 自動判斷環境：本機用 localhost API，其他（GitHub Pages / 手機）用 Zeabur
const isLocalhost = ['localhost', '127.0.0.1', '::1', ''].includes(
  window.location.hostname,
);

const API_BASE = isLocalhost
  ? 'http://localhost:3000'
  : 'https://practice-rings-backend.zeabur.app/';

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
};

// DOM 取得
const loginSectionEl = document.getElementById('loginSection');
const appSectionEl = document.getElementById('appSection');
const loginPasswordInput = document.getElementById('loginPassword');
const loginButton = document.getElementById('loginButton');

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
const codingStartTimeInput = document.getElementById('codingStartTime');
const codingEndTimeInput = document.getElementById('codingEndTime');
const codingAddTimeButton = document.getElementById('codingAddTimeButton');

const readingStartTimeInput = document.getElementById('readingStartTime');
const readingEndTimeInput = document.getElementById('readingEndTime');
const readingAddTimeButton = document.getElementById('readingAddTimeButton');

const writingStartTimeInput = document.getElementById('writingStartTime');
const writingEndTimeInput = document.getElementById('writingEndTime');
const writingAddTimeButton = document.getElementById('writingAddTimeButton');


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
  const [hh, mm] = value.split(':').map((v) => Number(v));
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
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password }),
  });

  if (!res.ok) {
    // 嘗試讀一下錯誤訊息（可選）
    let errorMessage = '登入失敗';
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
    throw new Error('登入失敗：缺少 token');
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
    `${API_BASE}/api/progress?date=${encodeURIComponent(state.currentDate)}`, {
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
  state.note = data.note || "";
}

async function fetchRecentProgress(days = 7) {
  const res = await fetch(
    `${API_BASE}/api/progress/recent?days=${encodeURIComponent(days)}`, {
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
    headers: buildHeaders({ 'Content-Type': 'application/json' }),
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
    headers: buildHeaders({ 'Content-Type': 'application/json' }),
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
    alert("請先選擇一個模式");
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
    showToast('請輸入有效時間（HH:MM）');
    return;
  }

  if (end <= start) {
    showToast('結束時間必須晚於開始時間');
    return;
  }

  const delta = end - start; // 差值就是分鐘數

  state.todayMinutes[mode] += delta;
  renderTodayNumbers();
  renderRings();

  try {
    await saveTodayMinutesOnly();
    showToast('已加入本日時間並自動儲存');
  } catch (err) {
    console.error(err);
    showToast('手動時間儲存失敗，下次操作時會再嘗試');
  }
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

    historyListEl.appendChild(item);
  });
}

function renderAll() {
  renderHeaderDate();
  renderTodayNumbers();
  renderRings();
  renderHistory();
}

// === 初始化 ===
async function init() {
  try {
    // 嘗試從 localStorage 恢復 token
    // const savedToken = localStorage.getItem('practiceRingsToken');
    // if (savedToken) {
    //   state.token = savedToken;
    //   state.isAuthenticated = true;
    // }

    if (!state.isAuthenticated) {
      // 還沒登入，只顯示登入區
      loadingEl.style.display = 'none';
      loginSectionEl.style.display = 'block';
      appSectionEl.style.display = 'none';
      return;
    }

    state.currentDate = getTodayString();
    await fetchSettings();
    await fetchTodayProgress();
    await fetchRecentProgress(7);
    renderAll();

    loadingEl.style.display = 'none';
    loginSectionEl.style.display = 'none';
    appSectionEl.style.display = 'block';
  } catch (err) {
    console.error(err);
    loadingEl.style.display = 'none';
    showToast('初始化失敗，請重新整理或檢查登入狀態');
  }
}

// === 事件綁定 ===
loginButton.addEventListener('click', async () => {
  const pwd = loginPasswordInput.value.trim();
  if (!pwd) {
    showToast('請先輸入密碼');
    return;
  }
  try {
    await login(pwd);
    await init();
  } catch (err) {
    console.error(err);
    showToast('登入失敗，請確認密碼是否正確');
  }
});

loginPasswordInput.addEventListener('keydown', async (event) => {
  if (event.key !== 'Enter') return;

  event.preventDefault(); // 避免預設行為
  const pwd = loginPasswordInput.value.trim();
  if (!pwd) {
    showToast('請先輸入密碼');
    return;
  }

  try {
    await login(pwd);
    await init();
  } catch (err) {
    console.error(err);
    showToast('登入失敗，請確認密碼是否正確');
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
    alert("今天的修煉已儲存 ✨");
  } catch (err) {
    console.error(err);
    alert("儲存失敗，請稍後再試");
  }
});

codingAddTimeButton.addEventListener('click', () => {
  addManualTime('coding', codingStartTimeInput.value, codingEndTimeInput.value);
});

readingAddTimeButton.addEventListener('click', () => {
  addManualTime('reading', readingStartTimeInput.value, readingEndTimeInput.value);
});

writingAddTimeButton.addEventListener('click', () => {
  addManualTime('writing', writingStartTimeInput.value, writingEndTimeInput.value);
});

document.addEventListener("DOMContentLoaded", init);
