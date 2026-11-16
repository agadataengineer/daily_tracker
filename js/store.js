// App state backed by IndexedDB. All reads come from memory; every change is
// written to IndexedDB immediately. If a write fails, the in-memory change is rolled
// back and the error is surfaced. Other open tabs are told to reload (BroadcastChannel).
import * as db from './db.js';
import * as M from './model.js';

export const DEFAULT_SETTINGS = {
  name: '',
  weekStart: 6,            // 6 = Saturday, 0 = Sunday, 1 = Monday
  goodDayThreshold: 80,    // % of a day's plan needed for a "good day"
  theme: 'auto',           // auto | light | dark
  showHijri: true,
  scoring: 'occurrence',   // occurrence | habit  (how the daily % is weighted)
  lastBackup: null,
};

export const state = {
  rev: 0,
  groups: new Map(),
  habits: new Map(),
  completions: new Map(),
  settings: { ...DEFAULT_SETTINGS },
  onboarded: false,
  snapshot: null, // { at, reason, summary } — previous data kept before a restore / erase
};

const listeners = new Set();
export const subscribe = fn => listeners.add(fn);
function emit() { state.rev++; listeners.forEach(fn => fn()); }

/* ---------- Multi-tab sync ---------- */
const TAB_ID = M.uid('tab_');
let channel = null;
try { channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('daily-habits-sync') : null; } catch { channel = null; }
if (channel) {
  channel.onmessage = async e => {
    if (!e.data || e.data.from === TAB_ID) return;
    try { await load(); emit(); } catch { /* ignore */ }
  };
}
function changed() { emit(); channel?.postMessage({ from: TAB_ID, at: Date.now() }); }

export class SaveError extends Error {
  constructor(cause) { super('Your change could not be saved on this device.'); this.cause = cause; }
}

// Run a mutation; on failure resync memory from the database and report.
async function guarded(work) {
  try {
    const r = await work();
    changed();
    return r;
  } catch (err) {
    try { await load(); } catch { /* keep memory as is */ }
    emit();
    throw err instanceof SaveError ? err : new SaveError(err);
  }
}

export const memoryMode = () => db.isMemoryMode();

export async function load() {
  const [groups, habits, completions, meta] = await Promise.all(
    ['groups', 'habits', 'completions', 'meta'].map(s => db.getAll(s)));
  state.groups = new Map(groups.map(g => [g.id, g]));
  state.habits = new Map(habits.map(h => [h.id, h]));
  state.completions = new Map(completions.map(c => [c.key, c]));
  const settings = meta.find(m => m.key === 'settings');
  state.settings = { ...DEFAULT_SETTINGS, ...(settings?.value || {}) };
  state.onboarded = !!meta.find(m => m.key === 'onboarded')?.value;
  const snap = meta.find(m => m.key === 'snapshot');
  state.snapshot = snap ? { at: snap.at, reason: snap.reason, summary: snap.summary } : null;
  state.rev++;
}

/* ---------- Settings ---------- */
export async function saveSettings(patch) {
  const prev = state.settings;
  state.settings = { ...state.settings, ...patch };
  try { await db.put('meta', { key: 'settings', value: state.settings }); }
  catch (e) { state.settings = prev; emit(); throw new SaveError(e); }
  changed();
}
export async function setOnboarded() {
  if (state.onboarded) return;
  state.onboarded = true;
  await guarded(() => db.put('meta', { key: 'onboarded', value: true }));
}

/* ---------- Groups ---------- */
const nextOrder = items => items.reduce((m, x) => Math.max(m, x.order ?? 0), 0) + 1;

export async function saveGroup(data) {
  const existing = data.id && state.groups.get(data.id);
  const g = existing
    ? { ...existing, ...data }
    : { id: M.uid('g_'), order: nextOrder([...state.groups.values()]), sample: false, deleted: false, createdAt: Date.now(), ...data };
  if (!g.id) g.id = M.uid('g_');
  await guarded(async () => { await db.put('groups', g); state.groups.set(g.id, g); });
  return g;
}

