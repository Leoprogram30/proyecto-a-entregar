import { useState } from 'react';
import { ArrowLeft, Check, Printer, UserPlus, X } from 'lucide-react';
import { useAsync } from '../../hooks/useAsync';
import { api } from '../../services/api';
import { ConfirmDialog, ErrorState, Loading, Modal, Notice, useToast } from '../ui';
import { MODALIDADES, inputCls } from './constantes';
import { AyudaModalidades, Campo, EstadoArt } from './comunes';
import TabAcuerdo from './TabAcuerdo';
import TabAportes from './TabAportes';
import TabMatriz from './TabMatriz';
import TabPlan from './TabPlan';
import TabEvaluacion from './TabEvaluacion';
import TabHistorial from './TabHistorial';
import ImpresionProyecto from './ImpresionProyecto';

function NotaRuta2({ anio }) {
  const { data } = useAsync(() => api.getRutas(), []);
  if (data?.find((r) => r.anio_lectivo === anio)?.ruta !== 'ruta_2') return null;
  return (
    <p className="text-[11px] text-sky-800 bg-sky-50 border border-sky-200 rounded-lg px-2 py-1">
      Ciclo lectivo {anio} en Ruta 2 (institución precursora): una vez presentado, este proyecto cuenta para la cobertura de tiempo compartido y proyectos de integración.
    </p>
  );
}

const TABS = [
  ['acuerdo', 'Acuerdo'],
  ['aportes', 'Aportes'],
  ['matriz', 'Matriz'],
  ['plan', 'Plan de trabajo'],
  ['evaluacion', 'Evaluación'],
  ['historial', 'Historial']
];

function InvitarModal({ proyecto, participantes, onClose, run }) {
  const docentes = useAsync(() => api.getDocentesDisponibles(), [], []);
  const espacios = useAsync(() => api.getEspacios({ anio: proyecto.curso }), [proyecto.curso], []);
  const [docenteId, setDocenteId] = useState('');
  const [espacioId, setEspacioId] = useState('');
  const yaEstan = new Set(participantes.map((x) => `${x.docente_id}-${x.espacio_id}`));
  const enviar = async (e) => {
    e.preventDefault();
    const r = await run('invitar', { docente_id: Number(docenteId), espacio_id: Number(espacioId) }, 'Invitación enviada.');
    if (r) onClose();
  };
  return (
    <Modal open onClose={onClose} title="Invitar a un docente" size="max-w-md">
      <form onSubmit={enviar} className="space-y-3">
        <p className="text-xs text-slate-600">Elija al docente y el espacio curricular de {proyecto.curso}.° año con el que participaría.</p>
        <Campo label="Docente" htmlFor="inv-doc">
          <select id="inv-doc" required value={docenteId} onChange={(e) => setDocenteId(e.target.value)} className={inputCls}>
            <option value="">Seleccione...</option>
            {docentes.data.map((d) => (
              <option key={d.id} value={d.id}>{d.nombre}</option>
            ))}
          </select>
        </Campo>
        <Campo label="Espacio curricular" htmlFor="inv-esp">
          <select id="inv-esp" required value={espacioId} onChange={(e) => setEspacioId(e.target.value)} className={inputCls}>
            <option value="">Seleccione...</option>
            {espacios.data.map((x) => (
              <option key={x.id} value={x.id} disabled={yaEstan.has(`${docenteId}-${x.id}`)}>{x.nombre} ({x.horas_catedra} hs)</option>
            ))}
          </select>
        </Campo>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-3 py-2 text-xs font-semibold text-slate-600">Cancelar</button>
          <button type="submit" className="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold rounded-lg">Enviar invitación</button>
        </div>
      </form>
    </Modal>
  );
}

function RevisarModal({ onClose, run }) {
  const [decision, setDecision] = useState('autorizado');
  const [motivo, setMotivo] = useState('');
  const enviar = async (e) => {
    e.preventDefault();
    const r = await run('revisar', { decision, motivo }, decision === 'autorizado' ? 'Proyecto autorizado.' : 'Proyecto devuelto con observaciones.');
    if (r) onClose();
  };
  return (
    <Modal open onClose={onClose} title="Revisión directiva" size="max-w-md">
      <form onSubmit={enviar} className="space-y-3">
        <fieldset className="space-y-1.5 text-xs">
          <legend className="font-semibold text-slate-700 mb-1">Decisión</legend>
          <label className="flex items-center gap-2"><input type="radio" name="dec" checked={decision === 'autorizado'} onChange={() => setDecision('autorizado')} /> Autorizar</label>
          <label className="flex items-center gap-2"><input type="radio" name="dec" checked={decision === 'observado'} onChange={() => setDecision('observado')} /> Devolver con observaciones</label>
        </fieldset>
        <Campo label={decision === 'observado' ? 'Motivo (obligatorio)' : 'Comentario (opcional)'} htmlFor="rev-motivo">
          <textarea id="rev-motivo" rows={4} required={decision === 'observado'} value={motivo} onChange={(e) => setMotivo(e.target.value)} className={inputCls} />
        </Campo>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-3 py-2 text-xs font-semibold text-slate-600">Cancelar</button>
          <button type="submit" className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg">Guardar decisión</button>
        </div>
      </form>
    </Modal>
  );
}

