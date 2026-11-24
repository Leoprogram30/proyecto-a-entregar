import { useState } from 'react';
import { Plus, Users, Mail } from 'lucide-react';
import { useAsync } from '../../hooks/useAsync';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { EmptyState, ErrorState, Loading } from '../ui';
import { ESTADOS_ART, MODALIDADES, inputCls } from './constantes';
import { AyudaModalidades, EstadoArt } from './comunes';

const PUEDEN_CREAR = ['docente', 'coordinador'];

export default function ListadoArticulacion({ onNuevo, onAbrir }) {
  const { user } = useAuth();
  const { data, error, loading, reload } = useAsync(() => api.getProyectosArticulados(), [], []);
  const [f, setF] = useState({ alcance: 'todos', curso: '', modalidad: '', estado: '' });
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  const visibles = data.filter((p) => {
    if (f.alcance === 'mios' && !(p.soy_creador || p.soy_participante)) return false;
    if (f.alcance === 'invitaciones' && p.mi_invitacion !== 'invitado') return false;
    if (f.alcance === 'convocatorias' && !(p.estado === 'en_acuerdo' && !p.soy_creador && !p.mi_invitacion)) return false;
    if (f.curso && String(p.curso) !== f.curso) return false;
    if (f.modalidad && p.modalidad !== f.modalidad) return false;
    if (f.estado && p.estado !== f.estado) return false;
    return true;
  });
  const invitaciones = data.filter((p) => p.mi_invitacion === 'invitado').length;
  const puedeCrear = PUEDEN_CREAR.includes(user.rol);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-sky-700" aria-hidden="true" /> Articulación entre espacios curriculares
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-3xl">
            Cada docente suma su espacio al proyecto desde un tema, aprendizajes o contenidos de su materia. Por ejemplo, Educación Física
            propone el cuerpo humano y Matemática, las funciones lineales: el módulo los reúne en un eje común.
          </p>
        </div>
        {puedeCrear && (
          <button
            type="button"
            onClick={onNuevo}
            className="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold rounded-lg flex items-center gap-2 self-start"
          >
            <Plus className="w-4 h-4" aria-hidden="true" /> Nuevo proyecto
          </button>
        )}
      </div>

      <AyudaModalidades />

      {invitaciones > 0 && (
        <div role="status" className="flex items-center gap-2 p-3 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-900">
          <Mail className="w-4 h-4" aria-hidden="true" />
          Tiene {invitaciones} {invitaciones === 1 ? 'invitación pendiente' : 'invitaciones pendientes'}.
          <button type="button" className="font-bold underline" onClick={() => setF((s) => ({ ...s, alcance: 'invitaciones' }))}>
            Verlas
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="art-f-alcance" className="block text-[11px] font-semibold text-slate-600 mb-1">Mostrar</label>
          <select id="art-f-alcance" value={f.alcance} onChange={set('alcance')} className={inputCls}>
            <option value="todos">Todo lo que puedo ver</option>
            <option value="mios">Mis proyectos</option>
            <option value="invitaciones">Mis invitaciones</option>
            <option value="convocatorias">Convocatorias abiertas</option>
          </select>
        </div>
        <div>
          <label htmlFor="art-f-curso" className="block text-[11px] font-semibold text-slate-600 mb-1">Curso</label>
          <select id="art-f-curso" value={f.curso} onChange={set('curso')} className={inputCls}>
            <option value="">Todos</option>
            {[1, 2, 3, 4, 5, 6].map((c) => (
              <option key={c} value={c}>{c}.° año</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="art-f-mod" className="block text-[11px] font-semibold text-slate-600 mb-1">Modalidad</label>
          <select id="art-f-mod" value={f.modalidad} onChange={set('modalidad')} className={inputCls}>
            <option value="">Todas</option>
            {Object.entries(MODALIDADES).map(([k, m]) => (
              <option key={k} value={k}>{m.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="art-f-estado" className="block text-[11px] font-semibold text-slate-600 mb-1">Estado</label>
          <select id="art-f-estado" value={f.estado} onChange={set('estado')} className={inputCls}>
            <option value="">Todos</option>
            {Object.entries(ESTADOS_ART).map(([k, e]) => (
              <option key={k} value={k}>{e.label}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && <Loading message="Cargando proyectos..." />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {!loading && !error && visibles.length === 0 && (
        <EmptyState
          title="No hay proyectos para mostrar"
          message={puedeCrear ? 'Cree un proyecto nuevo o cambie los filtros.' : 'Los proyectos aparecen aquí cuando son presentados a la Dirección.'}
        />
      )}

      <ul className="grid gap-3 md:grid-cols-2">
        {visibles.map((p) => (
          <li key={p.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <EstadoArt estado={p.estado} />
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700">
                {p.curso}.° año{p.division ? ` ${p.division}` : ''} · {p.anio_lectivo}
              </span>
              {p.mi_invitacion === 'invitado' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-600 text-white">Invitación</span>
              )}
            </div>
            <h2 className="text-sm font-bold text-slate-900">{p.titulo}</h2>
            <p className="text-[11px] text-slate-500">{MODALIDADES[p.modalidad]?.label}</p>
            <p className="text-xs text-slate-700 line-clamp-3">Eje: {p.eje}</p>
            <p className="text-[11px] text-slate-600">
              {p.participantes
                .filter((x) => x.invitacion === 'aceptado')
                .map((x) => `${x.espacio_nombre} (${x.docente_nombre} ${x.docente_apellido})`)
                .join(' · ') || 'Sin participantes'}
            </p>
            <div className="mt-auto pt-2">
              <button
                type="button"
                onClick={() => onAbrir(p.id)}
                aria-label={`Abrir el proyecto ${p.titulo}`}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg"
              >
                Abrir
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
