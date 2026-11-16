import * as M from './model.js';
import * as S from './store.js';

const { state } = S;
const APP_VERSION = '1.2.0';

/* =========================================================
   Helpers
   ========================================================= */
const ICONS = {
  today: '<circle cx="12" cy="12" r="10"/><path d="m8.5 12.5 2.5 2.5 5-5.5"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  chart: '<path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-3"/>',
  list: '<path d="M9 6h12M9 12h12M9 18h12"/><rect x="3" y="4.5" width="3" height="3" rx="1"/><rect x="3" y="10.5" width="3" height="3" rx="1"/><rect x="3" y="16.5" width="3" height="3" rx="1"/>',
  settings: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  plus: '<path d="M5 12h14M12 5v14"/>',
  left: '<path d="m15 18-6-6 6-6"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
  up: '<path d="m18 15-6-6-6 6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  edit: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
  pause: '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
  play: '<path d="M6 3l14 9-14 9V3z"/>',
  archive: '<rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8M10 12h4"/>',
  trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
  folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  miss: '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>',
  install: '<rect x="5" y="2" width="14" height="20" rx="3"/><path d="M12 7v7M9 11l3 3 3-3M10 18h4"/>',
  sparkle: '<path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/>',
  more: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
  skip: '<path d="M5 12h14"/>',
  grip: '<circle cx="9" cy="6" r="1.4"/><circle cx="15" cy="6" r="1.4"/><circle cx="9" cy="12" r="1.4"/><circle cx="15" cy="12" r="1.4"/><circle cx="9" cy="18" r="1.4"/><circle cx="15" cy="18" r="1.4"/>',
  sort: '<path d="M7 4v16M3 8l4-4 4 4M17 20V4M13 16l4 4 4-4"/>',
  undo: '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
};
const icon = (n, cls = '') =>
  `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]}</svg>`;

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pctText = p => (p === null || p === undefined ? '—' : `${Math.round(p * 100)}%`);
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const occLabel = (o, i) => (o.label ? o.label : `${i + 1}`);
const unitWord = () => (state.settings.scoring === 'habit' ? 'habits' : 'occurrences');

// Habit/group colors live on the small icon tile only; ticks and progress use brand blue.
// Orange is reserved for highlights & achievements, so it isn't offered here.
const COLORS = ['#4B91E8', '#2FB5C4', '#6E7FEA', '#9A7BE3', '#E46FA6', '#E5616B', '#F2B544', '#4CB98A', '#7C8EA8'];
const EMOJIS = ['✨', '🕌', '📿', '📖', '🤲', '🌅', '🌙', '💧', '🚶', '🏃', '🏋️', '🧘', '🥗', '🍎', '😴', '💊', '🦷', '📚', '✍️', '💻', '🧠', '🎯', '💼', '📈', '🗣️', '🎧', '🧹', '💰', '❤️', '📵'];

function ring(p, size = 132, stroke = 12) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, off = c * (1 - (p ?? 0));
  return `<svg class="ring" viewBox="0 0 ${size} ${size}" aria-hidden="true">
    <circle class="ring-bg" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${stroke}"/>
    <circle class="ring-fg ${p !== null && p >= 0.9999 ? 'full' : ''}" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${stroke}"
      stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${off.toFixed(2)}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
  </svg>`;
}

function groupOf(id) {
  if (!id) return { id: null, name: 'Ungrouped', icon: '📁', color: '#7C8EA8', order: 9999 };
  return state.groups.get(id) || { id, name: 'Removed group', icon: '📁', color: '#7C8EA8', order: 9998 };
}

function greeting() {
  const h = new Date().getHours();
  const part = h < 5 ? 'Good night' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  return state.settings.name ? `${part}, ${esc(state.settings.name)}` : part;
}

/* =========================================================
   Router
   ========================================================= */
const ui = { filter: 'all', lastToggled: null, deferredInstall: null, reorder: false };

function parseRoute() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const [name, a, b] = parts;
  const t = M.today();
  switch (name) {
    case 'day': return { view: 'day', nav: a === t ? 'today' : 'history', date: M.isDateStr(a) ? a : t };
    case 'history': return { view: 'history', nav: 'history', ym: /^\d{4}-\d{2}$/.test(a || '') ? a : M.monthOf(t) };
    case 'progress': return { view: 'progress', nav: 'progress', mode: a === 'month' ? 'month' : 'week', date: M.isDateStr(b) ? b : t };
    case 'habits': return { view: 'habits', nav: 'habits' };
    case 'settings': return { view: 'settings', nav: 'settings' };
    default: return { view: 'day', nav: 'today', date: t };
  }
}

const main = document.getElementById('view');

// Identify the focused control so focus can be restored after a re-render (keyboard users).
function focusSignature(el) {
  if (!el || !main.contains(el)) return null;
  if (el.dataset.key) return `[data-key="${CSS.escape(el.dataset.key)}"]`;
  if (el.dataset.action) {
    let sel = `[data-action="${CSS.escape(el.dataset.action)}"]`;
    for (const k of ['id', 'f', 't', 'group']) if (el.dataset[k]) sel += `[data-${k}="${CSS.escape(el.dataset[k])}"]`;
    return sel;
  }
  if (el.dataset.setting) return `[data-setting="${CSS.escape(el.dataset.setting)}"]`;
  return null;
}