function CerrarModal({ onClose, run }) {
  const [texto, setTexto] = useState('');
  const enviar = async (e) => {
    e.preventDefault();
    const r = await run('cerrar', { evaluacion_instancia: texto }, 'Proyecto cerrado.');
    if (r) onClose();
  };
  return (
    <Modal open onClose={onClose} title="Cerrar el proyecto" size="max-w-lg">
      <form onSubmit={enviar} className="space-y-3">
        <Campo label="Evaluación de la instancia" htmlFor="cer-ev" hint="¿Qué funcionó y qué cambiarían? Es obligatoria para cerrar.">
          <textarea id="cer-ev" rows={5} required value={texto} onChange={(e) => setTexto(e.target.value)} className={inputCls} />
        </Campo>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-3 py-2 text-xs font-semibold text-slate-600">Cancelar</button>
          <button type="submit" className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg">Cerrar proyecto</button>
        </div>
      </form>
    </Modal>
  );
}

function Unirse({ proyecto, run }) {
  const espacios = useAsync(() => api.getEspacios({ anio: proyecto.curso }), [proyecto.curso], []);
  const [espacioId, setEspacioId] = useState('');
  return (
    <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-xs flex flex-col sm:flex-row sm:items-end gap-2">
      <div className="flex-1">
        <label htmlFor="uni-esp" className="block font-semibold text-sky-900 mb-1">Esta convocatoria está abierta. ¿Quiere sumar su espacio?</label>
        <select id="uni-esp" value={espacioId} onChange={(e) => setEspacioId(e.target.value)} className={inputCls}>
          <option value="">Elija su espacio curricular...</option>
          {espacios.data.map((x) => (
            <option key={x.id} value={x.id}>{x.nombre} ({x.horas_catedra} hs)</option>
          ))}
        </select>
      </div>
      <button type="button" disabled={!espacioId} onClick={() => run('join', { espacio_id: Number(espacioId) }, 'Se sumó al proyecto.')} className="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded-lg disabled:opacity-50">
        Sumarme
      </button>
    </div>
  );
}

