const STATUS_INFO = {
  normal: {
    label: "通常運行（2台）",
    color: "var(--normal)",
    note: "通常授業開講日および試験期間のダイヤです。",
    busType: "2便",
  },
  hino_full: {
    label: "日野デー臨時便（終日）",
    color: "var(--hino-full)",
    note: "水曜日は日野デー臨時便を終日運行します。",
    busType: "3台",
  },
  hino_pm: {
    label: "日野デー臨時便（午後のみ）",
    color: "var(--hino-pm)",
    note: "木曜日は日野デー臨時便を午後のみ運行します。",
    busType: "3台",
  },
  one_bus: {
    label: "集中講義期間（1台）",
    color: "var(--one-bus)",
    note: "集中授業日や補講期間のダイヤです。",
    busType: "1台",
  },
  no_service: {
    label: "運休日（運行なし）",
    color: "var(--no-service)",
    busType: "運休",
  },
};

const DATA_PATHS = {
  schedule: "data/schedule.json",
  patterns: "data/patterns.json",
};

const todayDate = document.getElementById("today-date");
const todayStatus = document.getElementById("today-status");
const todayNote = document.getElementById("today-note");
const nextFromMinami = document.getElementById("next-from-minami");
const nextFromHino = document.getElementById("next-from-hino");
const timetableDescription = document.getElementById("timetable-description");
const timetableWrapper = document.getElementById("timetable-wrapper");
const datePicker = document.getElementById("selected-date");
const resetDateButton = document.getElementById("reset-date");

const patternCache = {};
let rawPatternDefinitions = {};
let scheduleData = {};
let displayRange = { min: "2025-10-01", max: "2026-02-28" };
let dataLoaded = false;
let currentDisplayDate = new Date();

function pad(num) {
  return String(num).padStart(2, "0");
}

function toKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