function render() {
  const r = parseRoute();
  const focusSel = focusSignature(document.activeElement);
  document.querySelectorAll('[data-nav]').forEach(a => {
    const on = a.dataset.nav === r.nav;
    a.classList.toggle('active', on);
    if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  const views = { day: dayView, history: historyView, progress: progressView, habits: habitsView, settings: settingsView };
  const preview = S.memoryMode()
    ? `<div class="notice preview-note">${icon('info')} <span><b>Preview mode:</b> this frame doesn't allow saving, so changes reset when you reload. Your installed app (GitHub Pages) saves everything on your device.</span></div>`
    : '';
  main.innerHTML = preview + views[r.view](r);
  const titles = { history: 'History', progress: 'Progress', habits: 'Habits', settings: 'Settings' };
  document.title = (r.view === 'day'
    ? (r.date === M.today() ? 'Today' : M.fmtDate(r.date, { day: 'numeric', month: 'short' }))
    : titles[r.view]) + ' · Daily Habits';
  document.getElementById('fab').hidden = r.view === 'settings' || (r.view === 'habits' && ui.reorder);
  if (ui.lastToggled) {
    main.querySelectorAll(`[data-key="${CSS.escape(ui.lastToggled)}"]`).forEach(el => el.classList.add('pop'));
    ui.lastToggled = null;
  }
  if (focusSel) main.querySelector(focusSel)?.focus({ preventScroll: true });
  const hm = main.querySelector('.heatmap-scroll');
  if (hm) hm.scrollLeft = hm.scrollWidth;
  if (r.view === 'habits' && ui.reorder) enableDragSort();
}

/* =========================================================
   Day view (dashboard)
   ========================================================= */
function welcomeView() {
  return `
  <section class="welcome card">
    <img src="icons/icon-192.png" alt="" width="72" height="72" class="welcome-logo">
    <h1>Build days you're proud of</h1>
    <p>Create your own groups and habits, track every occurrence — like each of the five prayers — and watch your consistency grow day by day.</p>
    <div class="welcome-actions">
      <button class="btn primary lg" data-action="new-habit">${icon('plus')} Create my first habit</button>
      <button class="btn ghost lg" data-action="load-samples">${icon('sparkle')} Try with sample habits</button>
    </div>
    <p class="hint">Sample habits are labelled <span class="badge sample">Sample</span> and can be removed in one tap from Settings.</p>
  </section>`;
}

function groupItems(items) {
  const map = new Map();
  for (const it of items) {
    const g = groupOf(it.v.groupId);
    if (!map.has(g.id)) map.set(g.id, { group: g, habits: new Map() });
    const bucket = map.get(g.id).habits;
    if (!bucket.has(it.habit.id)) bucket.set(it.habit.id, { habit: it.habit, v: it.v, items: [] });
    bucket.get(it.habit.id).items.push(it);
  }
  return [...map.values()]
    .map(x => ({ group: x.group, habits: [...x.habits.values()] }))
    .sort((a, b) => a.group.order - b.group.order);
}

function habitRow(h, its, date) {
  const t = M.today();
  const active = its.filter(i => !i.skipped);
  const n = active.length, d = active.filter(i => i.done).length, sk = its.length - n;
  const future = date > t;
  const st = !n ? 'skipped' : d === n ? 'done' : future ? 'upcoming' : date < t ? (d ? 'partial' : 'missed') : 'pending';
  const statusText = { done: 'Done', upcoming: 'Upcoming', missed: 'Missed', pending: 'Pending', partial: 'Partly done', skipped: 'Skipped' }[st];
  let meta = its.length === 1 ? statusText : n ? `${d} of ${n}${date < t && d < n ? ` · ${n - d} missed` : ''}` : 'Skipped';
  if (its.length > 1 && sk && n) meta += ` · ${sk} skipped`;
  const sample = h.sample && !groupOf(its[0].v.groupId).sample ? '<span class="badge sample">Sample</span>' : '';
  const attrs = it => `data-action="toggle" data-date="${it.date}" data-h="${h.id}" data-o="${it.occ.id}" data-key="${esc(it.key)}" ${future ? 'disabled' : ''}`;
  const more = future ? '' : `<button class="icon-btn sm more-btn" data-action="habit-day" data-h="${h.id}" data-date="${date}" data-key="more|${esc(h.id)}" aria-label="More options for ${esc(h.name)} (skip)" title="Skip or set each occurrence">${icon('more')}</button>`;
  if (its.length === 1) {
    const it = its[0];
    const cls = it.skipped ? 'skip' : it.done ? 'on' : st === 'missed' ? 'missed' : '';
    const label = it.skipped ? 'Skipped — mark done' : it.done ? 'Mark not done' : 'Mark done';
    return `<li class="habit-row st-${st}" style="--hc:${h.color}">
      <span class="h-icon">${esc(h.icon)}</span>
      <div class="h-main"><div class="h-name">${esc(h.name)} ${sample}</div><div class="h-meta">${meta}</div></div>
      <div class="row-actions">${more}<button class="check ${cls}" ${attrs(it)} aria-pressed="${it.done}" aria-label="${label}: ${esc(h.name)}">${icon(it.skipped ? 'skip' : 'check')}</button></div>
    </li>`;
  }
  const chips = its.map((it, i) => {
    const cs = it.skipped ? 'skip' : it.done ? 'on' : date < t ? 'missed' : '';
    return `<button class="chip-occ ${cs}" ${attrs(it)} aria-pressed="${it.done}" aria-label="${esc(h.name)} — ${esc(occLabel(it.occ, i))}${it.skipped ? ' (skipped)' : ''}">
      <span class="tick">${icon(it.skipped ? 'skip' : 'check')}</span><span>${esc(occLabel(it.occ, i))}</span></button>`;
  }).join('');
  return `<li class="habit-row multi st-${st}" style="--hc:${h.color}">
    <span class="h-icon">${esc(h.icon)}</span>
    <div class="h-main"><div class="h-name">${esc(h.name)} ${sample}</div><div class="h-meta">${meta}</div>
      <div class="mini-bar"><i style="width:${n ? (d / n) * 100 : 0}%"></i></div></div>
    <div class="row-actions">${more}</div>
    <div class="occ-chips">${chips}</div>
  </li>`;
}

function weeklyCard(weekly, date) {
  if (!weekly.length) return '';
  const t = M.today(), future = date > t;
  const rows = weekly.map(it => {
    const h = it.habit, met = it.weekCount >= it.target;
    const dots = Array.from({ length: it.target }, (_, i) => `<i class="${i < it.weekCount ? 'on' : ''}"></i>`).join('');
    return `<li class="habit-row ${it.done ? 'st-done' : 'st-pending'}" style="--hc:${h.color}">
      <span class="h-icon">${esc(h.icon)}</span>
      <div class="h-main"><div class="h-name">${esc(h.name)} ${h.sample && !groupOf(it.v.groupId).sample ? '<span class="badge sample">Sample</span>' : ''}</div>
        <div class="h-meta">${it.weekCount} / ${it.target} this week ${met ? '· <span class="achv">goal reached 🎉</span>' : ''}</div>
        <div class="dots ${met ? 'met' : ''}">${dots}</div></div>
      <button class="check ${it.done ? 'on' : ''}" data-action="toggle" data-date="${date}" data-h="${h.id}" data-o="${it.occ.id}" data-key="${esc(it.key)}" ${future ? 'disabled' : ''} aria-pressed="${it.done}" aria-label="Did it ${date === t ? 'today' : 'this day'}: ${esc(h.name)}">${icon('check')}</button>
    </li>`;
  }).join('');
  return `<article class="card group-card weekly">
    <header class="g-head"><span class="g-icon accent">🎯</span><div><h3>Weekly goals</h3><p class="g-sub">Do these any day — tick the day you did it</p></div></header>
    <ul class="habit-list">${rows}</ul>
  </article>`;
}

function weekStrip(date) {
  const { from } = M.weekRange(state, date);
  const t = M.today();
  const cells = Array.from({ length: 7 }, (_, i) => {
    const d = M.addDays(from, i);
    const s = d <= t ? M.dayStats(state, d) : { pct: null, planned: 0 };
    const h = s.pct === null ? 0 : Math.max(6, s.pct * 100);
    return `<a href="#/day/${d}" class="ws-day ${d === date ? 'sel' : ''} ${d === t ? 'is-today' : ''} ${d > t ? 'future' : ''}" aria-label="${M.fmtDate(d)} ${pctText(s.pct)}">
      <span class="ws-bar"><i class="lv${M.heatLevel(s.pct)}" style="height:${h}%"></i></span>
      <span class="ws-lbl">${M.WEEKDAYS_SHORT[M.weekday(d)].slice(0, 2)}</span>
      <span class="ws-num">${M.parse(d).getDate()}</span>
    </a>`;
  }).join('');
  const ws = M.periodStats(state, from, M.addDays(from, 6));
  return `<section class="card week-card">
    <div class="card-head"><h3>This week</h3><a class="link" href="#/progress/week/${date}">${pctText(ws.pct)} ${icon('right')}</a></div>
    <div class="week-strip">${cells}</div>
  </section>`;
}

function dayView({ date }) {
  if (!state.habits.size && !state.onboarded) return welcomeView();
  const t = M.today();
  const isToday = date === t, past = date < t, future = date > t;
  const items = M.plannedItems(state, date);
  const weekly = M.weeklyItems(state, date);
  const stats = M.dayStats(state, date);
  const pendingCount = items.filter(i => !i.done && !i.skipped).length;
  const doneCount = items.filter(i => i.done).length;
  const streak = M.overallStreak(state);

  const f = ui.filter;
  const visible = groupItems(items)
    .map(g => ({ ...g, habits: g.habits.filter(x => f === 'all' || (f === 'pending' ? x.items.some(i => !i.done && !i.skipped) : x.items.some(i => i.done))) }))
    .filter(g => g.habits.length);
  const visibleWeekly = weekly.filter(it => f === 'all' || (f === 'pending' ? !it.done && it.weekCount < it.target : it.done));

  const groupsHtml = visible.map(({ group, habits }) => {
    const full = items.filter(i => (i.v.groupId || null) === group.id && !i.skipped);
    const fd = full.filter(i => i.done).length;
    return `<article class="card group-card" style="--gc:${group.color || 'var(--primary)'}">
      <header class="g-head">
        <span class="g-icon">${esc(group.icon || '📁')}</span>
        <div><h3>${esc(group.name)} ${group.sample ? '<span class="badge sample">Sample</span>' : ''}</h3></div>
        <span class="g-count ${full.length && fd === full.length ? 'all' : ''}">${fd}/${full.length}</span>
      </header>
      <div class="g-bar"><i style="width:${full.length ? (fd / full.length) * 100 : 0}%"></i></div>
      <ul class="habit-list">${habits.map(x => habitRow(x.habit, x.items, date)).join('')}</ul>
    </article>`;
  }).join('');

  let listHtml = groupsHtml + (visibleWeekly.length ? weeklyCard(visibleWeekly, date) : '');
  if (!items.length && !weekly.length) {
    listHtml = `<div class="empty card">
      <div class="empty-emoji">${future ? '🗓️' : '🌿'}</div>
      <h3>${state.habits.size ? 'Nothing planned for this day' : 'No habits yet'}</h3>
      <p>${state.habits.size ? 'Habits scheduled for this weekday will show up here.' : 'Add your first habit to start tracking.'}</p>
      <button class="btn primary" data-action="new-habit">${icon('plus')} New habit</button>
    </div>`;
  } else if (!listHtml) {
    listHtml = `<div class="empty card slim"><div class="empty-emoji">${f === 'pending' ? '🎉' : '⏳'}</div>
      <h3>${f === 'pending' ? 'Nothing pending' : 'Nothing completed yet'}</h3>
      <p>${f === 'pending' ? 'Everything planned for this day is done or skipped.' : 'Tick a habit and it will appear here.'}</p></div>`;
  }

  const pendingList = isToday && pendingCount ? `<section class="card pending-card hide-mobile">
      <div class="card-head"><h3>Still to do</h3><span class="muted">${pendingCount}</span></div>
      <ul class="pending-list">${items.filter(i => !i.done && !i.skipped).slice(0, 10).map(i => {
        const idx = i.v.occurrences.findIndex(o => o.id === i.occ.id);
        return `<li><button class="check sm" data-action="toggle" data-date="${date}" data-h="${i.habit.id}" data-o="${i.occ.id}" data-key="side|${esc(i.key)}" aria-label="Mark done: ${esc(i.habit.name)} ${esc(occLabel(i.occ, idx))}">${icon('check')}</button>
        <span class="pl-icon">${esc(i.habit.icon)}</span><span class="pl-name">${esc(i.habit.name)}${i.v.occurrences.length > 1 ? ` <em>${esc(occLabel(i.occ, idx))}</em>` : ''}</span></li>`;
      }).join('')}${pendingCount > 10 ? `<li class="muted more">+ ${pendingCount - 10} more</li>` : ''}</ul>
    </section>` : '';

  const notice = past
    ? `<div class="notice">${icon('clock')} You're viewing a past day. Ticking here corrects your history.</div>`
    : future ? `<div class="notice">${icon('calendar')} This day hasn't started yet — you'll be able to check habits on the day.</div>` : '';

  const canSkip = !future && pendingCount > 0;
  const dayAction = stats.skipped
    ? `<button class="btn ghost sm" data-action="unskip-day" data-date="${date}" aria-label="Undo skip day">${icon('undo')}<span class="hide-xs">Undo skip</span></button>`
    : canSkip ? `<button class="btn ghost sm" data-action="skip-day" data-date="${date}" title="Skip day — excuse everything not done (travel, illness…)" aria-label="Skip day">${icon('skip')}<span class="hide-xs">Skip day</span></button>` : '';

  const hijri = state.settings.showHijri ? `<span class="hijri">${esc(M.fmtHijri(date))}</span>` : '';
  const eyebrow = isToday ? greeting() : past ? (M.diffDays(date, t) === 1 ? 'Yesterday' : `${M.diffDays(date, t)} days ago`) : (M.diffDays(t, date) === 1 ? 'Tomorrow' : 'Upcoming');
  const shownPct = stats.pct ?? (stats.total && !stats.planned ? null : items.length ? 0 : null);

  return `
  <header class="page-head">
    <div>
      <div class="eyebrow">${eyebrow}</div>
      <h1>${M.fmtDate(date)}</h1>
      <div class="sub">${M.parse(date).getFullYear()} ${hijri ? '· ' + hijri : ''}</div>
    </div>
    <div class="day-nav">
      <a class="icon-btn" href="#/day/${M.addDays(date, -1)}" aria-label="Previous day">${icon('left')}</a>
      ${isToday ? '' : `<a class="btn ghost sm" href="#/today">Today</a>`}
      <a class="icon-btn" href="#/day/${M.addDays(date, 1)}" aria-label="Next day">${icon('right')}</a>
    </div>
  </header>
  <div class="day-grid">
    <aside class="side-col">
      <section class="card summary">
        <div class="ring-wrap">${ring(shownPct)}<div class="ring-label"><b>${stats.total && !stats.planned ? '—' : pctText(shownPct)}</b><span>${isToday ? 'today' : 'complete'}</span></div></div>
        <div class="sum-stats">
          <div class="big"><b>${M.fmtNum(stats.done)}</b><span>/ ${stats.planned}</span></div>
          <div class="sum-cap">${unitWord()} completed</div>
          <div class="pills">
            ${past ? `<span class="pill bad">${icon('miss')} ${stats.occPlanned - stats.occDone} missed</span>` : future ? '' : `<span class="pill">${icon('clock')} ${pendingCount} pending</span>`}
            ${stats.skipped ? `<span class="pill">${icon('skip')} ${stats.skipped} skipped</span>` : ''}
            <span class="pill fire" title="Good days in a row">${icon('flame')} ${plural(streak, 'day')} streak</span>
          </div>
        </div>
      </section>
      ${weekStrip(date)}
      ${pendingList}
    </aside>
    <section class="main-col">
      ${notice}
      <div class="filter-row">
        <div class="seg" role="tablist" aria-label="Filter">
          ${[['all', 'All', items.length], ['pending', 'Pending', pendingCount], ['done', 'Done', doneCount]].map(([k, l, n]) =>
            `<button role="tab" aria-selected="${f === k}" class="${f === k ? 'on' : ''}" data-action="filter" data-f="${k}">${l}<span class="count">${n}</span></button>`).join('')}
        </div>
        ${dayAction}
      </div>
      <div class="group-list">${listHtml}</div>
    </section>
  </div>`;
}

/* =========================================================
   History
   ========================================================= */
function calendarGrid(ym) {
  const ws = state.settings.weekStart;
  const t = M.today();
  const { from, to } = M.monthRange(ym);
  const lead = (M.weekday(from) - ws + 7) % 7;
  const heads = M.weekdayOrder(ws).map(d => `<span class="cal-h">${M.WEEKDAYS_SHORT[d]}</span>`).join('');
  let cells = '<span class="cal-blank"></span>'.repeat(lead);
  for (const d of M.eachDay(from, to)) {
    const s = d <= t ? M.dayStats(state, d) : { pct: null, planned: 0, total: 0 };
    const skippedDay = d <= t && s.total && !s.planned;
    const lv = d > t ? 'future' : skippedDay ? 'skipday' : `lv${M.heatLevel(s.pct)}`;
    const label = skippedDay ? 'skipped' : s.planned ? pctText(s.pct) : 'nothing planned';
    cells += `<a href="#/day/${d}" class="cal-cell ${lv} ${d === t ? 'is-today' : ''}" aria-label="${M.fmtDate(d)}: ${label}">
      <span class="num">${M.parse(d).getDate()}</span>${d <= t ? (skippedDay ? '<span class="p">Skip</span>' : s.planned ? `<span class="p">${pctText(s.pct)}</span>` : '') : ''}</a>`;
  }
  return `<div class="cal">${heads}${cells}</div>`;
}

const legend = () => `<div class="legend"><span>Less</span>${[1, 2, 3, 4].map(l => `<i class="lv${l}"></i>`).join('')}<span>More</span><i class="lv5"></i><span>Perfect</span><span class="legend-none"><i class="lv0"></i> none / skipped</span></div>`;

function historyView({ ym }) {
  const t = M.today();
  const cur = M.monthOf(t);
  const { from, to } = M.monthRange(ym);
  const ps = M.periodStats(state, from, to);
  const dayRows = [];
  for (let d = M.minDate(to, t); d >= from; d = M.addDays(d, -1)) {
    const items = M.plannedItems(state, d);
    if (!items.length) continue;
    const s = M.dayStats(state, d);
    const missedByHabit = new Map();
    if (d < t) items.filter(i => !i.done && !i.skipped).forEach(i => missedByHabit.set(i.habit.id, { h: i.habit, n: (missedByHabit.get(i.habit.id)?.n || 0) + 1, total: i.v.occurrences.length }));
    const missed = [...missedByHabit.values()];
    const skipNote = s.skipped ? ` <span class="muted">· ${s.skipped} skipped</span>` : '';
    let metaHtml;
    if (!s.planned) metaHtml = '<span class="muted">Skipped day</span>';
    else if (d === t) metaHtml = `<span class="muted">Today · ${M.fmtNum(s.done)}/${s.planned} so far</span>${skipNote}`;
    else if (missed.length) metaHtml = `<span class="missed-txt">Missed: ${missed.slice(0, 3).map(m => esc(m.h.name) + (m.total > 1 ? ` (${m.n})` : '')).join(', ')}${missed.length > 3 ? ` +${missed.length - 3}` : ''}</span>${skipNote}`;
    else metaHtml = `<span class="ok-txt">Everything done ✓</span>${skipNote}`;
    dayRows.push(`<li><a href="#/day/${d}" class="log-row">
      <div class="log-date"><b>${M.parse(d).getDate()}</b><span>${M.WEEKDAYS_SHORT[M.weekday(d)]}</span></div>
      <div class="log-main">
        <div class="log-bar"><i class="lv${M.heatLevel(s.pct)}" style="width:${(s.pct || 0) * 100}%"></i></div>
        <div class="log-meta">${metaHtml}</div>
      </div>
      <div class="log-pct">${s.planned ? pctText(s.pct) : '—'}</div>
    </a></li>`);
  }
  return `
  <header class="page-head"><div><div class="eyebrow">History</div><h1>${M.fmtMonth(ym)}</h1><div class="sub">Tap any day to see exactly what was completed, skipped and missed.</div></div>
    <div class="day-nav">
      <a class="icon-btn" href="#/history/${M.addMonths(ym, -1)}" aria-label="Previous month">${icon('left')}</a>
      ${ym === cur ? '' : `<a class="btn ghost sm" href="#/history">This month</a>`}
      ${ym < cur ? `<a class="icon-btn" href="#/history/${M.addMonths(ym, 1)}" aria-label="Next month">${icon('right')}</a>` : `<span class="icon-btn disabled">${icon('right')}</span>`}
    </div></header>
  <div class="tiles">
    ${tile('Completion', pctText(ps.pct), `${M.fmtNum(ps.done)} of ${M.fmtNum(ps.planned)} ${unitWord()}`)}
    ${tile('Good days', ps.goodDays, `≥ ${state.settings.goodDayThreshold}% done`)}
    ${tile('Perfect days', ps.perfectDays, '100% done', 'fire')}
    ${tile('Missed', ps.missed, `occurrences${ps.skipped ? ` · ${ps.skipped} skipped` : ''}`, 'bad')}
  </div>
  <div class="two-col">
    <section class="card"><div class="card-head"><h3>Calendar</h3></div>${calendarGrid(ym)}${legend()}</section>
    <section class="card"><div class="card-head"><h3>Day by day</h3></div>
      ${dayRows.length ? `<ul class="log-list">${dayRows.join('')}</ul>` : '<p class="muted pad">No tracked days in this month yet.</p>'}</section>
  </div>`;
}

function tile(label, value, sub, tone = '') {
  return `<div class="tile ${tone}"><span class="t-label">${label}</span><b class="t-val">${value}</b><span class="t-sub">${sub}</span></div>`;
}

/* =========================================================
   Progress
   ========================================================= */
function heatmap() {
  const t = M.today();
  const ws = state.settings.weekStart;
  const start = M.addDays(M.weekStartOf(t, ws), -7 * 25);
  let cells = '';
  let months = '';
  for (let w = 0; w < 26; w++) {
    const wd = M.addDays(start, w * 7);
    const d0 = M.parse(wd);
    const showM = w === 0 || d0.getDate() <= 7;
    months += `<span>${showM ? d0.toLocaleDateString('en-GB', { month: 'short' }) : ''}</span>`;
    for (let i = 0; i < 7; i++) {
      const d = M.addDays(wd, i);
      if (d > t) { cells += '<i class="hm future"></i>'; continue; }
      const s = M.dayStats(state, d);
      cells += `<a href="#/day/${d}" class="hm lv${M.heatLevel(s.pct)}" title="${M.fmtDate(d, { day: 'numeric', month: 'short' })}: ${s.planned ? pctText(s.pct) : s.total ? 'skipped' : '—'}"></a>`;
    }
  }
  const labels = M.weekdayOrder(ws).map((d, i) => `<span>${i % 2 === 0 ? M.WEEKDAYS_SHORT[d].slice(0, 2) : ''}</span>`).join('');
  return `<div class="heatmap"><div class="hm-days">${labels}</div><div class="heatmap-scroll"><div class="hm-months">${months}</div><div class="hm-grid">${cells}</div></div></div>`;
}

function barChart(days) {
  const t = M.today();
  const many = days.length > 10;
  return `<div class="bars ${many ? 'many' : ''}">${days.map(s => {
    const h = s.pct === null ? 0 : Math.max(3, s.pct * 100);
    const d = M.parse(s.date);
    const lbl = many ? d.getDate() : M.WEEKDAYS_SHORT[d.getDay()];
    return `<a href="#/day/${s.date}" class="bar ${s.date === t ? 'is-today' : ''} ${s.future ? 'future' : ''}" title="${M.fmtDate(s.date, { day: 'numeric', month: 'short' })}: ${pctText(s.pct)}">
      ${many ? '' : `<span class="bar-val">${s.pct === null ? '' : pctText(s.pct)}</span>`}
      <span class="bar-track"><i class="lv${M.heatLevel(s.pct)}" style="height:${h}%"></i></span>
      <span class="bar-lbl">${lbl}</span></a>`;
  }).join('')}</div>`;
}

function weeklyGoalsCard(goals, mode) {
  if (!goals.length) return '';
  const rows = goals.map(g => {
    const h = g.habit;
    if (mode === 'week') {
      const w = g.weeks[0];
      const met = w.count >= w.target;
      const status = met ? '<span class="achv">Goal reached 🎉</span>' : w.ongoing ? `<span class="muted">${w.target - w.count} to go</span>` : `<span class="bad-txt">Missed by ${w.target - w.count}</span>`;
      const dots = Array.from({ length: w.target }, (_, i) => `<i class="${i < w.count ? 'on' : ''}"></i>`).join('');
      return `<li class="wg-row"><span class="h-icon sm" style="--hc:${h.color}">${esc(h.icon)}</span>
        <div class="wg-main"><div class="hn">${esc(h.name)}</div><div class="dots ${met ? 'met' : ''}">${dots}</div></div>
        <div class="wg-side"><b>${w.count}/${w.target}</b>${status}</div></li>`;
    }
    const counted = g.ended + g.weeks.filter(w => w.ongoing && w.count >= w.target).length;
    const bars = g.weeks.map(w => `<i class="${w.count >= w.target ? 'met' : w.ongoing ? 'ongoing' : 'miss'}" title="Week of ${M.fmtDate(w.start, { day: 'numeric', month: 'short' })}: ${w.count}/${w.target}"></i>`).join('');
    return `<li class="wg-row"><span class="h-icon sm" style="--hc:${h.color}">${esc(h.icon)}</span>
      <div class="wg-main"><div class="hn">${esc(h.name)}</div><div class="wk-bars">${bars}</div></div>
      <div class="wg-side"><b>${g.met}/${counted || 0}</b><span class="muted">weeks met</span></div></li>`;
  }).join('');
  return `<section class="card"><div class="card-head"><h3>Weekly goals</h3><span class="muted small">Tracked separately from the daily rate</span></div><ul class="wg-list">${rows}</ul></section>`;
}

function progressView({ mode, date }) {
  const t = M.today();
  let range, prevRange, label, prevHref, nextHref, canNext;
  if (mode === 'week') {
    range = M.weekRange(state, date);
    prevRange = M.weekRange(state, M.addDays(range.from, -7));
    const f = M.parse(range.from), e = M.parse(range.to);
    label = `${f.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${e.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    prevHref = `#/progress/week/${M.addDays(range.from, -7)}`;
    nextHref = `#/progress/week/${M.addDays(range.from, 7)}`;
    canNext = range.to < t;
  } else {
    const ym = M.monthOf(date);
    range = M.monthRange(ym);
    prevRange = M.monthRange(M.addMonths(ym, -1));
    label = M.fmtMonth(ym);
    prevHref = `#/progress/month/${M.addMonths(ym, -1)}-01`;
    nextHref = `#/progress/month/${M.addMonths(ym, 1)}-01`;
    canNext = range.to < t;
  }
  const ps = M.periodStats(state, range.from, range.to);
  const ongoing = range.from <= t && range.to >= t;
  const cmp = M.comparableRange(range, prevRange);
  const prev = M.periodStats(state, cmp.from, cmp.to);
  let delta = '';
  if (ps.pct !== null && prev.pct !== null) {
    const dd = Math.round((ps.pct - prev.pct) * 100);
    delta = `<span class="delta ${dd >= 0 ? 'up' : 'down'}">${dd >= 0 ? '▲' : '▼'} ${Math.abs(dd)} pts vs ${ongoing ? 'same point last ' + mode : 'last ' + mode}</span>`;
  }
  const goals = M.weeklyGoals(state, range.from, range.to);

  const gb = M.groupBreakdown(state, range.from, range.to)
    .map(r => ({ ...r, g: groupOf(r.groupId === '_none' ? null : r.groupId) }))
    .sort((a, b) => a.g.order - b.g.order);
  const groupBars = gb.length ? gb.map(r => `<div class="hbar"><div class="hbar-top"><span>${esc(r.g.icon)} ${esc(r.g.name)}</span><b>${pctText(r.done / r.planned)}</b></div>
      <div class="hbar-track"><i style="width:${(r.done / r.planned) * 100}%"></i></div><div class="hbar-sub">${r.done} of ${r.planned}</div></div>`).join('')
    : '<p class="muted">No data for this period yet.</p>';

  const habitRows = M.sortedHabits(state)
    .filter(h => M.startDate(h) <= range.to)
    .map(h => ({ h, s: M.habitStats(state, h, range.from, range.to) }))
    .filter(x => x.s.planned > 0)
    .map(({ h, s }) => `<tr>
      <td><div class="hcell"><span class="h-icon sm" style="--hc:${h.color}">${esc(h.icon)}</span><span class="hn">${esc(h.name)}</span></div>${h.archived ? ' <span class="badge">Archived</span>' : ''}</td>
      <td><div class="rate"><div class="rate-bar"><i style="width:${(s.pct || 0) * 100}%"></i></div><b>${pctText(s.pct)}</b></div></td>
      <td class="num hide-xs">${s.done}/${s.planned}</td>
      <td class="num">${s.unit === 'weeks' ? `${s.streak} wk` : `${s.streak} d`}</td>
      <td class="num ${s.missed ? 'bad-txt' : ''}">${s.missed}</td>
    </tr>`).join('');

  const avgDaily = ps.trackedDays ? (ps.days.filter(d => d.planned).reduce((a, d) => a + d.pct, 0) / ps.trackedDays) : null;

  return `
  <header class="page-head"><div><div class="eyebrow">Progress</div><h1>${label}</h1><div class="sub">Completion rate counts daily habits${ps.skipped ? '; skipped items are excluded' : ''}. Weekly goals are shown on their own.</div></div>
    <div class="day-nav">
      <div class="seg compact">
        <a href="#/progress/week/${date}" class="${mode === 'week' ? 'on' : ''}">Week</a>
        <a href="#/progress/month/${date}" class="${mode === 'month' ? 'on' : ''}">Month</a>
      </div>
      <a class="icon-btn" href="${prevHref}" aria-label="Previous">${icon('left')}</a>
      ${canNext ? `<a class="icon-btn" href="${nextHref}" aria-label="Next">${icon('right')}</a>` : `<span class="icon-btn disabled">${icon('right')}</span>`}
    </div></header>
  <div class="tiles">
    ${tile('Completion rate', pctText(ps.pct), delta || `${M.fmtNum(ps.done)} of ${M.fmtNum(ps.planned)} done`)}
    ${tile('Completed', M.fmtNum(ps.done), `of ${M.fmtNum(ps.planned)} ${unitWord()}${ongoing ? ' so far' : ''}`)}
    ${tile('Good days', `${ps.goodDays}<small>/${ps.trackedDays}</small>`, `days ≥ ${state.settings.goodDayThreshold}%`)}
    ${tile('Current streak', `${M.overallStreak(state)}<small> d</small>`, 'good days in a row', 'fire')}
  </div>
  <section class="card"><div class="card-head"><h3>Daily completion</h3><span class="muted">avg ${pctText(avgDaily)}</span></div>${barChart(ps.days)}</section>
  ${weeklyGoalsCard(goals, mode)}
  <div class="two-col narrow-first">
    <section class="card"><div class="card-head"><h3>By group</h3></div><div class="hbars">${groupBars}</div></section>
    <section class="card"><div class="card-head"><h3>By habit</h3></div>
      ${habitRows ? `<div class="table-wrap"><table class="htable"><thead><tr><th>Habit</th><th>Rate</th><th class="num hide-xs">Done</th><th class="num">Streak</th><th class="num">Missed</th></tr></thead><tbody>${habitRows}</tbody></table></div>` : '<p class="muted">No habits were planned in this period.</p>'}
    </section>
  </div>
  <section class="card"><div class="card-head"><h3>Consistency · last 26 weeks</h3></div>${heatmap()}${legend()}</section>`;
}

/* =========================================================
   Habits management
   ========================================================= */
function manageHabitRow(h) {
  const t = M.today();
  const cur = M.currentVersion(h);
  const latest = M.latestVersion(h);
  const upcoming = M.upcomingVersion(h);
  const paused = cur.status === 'paused';
  const notStarted = M.startDate(h) > t;
  let badges = '';
  if (h.sample) badges += '<span class="badge sample">Sample</span>';
  if (paused) badges += '<span class="badge warn">Paused</span>';
  if (upcoming) {
    const txt = upcoming.status === 'paused' && !paused ? 'Pauses tomorrow' : upcoming.status === 'archived' ? 'Archives tomorrow' : 'Changes tomorrow';
    badges += `<span class="badge info" title="Today keeps its current plan">${txt}</span>`;
  }
  if (notStarted) badges += `<span class="badge">Starts ${M.fmtDate(M.startDate(h), { day: 'numeric', month: 'short' })}</span>`;
  const pausedNext = latest.status === 'paused';
  const named = latest.occurrences.length > 1 && latest.occurrences.some(o => o.label);
  const reorder = ui.reorder;
  return `<li class="m-row ${paused ? 'paused' : ''}" style="--hc:${h.color}" data-drag-id="${h.id}">
    ${reorder ? `<span class="drag-handle" aria-hidden="true">${icon('grip')}</span>` : ''}
    <button class="m-main" data-action="${reorder ? 'noop' : 'edit-habit'}" data-id="${h.id}" ${reorder ? 'tabindex="-1"' : ''}>
      <span class="h-icon">${esc(h.icon)}</span>
      <span class="m-text"><span class="h-name">${esc(h.name)} ${badges}</span>
        <span class="h-meta">${esc(M.scheduleLabel(latest, state.settings.weekStart))}${named ? ' — ' + latest.occurrences.map((o, i) => esc(occLabel(o, i))).join(', ') : ''}</span></span>
    </button>
    <div class="m-actions">
      ${reorder ? `
        <button class="icon-btn sm" data-action="habit-up" data-id="${h.id}" aria-label="Move ${esc(h.name)} up">${icon('up')}</button>
        <button class="icon-btn sm" data-action="habit-down" data-id="${h.id}" aria-label="Move ${esc(h.name)} down">${icon('down')}</button>` : `
        <button class="icon-btn sm" data-action="${pausedNext ? 'resume' : 'pause'}" data-id="${h.id}" title="${pausedNext ? 'Resume — show it on your days again' : 'Pause — hide it from your days for now; history is kept'}" aria-label="${pausedNext ? 'Resume' : 'Pause'} ${esc(h.name)}">${icon(pausedNext ? 'play' : 'pause')}</button>
        <button class="icon-btn sm" data-action="edit-habit" data-id="${h.id}" title="Edit" aria-label="Edit ${esc(h.name)}">${icon('edit')}</button>`}
    </div>
  </li>`;
}

function habitsView() {
  const groups = M.sortedGroups(state);
  const active = M.sortedHabits(state).filter(h => !h.archived);
  const archived = M.sortedHabits(state).filter(h => h.archived);
  const groupIdOf = h => M.latestVersion(h).groupId || null;
  const byGroup = id => active.filter(h => groupIdOf(h) === id);
  const ungrouped = active.filter(h => { const g = groupIdOf(h); return !g || !state.groups.get(g) || state.groups.get(g).deleted; });
  const reorder = ui.reorder;

  const groupCards = groups.map((g, i) => {
    const hs = byGroup(g.id);
    return `<article class="card m-group" style="--gc:${g.color || 'var(--primary)'}" data-drag-id="${g.id}">
      <header class="g-head">
        ${reorder ? `<span class="drag-handle group-handle" aria-hidden="true">${icon('grip')}</span>` : ''}
        <span class="g-icon">${esc(g.icon || '📁')}</span>
        <div class="g-title"><h3>${esc(g.name)} ${g.sample ? '<span class="badge sample">Sample</span>' : ''}</h3>${g.description ? `<p class="g-sub">${esc(g.description)}</p>` : ''}</div>
        <div class="m-actions">
          ${reorder ? `
          <button class="icon-btn sm" data-action="group-up" data-id="${g.id}" ${i === 0 ? 'disabled' : ''} aria-label="Move group ${esc(g.name)} up">${icon('up')}</button>
          <button class="icon-btn sm" data-action="group-down" data-id="${g.id}" ${i === groups.length - 1 ? 'disabled' : ''} aria-label="Move group ${esc(g.name)} down">${icon('down')}</button>` : `
          <button class="icon-btn sm" data-action="edit-group" data-id="${g.id}" aria-label="Edit group ${esc(g.name)}">${icon('edit')}</button>
          <button class="icon-btn sm danger" data-action="delete-group" data-id="${g.id}" aria-label="Delete group ${esc(g.name)}">${icon('trash')}</button>`}
        </div>
      </header>
      ${hs.length ? `<ul class="m-list" data-sort="habits">${hs.map(manageHabitRow).join('')}</ul>` : '<p class="muted pad">No habits in this group yet.</p>'}
      ${reorder ? '' : `<button class="add-inline" data-action="new-habit" data-group="${g.id}">${icon('plus')} Add habit to ${esc(g.name)}</button>`}
    </article>`;
  }).join('');

  const ungroupedCard = ungrouped.length ? `<article class="card m-group" style="--gc:#7C8EA8">
      <header class="g-head"><span class="g-icon">📁</span><div class="g-title"><h3>Ungrouped</h3><p class="g-sub">Edit a habit to move it into a group</p></div></header>
      <ul class="m-list" data-sort="habits">${ungrouped.map(manageHabitRow).join('')}</ul></article>` : '';

  const archivedCard = archived.length && !reorder ? `<details class="card archived"><summary>${icon('archive')} Archived habits <span class="muted">(${archived.length})</span></summary>
      <p class="muted">Archived habits are hidden from your days, but their history is kept.</p>
      <ul class="m-list">${archived.map(h => `<li class="m-row" style="--hc:${h.color}"><div class="m-main static"><span class="h-icon">${esc(h.icon)}</span><span class="m-text"><span class="h-name">${esc(h.name)}${M.upcomingVersion(h) ? ' <span class="badge info">Archives tomorrow</span>' : ''}</span><span class="h-meta">Tracked since ${M.fmtDate(M.startDate(h), { day: 'numeric', month: 'short', year: 'numeric' })}</span></span></div>
        <div class="m-actions"><button class="btn ghost sm" data-action="restore" data-id="${h.id}">Restore</button><button class="icon-btn sm danger" data-action="delete-forever" data-id="${h.id}" aria-label="Delete ${esc(h.name)} permanently">${icon('trash')}</button></div></li>`).join('')}</ul></details>` : '';

  const empty = !groups.length && !active.length ? `<div class="empty card"><div class="empty-emoji">🧩</div><h3>Start with a group</h3>
      <p>Groups keep your day organised — e.g. Morning Routine, Prayer &amp; Worship, Health, Career.</p>
      <div class="row-gap"><button class="btn primary" data-action="new-group">${icon('folder')} New group</button><button class="btn ghost" data-action="new-habit">${icon('plus')} New habit</button></div></div>` : '';

  const canReorder = groups.length > 1 || active.length > 1;
  const headActions = reorder
    ? `<button class="btn primary" data-action="reorder">${icon('check')} Done</button>`
    : `${canReorder ? `<button class="btn ghost" data-action="reorder" title="Reorder groups and habits">${icon('sort')}<span class="hide-xs">Reorder</span></button>` : ''}
       <button class="btn ghost" data-action="new-group">${icon('folder')} <span class="hide-xs">New</span> group</button>
       <button class="btn primary" data-action="new-habit">${icon('plus')} <span class="hide-xs">New</span> habit</button>`;

  return `
  <header class="page-head"><div><div class="eyebrow">Manage</div><h1>Habits &amp; groups</h1><div class="sub">${plural(active.length, 'habit')} in ${plural(groups.length, 'group')}. Schedule changes never rewrite past days.</div></div>
    <div class="day-nav">${headActions}</div></header>
  ${reorder ? `<div class="notice reorder-notice">${icon('grip')} Drag the handles to reorder — or use the arrows. Habits move within their group.</div>` : ''}
  ${empty}
  <div class="m-groups ${reorder ? 'reordering' : ''}" data-sort="groups">${groupCards}</div>
  ${ungroupedCard ? `<div class="m-groups">${ungroupedCard}</div>` : ''}
  ${archivedCard}`;
}

/* =========================================================
   Settings
   ========================================================= */
let persisted = null;
function settingsView() {
  const s = state.settings;
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const lastBackup = s.lastBackup ? M.fmtDate(s.lastBackup.slice(0, 10), { day: 'numeric', month: 'short', year: 'numeric' }) : 'never';
  const snap = state.snapshot;
  const address = location.origin + location.pathname;
  return `
  <header class="page-head"><div><div class="eyebrow">Settings</div><h1>Make it yours</h1></div></header>
  <div class="settings">
    <section class="card">
      <h3>Personal</h3>
      <label class="field"><span>Your name <em>(for the greeting)</em></span><input type="text" data-setting="name" value="${esc(s.name)}" placeholder="e.g. Ashraf" maxlength="40"></label>
      <label class="field"><span>Week starts on</span>
        <select data-setting="weekStart">${[6, 0, 1].map(d => `<option value="${d}" ${s.weekStart === d ? 'selected' : ''}>${M.WEEKDAYS_LONG[d]}</option>`).join('')}</select></label>
      <label class="field"><span>A day counts as "good" at <b id="thr-val">${s.goodDayThreshold}%</b></span>
        <input type="range" min="50" max="100" step="5" data-setting="goodDayThreshold" value="${s.goodDayThreshold}"></label>
      <label class="field"><span>How the daily % is weighted</span>
        <select data-setting="scoring">
          <option value="occurrence" ${s.scoring !== 'habit' ? 'selected' : ''}>Each occurrence counts the same</option>
          <option value="habit" ${s.scoring === 'habit' ? 'selected' : ''}>Each habit counts the same</option>
        </select>
        <em class="hint">${s.scoring === 'habit' ? 'A habit with 8 occurrences weighs the same as a once-a-day habit; each occurrence is a fraction of it.' : 'Every planned occurrence (e.g. each prayer, each glass of water) is one point.'}</em></label>
      <label class="switch-row"><span>Show Hijri date</span><input type="checkbox" class="switch" data-setting="showHijri" ${s.showHijri ? 'checked' : ''}></label>
      <div class="field"><span>Appearance</span><div class="seg compact">${['auto', 'light', 'dark'].map(t => `<button data-action="theme" data-t="${t}" class="${s.theme === t ? 'on' : ''}">${t[0].toUpperCase() + t.slice(1)}</button>`).join('')}</div></div>
    </section>
    <section class="card">
      <h3>App</h3>
      ${standalone ? `<p class="ok-line">${icon('check')} Running as an installed app.</p>`
        : ui.deferredInstall ? `<p>Install Daily Habits for a full-screen app with its own icon.</p><button class="btn primary" data-action="install">${icon('install')} Install app</button>`
        : `<p class="muted">To install: open this site in Chrome, then use the install icon in the address bar (desktop) or menu ⋮ → <b>Install app</b> / <b>Add to Home screen</b> (Android).</p>`}
      <p class="muted small">Works offline once loaded. Version ${APP_VERSION}.</p>
    </section>
    <section class="card">
      <h3>Your data</h3>
      <p>Everything is saved on this device in the browser's database (IndexedDB) — no account, no server.
        ${persisted === true ? `<span class="ok-line inline">${icon('check')} Storage is marked persistent.</span>` : ''}</p>
      <div class="callout">${icon('info')}<div><b>Your data belongs to this exact address:</b> <code>${esc(address)}</code><br>
        If the app ever moves (renamed repository, custom domain, new host), export a backup here first and restore it at the new address — otherwise the new address starts empty.</div></div>
      <p class="muted small">Data doesn't sync between devices automatically. Use backup &amp; restore to move it. Last backup: <b>${lastBackup}</b>.</p>
      <div class="row-gap">
        <button class="btn" data-action="export">${icon('download')} Export backup</button>
        <button class="btn" data-action="import">${icon('upload')} Restore from backup</button>
        <input type="file" id="import-file" accept="application/json,.json" hidden>
      </div>
      ${snap ? `<div class="danger-zone"><div><b>Bring back previous data</b><p class="muted small">Saved automatically before your last ${esc(snap.reason === 'erase' ? 'erase' : snap.reason === 'undo' ? 'undo' : 'restore')} (${new Date(snap.at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} · ${snap.summary ? `${snap.summary.habits} habits, ${snap.summary.completions} records` : ''}).</p></div><button class="btn" data-action="undo-snapshot">${icon('undo')} Bring back</button></div>` : ''}
      ${S.hasSamples() ? `<div class="danger-zone"><div><b>Sample data</b><p class="muted small">Remove the demo groups and habits marked “Sample”.</p></div><button class="btn" data-action="remove-samples">Remove samples</button></div>` : ''}
      <div class="danger-zone"><div><b>Erase everything</b><p class="muted small">Deletes all habits, groups and history on this device. A copy is kept so you can bring it back.</p></div><button class="btn danger" data-action="erase">Erase</button></div>
    </section>
  </div>`;
}

/* =========================================================
   Modals, dialogs, toasts
   ========================================================= */
const modalRoot = document.getElementById('modal-root');
let lastFocus = null;

function openModal({ title, body, footer = '', onMount, size = '' }) {
  lastFocus = document.activeElement;
  const wrap = document.createElement('div');
  wrap.className = 'modal-backdrop';
  wrap.innerHTML = `<div class="modal ${size}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
    <header class="modal-head"><h2>${esc(title)}</h2><button class="icon-btn" data-close aria-label="Close">${icon('x')}</button></header>
    <div class="modal-body">${body}</div>
    ${footer ? `<footer class="modal-foot">${footer}</footer>` : ''}
  </div>`;
  modalRoot.appendChild(wrap);
  document.body.classList.add('modal-open');
  requestAnimationFrame(() => wrap.classList.add('show'));
  const close = () => {
    wrap.classList.remove('show');
    setTimeout(() => { wrap.remove(); if (!modalRoot.children.length) document.body.classList.remove('modal-open'); lastFocus?.focus?.(); }, 180);
  };
  wrap.addEventListener('click', e => { if (e.target === wrap || e.target.closest('[data-close]')) close(); });
  wrap.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  onMount?.(wrap.querySelector('.modal'), close);
  setTimeout(() => wrap.querySelector('[autofocus]')?.focus() || wrap.querySelector('.modal-head .icon-btn')?.focus(), 50);
  return close;
}

function confirmDialog({ title, message, confirmText = 'Confirm', danger = false }) {
  return new Promise(resolve => {
    let result = false;
    const close = openModal({
      title, size: 'small',
      body: `<p>${message}</p>`,
      footer: `<button class="btn ghost" data-close>Cancel</button><button class="btn ${danger ? 'danger' : 'primary'}" data-ok>${esc(confirmText)}</button>`,
      onMount: (el, close) => {
        el.querySelector('[data-ok]').addEventListener('click', () => { result = true; close(); });
        const obs = new MutationObserver(() => { if (!el.isConnected) { obs.disconnect(); resolve(result); } });
        obs.observe(modalRoot, { childList: true });
      },
    });
  });
}

function toast(msg, { action, onAction, timeout = 3200 } = {}) {
  const root = document.getElementById('toast-root');
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<span>${msg}</span>${action ? `<button>${esc(action)}</button>` : ''}`;
  root.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  const remove = () => { el.classList.remove('show'); setTimeout(() => el.remove(), 250); };
  if (action) el.querySelector('button').addEventListener('click', () => { onAction?.(); remove(); });
  setTimeout(remove, timeout);
}

// Generic multiple-choice dialog → resolves with the chosen value, or null if dismissed.
function choiceDialog({ title, message = '', choices, cancelText = 'Cancel' }) {
  return new Promise(resolve => {
    let result = null;
    openModal({
      title, size: 'small',
      body: `${message ? `<p>${message}</p>` : ''}<div class="choice-list">${choices.map((c, i) => `
        <button class="choice ${c.danger ? 'danger' : ''} ${c.recommended ? 'recommended' : ''}" data-ci="${i}">
          <span>${icon(c.icon || 'check')}</span><div><b>${esc(c.title)}${c.recommended ? ' <em class="rec">Recommended</em>' : ''}</b><p>${c.desc}</p></div></button>`).join('')}</div>`,
      footer: `<button class="btn ghost" data-close>${esc(cancelText)}</button>`,
      onMount: (el, close) => {
        el.querySelectorAll('[data-ci]').forEach(b => b.addEventListener('click', () => { result = choices[+b.dataset.ci].value; close(); }));
        const obs = new MutationObserver(() => { if (!el.isConnected) { obs.disconnect(); resolve(result); } });
        obs.observe(modalRoot, { childList: true });
      },
    });
  });
}

// B1: when today already has ticks, let the user decide when a change starts.
function askApplyFrom(what = 'this change') {
  return choiceDialog({
    title: 'When should this start?',
    message: `You've already ticked this habit today. Choose when ${what} takes effect.`,
    choices: [
      { value: 'tomorrow', icon: 'calendar', title: 'From tomorrow', desc: 'Today keeps its current plan and ticks exactly as they are.', recommended: true },
      { value: 'today', icon: 'clock', title: 'From today', desc: "Today's plan changes now; today's percentage is recalculated." },
    ],
  });
}

async function run(fn, okMsg) {
  try { const r = await fn(); if (okMsg) toast(okMsg); return r; }
  catch (err) { console.error(err); toast(`⚠️ ${esc(err.message || 'Something went wrong')} Nothing was changed.`, { timeout: 6000 }); return undefined; }
}

/* ---------- Habit form ---------- */
const PRESETS = [
  { label: '5 daily prayers', names: ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] },
  { label: 'Morning & evening', names: ['Morning', 'Evening'] },
  { label: 'Morning · Noon · Night', names: ['Morning', 'Noon', 'Night'] },
];

