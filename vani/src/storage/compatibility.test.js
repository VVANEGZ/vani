import test from 'node:test';
import assert from 'node:assert/strict';
import { loadData, saveData } from './storage.js';
import { WorkspaceSync } from './workspaceSync.js';

class MemoryStorage {
  data = new Map();
  get length() { return this.data.size; }
  key(index) { return [...this.data.keys()][index]; }
  getItem(key) { return this.data.get(key) ?? null; }
  setItem(key, value) { this.data.set(key, value); }
  removeItem(key) { this.data.delete(key); }
}
const existing = [{ id: 'existing', nombre: 'Biología', color: '#123456',
  criterios: [{ id: 'criterion', nombre: 'Examen', porcentaje: 100 }],
  fechas: [{ id: 'event', tipo: 'examen', titulo: 'Parcial', fecha: '2026-10-10' }],
  temas: [{ id: 'topic', nombre: 'Células', tarjetas: [{ id: 'note', titulo: 'Membrana', color: '#654321', contenido: '<h2>Resumen</h2><p><strong>Texto</strong> y <a href="https://example.com">enlace</a></p>' }] }],
}];

test('existing guest notes retain IDs, HTML, colors, criteria and calendar after save/reload', () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: new MemoryStorage() });
  try {
    localStorage.setItem('study_hub_data', JSON.stringify({ version: 3, materias: existing }));
    const loaded = loadData();
    assert.deepEqual(JSON.parse(JSON.stringify(loaded.materias)), existing);
    loaded.materias[0].temas[0].color = '#998877';
    saveData(loaded.materias);
    const reloaded = loadData().materias;
    assert.equal(reloaded[0].temas[0].color, '#998877');
    assert.deepEqual(reloaded[0].temas[0].tarjetas, existing[0].temas[0].tarjetas);
    assert.deepEqual(reloaded[0].fechas, existing[0].fechas);
  } finally {
    if (previous) Object.defineProperty(globalThis, 'localStorage', previous);
    else delete globalThis.localStorage;
  }
});

test('old cloud data is not rewritten on load; adding a topic color preserves note content', async () => {
  let cloud = { materias: structuredClone(existing), revision: 12 };
  let writes = 0;
  const engine = new WorkspaceSync({ userId: 'test-user', storage: new MemoryStorage(), initial: [], remote: {
    async load() { return structuredClone(cloud); },
    async save(materias, revision) { writes++; assert.equal(revision, cloud.revision); cloud = { materias: structuredClone(materias), revision: revision + 1 }; return cloud; },
  } });
  engine.active = true;
  try {
    await engine.sync();
    assert.equal(writes, 0);
    assert.deepEqual(engine.state.materias, existing);
    const changed = structuredClone(engine.state.materias);
    changed[0].temas[0].color = '#998877';
    engine.setMaterias(changed);
    await engine.sync();
    assert.equal(writes, 1);
    assert.deepEqual(cloud.materias[0].temas[0].tarjetas, existing[0].temas[0].tarjetas);
    assert.deepEqual(cloud.materias[0].fechas, existing[0].fechas);
    assert.equal(cloud.materias[0].temas[0].color, '#998877');
  } finally { engine.stop(); }
});