function toInputValue(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

async function fetchJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load ${url}: ${response.status}`);
  }
  return response.json();
}

function sanitizeTimeValue(value) {
  if (!value) {
    return "";
  }
  const normalised = String(value)
    .trim()
    .replace(/[；;]/g, ":");
  const match = normalised.match(/^(\d{1,2}):(\d{1,2})$/);
  if (!match) {
    return "";
  }
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return "";
  }
  return `${hour}:${pad(minute)}`;
}

function sanitizeTimeList(list) {
  if (!Array.isArray(list)) {
    return [];
  }
  return list
    .map(sanitizeTimeValue)
    .filter(Boolean);
}

function parseTimeToMinutes(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function mergeTimes(...lists) {
  const unique = new Set();
  lists
    .flat()
    .filter(Boolean)
    .forEach((time) => unique.add(time));
  return Array.from(unique).sort((a, b) => parseTimeToMinutes(a) - parseTimeToMinutes(b));
}

function clearTimetableWrapper() {
  if (timetableWrapper) {
    timetableWrapper.innerHTML = "";
  }
}

function renderMessageCard(primary, secondary) {
  if (!timetableWrapper) {
    return;
  }
  const card = document.createElement("article");
  card.className = "timetable-card timetable-card--message";

  if (primary) {
    const primaryEl = document.createElement("p");
    primaryEl.className = "message-primary";
    primaryEl.textContent = primary;
    card.appendChild(primaryEl);
  }

  if (secondary) {
    const secondaryEl = document.createElement("p");
    secondaryEl.className = "message-secondary";
    secondaryEl.textContent = secondary;
    card.appendChild(secondaryEl);
  }

  timetableWrapper.appendChild(card);
}

function renderLoadingState(targetDate) {
  const referenceDate = targetDate ?? currentDisplayDate;
  todayDate.textContent = formatDateLabel(referenceDate);
  todayStatus.textContent = "データ読み込み中…";
  todayNote.textContent = "";
  nextFromMinami.textContent = "-";
  nextFromHino.textContent = "-";
  timetableDescription.textContent = "";
  clearTimetableWrapper();
  renderMessageCard("データを読み込み中です…");
}

function renderDataLoadError() {
  dataLoaded = false;
  todayStatus.textContent = "データの読み込みに失敗しました";
  todayNote.textContent = "ネットワーク環境を確認し、再読み込みしてください。";
  nextFromMinami.textContent = "-";
  nextFromHino.textContent = "-";
  timetableDescription.textContent = "";
  clearTimetableWrapper();
  renderMessageCard("データの取得に失敗しました。", "ページを再読み込みしてください。");
}

function normalizePatterns(patterns) {
  const normalised = {};
  Object.entries(patterns ?? {}).forEach(([key, value]) => {
    if (!value || typeof value !== "object") {
      return;
    }
    normalised[key] = {
      description: value.description ?? "",
      notes: value.notes ?? "",
      minami_to_hino: Array.isArray(value.minami_to_hino) ? value.minami_to_hino : [],
      hino_to_minami: Array.isArray(value.hino_to_minami) ? value.hino_to_minami : [],
    };
  });
  return normalised;
}

function computeDisplayRangeFromMonths(months) {
  if (!months.length) {
    return null;
  }
  const sorted = months
    .map(({ year, month }) => ({ year, month }))
    .sort((a, b) => (a.year === b.year ? a.month - b.month : a.year - b.year));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const minDate = new Date(first.year, first.month - 1, 1);
  const maxDate = new Date(last.year, last.month, 0);
  return {
    min: toInputValue(minDate),
    max: toInputValue(maxDate),
  };
}

function normalizeSchedule(schedule) {
  const normalised = {};
  const months = [];

  Object.entries(schedule ?? {}).forEach(([monthKey, days]) => {
    if (typeof monthKey !== "string") {
      return;
    }
    const [yearStr, monthStr] = monthKey.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);
    if (!Number.isFinite(year) || !Number.isFinite(month)) {
      return;
    }

    const cleanedDays = {};
    Object.entries(days ?? {}).forEach(([dayKey, status]) => {
      const day = Number(dayKey);
      if (!Number.isFinite(day) || !status) {
        return;
      }
      cleanedDays[String(day)] = status;
    });

    const normalizedMonthKey = `${year}-${pad(month)}`;
    normalised[normalizedMonthKey] = cleanedDays;
    months.push({ year, month });
  });

  return {
    schedule: normalised,
    range: computeDisplayRangeFromMonths(months),
  };
}

function applyDisplayRange() {
  if (!datePicker) {
    return;
  }
  datePicker.min = displayRange.min;
  datePicker.max = displayRange.max;
}

function setPatternDefinitions(definitions) {
  rawPatternDefinitions = definitions;
  Object.keys(patternCache).forEach((key) => {
    delete patternCache[key];
  });
}

function getPattern(key) {
  if (patternCache[key]) {
    return patternCache[key];
  }
  const definition = rawPatternDefinitions[key];
  if (!definition) {
    return null;
  }
  const pattern = {
    description: definition.description ?? "",
    notes: definition.notes ?? "",
    minamiToHino: mergeTimes(sanitizeTimeList(definition.minami_to_hino)),
    hinoToMinami: mergeTimes(sanitizeTimeList(definition.hino_to_minami)),
  };
  patternCache[key] = pattern;
  return pattern;
}

function getStatusForDate(date) {
  const key = toKey(date);
  const map = scheduleData[key];
  const dayKey = String(date.getDate());
  const weekday = date.getDay();

  if (map && map[dayKey]) {
    return map[dayKey];
  }

  if (map && (weekday === 0 || weekday === 6)) {
    return "no_service";
  }

  return map ? "no_service" : null;
}

function formatDateLabel(date) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(date);
}

function findNextBus(statusKey, directionKey, targetDate) {
  const pattern = getPattern(statusKey);
  if (!pattern) return null;

  const list = pattern[directionKey];
  if (!list || list.length === 0) return null;

  const today = new Date();
  if (!isSameDay(targetDate, today)) {
    return { type: "scheduled", time: list[0] };
  }

  const minutesNow = today.getHours() * 60 + today.getMinutes();
  const upcoming = list.find((time) => parseTimeToMinutes(time) >= minutesNow);
  if (upcoming) {
    return { type: "today", time: upcoming };
  }
  return { type: "ended", time: list[0] };
}

function describeNextBus(result, statusKey) {
  if (!result) {
    if (statusKey === "no_service") {
      return "運行予定なし";
    }
    return "時刻表の情報が見つかりません";
  }
  if (result.type === "today") {
    return `${result.time} 発予定`;
  }
  if (result.type === "scheduled") {
    return `始発 ${result.time}`;
  }
  return `本日の運行は終了しました（始発 ${result.time}）`;
}

function renderTodayTimetable(statusKey, isToday) {
  clearTimetableWrapper();

  if (!statusKey) {
    timetableDescription.textContent = "提供期間外の日付のため時刻表は表示できません。";
    renderMessageCard("資料に時刻表がありません。", "提供期間内の日付を選択してください。");
    return;
  }

  if (statusKey === "no_service") {
    timetableDescription.textContent = isToday
      ? "本日は運休日のためバスは運行しません。"
      : "選択した日は運休日のためバスは運行しません。";
    renderMessageCard("運休日です", "次回の運行日にご利用ください。");
    return;
  }

  const pattern = getPattern(statusKey);
  if (!pattern) {
    timetableDescription.textContent = "該当する時刻表情報がありません。";
    renderMessageCard("時刻表データが見つかりません。", "管理者にお問い合わせください。");
    return;
  }

  const statusInfo = STATUS_INFO[statusKey];
  const descriptionPieces = [statusInfo?.label, pattern.description].filter(Boolean);
  timetableDescription.textContent = descriptionPieces.join(" / ") || statusKey;

  const card = document.createElement("article");
  card.className = "timetable-card";

  const header = document.createElement("header");
  const title = document.createElement("h3");
  title.textContent = statusInfo?.label ?? statusKey;
  header.appendChild(title);

  const badge = document.createElement("span");
  badge.className = "badge";
  badge.style.backgroundColor = statusInfo?.color ?? "var(--bg-secondary)";
  badge.textContent = statusInfo?.busType ?? statusKey;
  header.appendChild(badge);

  card.appendChild(header);

  if (pattern.description) {
    const desc = document.createElement("p");
    desc.className = "notes";
    desc.textContent = pattern.description;
    card.appendChild(desc);
  }

  const notePieces = [statusInfo?.note, pattern.notes]
    .filter(Boolean)
    .filter((value, index, array) => array.indexOf(value) === index);
  if (notePieces.length) {
    const note = document.createElement("p");
    note.className = "notes";
    note.textContent = notePieces.join(" / ");
    card.appendChild(note);
  }

  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  ["便", "南大沢 → 日野", "日野 → 南大沢"].forEach((text) => {
    const th = document.createElement("th");
    th.textContent = text;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  const maxRows = Math.max(pattern.minamiToHino.length, pattern.hinoToMinami.length);

  if (maxRows === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 3;
    td.textContent = "本日の運行便はありません";
    tr.appendChild(td);
    tbody.appendChild(tr);
  } else {
    for (let i = 0; i < maxRows; i += 1) {
      const tr = document.createElement("tr");

      const indexCell = document.createElement("td");
      indexCell.textContent = `${i + 1}`;
      tr.appendChild(indexCell);

      const minamiCell = document.createElement("td");
      minamiCell.textContent = pattern.minamiToHino[i] ?? "-";
      tr.appendChild(minamiCell);

      const hinoCell = document.createElement("td");
      hinoCell.textContent = pattern.hinoToMinami[i] ?? "-";
      tr.appendChild(hinoCell);

      tbody.appendChild(tr);
    }
  }

  table.appendChild(tbody);
  card.appendChild(table);
  timetableWrapper.appendChild(card);
}

function renderForDate(targetDate) {
  todayDate.textContent = formatDateLabel(targetDate);

  if (!dataLoaded) {
    renderLoadingState(targetDate);
    return;
  }

  const statusKey = getStatusForDate(targetDate);
  const statusInfo = statusKey ? STATUS_INFO[statusKey] : null;
  const today = new Date();
  const isToday = isSameDay(targetDate, today);

  if (!statusKey) {
    todayStatus.textContent = "資料に運行情報がありません";
    todayNote.textContent = "提供されている期間外の日付です。";
    nextFromMinami.textContent = "-";
    nextFromHino.textContent = "-";
    renderTodayTimetable(statusKey, isToday);
    return;
  }

  todayStatus.textContent = statusInfo?.label ?? statusKey;
  if (statusInfo?.note) {
    todayNote.textContent = statusInfo.note;
  } else if (statusKey === "no_service") {
    todayNote.textContent = isToday ? "本日は運休日です。" : "選択した日は運休日です。";
  } else {
    todayNote.textContent = isToday ? "" : "選択した日の運行予定を表示しています。";
  }

  nextFromMinami.textContent = describeNextBus(
    findNextBus(statusKey, "minamiToHino", targetDate),
    statusKey
  );
  nextFromHino.textContent = describeNextBus(
    findNextBus(statusKey, "hinoToMinami", targetDate),
    statusKey
  );

  renderTodayTimetable(statusKey, isToday);
}

function clampToRange(date) {
  const min = new Date(displayRange.min);
  const max = new Date(displayRange.max);

  if (date < min) return new Date(min);
  if (date > max) return new Date(max);
  return date;
}

function initDatePicker(initialDate) {
  if (!datePicker) return;

  applyDisplayRange();
  datePicker.value = toInputValue(initialDate);

  datePicker.addEventListener("change", () => {
    if (!datePicker.value) {
      return;
    }
    currentDisplayDate = clampToRange(new Date(datePicker.value));
    datePicker.value = toInputValue(currentDisplayDate);
    renderForDate(currentDisplayDate);
  });
}

async function loadData() {
  try {
    const [scheduleJson, patternJson] = await Promise.all([
      fetchJson(DATA_PATHS.schedule),
      fetchJson(DATA_PATHS.patterns),
    ]);

    const { schedule, range } = normalizeSchedule(scheduleJson);
    scheduleData = schedule;

    const patterns = normalizePatterns(patternJson);
    setPatternDefinitions(patterns);

    if (range) {
      displayRange = range;
      applyDisplayRange();
    }

    currentDisplayDate = clampToRange(currentDisplayDate);
    if (datePicker) {
      datePicker.value = toInputValue(currentDisplayDate);
    }

    dataLoaded = true;
    renderForDate(currentDisplayDate);
  } catch (error) {
    console.error(error);
    renderDataLoadError();
  }
}

function init() {
  currentDisplayDate = clampToRange(new Date());
  initDatePicker(currentDisplayDate);

  if (resetDateButton) {
    resetDateButton.addEventListener("click", () => {
      currentDisplayDate = clampToRange(new Date());
      if (datePicker) {
        datePicker.value = toInputValue(currentDisplayDate);
      }
      renderForDate(currentDisplayDate);
    });
  }

  renderLoadingState(currentDisplayDate);
  loadData();
}

document.addEventListener("DOMContentLoaded", init);
