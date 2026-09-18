import test from 'node:test';
import assert from 'node:assert/strict';
import { WorkspaceSync } from './workspaceSync.js';
const subjects = (text) => [{ id: 'm', nombre: text, temas: [], fechas: [], criterios: [] }];
class MemoryStorage {
  data = new Map();
  get length() { return this.data.size; }
  key(index) { return [...this.data.keys()][index]; }
  removeItem(key) { this.data.delete(key); }
  getItem(key) { return this.data.get(key) ?? null; }
  setItem(key, value) { this.data.set(key, value); }
}
function harness(row = null, storage = new MemoryStorage(), userId = 'alice') {
  let cloud = row;
  const remote = {
    async load() { return structuredClone(cloud); },
    async save(materias, revision) {
      if ((cloud?.revision ?? 0) !== revision) return null;
      cloud = { materias: structuredClone(materias), revision: revision + 1 };
      return structuredClone(cloud);
    },
  };
  const engine = new WorkspaceSync({ userId, storage, remote, initial: [] });
  engine.active = true;
  return { engine, storage, remote, cloud: () => cloud, changeCloud: (value) => { cloud = value; } };
}
test('loads existing cloud without overwriting it with local defaults', async () => {
  const h = harness({ materias: subjects('cloud'), revision: 4 });
  await h.engine.sync();
  assert.equal(h.engine.state.materias[0].nombre, 'cloud');
  assert.equal(h.cloud().revision, 4);
  h.engine.stop();
});
test('offline edits survive reload and sync after reconnect', async () => {
  const h = harness();
  await h.engine.sync();
  h.engine.setMaterias(subjects('offline'));
  h.remote.load = async () => { throw new Error('offline'); };
  await h.engine.sync();
  assert.equal(h.engine.state.dirty, true);
  assert.equal(h.engine.state.status, 'error');
  h.engine.stop();
  const next = harness(null, h.storage);
  await next.engine.sync();
  assert.equal(next.cloud().materias[0].nombre, 'offline');
  assert.equal(next.engine.state.dirty, false);
  next.engine.stop();
});
test('two devices detect conflict and preserve losing copy', async () => {
  const h = harness({ materias: subjects('base'), revision: 1 });
  await h.engine.sync();
  h.engine.setMaterias(subjects('mine'));
  h.changeCloud({ materias: subjects('theirs'), revision: 2 });
  await h.engine.sync();
  assert.equal(h.engine.state.status, 'conflict');
  assert.equal(h.cloud().materias[0].nombre, 'theirs');
  h.engine.resolve(true);
  await h.engine.sync();
  assert.equal(h.cloud().materias[0].nombre, 'mine');
  assert.ok([...h.storage.data.keys()].some((key) => key.includes(':backup:')));
  h.engine.stop();
});
test('edits made during upload remain dirty and upload next', async () => {
  const h = harness();
  await h.engine.sync();
  h.engine.setMaterias(subjects('first'));
  let finish;
  const save = h.remote.save;
  h.remote.save = (...args) => new Promise((resolve) => { finish = async () => resolve(await save(...args)); });
  const pending = h.engine.sync();
  await new Promise((resolve) => setImmediate(resolve));
  h.engine.setMaterias(subjects('second'));
  await finish();
  await pending;
  assert.equal(h.engine.state.dirty, true);
  assert.equal(h.engine.state.materias[0].nombre, 'second');
  h.remote.save = save;
  await h.engine.sync();
  assert.equal(h.cloud().materias[0].nombre, 'second');
  h.engine.stop();
});
test('signout ignores late responses and cache belongs only to original user', async () => {
  const h = harness();
  await h.engine.sync();
  h.engine.setMaterias(subjects('private'));
  let finish;
  h.remote.load = () => new Promise((resolve) => { finish = resolve; });
  const pending = h.engine.sync();
  h.engine.stop();
  finish({ materias: subjects('late'), revision: 99 });
  await pending;
  const other = harness(null, h.storage, 'bob');
  assert.deepEqual(other.engine.state.materias, []);
  assert.equal(h.engine.state.materias[0].nombre, 'private');
  other.engine.stop();
});
test('guest import is explicit, additive and leaves original intact', async () => {
  const storage = new MemoryStorage();
  storage.setItem('study_hub_data', JSON.stringify({ materias: subjects('guest') }));
  const h = harness({ materias: subjects('account'), revision: 1 }, storage);
  await h.engine.sync();
  assert.equal(h.engine.state.materias.length, 1);
  h.engine.importGuest();
  assert.equal(h.engine.state.materias.length, 2);
  assert.notEqual(h.engine.state.materias[1].id, 'm');
  assert.equal(JSON.parse(storage.getItem('study_hub_data')).materias[0].nombre, 'guest');
  h.engine.stop();
});
test('failed initial read cannot upload empty data or leak guest notes', async () => {
  const h = harness();
  h.remote.load = async () => { throw new Error('denied'); };
  await h.engine.sync();
  assert.equal(h.engine.state.ready, false);
  h.engine.setMaterias(subjects('ignored'));
  assert.deepEqual(h.engine.state.materias, []);
  h.engine.stop();
});
test('stale revision rejected during save is fetched again before retry', async () => {
  const h = harness({ materias: subjects('base'), revision: 1 });
  await h.engine.sync();
  h.engine.setMaterias(subjects('mine'));
  h.remote.save = async () => { h.changeCloud({ materias: subjects('other'), revision: 2 }); return null; };
  await h.engine.sync();
  await h.engine.sync();
  assert.equal(h.engine.state.status, 'conflict');
  assert.equal(h.cloud().materias[0].nombre, 'other');
  h.engine.stop();
});
test('storage failure is surfaced and unsaved work remains in memory', async () => {
  const h = harness();
  await h.engine.sync();
  h.storage.setItem = () => { throw new Error('quota'); };
  h.engine.setMaterias(subjects('valuable'));
  assert.equal(h.engine.state.storageError, true);
  assert.equal(h.engine.state.materias[0].nombre, 'valuable');
  h.engine.stop();
});
test('a clean tab cannot erase another tab pending offline edits', async () => {
  const storage = new MemoryStorage();
  const row = { materias: subjects('cloud'), revision: 1 };
  const dirty = harness(row, storage);
  const clean = harness(row, storage);
  await dirty.engine.sync();
  await clean.engine.sync();
  dirty.engine.setMaterias(subjects('offline work'));
  await clean.engine.sync();
  dirty.engine.stop();
  clean.engine.stop();
  const reload = harness(row, storage);
  assert.equal(reload.engine.state.materias[0].nombre, 'offline work');
  await reload.engine.sync();
  assert.equal(reload.cloud().materias[0].nombre, 'offline work');
  reload.engine.stop();
});
test('taking cloud conflict version keeps a backup of local changes', async () => {
  const h = harness({ materias: subjects('base'), revision: 1 });
  await h.engine.sync();
  h.engine.setMaterias(subjects('local'));
  h.changeCloud({ materias: subjects('remote'), revision: 2 });
  await h.engine.sync();
  h.engine.resolve(false);
  assert.equal(h.engine.state.materias[0].nombre, 'remote');
  const backup = [...h.storage.data.entries()].find(([key]) => key.includes(':backup:'));
  assert.equal(JSON.parse(backup[1]).materias[0].nombre, 'local');
  h.engine.stop();
});