export default function FichaProyecto({ id, onBack }) {
  const toast = useToast();
  const { data, error, loading, reload } = useAsync(() => api.getProyectoArt(id), [id]);
  const [d, setD] = useState(null);
  const [tab, setTab] = useState('acuerdo');
  const [modal, setModal] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [busy, setBusy] = useState(false);
  const [imprimiendo, setImprimiendo] = useState(false);

  // Conserva la última ficha mientras recarga, para no perder la posición ni las pestañas
  if (data && data !== d) setD(data);

  const run = async (accion, body, ok) => {
    setBusy(true);
    try {
      const r = await api.proyectoArtAccion(accion, { proyecto_id: id, ...body });
      if (ok) toast.success(typeof ok === 'function' ? ok(r) : ok);
      reload();
      return r ?? true;
    } catch (e) {
      toast.error(e.message);
      return null;
    } finally {
      setBusy(false);
    }
  };

  if (!d) {
    if (error) return (
      <div className="space-y-3">
        <button type="button" onClick={onBack} className="text-xs font-semibold text-slate-600 flex items-center gap-1"><ArrowLeft className="w-4 h-4" aria-hidden="true" /> Volver</button>
        <ErrorState message={error} onRetry={reload} />
      </div>
    );
    return loading ? <Loading message="Cargando proyecto..." /> : null;
  }

  const { proyecto: p, participantes, permisos, calculo } = d;
  const mod = MODALIDADES[p.modalidad];
  const aceptados = participantes.filter((x) => x.invitacion === 'aceptado');
  const misAceptados = aceptados.filter((x) => permisos.mis_espacios.some((m) => m.espacio_id === x.espacio_id));
  const invitaciones = permisos.mis_espacios.filter((m) => m.invitacion === 'invitado');
  const enAcuerdo = ['en_acuerdo', 'conformado', 'observado'].includes(p.estado);
  const editable = ['borrador', 'en_acuerdo', 'conformado', 'observado'].includes(p.estado);
  const conformo = misAceptados.length > 0 && misAceptados.every((x) => x.conformidad);
  const nEspacios = new Set(aceptados.map((x) => x.espacio_id)).size;
  const sobraEspacio = p.modalidad === 'tiempo_compartido' && nEspacios > 2;
  const completo = permisos.nivel === 'completo';
  const esParticipante = permisos.es_creador || misAceptados.length > 0;

  return (
    <div className="space-y-4">
      <button type="button" onClick={onBack} className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1">
        <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Volver al listado
      </button>

      <header className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <EstadoArt estado={p.estado} />
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700">
            {p.curso}.° año{p.division ? ` ${p.division}` : ''} · {p.anio_lectivo}
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-sky-800">{mod?.label}</span>
        </div>
        <h1 className="text-lg font-extrabold text-slate-900">{p.titulo}</h1>
        <p className="text-xs text-slate-700"><span className="font-semibold">Eje:</span> {p.eje}</p>
        <NotaRuta2 anio={p.anio_lectivo} />
        <p className="text-[11px] text-slate-500">Creado por {p.creador_nombre} {p.creador_apellido}</p>

        <div className="flex flex-wrap gap-2 pt-1">
          {permisos.es_creador && p.estado === 'borrador' && (
            <button type="button" disabled={busy} onClick={() => run('abrir', {}, 'Proyecto abierto a convocatoria.')} className="px-3 py-1.5 bg-sky-700 text-white text-xs font-bold rounded-lg disabled:opacity-50">Abrir a convocatoria</button>
          )}
          {esParticipante && editable && (
            <button type="button" onClick={() => setModal('invitar')} className="px-3 py-1.5 bg-white border border-slate-300 text-slate-800 text-xs font-bold rounded-lg flex items-center gap-1.5">
              <UserPlus className="w-4 h-4" aria-hidden="true" /> Invitar docente
            </button>
          )}
          {misAceptados.length > 0 && enAcuerdo && (
            conformo ? (
              <button type="button" disabled={busy} onClick={() => run('conformar', { conforme: false }, 'Conformidad retirada.')} className="px-3 py-1.5 bg-white border border-slate-300 text-slate-800 text-xs font-bold rounded-lg flex items-center gap-1.5 disabled:opacity-50">
                <X className="w-4 h-4" aria-hidden="true" /> Retirar mi conformidad
              </button>
            ) : (
              <button type="button" disabled={busy} onClick={() => run('conformar', { conforme: true }, 'Conformidad registrada.')} className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 disabled:opacity-50">
                <Check className="w-4 h-4" aria-hidden="true" /> Doy mi conformidad
              </button>
            )
          )}
          {permisos.es_creador && ['conformado', 'observado'].includes(p.estado) && (
            <button type="button" disabled={busy} onClick={() => run('presentar', {}, 'Proyecto presentado a la Dirección.')} className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg disabled:opacity-50">Presentar a la Dirección</button>
          )}
          {permisos.puede_revisar && (
            <button type="button" onClick={() => setModal('revisar')} className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg">Revisar proyecto</button>
          )}
          {permisos.es_creador && p.estado === 'autorizado' && (
            <button type="button" disabled={busy} onClick={() => run('iniciar', {}, 'Proyecto en ejecución.')} className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-lg disabled:opacity-50">Iniciar ejecución</button>
          )}
          {permisos.es_creador && p.estado === 'en_ejecucion' && (
            <button type="button" onClick={() => setModal('cerrar')} className="px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-lg">Cerrar proyecto</button>
          )}
          {completo && (
            <button type="button" onClick={() => setImprimiendo(true)} className="px-3 py-1.5 bg-white border border-slate-300 text-slate-800 text-xs font-bold rounded-lg flex items-center gap-1.5">
              <Printer className="w-4 h-4" aria-hidden="true" /> Imprimir
            </button>
          )}
          {permisos.es_creador && p.estado === 'borrador' && (
            <button type="button" onClick={() => setConfirmar('eliminar')} className="px-3 py-1.5 text-rose-700 text-xs font-bold">Eliminar borrador</button>
          )}
          {!permisos.es_creador && misAceptados.length > 0 && editable && (
            <button type="button" onClick={() => setConfirmar('salir')} className="px-3 py-1.5 text-rose-700 text-xs font-bold">Dejar el proyecto</button>
          )}
        </div>
      </header>

      {invitaciones.map((inv) => {
        const esp = participantes.find((x) => x.espacio_id === inv.espacio_id && permisos.mis_espacios.some((m) => m.espacio_id === x.espacio_id));
        return (
          <div key={inv.espacio_id} role="status" className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-xs flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="flex-1 text-sky-900">Lo invitaron a participar con <strong>{esp?.espacio_nombre}</strong>.</span>
            <button type="button" disabled={busy} onClick={() => run('responder', { espacio_id: inv.espacio_id, aceptar: true }, 'Se sumó al proyecto.')} className="px-3 py-1.5 bg-sky-700 text-white font-bold rounded-lg disabled:opacity-50">Aceptar</button>
            <button type="button" disabled={busy} onClick={() => run('responder', { espacio_id: inv.espacio_id, aceptar: false }, 'Invitación rechazada.')} className="px-3 py-1.5 bg-white border border-slate-300 font-bold rounded-lg disabled:opacity-50">Rechazar</button>
          </div>
        );
      })}
      {permisos.puede_unirse && (p.modalidad === 'tiempo_compartido' && aceptados.length >= 2 ? (
        <p className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-xs text-sky-900">
          El trabajo integrado en tiempo compartido reúne dos espacios y ya están cubiertos. Para sumar un tercero, quien creó la propuesta puede pasarla a proyecto interdisciplinario.
        </p>
      ) : (
        <Unirse proyecto={p} run={run} />
      ))}

      {p.devolucion && ['observado', 'autorizado', 'presentado'].includes(p.estado) && (
        <div className={`rounded-xl border p-3 text-xs ${p.estado === 'observado' ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'}`}>
          <strong>Devolución de la Dirección:</strong> {p.devolucion}
        </div>
      )}
      {sobraEspacio && (
        <Notice>
          Hay {nEspacios} espacios en este proyecto. El trabajo integrado en tiempo compartido vincula exactamente dos espacios; para tres o
          más conviene la modalidad «Proyecto interdisciplinario».
          {permisos.puede_editar && (
            <button type="button" disabled={busy} onClick={() => run('update', { modalidad: 'proyecto_interdisciplinario' }, 'Modalidad cambiada. Las conformidades se anularon.')} className="ml-2 font-bold underline">
              Cambiar modalidad
            </button>
          )}
        </Notice>
      )}
      {calculo.advertencias.filter((a) => !(sobraEspacio && a.startsWith('El trabajo integrado'))).map((a) => (
        <Notice key={a}>{a}</Notice>
      ))}
      {enAcuerdo && completo && (
        <p className="text-[11px] text-slate-600" aria-live="polite">
          Conformidad: {aceptados.filter((x) => x.conformidad).length} de {aceptados.length} docentes
          {participantes.some((x) => x.invitacion === 'invitado') ? ` · ${participantes.filter((x) => x.invitacion === 'invitado').length} invitación(es) sin responder` : ''}.
          Cualquier cambio en un aporte o en el eje anula las conformidades.
        </p>
      )}

      <div className="flex overflow-x-auto border-b border-slate-200 bg-white rounded-xl" role="tablist" aria-label="Secciones del proyecto">
        {TABS.filter(([k]) => completo || k === 'acuerdo' || k === 'aportes').map(([k, l]) => (
          <button
            key={k}
            type="button"
            role="tab"
            id={`tab-${k}`}
            aria-selected={tab === k}
            aria-controls={`panel-${k}`}
            onClick={() => setTab(k)}
            className={`px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 ${tab === k ? 'border-emerald-600 text-emerald-900 bg-emerald-50/50' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            {l}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="space-y-4">
        {tab === 'acuerdo' && <TabAcuerdo d={d} run={run} busy={busy} />}
        {tab === 'aportes' && <TabAportes d={d} run={run} />}
        {tab === 'matriz' && <TabMatriz d={d} />}
        {tab === 'plan' && <TabPlan d={d} run={run} />}
        {tab === 'evaluacion' && <TabEvaluacion d={d} run={run} busy={busy} />}
        {tab === 'historial' && <TabHistorial d={d} />}
      </div>

      <AyudaModalidades resaltada={p.modalidad} />

      {modal === 'invitar' && <InvitarModal proyecto={p} participantes={participantes} onClose={() => setModal('')} run={run} />}
      {modal === 'revisar' && <RevisarModal onClose={() => setModal('')} run={run} />}
      {modal === 'cerrar' && <CerrarModal onClose={() => setModal('')} run={run} />}
      <ConfirmDialog
        open={confirmar !== ''}
        title={confirmar === 'eliminar' ? 'Eliminar borrador' : 'Dejar el proyecto'}
        message={confirmar === 'eliminar' ? 'Se eliminará el borrador y todo lo cargado. No se puede deshacer.' : 'Dejará de participar y se anularán las conformidades de los demás docentes.'}
        confirmLabel={confirmar === 'eliminar' ? 'Eliminar' : 'Dejar el proyecto'}
        busy={busy}
        onCancel={() => setConfirmar('')}
        onConfirm={async () => {
          const r = await run(confirmar === 'eliminar' ? 'delete' : 'leave', {}, confirmar === 'eliminar' ? 'Borrador eliminado.' : 'Dejó el proyecto.');
          setConfirmar('');
          if (r) onBack();
        }}
      />
      {imprimiendo && <ImpresionProyecto d={d} onClose={() => setImprimiendo(false)} />}
    </div>
  );
}