function habitForm(habitId = null, preset = {}) {
  const h = habitId ? state.habits.get(habitId) : null;
  const v = h ? M.latestVersion(h) : null; // edit what applies going forward
  const t = M.today();
  const groups = M.sortedGroups(state);
  const data = {
    name: h?.name || '',
    icon: h?.icon || '✨',
    color: h?.color || COLORS[state.habits.size % COLORS.length],
    groupId: v ? v.groupId : (preset.groupId ?? groups[0]?.id ?? null),
    type: v?.schedule.type || 'daily',
    days: v?.schedule.days?.length ? [...v.schedule.days] : [0, 1, 2, 3, 4, 5, 6],
    perWeek: v?.schedule.perWeek || 3,
    occs: v ? v.occurrences.map(o => ({ id: o.id, label: o.label })) : [{ id: null, label: '' }],
    status: v?.status === 'paused' ? 'paused' : 'active',
    notes: h?.notes || '',
    startDate: h ? M.startDate(h) : t,
  };
  const canEditStart = !h || (h.versions.length === 1 && M.startDate(h) >= t);
  const ws = state.settings.weekStart;

  const body = `<form id="habit-form" novalidate>
    <div class="form-top">
      <button type="button" class="emoji-btn" id="emoji-toggle" aria-label="Choose icon" style="--hc:${data.color}">${esc(data.icon)}</button>
      <label class="field grow"><span>Habit name</span><input name="name" required maxlength="60" value="${esc(data.name)}" placeholder="e.g. Read Quran, Walk 30 min" autofocus></label>
    </div>
    <div class="emoji-panel" id="emoji-panel" hidden>
      <div class="emoji-grid">${EMOJIS.map(e => `<button type="button" data-emoji="${e}">${e}</button>`).join('')}</div>
      <label class="field"><span>Or type any emoji</span><input id="emoji-custom" maxlength="4" placeholder="🙂"></label>
    </div>
    <div class="field"><span>Icon color</span><div class="swatches">${(COLORS.includes(data.color) ? COLORS : [data.color, ...COLORS]).map(c => `<button type="button" class="sw ${c === data.color ? 'on' : ''}" data-color="${c}" style="--c:${c}" aria-label="Color ${c}"></button>`).join('')}</div></div>
    <label class="field"><span>Group</span>
      <select name="groupId">
        ${groups.map(g => `<option value="${g.id}" ${g.id === data.groupId ? 'selected' : ''}>${esc(g.icon || '')} ${esc(g.name)}</option>`).join('')}
        <option value="" ${!data.groupId ? 'selected' : ''}>No group</option>
        <option value="__new">+ New group…</option>
      </select></label>
    <div class="new-group-inline" id="new-group-inline" hidden>
      <input id="new-group-name" placeholder="New group name" maxlength="40">
    </div>

    <div class="field"><span>Frequency</span>
      <div class="seg full" id="freq">
        <button type="button" data-type="daily" class="${data.type === 'daily' ? 'on' : ''}">Every day</button>
        <button type="button" data-type="days" class="${data.type === 'days' ? 'on' : ''}">Specific days</button>
        <button type="button" data-type="weekly" class="${data.type === 'weekly' ? 'on' : ''}">Weekly goal</button>
      </div></div>
    <div class="field" id="days-field" ${data.type === 'days' ? '' : 'hidden'}><span>On these days</span>
      <div class="daypick">${M.weekdayOrder(ws).map(d => `<button type="button" data-day="${d}" class="${data.days.includes(d) ? 'on' : ''}" aria-pressed="${data.days.includes(d)}">${M.WEEKDAYS_SHORT[d]}</button>`).join('')}</div></div>
    <div class="field" id="weekly-field" ${data.type === 'weekly' ? '' : 'hidden'}><span>Times per week</span>
      <div class="stepper" data-stepper="perWeek"><button type="button" data-step="-1" aria-label="Fewer">−</button><output id="perWeek">${data.perWeek}</output><button type="button" data-step="1" aria-label="More">+</button></div>
      <p class="hint">Tick any day you do it. Weekly goals are tracked on their own, separate from the daily %.</p></div>

    <div id="times-block" ${data.type === 'weekly' ? 'hidden' : ''}>
      <div class="field"><span>Times per day</span>
        <div class="row-gap center">
          <div class="stepper" data-stepper="times"><button type="button" data-step="-1" aria-label="Remove last occurrence">−</button><output id="times">${data.occs.length}</output><button type="button" data-step="1" aria-label="Add occurrence">+</button></div>
          <div class="presets">${PRESETS.map((p, i) => `<button type="button" class="chip" data-preset="${i}">${p.label}</button>`).join('')}</div>
        </div></div>
      <div class="field" id="labels-field" ${data.occs.length > 1 ? '' : 'hidden'}><span>Occurrences <em>(each gets its own checkbox; names are optional)</em></span>
        <div class="occ-editor" id="occ-editor"></div>
        ${h ? '<p class="hint">Removing an occurrence only affects today onward — past ticks stay in your history.</p>' : ''}
      </div>
    </div>

    ${canEditStart ? `<label class="field"><span>Start tracking on</span><input type="date" name="startDate" value="${data.startDate}">
      <em class="warn-text" id="start-warn" hidden></em></label>` : `<p class="hint">Tracking since ${M.fmtDate(data.startDate, { day: 'numeric', month: 'long', year: 'numeric' })}. Schedule changes never rewrite earlier days.</p>`}
    ${h ? `<label class="switch-row"><span>Paused <em>— hidden from your days for now; history is kept</em></span><input type="checkbox" class="switch" name="paused" ${data.status === 'paused' ? 'checked' : ''}></label>` : ''}
    <label class="field"><span>Notes <em>(optional)</em></span><textarea name="notes" rows="2" maxlength="300" placeholder="Why this habit matters, cues, details…">${esc(data.notes)}</textarea></label>
    <p class="form-error" id="form-error" role="alert"></p>
  </form>`;

  const footer = `${h ? `<button class="btn ghost danger-text" data-del>${icon('trash')} Remove…</button>` : ''}<span class="spacer"></span>
    <button class="btn ghost" data-close>Cancel</button><button class="btn primary" data-save>${h ? 'Save changes' : 'Add habit'}</button>`;

  openModal({
    title: h ? 'Edit habit' : 'New habit', body, footer,
    onMount: (el, close) => {
      const form = el.querySelector('#habit-form');
      const editor = el.querySelector('#occ-editor');
      // A2: every occurrence row keeps its own id; removing one never shifts the others.
      const renderOccs = () => {
        editor.innerHTML = data.occs.map((o, i) => `<div class="occ-row">
          <span class="occ-n">${i + 1}</span>
          <input data-oi="${i}" value="${esc(o.label)}" placeholder="Occurrence ${i + 1}" maxlength="24" aria-label="Occurrence ${i + 1} name">
          <button type="button" class="icon-btn sm" data-rm="${i}" aria-label="Remove occurrence ${i + 1}${o.label ? ' (' + esc(o.label) + ')' : ''}">${icon('x')}</button>
        </div>`).join('');
        el.querySelector('#labels-field').hidden = data.occs.length < 2;
        el.querySelector('#times').textContent = data.occs.length;
      };
      renderOccs();
      editor.addEventListener('input', e => { const i = e.target.dataset.oi; if (i !== undefined) data.occs[+i].label = e.target.value; });
      editor.addEventListener('click', e => {
        const b = e.target.closest('[data-rm]'); if (!b || data.occs.length < 2) return;
        data.occs.splice(+b.dataset.rm, 1); renderOccs();
      });

      el.querySelector('#emoji-toggle').addEventListener('click', () => { const p = el.querySelector('#emoji-panel'); p.hidden = !p.hidden; });
      const setEmoji = e => { data.icon = e; el.querySelector('#emoji-toggle').textContent = e; };
      el.querySelector('.emoji-grid').addEventListener('click', e => { const b = e.target.closest('[data-emoji]'); if (b) { setEmoji(b.dataset.emoji); el.querySelector('#emoji-panel').hidden = true; } });
      el.querySelector('#emoji-custom').addEventListener('input', e => { if (e.target.value.trim()) setEmoji(e.target.value.trim()); });
      el.querySelector('.swatches').addEventListener('click', e => {
        const b = e.target.closest('[data-color]'); if (!b) return;
        data.color = b.dataset.color;
        el.querySelectorAll('.sw').forEach(s => s.classList.toggle('on', s === b));
        el.querySelector('#emoji-toggle').style.setProperty('--hc', data.color);
      });
      const gsel = form.elements.groupId;
      gsel.addEventListener('change', () => { el.querySelector('#new-group-inline').hidden = gsel.value !== '__new'; if (gsel.value === '__new') el.querySelector('#new-group-name').focus(); });
      el.querySelector('#freq').addEventListener('click', e => {
        const b = e.target.closest('[data-type]'); if (!b) return;
        data.type = b.dataset.type;
        el.querySelectorAll('#freq button').forEach(x => x.classList.toggle('on', x === b));
        el.querySelector('#days-field').hidden = data.type !== 'days';
        el.querySelector('#weekly-field').hidden = data.type !== 'weekly';
        el.querySelector('#times-block').hidden = data.type === 'weekly';
      });
      el.querySelector('.daypick').addEventListener('click', e => {
        const b = e.target.closest('[data-day]'); if (!b) return;
        const d = +b.dataset.day;
        data.days = data.days.includes(d) ? data.days.filter(x => x !== d) : [...data.days, d];
        b.classList.toggle('on'); b.setAttribute('aria-pressed', b.classList.contains('on'));
      });
      el.querySelectorAll('[data-stepper]').forEach(st => st.addEventListener('click', e => {
        const b = e.target.closest('[data-step]'); if (!b) return;
        const step = +b.dataset.step;
        if (st.dataset.stepper === 'perWeek') {
          data.perWeek = Math.min(7, Math.max(1, data.perWeek + step));
          el.querySelector('#perWeek').textContent = data.perWeek;
        } else {
          if (step > 0 && data.occs.length < 24) data.occs.push({ id: null, label: '' });
          if (step < 0 && data.occs.length > 1) data.occs.pop();
          renderOccs();
        }
      }));
      el.querySelector('.presets').addEventListener('click', e => {
        const b = e.target.closest('[data-preset]'); if (!b) return;
        const names = PRESETS[+b.dataset.preset].names;
        // Rename existing occurrences in place (ids kept), add or trim at the end.
        data.occs = names.map((n, i) => ({ id: data.occs[i]?.id || null, label: n }));
        renderOccs();
      });
      // B2: warn when a start date in the past would create missed days.
      const sd = form.elements.startDate;
      const updateStartWarn = () => {
        const w = el.querySelector('#start-warn'); if (!w || !sd) return;
        if (sd.value && sd.value < t) {
          w.hidden = false;
          w.textContent = `⚠️ Starting in the past: every day from ${M.fmtDate(sd.value, { day: 'numeric', month: 'short' })} to yesterday will count as missed unless you open those days and tick them.`;
        } else if (sd.value && sd.value > t) {
          w.hidden = false; w.className = 'hint'; w.textContent = `It will appear on your days from ${M.fmtDate(sd.value, { day: 'numeric', month: 'short' })}.`;
        } else { w.hidden = true; w.className = 'warn-text'; }
      };
      sd?.addEventListener('input', () => { el.querySelector('#start-warn').className = 'warn-text'; updateStartWarn(); });
      updateStartWarn();

      el.querySelector('[data-save]').addEventListener('click', () => form.requestSubmit());
      let saving = false;
      form.addEventListener('submit', async e => {
        e.preventDefault();
        if (saving) return;
        const err = el.querySelector('#form-error');
        err.textContent = '';
        const name = form.elements.name.value.trim();
        if (!name) { err.textContent = 'Give your habit a name.'; form.elements.name.focus(); return; }
        if (data.type === 'days' && !data.days.length) { err.textContent = 'Pick at least one day.'; return; }
        if (sd && !M.isDateStr(sd.value)) { err.textContent = 'Pick a valid start date.'; return; }
        let groupId = gsel.value || null;
        const schedule = { type: data.type, days: data.type === 'days' ? [...data.days].sort((a, b) => a - b) : [], perWeek: data.type === 'weekly' ? data.perWeek : 0 };
        const occs = data.type === 'weekly' ? [data.occs[0] || { id: null, label: '' }] : data.occs;
        const occurrences = occs.map(o => ({ ...(o.id ? { id: o.id } : {}), label: (o.label || '').trim() }));
        saving = true;
        try {
          if (groupId === '__new') {
            const gname = el.querySelector('#new-group-name').value.trim();
            if (!gname) { err.textContent = 'Name the new group.'; el.querySelector('#new-group-name').focus(); return; }
            groupId = (await S.saveGroup({ name: gname, icon: '📁', color: data.color })).id;
          }
          const common = { name, icon: data.icon, color: data.color, notes: form.elements.notes.value.trim(), startDate: sd?.value || undefined };
          if (h) {
            // Only send what actually changed, so pending future changes aren't overwritten.
            const patch = {};
            if ((groupId || null) !== (v.groupId || null)) patch.groupId = groupId;
            const status = form.elements.paused?.checked ? 'paused' : 'active';
            if (status !== (v.status === 'paused' ? 'paused' : 'active')) patch.status = status;
            if (JSON.stringify(schedule) !== JSON.stringify(v.schedule)) patch.schedule = schedule;
            if (JSON.stringify(occurrences) !== JSON.stringify(v.occurrences.map(o => ({ id: o.id, label: o.label })))) patch.occurrences = occurrences;
            let when = 'today';
            if (S.needsApplyChoice(h, patch)) {
              when = await askApplyFrom('these changes');
              if (!when) return; // dialog dismissed: keep the form open
            }
            await S.updateHabit(h.id, { ...common, patch }, when);
            toast(when === 'tomorrow' ? 'Saved — changes start tomorrow' : 'Habit updated');
          } else {
            await S.createHabit({ ...common, groupId, schedule, occurrences });
            await S.setOnboarded();
            toast(`${esc(data.icon)} ${esc(name)} added`);
          }
          close();
        } catch (ex) {
          console.error(ex);
          err.textContent = `${ex.message || 'Could not save.'} Please try again.`;
        } finally { saving = false; }
      });
      el.querySelector('[data-del]')?.addEventListener('click', () => { close(); setTimeout(() => removeHabitDialog(h.id), 200); });
    },
  });
}

