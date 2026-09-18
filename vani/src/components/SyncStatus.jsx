import { useState } from 'react';

const labels = { local: 'Guardado en este dispositivo', loading: 'Cargando tus apuntes…',
  syncing: 'Sincronizando…', pending: 'Cambios pendientes de sincronizar',
  synced: 'Sincronizado con Supabase', error: 'Sin sincronizar. Reintentaremos al recuperar la conexión.',
  conflict: 'Hay cambios diferentes en otro dispositivo.' };

export default function SyncStatus({ sync, signedIn }) {
  const [askImport, setAskImport] = useState(false);
  const [imported, setImported] = useState(false);
  const button = 'rounded border border-slate-300 px-2 py-1 font-semibold dark:border-slate-600';
  return <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-4 py-2 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
    <span role="status">{labels[sync.status]}</span>
    {sync.storageError && <span role="alert">No se pudo guardar la copia local. Exporta tus apuntes antes de cerrar.</span>}
    {sync.status === 'error' && <button className={button} onClick={sync.retry}>Reintentar</button>}
    {sync.conflict && <div role="alert" className="flex flex-wrap items-center gap-2">
      <span>Elige una versión; conservaremos una copia de respaldo de la otra en este dispositivo.</span>
      <button className={button} onClick={() => sync.resolve(false)}>Usar versión de la nube</button>
      <button className={button} onClick={() => sync.resolve(true)}>Conservar mis cambios</button>
    </div>}
    {signedIn && sync.ready && !sync.conflict && !imported && <button className={button} onClick={() => setAskImport(!askImport)}>Importar apuntes de este navegador</button>}
    {askImport && <div className="flex flex-wrap items-center gap-2">
      <span>Se añadirán como materias nuevas a esta cuenta. La copia original permanecerá en este navegador.</span>
      <button className={button} onClick={() => { sync.importGuest(); setAskImport(false); setImported(true); }}>Añadir a mi cuenta</button>
      <button className={button} onClick={() => setAskImport(false)}>Cancelar</button>
    </div>}
  </div>;
}
