// 基本設定：本機 node 測試時用 http://localhost:3000 
// 如果後端在 Zeabur，改成例如：'https://practice-rings-api.zeabur.app'
const API_BASE = 'https://practice-rings-backend.zeabur.app';

// 全域狀態
const state = {
  currentDate: '',
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
  note: '',
  recentRecords: [],
};

// DOM 取得
const loadingEl = document.getElementById('loading');
const mainContentEl = document.getElementById('mainContent');
const headerDateEl = document.getElementById('headerDate');

const modeCodingButton = document.getElementById('modeCodingButton');
const modeReadingButton = document.getElementById('modeReadingButton');
const modeWritingButton = document.getElementById('modeWritingButton');

const currentModeLabelEl = document.getElementById('currentModeLabel');
const timerClockEl = document.getElementById('timerClock');
const timerStartButton = document.getElementById('timerStartButton');
const timerPauseButton = document.getElementById('timerPauseButton');
const timerResetButton = document.getElementById('timerResetButton');

const codingTextEl = document.getElementById('codingText');
const readingTextEl = document.getElementById('readingText');
const writingTextEl = document.getElementById('writingText');

const codingMinutesDisplayEl = document.getElementById('codingMinutesDisplay');
const readingMinutesDisplayEl = document.getElementById('readingMinutesDisplay');
const writingMinutesDisplayEl = document.getElementById('writingMinutesDisplay');

const todayNoteEl = document.getElementById('todayNote');
const saveTodayButton = document.getElementById('saveTodayButton');

const historyListEl = document.getElementById('historyList');

// 日期字串：YYYY-MM-DD
function getTodayString() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Header 顯示今天日期
function renderHeaderDate() {
  const d = new Date();
  const month = d.getMonth() + 1;
  const date = d.getDate();
  const dayIndex = d.getDay();
  const days = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
  headerDateEl.textContent = `${month} 月 ${date} 日（${days[dayIndex]}）`;
}

// 格式化時間 HH:MM:SS
function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const s = String(totalSeconds % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

// === API 呼叫 ===
async function fetchSettings() {
  const res = await fetch(`${API_BASE}/api/settings`);
  if (!res.ok) throw new Error('無法取得設定');
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
  );
  if (!res.ok) throw new Error('無法取得今日進度');
  const data = await res.json();
  state.todayMinutes = {
    coding: Number(data.codingMinutes) || 0,
    reading: Number(data.readingMinutes) || 0,
    writing: Number(data.writingMinutes) || 0,
  };
  state.note = data.note || '';
}

async function fetchRecentProgress(days = 7) {
  const res = await fetch(
    `${API_BASE}/api/progress/recent?days=${encodeURIComponent(days)}`,
  );
  if (!res.ok) throw new Error('無法取得歷史紀錄');
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
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error('儲存失敗');
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
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error('儲存時間失敗');
}


function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.style.display = 'block';
  setTimeout(() => {
    toast.style.display = 'none';
  }, 3000);
}


// === 模式與計時器邏輯 ===
function modeLabel(mode) {
  if (mode === 'coding') return '刷題 Coding';
  if (mode === 'reading') return '閱讀 Reading';
  if (mode === 'writing') return '筆記 Writing';
  return '尚未開始';
}

