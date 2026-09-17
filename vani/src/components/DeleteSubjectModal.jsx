export default function DeleteSubjectModal({ materia, onCancel, onConfirm }) {
  if (!materia) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="delete-subject-title">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <h2 id="delete-subject-title" className="break-words text-lg font-bold text-slate-900 dark:text-slate-100">
          ¿Eliminar {materia.nombre}?
        </h2>
        <p className="mt-2 break-words text-sm leading-6 text-slate-600 dark:text-slate-300">
          También se eliminarán sus temas, apuntes, eventos y encuadre. Esta acción no se puede deshacer desde la app.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">
            Cancelar
          </button>
          <button onClick={onConfirm} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
            Eliminar materia
          </button>
        </div>
      </div>
    </div>
  );
}
