import { Plus, X } from 'lucide-react';

export default function TabBar({ materias, activaId, onSelect, onAdd, onDelete }) {
  return (
    <div className="flex items-center bg-gray-200 px-3 pt-2 gap-1.5 border-b border-gray-300 overflow-x-auto">
      {materias.map((materia) => {
        const esActiva = materia.id === activaId;
        return (
          <div
            key={materia.id}
            onClick={() => onSelect(materia.id)}
            /* AQUÍ ESTÁ EL ATRIBUTO DE COLOR CORRECTAMENTE ASIGNADO */
            style={{ backgroundColor: esActiva ? (materia.color || '#e5e7eb') : '#d1d5db' }}
            className={`group flex items-center justify-between gap-2 px-4 py-2 text-sm font-medium rounded-t-lg cursor-pointer transition-all border-t border-x ${
              esActiva
                ? 'text-gray-900 border-gray-400 shadow-sm'
                : 'text-gray-600 border-transparent hover:brightness-95'
            }`}
          >
            <span className="truncate max-w-[150px]">{materia.nombre || 'Nueva Materia'}</span>
            
            {materias.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(materia.id);
                }}
                className="opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white rounded p-0.5 transition-colors"
              >
                <X size={13} />
              </button>
            )}
          </div>
        );
      })}
      <button
        onClick={onAdd}
        className="p-1.5 text-gray-600 hover:bg-gray-300 rounded-md transition-colors"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}