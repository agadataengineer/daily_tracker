// Pure domain logic: dates, schedules and progress calculations.
// Nothing here touches the DOM or storage, which keeps it easy to test.

/* ---------- Dates (all dates are local 'YYYY-MM-DD' strings) ---------- */

const pad = n => String(n).padStart(2, '0');
export const toStr = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const today = () => toStr(new Date());
export const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return toStr(d); };
export const weekday = s => parse(s).getDay(); // 0 = Sunday … 6 = Saturday
export const diffDays = (a, b) => Math.round((parse(b) - parse(a)) / 86400000);
export const weekStartOf = (s, ws) => addDays(s, -((weekday(s) - ws + 7) % 7));
export const monthOf = s => s.slice(0, 7);
export const daysInMonth = ym => { const [y, m] = ym.split('-').map(Number); return new Date(y, m, 0).getDate(); };
export const addMonths = (ym, n) => { const [y, m] = ym.split('-').map(Number); const d = new Date(y, m - 1 + n, 1); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; };
export const minDate = (a, b) => (a < b ? a : b);
export const maxDate = (a, b) => (a > b ? a : b);
export const isDateStr = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);

export function* eachDay(from, to) {
  for (let d = from; d <= to; d = addDays(d, 1)) yield d;
}

export const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const WEEKDAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const weekdayOrder = ws => [0, 1, 2, 3, 4, 5, 6].map(i => (ws + i) % 7);

export function fmtDate(s, opts = { weekday: 'long', day: 'numeric', month: 'long' }) {
  return parse(s).toLocaleDateString('en-GB', opts);
}
export function fmtMonth(ym) {
  return parse(ym + '-01').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}
export function fmtHijri(s) {
  try {
    return new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric' }).format(parse(s));
  } catch { return ''; }
}
// Whole numbers stay whole; fractional scores (equal-weight mode) get one decimal.
export const fmtNum = n => (Number.isInteger(n) ? String(n) : (Math.round(n * 10) / 10).toFixed(1));

/* ---------- IDs ---------- */
export const uid = (p = '') => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
export const ckey = (date, habitId, occId) => `${date}|${habitId}|${occId}`;

/* ---------- Completion records ----------
 * One record per occurrence per day, keyed by `date|habit|occurrence`.
 * No `state` (or state 'done') = completed. state 'skipped' = excused:
 * it doesn't count as planned, doesn't count as missed and doesn't break streaks.
 */
export const isDone = (state, key) => { const r = state.completions.get(key); return !!r && r.state !== 'skipped'; };
export const isSkipped = (state, key) => state.completions.get(key)?.state === 'skipped';

/* ---------- Habit versions ----------
 * A habit keeps a list of versions: [{from, groupId, status, schedule, occurrences}]
 * sorted by `from`. The version in force on a date decides whether the habit was
 * planned that day, in which group and with which occurrences. Edits create a new
 * version (from today or tomorrow), so past days keep the plan they actually had.
 * Occurrences have permanent ids; editing never renumbers them.
 */
export function versionAt(h, date) {
  let v = null;
  for (const x of h.versions) { if (x.from <= date) v = x; else break; }
  return v;
}
export function currentVersion(h, date = today()) {
  return versionAt(h, date) || h.versions[0];
}
export const latestVersion = h => h.versions[h.versions.length - 1];
// A version scheduled to start after today (e.g. "apply from tomorrow"), if any.
export const upcomingVersion = h => { const v = latestVersion(h); return v.from > today() && h.versions.length > 1 ? v : null; };
export const startDate = h => h.versions[0].from;

export function isScheduledOn(v, date) {
  if (!v || v.status !== 'active') return false;
  const t = v.schedule.type;
  if (t === 'daily') return true;
  if (t === 'days') return v.schedule.days.includes(weekday(date));
  return false; // weekly-goal habits are tracked per week, not per day
}
export const isWeeklyActive = v => !!v && v.status === 'active' && v.schedule.type === 'weekly';

export function scheduleLabel(v, ws = 6) {
  if (!v) return '';
  const s = v.schedule;
  const n = v.occurrences.length;
  const times = n > 1 ? ` · ${n}× a day` : '';
  if (s.type === 'daily') return `Every day${times}`;
  if (s.type === 'days') {
    const order = weekdayOrder(ws).filter(d => s.days.includes(d));
    if (order.length === 7) return `Every day${times}`;
    return order.map(d => WEEKDAYS_SHORT[d]).join(', ') + times;
  }
  return `${s.perWeek}× per week`;
}