// B10: Pause / Archive / Delete, each with a one-line explanation.
async function removeHabitDialog(id) {
  const h = state.habits.get(id);
  const isPaused = M.latestVersion(h).status === 'paused';
  const choices = [
    ...(isPaused ? [] : [{ value: 'pause', icon: 'pause', title: 'Pause', desc: 'Temporary. Hidden from your days until you resume it; nothing is lost.' }]),
    { value: 'archive', icon: 'archive', title: 'Archive', desc: "Stopped for good, but all past records and stats are kept. Restore it anytime." },
    { value: 'delete', icon: 'trash', title: 'Delete permanently', desc: "Erases the habit and every record of it. This can't be undone.", danger: true },
  ];
  const c = await choiceDialog({ title: `Remove “${h.name}”?`, choices });
  if (!c) return;
  if (c === 'delete') {
    if (await confirmDialog({ title: 'Delete permanently?', message: `“${esc(h.name)}” and its full history will be erased.`, confirmText: 'Delete', danger: true })) {
      await run(() => S.deleteHabitForever(id), 'Habit deleted');
    }
    return;
  }
  let when = 'today';
  if (S.todayRecordsFor(id)) { when = await askApplyFrom(c === 'pause' ? 'pausing' : 'archiving'); if (!when) return; }
  if (c === 'pause') await run(() => S.setHabitStatus(id, 'paused', when), when === 'tomorrow' ? 'Pauses from tomorrow — history kept' : 'Paused — history kept');
  else {
    const ok = await run(async () => { await S.archiveHabit(id, when); return true; });
    if (ok) toast(when === 'tomorrow' ? 'Archives from tomorrow' : 'Habit archived', { action: 'Undo', onAction: () => run(() => S.restoreHabit(id)) });
  }
}