export function habitsInGroup(groupId) {
  return M.sortedHabits(state).filter(h => !h.archived && M.latestVersion(h).groupId === groupId);
}

// Deleting a group moves its habits (from today on) to another group.
// If past records still reference the group, it is hidden rather than erased
// so history keeps showing the right group name.
export async function deleteGroup(id, moveToId = null) {
  await guarded(async () => {
    const toWrite = [];
    for (const h of M.sortedHabits(state)) {
      if (h.versions.some(v => v.groupId === id && v.from >= M.today()) || M.currentVersion(h).groupId === id) {
        const nh = { ...h, versions: applyForward(h, { groupId: moveToId }, M.today()) };
        toWrite.push(nh);
      }
    }
    await db.putMany('habits', toWrite);
    toWrite.forEach(h => state.habits.set(h.id, h));
    const referenced = [...state.habits.values()].some(h => h.versions.some(v => v.groupId === id));
    if (referenced) {
      const g = { ...state.groups.get(id), deleted: true };
      await db.put('groups', g); state.groups.set(id, g);
    } else {
      await db.remove('groups', id); state.groups.delete(id);
    }
  });
}

export async function reorderGroups(ids) {
  await guarded(async () => {
    const list = ids.map((id, i) => ({ ...state.groups.get(id), order: i + 1 }));
    await db.putMany('groups', list);
    list.forEach(g => state.groups.set(g.id, g));
  });
}

export async function moveGroup(id, dir) {
  const ids = M.sortedGroups(state).map(g => g.id);
  const i = ids.indexOf(id), j = i + dir;
  if (i < 0 || j < 0 || j >= ids.length) return;
  [ids[i], ids[j]] = [ids[j], ids[i]];
  await reorderGroups(ids);
}

/* ---------- Habit versions ---------- */
const sameVersion = (a, b) => {
  const strip = v => JSON.stringify({ groupId: v.groupId ?? null, status: v.status, schedule: v.schedule, occurrences: v.occurrences });
  return strip(a) === strip(b);
};
const clone = x => structuredClone(x);

/* Apply a partial structural change from `start` onward:
 *  - versions already starting on/after `start` get the patch merged (so a pending
 *    "pause from tomorrow" keeps its pause but picks up other edits);
 *  - the version in force just before `start` is copied with the patch from `start`;
 *  - a habit that hasn't started yet is simply patched in place.
 * Earlier versions — i.e. history — are never touched.
 */
export function applyForward(h, patch, start) {
  let vs = h.versions.map(clone);
  if (vs[0].from > M.today() && vs.length === 1) return [{ ...vs[0], ...clone(patch) }];
  vs = vs.map(v => (v.from >= start ? { ...v, ...clone(patch) } : v));
  if (!vs.some(v => v.from === start)) {
    let idx = -1;
    vs.forEach((v, i) => { if (v.from < start) idx = i; });
    if (idx >= 0) {
      const merged = { ...vs[idx], ...clone(patch), from: start };
      if (!sameVersion(vs[idx], merged)) vs.splice(idx + 1, 0, merged);
    }
  }
  return vs.filter((v, i) => i === 0 || !sameVersion(vs[i - 1], v));
}

export const todayRecordsFor = habitId =>
  [...state.completions.values()].some(c => c.habitId === habitId && c.date === M.today());

// Should the user be asked "from today or from tomorrow?" before applying `patch`?
export function needsApplyChoice(h, patch) {
  if (!todayRecordsFor(h.id)) return false;
  const cur = M.currentVersion(h);
  if (patch.status !== undefined && patch.status !== cur.status) return true;
  if (patch.schedule && JSON.stringify(patch.schedule) !== JSON.stringify(cur.schedule)) return true;
  if (patch.occurrences) {
    const a = cur.occurrences.map(o => o.id).join(), b = patch.occurrences.map(o => o.id).join();
    if (a !== b) return true; // added/removed occurrences (pure renames apply immediately)
  }
  return false;
}