/* ---------- Ordering helpers ---------- */
export function sortedGroups(state, { includeDeleted = false } = {}) {
  return [...state.groups.values()]
    .filter(g => includeDeleted || !g.deleted)
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}
export function sortedHabits(state) {
  return [...state.habits.values()].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

/* ---------- Day level ---------- */

// Every scheduled occurrence (daily & selected-day habits) for a date, including skipped ones.
export function plannedItems(state, date) {
  const items = [];
  for (const h of sortedHabits(state)) {
    const v = versionAt(h, date);
    if (!isScheduledOn(v, date)) continue;
    for (const occ of v.occurrences) {
      const key = ckey(date, h.id, occ.id);
      items.push({ habit: h, v, occ, key, date, done: isDone(state, key), skipped: isSkipped(state, key) });
    }
  }
  return items;
}

// Weekly-goal habits active on a date, with this week's progress.
export function weeklyItems(state, date) {
  const ws = state.settings.weekStart;
  const wStart = weekStartOf(date, ws);
  const out = [];
  for (const h of sortedHabits(state)) {
    const v = versionAt(h, date);
    if (!isWeeklyActive(v)) continue;
    const occ = v.occurrences[0];
    const key = ckey(date, h.id, occ.id);
    out.push({ habit: h, v, occ, key, date, done: isDone(state, key), skipped: false,
      weekCount: weekCountFor(state, h.id, occ.id, wStart), target: v.schedule.perWeek });
  }
  return out;
}

function weekCountFor(state, habitId, occId, wStart) {
  let c = 0;
  for (let i = 0; i < 7; i++) if (isDone(state, ckey(addDays(wStart, i), habitId, occId))) c++;
  return c;
}

export function itemStatus(item, todayStr = today()) {
  if (item.skipped) return 'skipped';
  if (item.done) return 'done';
  if (item.date < todayStr) return 'missed';
  if (item.date > todayStr) return 'upcoming';
  return 'pending';
}

/* Day score.
 *  scoring 'occurrence' (default): every planned occurrence weighs the same.
 *  scoring 'habit': every habit weighs the same; its occurrences are fractions of it.
 * Skipped occurrences are removed from the plan. `occPlanned/occDone/missed` are always raw counts.
 */
const dayCache = { rev: -1, map: new Map() };
export function dayStats(state, date) {
  if (dayCache.rev !== state.rev) { dayCache.rev = state.rev; dayCache.map.clear(); }
  const hit = dayCache.map.get(date);
  if (hit) return hit;
  const items = plannedItems(state, date);
  const active = items.filter(i => !i.skipped);
  const occPlanned = active.length;
  const occDone = active.reduce((n, i) => n + (i.done ? 1 : 0), 0);
  let planned = occPlanned, done = occDone;
  if (state.settings.scoring === 'habit') {
    const per = new Map();
    for (const i of active) {
      const r = per.get(i.habit.id) || { n: 0, d: 0 };
      r.n++; if (i.done) r.d++;
      per.set(i.habit.id, r);
    }
    planned = per.size;
    done = [...per.values()].reduce((s, r) => s + r.d / r.n, 0);
  }
  const res = {
    date, planned, done, pct: planned ? done / planned : null,
    occPlanned, occDone, skipped: items.length - active.length, total: items.length,
  };
  dayCache.map.set(date, res);
  return res;
}

export function heatLevel(pct) {
  if (pct === null || pct === undefined) return 0;
  if (pct >= 0.9999) return 5;
  if (pct >= 0.7) return 4;
  if (pct >= 0.4) return 3;
  if (pct > 0) return 2;
  return 1; // planned but nothing done
}

/* ---------- Periods (week / month / custom range) ----------
 * The completion rate covers daily & selected-day habits only, for days up to today.
 * Weekly goals are reported separately (weeklyGoals) so a week that has just started
 * doesn't look like a failure.
 */
export function earliestDate(state) {
  let d = null;
  for (const h of state.habits.values()) { const s = startDate(h); if (!d || s < d) d = s; }
  return d;
}

export function periodStats(state, from, to) {
  const t = today();
  const threshold = state.settings.goodDayThreshold / 100;
  const end = minDate(to, t);
  let planned = 0, done = 0, goodDays = 0, perfectDays = 0, trackedDays = 0, missed = 0, skippedDays = 0, skipped = 0;
  const days = [];
  for (const d of eachDay(from, to)) {
    if (d > end) { days.push({ date: d, planned: 0, done: 0, pct: null, future: true }); continue; }
    const s = dayStats(state, d);
    days.push(s);
    skipped += s.skipped;
    if (!s.planned) { if (s.total) skippedDays++; continue; }
    trackedDays++;
    planned += s.planned; done += s.done;
    if (d < t) missed += s.occPlanned - s.occDone;
    if (s.pct >= threshold) goodDays++;
    if (s.pct >= 0.9999) perfectDays++;
  }
  return { from, to, planned, done, pct: planned ? done / planned : null, goodDays, perfectDays, trackedDays, missed, skipped, skippedDays, days };
}

// Weekly-goal progress for weeks that start inside [from, to] (and have started).
export function weeklyGoals(state, from, to) {
  const t = today();
  const ws = state.settings.weekStart;
  let w = weekStartOf(from, ws);
  if (w < from) w = addDays(w, 7);
  const byHabit = new Map();
  for (; w <= to && w <= t; w = addDays(w, 7)) {
    const wEnd = addDays(w, 6);
    const ref = minDate(wEnd, t);
    for (const h of sortedHabits(state)) {
      const v = versionAt(h, ref);
      if (!isWeeklyActive(v)) continue;
      const count = weekCountFor(state, h.id, v.occurrences[0].id, w);
      const r = byHabit.get(h.id) || { habit: h, weeks: [], met: 0, ended: 0 };
      const ongoing = wEnd >= t;
      r.weeks.push({ start: w, count, target: v.schedule.perWeek, ongoing });
      if (count >= v.schedule.perWeek) r.met++;
      if (!ongoing) r.ended++;
      byHabit.set(h.id, r);
    }
  }
  return [...byHabit.values()];
}

// Same elapsed span in the previous period, so a half-finished week is compared fairly.
export function comparableRange(range, prevRange) {
  const t = today();
  if (range.to < t) return prevRange;
  const elapsed = Math.max(0, diffDays(range.from, t));
  return { from: prevRange.from, to: minDate(addDays(prevRange.from, elapsed), prevRange.to) };
}

export function weekRange(state, date) {
  const s = weekStartOf(date, state.settings.weekStart);
  return { from: s, to: addDays(s, 6) };
}
export function monthRange(ym) {
  return { from: `${ym}-01`, to: `${ym}-${pad(daysInMonth(ym))}` };
}

// Completion rate per group across a period (daily-habit occurrences, skipped excluded).
export function groupBreakdown(state, from, to) {
  const end = minDate(to, today());
  const map = new Map();
  for (const d of eachDay(from, end)) {
    for (const it of plannedItems(state, d)) {
      if (it.skipped) continue;
      const gid = it.v.groupId || '_none';
      const r = map.get(gid) || { groupId: gid, planned: 0, done: 0 };
      r.planned++; if (it.done) r.done++;
      map.set(gid, r);
    }
  }
  return [...map.values()];
}

/* ---------- Streaks ---------- */

// Consecutive days at or above the "good day" threshold. Today doesn't break a streak while
// it's in progress; days with nothing planned (or fully skipped) are passed over.
export function overallStreak(state) {
  const t = today();
  const first = earliestDate(state);
  if (!first) return 0;
  const threshold = state.settings.goodDayThreshold / 100;
  let streak = 0;
  for (let d = t, i = 0; d >= first && i < 1500; d = addDays(d, -1), i++) {
    const s = dayStats(state, d);
    if (!s.planned) continue;
    if (s.pct >= threshold) streak++;
    else if (d === t) continue;
    else break;
  }
  return streak;
}

// Per-habit stats for a range: rate, missed, current & best streak.
export function habitStats(state, h, from, to) {
  const t = today();
  const end = minDate(to, t);
  const begin = maxDate(from, startDate(h));
  let planned = 0, done = 0, missed = 0;
  const vEnd = versionAt(h, end) || currentVersion(h);
  if (vEnd.schedule.type === 'weekly') {
    // Ended weeks always count; the ongoing week only once its target is met.
    const ws = state.settings.weekStart;
    let weeks = 0, met = 0;
    for (let w = weekStartOf(begin, ws); w <= end; w = addDays(w, 7)) {
      const wEnd = addDays(w, 6);
      const v = versionAt(h, minDate(wEnd, t));
      if (!isWeeklyActive(v)) continue;
      const c = weekCountFor(state, h.id, v.occurrences[0].id, w);
      const target = v.schedule.perWeek;
      const ongoing = wEnd >= t;
      if (ongoing && c < target) continue;
      planned += target; done += Math.min(c, target);
      if (!ongoing) missed += Math.max(0, target - c);
      weeks++; if (c >= target) met++;
    }
    return { planned, done, pct: planned ? done / planned : null, missed, streak: weeklyStreak(state, h), best: null, unit: 'weeks', weeks, met };
  }
  for (const d of eachDay(begin, end)) {
    const v = versionAt(h, d);
    if (!isScheduledOn(v, d)) continue;
    for (const o of v.occurrences) {
      const k = ckey(d, h.id, o.id);
      if (isSkipped(state, k)) continue;
      planned++;
      if (isDone(state, k)) done++;
      else if (d < t) missed++;
    }
  }
  const { current, best } = dailyStreaks(state, h);
  return { planned, done, pct: planned ? done / planned : null, missed, streak: current, best, unit: 'days' };
}

// 'done' | 'partial' | 'skipped' (all occurrences skipped) for a habit on a scheduled day
function habitDayResult(state, h, v, d) {
  let active = 0, done = 0;
  for (const o of v.occurrences) {
    const k = ckey(d, h.id, o.id);
    if (isSkipped(state, k)) continue;
    active++; if (isDone(state, k)) done++;
  }
  if (!active) return 'skipped';
  return done === active ? 'done' : 'partial';
}

export function dailyStreaks(state, h) {
  const t = today();
  const first = startDate(h);
  let best = 0, run = 0;
  for (const d of eachDay(first, t)) {
    const v = versionAt(h, d);
    if (!isScheduledOn(v, d)) continue;
    const r = habitDayResult(state, h, v, d);
    if (r === 'skipped') continue;
    if (r === 'done') { run++; best = Math.max(best, run); }
    else if (d !== t) run = 0;
  }
  return { current: run, best };
}

function weeklyStreak(state, h) {
  const ws = state.settings.weekStart;
  const t = today();
  let streak = 0;
  for (let w = weekStartOf(t, ws), i = 0; w >= weekStartOf(startDate(h), ws) && i < 260; w = addDays(w, -7), i++) {
    const v = versionAt(h, minDate(addDays(w, 6), t));
    if (!isWeeklyActive(v)) continue;
    const c = weekCountFor(state, h.id, v.occurrences[0].id, w);
    if (c >= v.schedule.perWeek) streak++;
    else if (w === weekStartOf(t, ws)) continue;
    else break;
  }
  return streak;
}

/* ---------- Backup validation ---------- */
export const BACKUP_SCHEMA = 2;

export function validateBackup(data) {
  const errors = [];
  const fail = msg => { if (errors.length < 5) errors.push(msg); };
  if (!data || typeof data !== 'object') return { ok: false, errors: ['The file is not valid JSON data.'] };
  if (data.app !== 'daily-habits') return { ok: false, errors: ['This file is not a Daily Habits backup.'] };
  if (typeof data.schema === 'number' && data.schema > BACKUP_SCHEMA) return { ok: false, errors: ['This backup was made by a newer version of the app. Update the app first.'] };
  for (const k of ['groups', 'habits', 'completions']) if (!Array.isArray(data[k])) fail(`Missing “${k}” list.`);
  if (errors.length) return { ok: false, errors };
  const groupIds = new Set();
  data.groups.forEach((g, i) => {
    if (!g || typeof g.id !== 'string' || typeof g.name !== 'string') fail(`Group #${i + 1} is malformed.`);
    else groupIds.add(g.id);
  });
  const occIds = new Map();
  data.habits.forEach((h, i) => {
    if (!h || typeof h.id !== 'string' || typeof h.name !== 'string' || !Array.isArray(h.versions) || !h.versions.length) { fail(`Habit #${i + 1} is malformed.`); return; }
    const ids = new Set();
    h.versions.forEach(v => {
      if (!v || !isDateStr(v.from) || !v.schedule || !['daily', 'days', 'weekly'].includes(v.schedule.type) || !Array.isArray(v.occurrences) || !v.occurrences.length) fail(`Habit “${h.name}” has an invalid schedule.`);
      else v.occurrences.forEach(o => { if (!o || typeof o.id !== 'string') fail(`Habit “${h.name}” has an invalid occurrence.`); else ids.add(o.id); });
    });
    occIds.set(h.id, ids);
  });
  let first = null, last = null;
  data.completions.forEach((c, i) => {
    if (!c || !isDateStr(c.date) || typeof c.habitId !== 'string' || typeof c.occId !== 'string' || c.key !== ckey(c.date, c.habitId, c.occId)) { fail(`Record #${i + 1} is malformed.`); return; }
    if (c.state && !['done', 'skipped'].includes(c.state)) fail(`Record #${i + 1} has an unknown state.`);
    if (!first || c.date < first) first = c.date;
    if (!last || c.date > last) last = c.date;
  });
  if (errors.length) return { ok: false, errors };
  return {
    ok: true, errors: [],
    summary: { groups: data.groups.filter(g => !g.deleted).length, habits: data.habits.length, completions: data.completions.length, first, last, exportedAt: data.exportedAt || null },
  };
}
