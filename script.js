const STATUS_INFO = {
  normal: {
    label: "2便（通常授業開講日及び試験期間）",
    color: "var(--normal)",
    busType: "2便",
  },
  hino_full: {
    label: "3・4便（日野デー臨時便終日運行）",
    color: "var(--hino-full)",
    note: "水曜日のみ<日野デー>の臨時便が終日運行します。",
    busType: "3・4便",
  },
  hino_pm: {
    label: "3便（日野デー臨時便 午後便のみ運行）",
    color: "var(--hino-pm)",
    note: "水曜日のみ<日野デー>の臨時便が午後のみ運行します。",
    busType: "3便",
  },
  one_bus: {
    label: "1便（集中授業日および補講期間）",
    color: "var(--one-bus)",
    busType: "1便",
  },
  no_service: {
    label: "運休日（休業・休講日・土曜日等）",
    color: "var(--no-service)",
    busType: "運休日",
  },
};

const scheduleData = {
  "2025-10": {
    1: "hino_pm",
    2: "hino_full",
    3: "normal",
    6: "normal",
    7: "normal",
    8: "hino_pm",
    9: "hino_full",
    10: "normal",
    13: "normal",
    14: "normal",
    15: "hino_pm",
    16: "hino_full",
    17: "normal",
    20: "normal",
    21: "normal",
    22: "hino_pm",
    23: "hino_full",
    24: "normal",
    27: "normal",
    28: "normal",
    29: "hino_pm",
    30: "hino_full",
    31: "normal",
  },
  "2025-11": {
    3: "normal",
    4: "normal",
    5: "hino_pm",
    6: "hino_full",
    7: "normal",
    10: "normal",
    11: "normal",
    12: "hino_pm",
    13: "hino_full",
    14: "normal",
    17: "normal",
    18: "normal",
    19: "hino_pm",
    20: "hino_full",
    21: "normal",
    24: "normal",
    25: "normal",
    26: "hino_pm",
    27: "hino_full",
    28: "normal",
  },
  "2025-12": {
    1: "normal",
    2: "normal",
    3: "hino_pm",
    4: "hino_full",
    5: "normal",
    8: "normal",
    9: "normal",
    10: "hino_pm",
    11: "hino_full",
    12: "normal",
    15: "normal",
    16: "normal",
    17: "hino_pm",
    18: "hino_full",
    19: "normal",
    22: "normal",
    23: "normal",
    24: "one_bus",
    25: "one_bus",
    26: "one_bus",
  },
  "2026-01": {
    5: "one_bus",
    6: "one_bus",
    7: "one_bus",
    8: "hino_pm",
    9: "hino_full",
    13: "hino_pm",
    14: "hino_full",
    15: "normal",
    16: "normal",
    19: "normal",
    20: "normal",
    21: "hino_pm",
    22: "hino_full",
    23: "normal",
    26: "normal",
    27: "normal",
    28: "hino_pm",
    29: "hino_full",
    30: "normal",
  },
  "2026-02": {
    2: "normal",
    3: "normal",
    4: "hino_pm",
    5: "hino_full",
    6: "normal",
    9: "normal",
    10: "one_bus",
    11: "one_bus",
    12: "one_bus",
    13: "one_bus",
    16: "normal",
    17: "normal",
    18: "hino_pm",
    19: "hino_full",
    20: "normal",
    23: "normal",
    24: "normal",
    25: "hino_pm",
    26: "hino_full",
    27: "normal",
  },
  "2026-03": {},
};