const startFor = when => (when === 'tomorrow' ? M.addDays(M.today(), 1) : M.today());

async function writeHabit(h) {
  await db.put('habits', h);
  state.habits.set(h.id, h);
}

export async function createHabit(data) {
  const h = {
    id: M.uid('h_'),
    name: data.name.trim(),
    icon: data.icon || '✨',
    color: data.color || '#4B91E8',
    notes: data.notes || '',
    sample: !!data.sample,
    archived: false,
    order: nextOrder([...state.habits.values()]),
    createdAt: Date.now(),
    versions: [{
      from: data.startDate || M.today(),
      groupId: data.groupId || null,
      status: data.status || 'active',
      schedule: data.schedule,
      occurrences: (data.occurrences || data.occurrenceLabels.map(l => ({ label: l })))
        .map(o => ({ id: o.id || M.uid('o_'), label: (o.label || '').trim() })),
    }],
  };
  await guarded(() => writeHabit(h));
  return h;
}

// data: { name, icon, color, notes, startDate?, patch: {groupId?, status?, schedule?, occurrences?} }
export async function updateHabit(id, data, when = 'today') {
  await guarded(async () => {
    let h = state.habits.get(id);
    h = { ...h, name: data.name.trim(), icon: data.icon, color: data.color, notes: data.notes ?? h.notes };
    const patch = { ...(data.patch || {}) };
    if (patch.occurrences) patch.occurrences = patch.occurrences.map(o => ({ id: o.id || M.uid('o_'), label: (o.label || '').trim() }));
    if (Object.keys(patch).length) h = { ...h, versions: applyForward(h, patch, startFor(when)) };
    // A habit with a single version that hasn't started (or started today) can move its start date.
    if (data.startDate && h.versions.length === 1 && M.startDate(state.habits.get(id)) >= M.today()) {
      h = { ...h, versions: [{ ...h.versions[0], from: data.startDate }] };
    }
    await writeHabit(h);
  });
}

export async function setHabitStatus(id, status, when = 'today') {
  await guarded(async () => {
    const h = state.habits.get(id);
    await writeHabit({ ...h, versions: applyForward(h, { status }, startFor(when)) });
  });
}

export async function archiveHabit(id, when = 'today') {
  await guarded(async () => {
    const h = state.habits.get(id);
    await writeHabit({ ...h, archived: true, versions: applyForward(h, { status: 'archived' }, startFor(when)) });
  });
}

export async function restoreHabit(id) {
  await guarded(async () => {
    const h = state.habits.get(id);
    const patch = { status: 'active' };
    const gid = M.latestVersion(h).groupId;
    if (gid && state.groups.get(gid)?.deleted) patch.groupId = null; // its old group is gone
    // Drop any pending future "archived" version, then re-activate from today.
    const t = M.today();
    const base = { ...h, versions: h.versions.filter((v, i) => i === 0 || v.from <= t) };
    await writeHabit({ ...h, archived: false, versions: applyForward(base, patch, t) });
  });
}

export async function deleteHabitForever(id) {
  await guarded(async () => {
    const keys = [...state.completions.values()].filter(c => c.habitId === id).map(c => c.key);
    await db.removeMany('completions', keys);
    await db.remove('habits', id);
    keys.forEach(k => state.completions.delete(k));
    state.habits.delete(id);
  });
}

// Reorder habits: `ids` in their new visual order. They reuse their existing order
// slots, so habits in other groups keep their positions.
export async function reorderHabits(ids) {
  await guarded(async () => {
    const slots = ids.map(id => state.habits.get(id).order).sort((a, b) => a - b);
    // ensure distinct slots
    for (let i = 1; i < slots.length; i++) if (slots[i] <= slots[i - 1]) slots[i] = slots[i - 1] + 0.001;
    const list = ids.map((id, i) => ({ ...state.habits.get(id), order: slots[i] }));
    await db.putMany('habits', list);
    list.forEach(h => state.habits.set(h.id, h));
  });
}