// A5: per-habit sheet to mark each occurrence Done / Skipped / Pending for a day.
function habitDaySheet(date, habitId) {
  const h = state.habits.get(habitId);
  const v = M.versionAt(h, date);
  if (!v) return;
  const body = () => {
    const rows = v.occurrences.map((o, i) => {
      const key = M.ckey(date, h.id, o.id);
      const st = M.isSkipped(state, key) ? 'skipped' : M.isDone(state, key) ? 'done' : 'none';
      const opt = (val, label) => `<button type="button" class="${st === val ? 'on' : ''} opt-${val}" data-o="${o.id}" data-st="${val}" aria-pressed="${st === val}">${label}</button>`;
      return `<div class="sheet-row"><span class="occ-name">${esc(v.occurrences.length > 1 ? occLabel(o, i) : h.name)}</span>
        <div class="seg compact tri">${opt('done', 'Done')}${opt('skipped', 'Skip')}${opt('none', date < M.today() ? 'Missed' : 'Pending')}</div></div>`;
    }).join('');
    return `<p class="muted small">${M.fmtDate(date)} · Skipped items don't count as planned or missed, and don't break streaks — use it for travel, illness or any valid excuse.</p>
      <div class="sheet-rows">${rows}</div>
      ${v.occurrences.length > 1 ? `<div class="row-gap"><button type="button" class="btn sm" data-all="skipped">${icon('skip')} Skip all remaining</button><button type="button" class="btn ghost sm" data-all="clear">${icon('undo')} Clear skips</button></div>` : ''}`;
  };
  openModal({
    title: `${h.icon} ${h.name}`, size: 'small', body: `<div id="sheet-body">${body()}</div>`,
    footer: '<button class="btn primary" data-close>Done</button>',
    onMount: (el) => {
      const refresh = () => { el.querySelector('#sheet-body').innerHTML = body(); };
      el.addEventListener('click', async e => {
        const b = e.target.closest('[data-st]');
        if (b) {
          const st = b.dataset.st === 'none' ? null : b.dataset.st;
          await run(() => S.setOccurrenceState(date, h.id, b.dataset.o, st));
          refresh(); return;
        }
        const a = e.target.closest('[data-all]');
        if (a) {
          const states = {};
          v.occurrences.forEach(o => {
            const key = M.ckey(date, h.id, o.id);
            if (a.dataset.all === 'skipped' && !M.isDone(state, key)) states[o.id] = 'skipped';
            if (a.dataset.all === 'clear' && M.isSkipped(state, key)) states[o.id] = null;
          });
          await run(() => S.setHabitDay(date, h.id, states));
          refresh();
        }
      });
    },
  });
}

