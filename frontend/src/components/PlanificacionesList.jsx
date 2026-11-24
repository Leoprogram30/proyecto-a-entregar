import { useState } from 'react';
import { useAsync } from '../hooks/useAsync';
import { api } from '../services/api';
import PrintablePlanning from './PrintablePlanning';
import { ConfirmDialog, EmptyState, ErrorState, EstadoBadge, Loading, Modal, useToast } from './ui';
import { Plus, Eye, Pencil, Printer, Trash2, MessageSquare, Copy } from 'lucide-react';

export default function PlanificacionesList({ onNew, onOpen }) {
  const toast = useToast();
  const { data: plans, loading, error, reload } = useAsync(() => api.getMyPlanificaciones(), [], []);
  const [printing, setPrinting] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toDuplicate, setToDuplicate] = useState(null);
  const [dup, setDup] = useState({ anio_lectivo: '', division: 'A' });
  const [duplicating, setDuplicating] = useState(false);

  const openDuplicate = (plan) => {
    setDup({ anio_lectivo: String(plan.anio_lectivo), division: plan.division || 'A' });
    setToDuplicate(plan);
  };

  const handleDuplicate = async (e) => {
    e.preventDefault();
    setDuplicating(true);
    try {
      await api.duplicatePlanificacion({ id: toDuplicate.id, anio_lectivo: Number(dup.anio_lectivo), division: dup.division });
      toast.success('Planificación duplicada como borrador.');
      setToDuplicate(null);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDuplicating(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.deletePlanificacion(toDelete.id);
      toast.success('Planificación eliminada.');
      setToDelete(null);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
            Espacio de Trabajo Docente
          </span>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1">Mis Planificaciones Curriculares Anuales</h2>
          <p className="text-xs text-slate-500">Planificaciones registradas en el IPEM 349.</p>
        </div>
        <button
          type="button"
          onClick={onNew}
          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Nueva Planificación Anual
        </button>
      </div>

      {loading ? (
        <Loading message="Cargando planificaciones..." />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : plans.length === 0 ? (
        <EmptyState title="No tiene planificaciones creadas todavía" message="Comience con el asistente paso a paso.">
          <button type="button" onClick={onNew} className="mt-2 px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold">
            Comenzar con el Asistente
          </button>
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map((plan) => {
            const locked = plan.estado === 'aprobada';
            const devolucion = plan.devolucion_directivo || plan.devolucion;
            return (
              <div key={plan.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-300 transition">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {plan.espacio_anio}° Año "{plan.division || '-'}" - {plan.anio_lectivo}
                    </span>
                    <EstadoBadge estado={plan.estado} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">{plan.espacio_nombre}</h3>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">{plan.diagnostico || 'Sin diagnóstico cargado.'}</p>

                  {devolucion && (
                    <div className="mt-3 p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-900 flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                      <span className="italic">Devolución: "{devolucion}"</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => setPrinting(plan)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition">
                      <Printer className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                      Imprimir
                    </button>
                    <button type="button" onClick={() => openDuplicate(plan)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition">
                      <Copy className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                      Duplicar
                    </button>
                    {!locked && (
                      <button type="button" onClick={() => setToDelete(plan)} className="px-3 py-1.5 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition">
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        Eliminar
                      </button>
                    )}
                  </div>
                  <button type="button" onClick={() => onOpen(plan)} className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1">
                    {locked ? <Eye className="w-3.5 h-3.5" aria-hidden="true" /> : <Pencil className="w-3.5 h-3.5" aria-hidden="true" />}
                    {locked ? 'Ver' : 'Editar'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {printing && <PrintablePlanning plan={printing} espacio={null} onClose={() => setPrinting(null)} />}

      <Modal open={Boolean(toDuplicate)} onClose={() => setToDuplicate(null)} title="Duplicar planificación" size="max-w-md">
        <form onSubmit={handleDuplicate} className="space-y-4">
          <p className="text-xs text-slate-600">
            Se crea un borrador nuevo con el contenido de "{toDuplicate?.espacio_nombre}". Indique el año lectivo y la división de la copia.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-semibold text-slate-700">
              Año lectivo
              <input
                type="number"
                min="2000"
                max="2100"
                required
                value={dup.anio_lectivo}
                onChange={(e) => setDup({ ...dup, anio_lectivo: e.target.value })}
                className="mt-1 w-full p-2.5 text-xs border border-slate-300 rounded-lg"
              />
            </label>
            <label className="text-xs font-semibold text-slate-700">
              División
              <select value={dup.division} onChange={(e) => setDup({ ...dup, division: e.target.value })} className="mt-1 w-full p-2.5 text-xs border border-slate-300 rounded-lg bg-white">
                {['A', 'B', 'C'].map((d) => (
                  <option key={d} value={d}>División "{d}"</option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setToDuplicate(null)} className="px-4 py-2 text-xs font-bold text-slate-600 border border-slate-300 rounded-xl">
              Cancelar
            </button>
            <button type="submit" disabled={duplicating} className="px-4 py-2 text-xs font-bold bg-emerald-700 text-white rounded-xl disabled:opacity-50">
              {duplicating ? 'Duplicando...' : 'Crear copia'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Eliminar planificación"
        message={`¿Eliminar la planificación de "${toDelete?.espacio_nombre || ''}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        busy={deleting}
        onCancel={() => setToDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