export async function moveHabit(id, dir) {
  const gid = M.latestVersion(state.habits.get(id)).groupId;
  const ids = habitsInGroup(gid).map(h => h.id);
  const i = ids.indexOf(id), j = i + dir;
  if (i < 0 || j < 0 || j >= ids.length) return;
  [ids[i], ids[j]] = [ids[j], ids[i]];
  await reorderHabits(ids);
}

/* ---------- Completions (done / skipped) ---------- */

// Optimistic write of several records. `changes`: [{key, date, habitId, occId, state: 'done'|'skipped'|null}]
async function writeRecords(changes) {
  const before = changes.map(c => [c.key, state.completions.get(c.key)]);
  const puts = [], dels = [];
  for (const c of changes) {
    if (c.state) {
      const rec = { key: c.key, date: c.date, habitId: c.habitId, occId: c.occId, at: Date.now() };
      if (c.state === 'skipped') rec.state = 'skipped';
      state.completions.set(c.key, rec); puts.push(rec);
    } else if (state.completions.has(c.key)) {
      state.completions.delete(c.key); dels.push(c.key);
    }
  }
  emit();
  try {
    if (puts.length) await db.putMany('completions', puts);
    if (dels.length) await db.removeMany('completions', dels);
  } catch (e) {
    before.forEach(([k, v]) => (v ? state.completions.set(k, v) : state.completions.delete(k)));
    emit();
    throw new SaveError(e);
  }
  channel?.postMessage({ from: TAB_ID, at: Date.now() });
}

const change = (date, habitId, occId, st) => ({ key: M.ckey(date, habitId, occId), date, habitId, occId, state: st });

// Tap: pending/skipped → done, done → pending. Returns true when it ends up done.
export async function toggle(date, habitId, occId) {
  const nowDone = !M.isDone(state, M.ckey(date, habitId, occId));
  await writeRecords([change(date, habitId, occId, nowDone ? 'done' : null)]);
  return nowDone;
}

export async function setOccurrenceState(date, habitId, occId, st) {
  await writeRecords([change(date, habitId, occId, st)]);
}

export async function setHabitDay(date, habitId, states /* {occId: 'done'|'skipped'|null} */) {
  await writeRecords(Object.entries(states).map(([occId, st]) => change(date, habitId, occId, st)));
}

// Excuse a whole day: everything not done becomes skipped.
export async function skipDay(date) {
  const items = M.plannedItems(state, date).filter(i => !i.done && !i.skipped);
  await writeRecords(items.map(i => change(date, i.habit.id, i.occ.id, 'skipped')));
  return items.length;
}
export async function unskipDay(date) {
  const items = M.plannedItems(state, date).filter(i => i.skipped);
  await writeRecords(items.map(i => change(date, i.habit.id, i.occ.id, null)));
}

/* ---------- Backup, restore, undo ---------- */
export function exportData() {
  return {
    app: 'daily-habits',
    schema: M.BACKUP_SCHEMA,
    exportedAt: new Date().toISOString(),
    origin: typeof location !== 'undefined' ? location.origin + location.pathname : '',
    settings: state.settings,
    groups: [...state.groups.values()],
    habits: [...state.habits.values()],
    completions: [...state.completions.values()],
  };
}

async function keepSnapshot(reason) {
  const data = exportData();
  const v = M.validateBackup(data);
  await db.put('meta', { key: 'snapshot', at: new Date().toISOString(), reason, summary: v.summary, data });
}

function metaFor(data, onboarded) {
  return [
    { key: 'settings', value: { ...DEFAULT_SETTINGS, ...(data.settings || {}) } },
    { key: 'onboarded', value: onboarded },
  ];
}