// A9: validate and preview a backup before anything is replaced.
async function importFlow(file) {
  let data;
  try { data = JSON.parse(await file.text()); }
  catch { toast("⚠️ That file isn't valid JSON. Nothing was changed."); return; }
  const v = M.validateBackup(data);
  if (!v.ok) {
    openModal({ title: "Can't restore this file", size: 'small',
      body: `<p>Nothing was changed. Problems found:</p><ul class="err-list">${v.errors.map(e => `<li>${esc(e)}</li>`).join('')}</ul>`,
      footer: '<button class="btn primary" data-close>OK</button>' });
    return;
  }
  const s = v.summary;
  const range = s.first ? `${M.fmtDate(s.first, { day: 'numeric', month: 'short', year: 'numeric' })} – ${M.fmtDate(s.last, { day: 'numeric', month: 'short', year: 'numeric' })}` : 'no records yet';
  const ok = await confirmDialog({
    title: 'Restore this backup?', confirmText: 'Replace my data', danger: true,
    message: `<span class="preview-box"><b>${plural(s.habits, 'habit')}</b> · ${plural(s.groups, 'group')} · ${plural(s.completions, 'record')}<br>History: ${range}${s.exportedAt ? `<br>Exported ${new Date(s.exportedAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}` : ''}</span>
      Everything currently on this device will be replaced. Your current data is kept, so you can bring it back from Settings.`,
  });
  if (!ok) return;
  await run(() => S.importData(data), 'Backup restored');
}

/* =========================================================
   Drag-to-reorder (A6) — pointer events, so it works with touch and mouse.
   Arrow buttons remain as a keyboard / accessibility fallback.
   ========================================================= */
function enableDragSort() {
  main.querySelectorAll('.drag-handle').forEach(h => h.addEventListener('pointerdown', startDrag));
}

function startDrag(e) {
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  const handle = e.currentTarget;
  const item = handle.closest('[data-drag-id]');
  const list = item?.parentElement;
  if (!list?.dataset.sort) return;
  e.preventDefault();
  try { handle.setPointerCapture(e.pointerId); } catch { /* ignore */ }
  const siblings = () => [...list.children].filter(c => c.dataset.dragId);
  const before = siblings().map(c => c.dataset.dragId).join();
  item.classList.add('dragging');
  document.body.classList.add('is-dragging');
  let offset = 0;
  const grab = e.clientY - item.getBoundingClientRect().top;
  let scrollTimer = null;

  const move = ev => {
    const y = ev.clientY;
    const items = siblings();
    const idx = items.indexOf(item);
    const prev = items[idx - 1], next = items[idx + 1];
    if (next) { const r = next.getBoundingClientRect(); if (y > r.top + r.height / 2) list.insertBefore(next, item); }
    if (prev) { const r = prev.getBoundingClientRect(); if (y < r.top + r.height / 2) list.insertBefore(item, prev); }
    const natural = item.getBoundingClientRect().top - offset;
    offset = y - grab - natural;
    item.style.transform = `translateY(${offset}px)`;
    clearInterval(scrollTimer);
    const edge = 70;
    const bottomLimit = innerHeight - (matchMedia('(max-width: 760px)').matches ? 140 : edge);
    if (y < edge) scrollTimer = setInterval(() => scrollBy(0, -12), 16);
    else if (y > bottomLimit) scrollTimer = setInterval(() => scrollBy(0, 12), 16);
  };
  const end = async () => {
    clearInterval(scrollTimer);
    handle.removeEventListener('pointermove', move);
    handle.removeEventListener('pointerup', end);
    handle.removeEventListener('pointercancel', end);
    item.classList.remove('dragging');
    item.style.transform = '';
    document.body.classList.remove('is-dragging');
    const ids = siblings().map(c => c.dataset.dragId);
    if (ids.join() === before) return;
    if (list.dataset.sort === 'groups') await run(() => S.reorderGroups(ids));
    else await run(() => S.reorderHabits(ids));
  };
  handle.addEventListener('pointermove', move);
  handle.addEventListener('pointerup', end);
  handle.addEventListener('pointercancel', end);
}

/* ---------- Group form ---------- */
function groupForm(groupId = null) {
  const g = groupId ? state.groups.get(groupId) : null;
  const data = { icon: g?.icon || '📁', color: g?.color || COLORS[state.groups.size % COLORS.length] };
  const GROUP_EMOJIS = ['📁', '🌅', '🕌', '💪', '📚', '💼', '🧠', '❤️', '🏠', '🌙', '🎯', '💰', '🧘', '🎨', '👨‍👩‍👧', '🌱'];
  openModal({
    title: g ? 'Edit group' : 'New group', size: 'small',
    body: `<form id="group-form" novalidate>
      <label class="field"><span>Name</span><input name="name" required maxlength="40" value="${esc(g?.name || '')}" placeholder="e.g. Morning Routine" autofocus></label>
      <div class="field"><span>Icon</span><div class="emoji-grid small">${GROUP_EMOJIS.map(e => `<button type="button" data-emoji="${e}" class="${e === data.icon ? 'on' : ''}">${e}</button>`).join('')}</div></div>
      <div class="field"><span>Color</span><div class="swatches">${COLORS.map(c => `<button type="button" class="sw ${c === data.color ? 'on' : ''}" data-color="${c}" style="--c:${c}" aria-label="Color ${c}"></button>`).join('')}</div></div>
      <label class="field"><span>Description <em>(optional)</em></span><input name="description" maxlength="80" value="${esc(g?.description || '')}" placeholder="What belongs here"></label>
      <p class="form-error" role="alert"></p>
    </form>`,
    footer: `<button class="btn ghost" data-close>Cancel</button><button class="btn primary" data-save>${g ? 'Save' : 'Create group'}</button>`,
    onMount: (el, close) => {
      const form = el.querySelector('form');
      el.querySelector('.emoji-grid').addEventListener('click', e => { const b = e.target.closest('[data-emoji]'); if (!b) return; data.icon = b.dataset.emoji; el.querySelectorAll('[data-emoji]').forEach(x => x.classList.toggle('on', x === b)); });
      el.querySelector('.swatches').addEventListener('click', e => { const b = e.target.closest('[data-color]'); if (!b) return; data.color = b.dataset.color; el.querySelectorAll('.sw').forEach(s => s.classList.toggle('on', s === b)); });
      el.querySelector('[data-save]').addEventListener('click', () => form.requestSubmit());
      form.addEventListener('submit', async e => {
        e.preventDefault();
        const name = form.elements.name.value.trim();
        if (!name) { el.querySelector('.form-error').textContent = 'Give the group a name.'; return; }
        await S.saveGroup({ ...(g ? { id: g.id } : {}), name, icon: data.icon, color: data.color, description: form.elements.description.value.trim() });
        await S.setOnboarded();
        toast(g ? 'Group updated' : `${esc(data.icon)} ${esc(name)} created`);
        close();
      });
    },
  });
}

function deleteGroupDialog(id) {
  const g = state.groups.get(id);
  const hs = S.habitsInGroup(id);
  const others = M.sortedGroups(state).filter(x => x.id !== id);
  openModal({
    title: `Delete “${g.name}”?`, size: 'small',
    body: hs.length
      ? `<p>This group has ${plural(hs.length, 'habit')}. Where should they go?</p>
         <label class="field"><span>Move habits to</span><select id="move-to">${others.map(o => `<option value="${o.id}">${esc(o.icon || '')} ${esc(o.name)}</option>`).join('')}<option value="">No group</option></select></label>
         <p class="hint">Past days keep showing these habits under “${esc(g.name)}”.</p>`
      : '<p>The group is empty. Past records stay intact.</p>',
    footer: `<button class="btn ghost" data-close>Cancel</button><button class="btn danger" data-ok>Delete group</button>`,
    onMount: (el, close) => {
      el.querySelector('[data-ok]').addEventListener('click', async () => {
        const to = el.querySelector('#move-to')?.value || null;
        await S.deleteGroup(id, to); close(); toast('Group deleted');
      });
    },
  });
}

function addSheet() {
  openModal({
    title: 'Add', size: 'small',
    body: `<div class="choice-list">
      <button class="choice" data-c="habit"><span>${icon('target')}</span><div><b>New habit</b><p>Something you want to do daily, on certain days, or a few times a week.</p></div></button>
      <button class="choice" data-c="group"><span>${icon('folder')}</span><div><b>New group</b><p>A section like Morning Routine, Health or Career.</p></div></button>
    </div>`,
    onMount: (el, close) => {
      el.querySelector('[data-c="habit"]').addEventListener('click', () => { close(); setTimeout(() => habitForm(), 190); });
      el.querySelector('[data-c="group"]').addEventListener('click', () => { close(); setTimeout(() => groupForm(), 190); });
    },
  });
}

// Save a file: a normal browser download, or — inside a Claude artifact preview,
// where pages can't start downloads — the platform's download prompt.
async function saveFile(filename, text) {
  const host = window.claude;
  if (host && typeof host.use === 'function') {
    const downloads = await host.use('downloads').catch(() => null);
    if (downloads) {
      try { await downloads.save({ filename, data: text }); return 'saved'; }
      catch (e) { if (e && e.code === 'declined') return 'declined'; if (e && e.code !== 'unavailable') throw new Error(e.message || 'Download failed.'); }
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  return 'saved';
}

/* =========================================================
   Actions (event delegation)
   ========================================================= */
const actions = {
  async toggle(el) {
    const { date, h, o, key } = el.dataset;
    const before = M.dayStats(state, date);
    ui.lastToggled = key;
    const on = await S.toggle(date, h, o);
    if (on && navigator.vibrate) navigator.vibrate(8);
    const after = M.dayStats(state, date);
    if (on && after.planned && after.pct >= 0.9999 && !(before.pct >= 0.9999)) toast('🎉 Everything done for the day!');
  },
  noop() {},
  filter(el) { ui.filter = el.dataset.f; render(); },
  'habit-day'(el) { habitDaySheet(el.dataset.date, el.dataset.h); },
  async 'skip-day'(el) {
    const date = el.dataset.date;
    const n = await S.skipDay(date);
    toast(`Day excused — ${plural(n, 'item')} skipped`, { action: 'Undo', onAction: () => run(() => S.unskipDay(date)) });
  },
  async 'unskip-day'(el) { await S.unskipDay(el.dataset.date); toast('Skips cleared'); },
  'new-habit'(el) { habitForm(null, { groupId: el.dataset.group }); },
  'new-group'() { groupForm(); },
  'edit-habit'(el) { habitForm(el.dataset.id); },
  'edit-group'(el) { groupForm(el.dataset.id); },
  'delete-group'(el) { deleteGroupDialog(el.dataset.id); },
  reorder() { ui.reorder = !ui.reorder; render(); },
  'group-up'(el) { return S.moveGroup(el.dataset.id, -1); },
  'group-down'(el) { return S.moveGroup(el.dataset.id, 1); },
  'habit-up'(el) { return S.moveHabit(el.dataset.id, -1); },
  'habit-down'(el) { return S.moveHabit(el.dataset.id, 1); },
  async pause(el) {
    const id = el.dataset.id;
    let when = 'today';
    if (S.todayRecordsFor(id)) { when = await askApplyFrom('pausing'); if (!when) return; }
    await S.setHabitStatus(id, 'paused', when);
    toast(when === 'tomorrow' ? 'Pauses from tomorrow — history kept' : 'Paused — history kept', { action: 'Undo', onAction: () => run(() => S.setHabitStatus(id, 'active', 'today')) });
  },
  async resume(el) { await S.setHabitStatus(el.dataset.id, 'active', 'today'); toast('Resumed'); },
  async restore(el) { await S.restoreHabit(el.dataset.id); toast('Habit restored'); },
  async 'delete-forever'(el) {
    const h = state.habits.get(el.dataset.id);
    if (await confirmDialog({ title: 'Delete permanently?', message: `“${esc(h.name)}” and its full history will be erased.`, confirmText: 'Delete', danger: true })) {
      await S.deleteHabitForever(h.id); toast('Habit deleted');
    }
  },
  async 'load-samples'() { await S.loadSamples(); toast('Sample habits added — edit or remove them anytime'); },
  async 'remove-samples'() {
    if (await confirmDialog({ title: 'Remove sample data?', message: 'Sample groups and habits, and any ticks on them, will be removed. Your own habits are untouched.', confirmText: 'Remove', danger: true })) {
      await S.removeSamples(); toast('Samples removed');
    }
  },
  theme(el) { return S.saveSettings({ theme: el.dataset.t }); },
  async install() {
    if (!ui.deferredInstall) return;
    ui.deferredInstall.prompt();
    await ui.deferredInstall.userChoice;
    ui.deferredInstall = null; render();
  },
  async export() {
    const text = JSON.stringify(S.exportData(), null, 2);
    const res = await saveFile(`daily-habits-backup-${M.today()}.json`, text);
    if (res === 'declined') { toast('Backup not saved'); return; }
    await S.saveSettings({ lastBackup: new Date().toISOString() });
    toast('Backup downloaded');
  },
  import() { document.getElementById('import-file')?.click(); },
  async 'undo-snapshot'() {
    const s = state.snapshot;
    if (await confirmDialog({ title: 'Bring back previous data?', message: `This swaps in the data saved before your last ${s?.reason || 'change'}. What you have now is kept as the new "previous data", so this can be undone too.`, confirmText: 'Bring back' })) {
      await S.undoSnapshot(); toast('Previous data restored');
    }
  },
  async erase() {
    if (await confirmDialog({ title: 'Erase everything?', message: 'All habits, groups and history on this device will be deleted. A copy is kept so you can bring it back from Settings.', confirmText: 'Erase all', danger: true })) {
      await S.eraseAll(); location.hash = '#/today'; toast('All data erased', { action: 'Undo', onAction: () => run(() => S.undoSnapshot()) });
    }
  },
  add() { addSheet(); },
};

// B4: every action is guarded — a failed save is rolled back and reported.
document.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el || el.disabled) return;
  const fn = actions[el.dataset.action];
  if (!fn) return;
  e.preventDefault();
  Promise.resolve().then(() => fn(el, e)).catch(err => {
    console.error(err);
    toast(`⚠️ ${esc(err.message || 'Something went wrong.')} Nothing was changed.`, { timeout: 6000 });
  });
});