const PATTERN_DEFS = {
  normal: {
    description: "通常授業開講日及び試験期間の時刻表",
    times: {
      minamiToHino: [
        "7:45",
        "8:30",
        "9:10",
        "9:45",
        "10:35",
        "12:10",
        "13:00",
        "13:45",
        "14:40",
        "15:25",
        "16:25",
        "17:10",
        "18:05",
        "18:45",
      ],
      hinoToMinami: [
        "7:50",
        "8:35",
        "9:05",
        "9:45",
        "10:30",
        "12:20",
        "13:00",
        "13:50",
        "14:40",
        "15:20",
        "16:25",
        "17:00",
        "18:00",
        "18:45",
      ],
    },
  },
  hino_full: {
    description: "日野デー臨時便（終日）を含む時刻表",
    notes: "水曜日は終日臨時便あり",
    base: "normal",
    extra: {
      minamiToHino: ["7:40", "9:00", "10:30", "12:20", "13:50", "15:30", "17:00"],
      hinoToMinami: ["8:25", "9:35", "11:00", "12:50", "14:45", "16:20", "18:05"],
    },
  },
  hino_pm: {
    description: "日野デー臨時便（午後のみ）を含む時刻表",
    notes: "水曜日は午後のみ臨時便あり",
    base: "normal",
    extra: {
      minamiToHino: ["13:50", "15:30", "17:00"],
      hinoToMinami: ["14:45", "16:20", "18:05"],
    },
  },
  one_bus: {
    description: "集中授業日・補講期間の時刻表",
    times: {
      minamiToHino: ["7:47", "9:12", "10:37", "13:02", "14:42", "16:27", "18:07"],
      hinoToMinami: ["7:35", "8:45", "12:20", "13:50", "17:00"],
    },
  },
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

const DISPLAY_RANGE = {
  min: "2025-10-01",
  max: "2026-03-31",
};

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

function getStatusForDate(date) {
  const key = toKey(date);
  const map = scheduleData[key];
  const day = date.getDate();
  const weekday = date.getDay();

  if (map && map[day]) {
    return map[day];
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

function getPattern(key) {
  if (patternCache[key]) {
    return patternCache[key];
  }

  const def = PATTERN_DEFS[key];
  if (!def) {
    return null;
  }

  let basePattern = { minamiToHino: [], hinoToMinami: [] };
  if (def.base) {
    const resolvedBase = getPattern(def.base);
    if (resolvedBase) {
      basePattern = {
        minamiToHino: [...resolvedBase.minamiToHino],
        hinoToMinami: [...resolvedBase.hinoToMinami],
      };
    }
  }

  const times = def.times ?? {};
  const extra = def.extra ?? {};

  const pattern = {
    description: def.description,
    notes: def.notes,
    minamiToHino: mergeTimes(
      basePattern.minamiToHino,
      times.minamiToHino ?? [],
      extra.minamiToHino ?? []
    ),
    hinoToMinami: mergeTimes(
      basePattern.hinoToMinami,
      times.hinoToMinami ?? [],
      extra.hinoToMinami ?? []
    ),
  };

  patternCache[key] = pattern;
  return pattern;
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
  timetableWrapper.innerHTML = "";

  if (!statusKey) {
    timetableDescription.textContent = "提供期間外の日付のため時刻表は表示できません。";
    timetableWrapper.textContent = "資料に時刻表がありません。";
    return;
  }

  if (statusKey === "no_service") {
    timetableDescription.textContent = isToday
      ? "本日は運休日のためバスは運行しません。"
      : "選択した日は運休日のためバスは運行しません。";
    timetableWrapper.textContent = "次回の運行日にご利用ください。";
    return;
  }

  const pattern = getPattern(statusKey);
  if (!pattern) {
    timetableDescription.textContent = "該当する時刻表情報がありません。";
    timetableWrapper.textContent = "管理者にお問い合わせください。";
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

  const desc = document.createElement("p");
  desc.className = "notes";
  desc.textContent = pattern.description;
  card.appendChild(desc);

  const notePieces = [statusInfo?.note, pattern.notes].filter(Boolean);
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
  const min = new Date(DISPLAY_RANGE.min);
  const max = new Date(DISPLAY_RANGE.max);

  if (date < min) return min;
  if (date > max) return max;
  return date;
}

function initDatePicker(initialDate) {
  if (!datePicker) return;

  datePicker.min = DISPLAY_RANGE.min;
  datePicker.max = DISPLAY_RANGE.max;
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

let currentDisplayDate = clampToRange(new Date());

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

  renderForDate(currentDisplayDate);
}

document.addEventListener("DOMContentLoaded", init);
