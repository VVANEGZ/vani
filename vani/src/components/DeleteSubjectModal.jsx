export default function DeleteSubjectModal({ materia, onCancel, onConfirm }) {
  if (!materia) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="delete-subject-title">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 id="delete-subject-title" className="text-lg font-bold text-slate-900">
          ¿Eliminar {materia.nombre}?
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          También se eliminarán sus apuntes, eventos y encuadre. Esta acción no se puede deshacer desde la app.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
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