document.addEventListener('change', async e => {
  const el = e.target;
  if (el.id === 'import-file' && el.files[0]) {
    const f = el.files[0];
    el.value = '';
    await importFlow(f);
    return;
  }
  const key = el.dataset.setting;
  if (!key) return;
  let val = el.type === 'checkbox' ? el.checked : el.value;
  if (key === 'weekStart' || key === 'goodDayThreshold') val = Number(val);
  if (key === 'name') val = String(val).trim();
  await run(() => S.saveSettings({ [key]: val }));
});
document.addEventListener('input', e => {
  if (e.target.dataset.setting === 'goodDayThreshold') document.getElementById('thr-val').textContent = e.target.value + '%';
});

/* =========================================================
   Theme, PWA, boot
   ========================================================= */
function applyTheme() {
  const t = state.settings.theme;
  try { localStorage.setItem('dh-theme', t); } catch { /* only a paint hint; real setting lives in IndexedDB */ }
  if (t === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', t);
  const dark = t === 'dark' || (t === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.querySelectorAll('meta[name="theme-color"]').forEach(m => { m.removeAttribute('media'); m.setAttribute('content', dark ? '#101B2D' : '#F4F7FC'); });
}

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  ui.deferredInstall = e;
  document.getElementById('install-side').hidden = false;
  if (parseRoute().view === 'settings') render();
});
window.addEventListener('appinstalled', () => { ui.deferredInstall = null; document.getElementById('install-side').hidden = true; toast('Installed — find Daily Habits in your apps'); });

