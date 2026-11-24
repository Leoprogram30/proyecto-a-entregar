import { useState } from 'react';
import { useAsync } from '../hooks/useAsync';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { DIRECTIVOS, PLANIFICAN } from '../config/views';
import { ConfirmDialog, EmptyState, ErrorState, EstadoBadge, Loading, useToast } from './ui';
import SecuenciaForm from './SecuenciaForm';
import PrintableSecuencia from './PrintableSecuencia';
import ArticulacionColaborativa from './ArticulacionColaborativa';
import { Sprout, Plus, BookOpen, Link2, Users, Clock, Eye, Pencil, Trash2, MessageSquare, Copy, Printer } from 'lucide-react';

const inputCls = 'w-full p-2.5 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50';

const devolucionDe = (s) => s?.devolucion || s?.devolucion_directivo || '';

export default function SecuenciasView({ selectedEspacio }) {
  const { user } = useAuth();
  const toast = useToast();
  const canCreate = PLANIFICAN.includes(user.rol);

  const [tab, setTab] = useState('propias');
  const { data: espacios, error: espaciosError } = useAsync(() => api.getEspacios({}), [], []);
  const [espacioId, setEspacioId] = useState(selectedEspacio?.id ? String(selectedEspacio.id) : '');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const { data: secuencias, loading, error: secError, reload } = useAsync(
    () => api.getSecuencias(espacioId || undefined),
    [espacioId],
    []
  );
  const error = secError || espaciosError;
  const [modal, setModal] = useState({ open: false, secuencia: null });
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [printing, setPrinting] = useState(null);

  const handleDuplicate = async (sec) => {
    try {
      await api.duplicateSecuencia(sec.id);
      toast.success('Secuencia duplicada como borrador.');
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.deleteSecuencia(toDelete.id);
      toast.success('Secuencia eliminada.');
      setToDelete(null);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const visibles = estadoFiltro ? secuencias.filter((s) => s.estado === estadoFiltro) : secuencias;
  const tabCls = (t) =>
    `flex-1 py-3 px-3 text-xs font-bold text-center border-b-2 transition flex items-center justify-center gap-2 ${
      tab === t ? 'border-emerald-600 text-emerald-900 bg-emerald-50/50' : 'border-transparent text-slate-500 hover:text-slate-800'
    }`;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-900 to-sky-900 rounded-2xl p-6 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-emerald-800/80 px-3 py-1 rounded-full text-xs text-amber-300 font-semibold mb-2 border border-emerald-700">
            <Sprout className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
            Módulo Pedagógico: Secuencias Didácticas & Articulación
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">Secuencias Didácticas e Integración Interdisciplinaria</h2>
          <p className="text-xs text-emerald-100 mt-1 max-w-2xl leading-relaxed">
            Diseñe secuencias paso a paso, desde los contenidos y los indicadores de logro hasta las clases, y coordine proyectos articulados entre espacios curriculares.
          </p>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() => setModal({ open: true, secuencia: null })}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Nueva Secuencia Didáctica
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row border-b border-slate-200 bg-white rounded-xl shadow-xs overflow-hidden" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'propias'} onClick={() => setTab('propias')} className={tabCls('propias')}>
          <BookOpen className="w-4 h-4 text-emerald-600" aria-hidden="true" />
          Secuencias ({visibles.length})
        </button>
        <button type="button" role="tab" aria-selected={tab === 'colaborativas'} onClick={() => setTab('colaborativas')} className={tabCls('colaborativas')}>
          <Users className="w-4 h-4 text-sky-600" aria-hidden="true" />
          Articulación Colaborativa (Proyectos Interdisciplinarios)
        </button>
      </div>

      {tab === 'propias' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label htmlFor="sec-f-espacio" className="block text-[11px] font-semibold text-slate-600 mb-1">Espacio curricular</label>
              <select id="sec-f-espacio" value={espacioId} onChange={(e) => setEspacioId(e.target.value)} className={`${inputCls} bg-white`}>
                <option value="">Todos los espacios</option>
                {espacios.map((e) => (
                  <option key={e.id} value={e.id}>{e.anio}° - {e.nombre}</option>
                ))}
              </select>
            </div>
            <div className="sm:w-56">
              <label htmlFor="sec-f-estado" className="block text-[11px] font-semibold text-slate-600 mb-1">Estado</label>
              <select id="sec-f-estado" value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)} className={`${inputCls} bg-white`}>
                <option value="">Todos</option>
                <option value="borrador">Borrador</option>
                <option value="pendiente_revision">Pendiente de revisión</option>
                <option value="requiere_ajustes">Requiere ajustes</option>
                <option value="aprobada">Aprobada</option>
              </select>
            </div>
          </div>

          {loading ? (
            <Loading message="Cargando secuencias..." />
          ) : error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : visibles.length === 0 ? (
            <EmptyState
              title="No hay secuencias para mostrar"
              message={canCreate ? 'Use "Nueva Secuencia Didáctica" para redactar una o partir de una plantilla modelo.' : 'Todavía no se cargaron secuencias con estos filtros.'}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visibles.map((sec) => {
                const own = Number(sec.docente_id) === Number(user.id);
                const editable = own && sec.estado !== 'aprobada';
                const dev = devolucionDe(sec);
                return (
                  <div key={sec.id} className="bg-white rounded-xl border border-slate-200 hover:border-emerald-300 p-5 shadow-xs flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {sec.espacio_nombre || 'Espacio curricular'}
                        </span>
                        <EstadoBadge estado={sec.estado} />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 line-clamp-2">{sec.titulo}</h3>
                      {(sec.docente_nombre || sec.docente_apellido) && (
                        <p className="text-[11px] text-slate-500 mt-0.5">{sec.docente_nombre} {sec.docente_apellido}</p>
                      )}
                      <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">{sec.fundamentacion}</p>

                      {sec.tipo_articulacion === 'declarativa' && sec.articulacion_materias && (
                        <div className="mt-3 p-2.5 rounded-lg bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2">
                          <Link2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                          <div>
                            <div className="font-semibold text-[11px]">Articula con: {sec.articulacion_materias}</div>
                            {sec.articulacion_eje && <div className="text-[10px] text-emerald-800 italic">Eje: {sec.articulacion_eje}</div>}
                          </div>
                        </div>
                      )}
                      {dev && (
                        <div className="mt-3 p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-900 italic flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                          "{dev}"
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="text-slate-400 text-[11px] flex items-center gap-1">
                        {sec.tiempo_estimado && (<><Clock className="w-3.5 h-3.5" aria-hidden="true" />{sec.tiempo_estimado}</>)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button type="button" onClick={() => setPrinting(sec)} className="px-2.5 py-1.5 text-slate-700 hover:bg-slate-100 rounded-lg font-semibold flex items-center gap-1" aria-label={`Imprimir ${sec.titulo}`}>
                          <Printer className="w-3.5 h-3.5" aria-hidden="true" /> Imprimir
                        </button>
                        {own && canCreate && (
                          <button type="button" onClick={() => handleDuplicate(sec)} className="px-2.5 py-1.5 text-slate-700 hover:bg-slate-100 rounded-lg font-semibold flex items-center gap-1" aria-label={`Duplicar ${sec.titulo}`}>
                            <Copy className="w-3.5 h-3.5" aria-hidden="true" /> Duplicar
                          </button>
                        )}
                        {editable && (
                          <button type="button" onClick={() => setToDelete(sec)} className="px-2.5 py-1.5 text-rose-700 hover:bg-rose-50 rounded-lg font-semibold flex items-center gap-1" aria-label={`Eliminar ${sec.titulo}`}>
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> Eliminar
                          </button>
                        )}
                        <button type="button" onClick={() => setModal({ open: true, secuencia: sec })} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1 transition">
                          {editable ? <Pencil className="w-3.5 h-3.5" aria-hidden="true" /> : <Eye className="w-3.5 h-3.5" aria-hidden="true" />}
                          {editable ? 'Editar' : DIRECTIVOS.includes(user.rol) && !own ? 'Ver / Revisar' : 'Ver'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'colaborativas' && <ArticulacionColaborativa espacios={espacios} defaultEspacioId={espacioId} />}

      {modal.open && (
        <SecuenciaForm
          secuencia={modal.secuencia}
          espacios={espacios}
          defaultEspacioId={espacioId}
          user={user}
          onClose={() => setModal({ open: false, secuencia: null })}
          onSaved={() => {
            setModal({ open: false, secuencia: null });
            reload();
          }}
        />
      )}

      {printing && <PrintableSecuencia secuencia={printing} onClose={() => setPrinting(null)} />}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Eliminar secuencia"
        message={`¿Eliminar la secuencia "${toDelete?.titulo || ''}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        busy={deleting}
        onCancel={() => setToDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