function highlightModeButtons() {
  const buttons = [modeCodingButton, modeReadingButton, modeWritingButton];
  buttons.forEach((btn) => {
    const mode = btn.dataset.mode;
    if (mode === state.currentMode) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
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
  timerClockEl.textContent = '00:00:00';
  timerPauseButton.textContent = '暫停 Pause';
  highlightModeButtons();
}

// 開始計時
function startTimer() {
  if (!state.currentMode) {
    alert('請先選擇一個模式');
    return;
  }
  if (state.timerRunning) {
    return;
  }
  state.timerRunning = true;
  state.timerStartTime = Date.now();
  state.timerIntervalId = setInterval(updateTimerDisplay, 1000);
  timerPauseButton.textContent = '暫停 Pause';
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
  if (!state.currentMode && !state.timerRunning && state.timerPausedElapsedMs === 0) {
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
    timerPauseButton.textContent = '結束 Stop'; // 下一次按下去會結束
    return;
  }

  // 已暫停狀態 -> 結束並累加
  if (!state.timerRunning && state.currentMode && state.timerPausedElapsedMs > 0) {
    const elapsedMinutes = Math.floor(state.timerPausedElapsedMs / 60000);
    if (elapsedMinutes > 0) {
      state.todayMinutes[state.currentMode] += elapsedMinutes;
    }

    // 自動儲存目前累積時間（不含 note）
    saveTodayMinutesOnly().catch((err) => {
      console.error(err);
      showToast('自動儲存時間失敗，下次結束計時時會再試一次。');
    });

    // 重置計時狀態
    state.timerPausedElapsedMs = 0;
    state.currentMode = null;
    state.timerRunning = false;
    state.timerStartTime = null;
    clearInterval(state.timerIntervalId);
    state.timerIntervalId = null;

    timerClockEl.textContent = '00:00:00';
    currentModeLabelEl.textContent = '尚未開始';
    timerPauseButton.textContent = '暫停 Pause';
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
  timerClockEl.textContent = '00:00:00';
  currentModeLabelEl.textContent = '尚未開始';
  timerPauseButton.textContent = '暫停 Pause';
}

// === Render ===
function renderRings() {
  renderRing(
    'codingRing',
    'ring-coding',
    state.todayMinutes.coding,
    state.goals.coding,
  );
  renderRing(
    'readingRing',
    'ring-reading',
    state.todayMinutes.reading,
    state.goals.reading,
  );
  renderRing(
    'writingRing',
    'ring-writing',
    state.todayMinutes.writing,
    state.goals.writing,
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
  const trimmed = (state.note || '').trim();
  if (trimmed.length === 0) {
    saveTodayButton.textContent = '儲存今天 Save Today';
  } else {
    saveTodayButton.textContent = '修改並儲存 Update & Save';
  }
}


function renderTodayNumbers() {
  codingMinutesDisplayEl.textContent = `${state.todayMinutes.coding} 分鐘`;
  readingMinutesDisplayEl.textContent = `${state.todayMinutes.reading} 分鐘`;
  writingMinutesDisplayEl.textContent = `${state.todayMinutes.writing} 分鐘`;
  todayNoteEl.value = state.note || '';
  updateSaveButtonLabel();
}

function renderHistory() {
  historyListEl.innerHTML = '';
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

    const item = document.createElement('div');
    item.className = 'history-day';

    // 日期只顯示「MM-DD」比較不占空間
    let dateLabel = r.date || '';
    if (dateLabel.includes('-')) {
      const parts = dateLabel.split('-');
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
    state.currentDate = getTodayString();
    await fetchSettings();
    await fetchTodayProgress();
    await fetchRecentProgress(7);
    renderAll();
    loadingEl.style.display = 'none';
    mainContentEl.style.display = 'block';
  } catch (err) {
    console.error(err);
    loadingEl.style.display = 'none';
    alert('初始化失敗，請稍後再試');
  }
}

// === 事件綁定 ===
modeCodingButton.addEventListener('click', () => setMode('coding'));
modeReadingButton.addEventListener('click', () => setMode('reading'));
modeWritingButton.addEventListener('click', () => setMode('writing'));

timerStartButton.addEventListener('click', startTimer);
timerPauseButton.addEventListener('click', pauseOrStopTimer);
timerResetButton.addEventListener('click', resetTimerOnly);

todayNoteEl.addEventListener('input', (e) => {
  state.note = e.target.value;
  updateSaveButtonLabel();
});

saveTodayButton.addEventListener('click', async () => {
  try {
    // 若有未結束/暫停的計時，先結束並累加
    if (state.timerRunning || state.timerPausedElapsedMs > 0) {
      pauseOrStopTimer();
    }
    await saveTodayFull();
    await fetchRecentProgress(7);
    renderHistory();
    alert('今天的修煉已儲存 ✨');
  } catch (err) {
    console.error(err);
    alert('儲存失敗，請稍後再試');
  }
});

document.addEventListener('DOMContentLoaded', init);