function registerSW() {
  try { registerSWUnsafe(); } catch { /* sandboxed previews don't allow service workers */ }
}
function registerSWUnsafe() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('./sw.js').then(reg => {
    const notify = w => toast('A new version is ready', { action: 'Update', timeout: 15000, onAction: () => w.postMessage('SKIP_WAITING') });
    if (reg.waiting && navigator.serviceWorker.controller) notify(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const w = reg.installing;
      w?.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) notify(w); });
    });
  }).catch(() => {});
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (!reloaded) { reloaded = true; location.reload(); } });
}

let lastDay = M.today();
function watchDayChange() {
  const check = () => { const t = M.today(); if (t !== lastDay) { lastDay = t; render(); } };
  setInterval(check, 60_000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
}

async function boot() {
  try {
    await S.load();
  } catch (err) {
    main.innerHTML = `<div class="empty card"><div class="empty-emoji">⚠️</div><h3>Storage unavailable</h3><p>${esc(err.message)}. Private/incognito windows may block storage.</p></div>`;
    return;
  }
  applyTheme();
  S.subscribe(() => { applyTheme(); render(); });
  window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
  render();
  document.body.classList.add('ready');
  S.requestPersistence().then(p => { persisted = p; }).catch(() => {});
  registerSW();
  watchDayChange();
}

boot();
