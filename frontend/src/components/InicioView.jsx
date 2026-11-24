import { useAsync } from '../hooks/useAsync';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ErrorState, Loading, formatFecha } from './ui';
import { AlertTriangle, ArrowRight, Flag, CalendarDays, CheckCircle2, Clock, FileText, Layers, UserCheck } from 'lucide-react';

const n = (grupo, estado) => grupo?.[estado] ?? 0;

function Tarjeta({ icon: Icon, valor, texto, destacado = false, onClick }) {
  const alerta = destacado && valor > 0;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left bg-white rounded-2xl border p-4 shadow-xs transition hover:shadow-md hover:border-emerald-400 ${
        alerta ? 'border-amber-400 ring-1 ring-amber-200' : 'border-slate-200'
      }`}
    >
      <Icon className={`w-5 h-5 ${alerta ? 'text-amber-600' : 'text-emerald-700'}`} aria-hidden="true" />
      <div className="text-2xl font-extrabold text-slate-900 mt-2">{valor}</div>
      <div className="text-xs text-slate-600">{texto}</div>
    </button>
  );
}

function ListaFechas({ titulo, vacio, items, onVer, verTexto }) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-emerald-700" aria-hidden="true" />
          {titulo}
        </h3>
        <button type="button" onClick={onVer} className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1">
          {verTexto} <ArrowRight className="w-3 h-3" aria-hidden="true" />
        </button>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-slate-500">{vacio}</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((i) => (
            <li key={i.id} className="py-2 flex items-start justify-between gap-3 text-xs">
              <div>
                <div className="font-semibold text-slate-800">{i.titulo}</div>
                {i.espacio_nombre && (
                  <div className="text-slate-500">
                    {i.espacio_nombre} ({i.espacio_anio}° año)
                  </div>
                )}
              </div>
              <span className="text-slate-600 whitespace-nowrap">
                {formatFecha(i.fecha || i.fecha_inicio)}
                {i.fecha_fin && i.fecha_fin !== i.fecha_inicio ? ` al ${formatFecha(i.fecha_fin)}` : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function InicioView({ onNavigate }) {
  const { user } = useAuth();
  const { data, loading, error, reload } = useAsync(() => api.getInicio(), [user.id]);

  if (loading) return <Loading message="Cargando resumen..." />;
  if (error || !data) return <ErrorState message={error || 'No se pudo cargar el resumen.'} onRetry={reload} />;

  const { mis_planificaciones: mp, mis_secuencias: ms, institucion: inst } = data;
  const planesDevueltos = n(mp, 'requiere_ajustes');
  const secuenciasDevueltas = n(ms, 'requiere_ajustes');
  const devueltas = planesDevueltos + secuenciasDevueltas;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-emerald-900 to-emerald-700 text-white p-6 sm:p-8 shadow-md">
        <h2 className="text-2xl font-extrabold">Hola, {user.nombre}</h2>
        <p className="text-sm text-emerald-100 mt-1">Este es el resumen de su trabajo en el IPEM N° 349 "Giovanni Bosco".</p>
      </div>

      {data.ruta && (
        <section aria-label="Ruta institucional" className="rounded-xl border border-sky-200 bg-sky-50 text-sky-900 text-xs p-3 space-y-1">
          <p className="flex items-center gap-2">
            <Flag className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>
              Ruta institucional {data.ruta.anio}: <strong>{data.ruta.ruta === 'ruta_2' ? 'Ruta 2 (institución precursora)' : 'Ruta 1'}</strong>.
            </span>
          </p>
          {data.ruta.ruta_proximo === 'ruta_2' && (
            <p className="pl-6">
              Preparación {data.ruta.anio_proximo}: la escuela es institución precursora.{' '}
              <button type="button" onClick={() => onNavigate('precursora')} className="font-bold underline">
                Ver el seguimiento
              </button>
            </p>
          )}
        </section>
      )}

      {mp && (devueltas > 0 || data.hitos_vencidos > 0) && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 text-amber-900 text-xs p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>
            {devueltas > 0 && `Documentos con ajustes solicitados por el equipo directivo: ${devueltas}. `}
            {data.hitos_vencidos > 0 && `Actividades de agenda vencidas sin marcar como cumplidas: ${data.hitos_vencidos}.`}
          </span>
        </div>
      )}

      {mp && (
        <section aria-label="Mi trabajo">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Mi trabajo</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Tarjeta icon={FileText} valor={n(mp, 'borrador')} texto="Planificaciones en borrador" onClick={() => onNavigate('planificaciones')} />
            <Tarjeta icon={Clock} valor={n(mp, 'pendiente_revision')} texto="Planificaciones en revisión" onClick={() => onNavigate('planificaciones')} />
            <Tarjeta icon={CheckCircle2} valor={n(mp, 'aprobada')} texto="Planificaciones aprobadas" onClick={() => onNavigate('planificaciones')} />
            <Tarjeta
              icon={AlertTriangle}
              valor={devueltas}
              texto="Con ajustes solicitados"
              destacado
              onClick={() => onNavigate(planesDevueltos === 0 && secuenciasDevueltas > 0 ? 'secuencias' : 'planificaciones')}
            />
          </div>
        </section>
      )}

      {inst && (
        <section aria-label="Institución">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Institución</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Tarjeta icon={FileText} valor={n(inst.planificaciones, 'pendiente_revision')} texto="Planificaciones para revisar" destacado onClick={() => onNavigate('directivo-supervision')} />
            <Tarjeta icon={Layers} valor={n(inst.secuencias, 'pendiente_revision')} texto="Secuencias para revisar" destacado onClick={() => onNavigate('directivo-supervision')} />
            <Tarjeta icon={CheckCircle2} valor={n(inst.planificaciones, 'aprobada')} texto="Planificaciones aprobadas" onClick={() => onNavigate('directivo-supervision')} />
            {data.usuarios_pendientes !== undefined && (
              <Tarjeta icon={UserCheck} valor={data.usuarios_pendientes} texto="Solicitudes de acceso" destacado onClick={() => onNavigate('admin-users')} />
            )}
          </div>
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {data.proximos_hitos && (
          <ListaFechas titulo="Mis próximas actividades" vacio="No hay actividades próximas en la agenda." items={data.proximos_hitos} onVer={() => onNavigate('agenda')} verTexto="Ver agenda" />
        )}
        <ListaFechas titulo="Cronograma escolar" vacio="No hay eventos próximos." items={data.cronograma} onVer={() => onNavigate('cronograma')} verTexto="Ver cronograma" />
      </div>
    </div>
  );
}
