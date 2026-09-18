// Framework-independent sync engine; each instance belongs to exactly one user.
export class WorkspaceSync {
  constructor({ userId, storage, remote, initial }) {
    this.userId = userId;
    this.storage = storage;
    this.remote = remote;
    this.key = userId ? `vani_workspace:${userId}` : 'study_hub_data';
    this.draftKey = `${this.key}:draft:${crypto.randomUUID()}`;
    this.listeners = new Set();
    this.active = false;
    this.busy = false;
    this.generation = 0;
    this.editCount = 0;
    let cached = null;
    let cacheError = false;
    try {
      const raw = storage.getItem(this.key);
      if (raw) {
        cached = JSON.parse(raw);
        if (!Array.isArray(cached.materias)) throw new Error('Invalid cache');
      }
      if (userId) {
        // A clean tab must never overwrite an offline tab's pending edits.
        let newest = null;
        for (let index = 0; index < storage.length; index++) {
          const key = storage.key(index);
          if (!key?.startsWith(`${this.key}:draft:`)) continue;
          const draft = JSON.parse(storage.getItem(key));
          if (Array.isArray(draft?.materias) && (!newest || draft.savedAt > newest.savedAt)) {
            newest = { ...draft, key };
          }
        }
        if (newest) { cached = newest; this.recoveredKey = newest.key; this.recoveredValue = storage.getItem(newest.key); }
      } else if (cached) {
        cached = { ...cached, materias: initial }; // Preserve legacy normalization.
      }
    } catch { cacheError = true; }
    this.state = {
      materias: cached?.materias ?? initial,
      revision: cached?.revision ?? 0,
      dirty: Boolean(userId && cached?.dirty),
      ready: !userId || Boolean(cached),
      status: userId ? 'loading' : 'local',
      conflict: null,
      storageError: cacheError,
    };
  }
  getSnapshot = () => this.state;
  subscribe = (listener) => { this.listeners.add(listener); return () => this.listeners.delete(listener); };
  emit(patch) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((listener) => listener());
  }
  persist() {
    try {
      const serialized = JSON.stringify({ version: 3, materias: this.state.materias,
        revision: this.state.revision, dirty: this.state.dirty, savedAt: Date.now() });
      if (this.userId && this.state.dirty) this.storage.setItem(this.draftKey, serialized);
      this.storage.setItem(this.key, serialized);
      if (this.userId && !this.state.dirty) this.storage.removeItem(this.draftKey);
      if (this.recoveredKey && this.storage.getItem(this.recoveredKey) === this.recoveredValue) {
        this.storage.removeItem(this.recoveredKey);
        this.recoveredKey = null;
      }
      if (this.state.storageError) this.emit({ storageError: false });
    } catch { this.emit({ storageError: true }); }
  }
  backup(materias) {
    // Keep recovery copies separate from the current workspace.
    this.storage.setItem(`${this.key}:backup:${Date.now()}:${Math.random()}`, JSON.stringify({ materias }));
  }
  setMaterias = (value) => {
    if (!this.state.ready) return;
    const materias = typeof value === 'function' ? value(this.state.materias) : value;
    this.editCount++;
    this.emit({ materias, dirty: Boolean(this.userId), status: this.userId ? 'pending' : 'local' });
    this.persist();
    this.schedule();
  };
  schedule() {
    clearTimeout(this.timer);
    if (this.active && this.userId) this.timer = setTimeout(() => this.sync(), 700);
  }
  start() { this.active = true; void this.sync(); }
  stop() { this.active = false; this.generation++; clearTimeout(this.timer); }
  async sync() {
    if (!this.active || !this.userId || this.busy || this.state.conflict) return;
    this.busy = true;
    const generation = this.generation;
    const valid = () => this.active && generation === this.generation;
    this.emit({ status: 'syncing' });
    try {
      const row = await this.remote.load(this.userId);
      if (!valid()) return;
      const revision = row?.revision ?? 0;
      if (this.state.dirty && revision !== this.state.revision) {
        this.emit({ conflict: { materias: row?.materias ?? [], revision }, status: 'conflict', ready: true });
        return;
      }
      if (!this.state.dirty) {
        this.emit({ materias: row && JSON.stringify(row.materias) !== JSON.stringify(this.state.materias) ? row.materias : this.state.materias, revision, ready: true, status: 'synced' });
        this.persist();
        return;
      }
      const sent = this.state.materias;
      const sentEdit = this.editCount;
      const saved = await this.remote.save(sent, revision, this.userId);
      if (!valid()) return;
      if (!saved) { this.emit({ status: 'pending' }); this.schedule(); return; }
      const dirty = sentEdit !== this.editCount;
      this.emit({ revision: saved.revision, dirty, ready: true, status: dirty ? 'pending' : 'synced' });
      this.persist();
      if (dirty) this.schedule();
    } catch (error) {
      if (valid()) this.emit({ status: 'error', error: error.message || 'Sin conexión' });
    } finally {
      this.busy = false;
      if (this.active && generation !== this.generation) this.schedule();
    }
  }
  resolve = (useLocal) => {
    const conflict = this.state.conflict;
    if (!conflict) return;
    try { this.backup(useLocal ? conflict.materias : this.state.materias); }
    catch { this.emit({ storageError: true }); return; }
    this.editCount++;
    this.emit({ materias: useLocal ? this.state.materias : conflict.materias,
      revision: conflict.revision, dirty: useLocal, conflict: null, status: useLocal ? 'pending' : 'synced' });
    this.persist();
    this.schedule();
  };
  importGuest = (normalized) => {
    try {
      const guest = JSON.parse(this.storage.getItem('study_hub_data') || 'null');
      const materias = normalized ?? guest?.materias;
      if (!Array.isArray(materias)) return;
      // New IDs avoid collisions with examples and existing cloud subjects.
      const imported = materias.map((subject) => ({ ...subject,
        id: `import-${crypto.randomUUID()}`, nombre: `${subject.nombre} (importada)` }));
      this.setMaterias([...this.state.materias, ...imported]);
    } catch { this.emit({ storageError: true }); }
  };
}