// Validates first; current data is kept as an undo snapshot; replacement is one atomic transaction.
export async function importData(data) {
  const v = M.validateBackup(data);
  if (!v.ok) throw new Error(v.errors.join(' '));
  await keepSnapshot('restore');
  await db.replaceAll({ groups: data.groups, habits: data.habits, completions: data.completions, meta: metaFor(data, true) });
  await load();
  changed();
  return v.summary;
}

export async function eraseAll() {
  await keepSnapshot('erase');
  await db.replaceAll({ meta: metaFor({}, false) });
  await load();
  changed();
}

// Swap back to the data saved before the last restore/erase.
export async function undoSnapshot() {
  const snap = await db.get('meta', 'snapshot');
  if (!snap?.data) throw new Error('No previous data to bring back.');
  const v = M.validateBackup(snap.data);
  if (!v.ok) throw new Error('The saved previous data is damaged.');
  await keepSnapshot('undo');
  await db.replaceAll({ groups: snap.data.groups, habits: snap.data.habits, completions: snap.data.completions, meta: metaFor(snap.data, true) });
  await load();
  changed();
}

/* ---------- Sample data (clearly marked, removable in one tap) ---------- */
export async function loadSamples() {
  const mk = (name, icon, color, description) => saveGroup({ name, icon, color, description, sample: true });
  const worship = await mk('Prayer & Worship', '🕌', '#4B91E8', 'Prayers, azkar and Quran');
  const health = await mk('Health', '💪', '#2FB5C4', 'Body and energy');
  const growth = await mk('Personal Development', '📚', '#9A7BE3', 'Reading and learning');
  const t = M.today();
  const daily = { type: 'daily', days: [], perWeek: 0 };
  const habits = [
    { name: 'Daily prayers', icon: '🕌', color: '#4B91E8', groupId: worship.id, schedule: daily, occurrenceLabels: ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] },
    { name: 'Azkar', icon: '📿', color: '#6E7FEA', groupId: worship.id, schedule: daily, occurrenceLabels: ['Morning', 'Evening'] },
    { name: 'Drink water', icon: '💧', color: '#2FB5C4', groupId: health.id, schedule: daily, occurrenceLabels: ['', '', '', '', '', ''] },
    { name: 'Workout', icon: '🏋️', color: '#4CB98A', groupId: health.id, schedule: { type: 'weekly', days: [], perWeek: 3 }, occurrenceLabels: [''] },
    { name: 'Read 20 pages', icon: '📖', color: '#9A7BE3', groupId: growth.id, schedule: { type: 'days', days: [6, 0, 1, 2, 3], perWeek: 0 }, occurrenceLabels: [''] },
  ];
  for (const h of habits) await createHabit({ ...h, sample: true, startDate: t });
  await setOnboarded();
}

export async function removeSamples() {
  await guarded(async () => {
    for (const h of [...state.habits.values()].filter(h => h.sample)) {
      const keys = [...state.completions.values()].filter(c => c.habitId === h.id).map(c => c.key);
      await db.removeMany('completions', keys);
      await db.remove('habits', h.id);
      keys.forEach(k => state.completions.delete(k));
      state.habits.delete(h.id);
    }
    for (const g of [...state.groups.values()].filter(g => g.sample)) {
      const used = [...state.habits.values()].some(h => h.versions.some(v => v.groupId === g.id));
      if (used) { const ng = { ...g, sample: false }; await db.put('groups', ng); state.groups.set(g.id, ng); }
      else { await db.remove('groups', g.id); state.groups.delete(g.id); }
    }
  });
}

export const hasSamples = () =>
  [...state.habits.values()].some(h => h.sample) || [...state.groups.values()].some(g => g.sample);

/* ---------- Persistent storage ---------- */
export async function requestPersistence() {
  try {
    if (db.isMemoryMode() || !navigator.storage?.persist) return null;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch { return null; }
}
