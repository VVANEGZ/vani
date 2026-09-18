import { useEffect, useState, useSyncExternalStore } from 'react';
import { supabase } from '../lib/supabase';
import { loadData } from './storage';
import { WorkspaceSync } from './workspaceSync';

const remote = {
  async load(userId) {
    const { data, error } = await supabase.from('vani_workspaces')
      .select('materias, revision').eq('user_id', userId).maybeSingle();
    if (error) throw error;
    return data;
  },
  async save(materias, revision, userId) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user.id !== userId) throw new Error('La sesión cambió. Vuelve a entrar.');
    const { data, error } = await supabase.rpc('save_vani_workspace', {
      p_materias: materias, p_revision: revision, p_user_id: userId,
    });
    if (error) throw error;
    return data;
  },
};

export function useWorkspace(userId) {
  const [engine] = useState(() => new WorkspaceSync({ userId, storage: localStorage, remote,
    initial: userId ? [] : loadData().materias }));
  const state = useSyncExternalStore(engine.subscribe, engine.getSnapshot);
  useEffect(() => {
    engine.start();
    const refresh = () => { if (document.visibilityState !== 'hidden') void engine.sync(); };
    const timer = setInterval(refresh, 15000);
    window.addEventListener('online', refresh);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    const warnPending = (event) => {
      if (engine.state.dirty || engine.state.storageError) { event.preventDefault(); event.returnValue = ''; }
    };
    window.addEventListener('beforeunload', warnPending);
    return () => {
      engine.stop();
      clearInterval(timer);
      window.removeEventListener('online', refresh);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('beforeunload', warnPending);
    };
  }, [engine]);
  return { ...state, setMaterias: engine.setMaterias, retry: () => engine.sync(),
    resolve: engine.resolve, importGuest: () => engine.importGuest(loadData().materias) };
}
