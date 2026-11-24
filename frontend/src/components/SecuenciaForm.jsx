import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import { DIRECTIVOS } from '../config/views';
import { CAPACIDADES_FUNDAMENTALES, FORMATOS_PEDAGOGICOS, MOMENTOS_CLASE, asArray, nuevoContenido } from '../config/catalogos';
import { Modal, useToast } from './ui';
import ContenidosPicker from './planning/ContenidosPicker';
import { useEspacioCurricular } from './planning/useEspacioCurricular';
import { CheckGroup, RowControls } from './planning/FormBits';
import { btnSecondary, fieldCls, moveItem } from './planning/helpers';
import PrintableSecuencia from './PrintableSecuencia';
import { Sparkles, Plus, Save, Send, ArrowLeft, ArrowRight, MessageSquare, Printer, Download } from 'lucide-react';

const STEPS = [
  { step: 1, title: '1. Datos y vínculo' },
  { step: 2, title: '2. Objetivos y contenidos' },
  { step: 3, title: '3. Formato y tiempo' },
  { step: 4, title: '4. Clases' },
  { step: 5, title: '5. Evaluación y recursos' },
  { step: 6, title: '6. Articulación y revisión' }
];

const FIELD_STEP = {
  espacio_id: 1, titulo: 1, planificacion_id: 1, fundamentacion: 1,
  objetivos: 2, contenidos: 2, capacidades: 2,
  formato: 3, tiempo_estimado: 3, agrupamientos: 3, ambiente: 3,
  clases: 4, producto: 5, evaluacion_criterios: 5, evaluacion_instrumentos: 5, recursos: 5, bibliografia: 5,
  tipo_articulacion: 6, articulacion_eje: 6, articulacion_materias: 6
};

const EMPTY = {
  titulo: '',
  planificacion_id: '',
  fundamentacion: '',
  objetivos: '',
  contenidos: [],
  capacidades: [],
  formato: '',
  tiempo_estimado: '',
  agrupamientos: '',
  ambiente: '',
  clases: [],
  producto: '',
  evaluacion_criterios: '',
  evaluacion_instrumentos: '',
  recursos: '',
  bibliografia: '',
  tipo_articulacion: 'ninguna',
  articulacion_eje: '',
  articulacion_materias: ''
};

const emptyClase = (momento = 'desarrollo') => ({ titulo: '', momento, duracion: '', actividades: '', recursos: '', evaluativa: false });

// Plantillas modelo completas: no definen espacio ni ids, solo completan el formulario
const TEMPLATES = {
  compost: {
    titulo: 'Manejo de sustratos orgánicos y compostaje',
    fundamentacion:
      'En el contexto productivo de Colonia Caroya, la valorización de restos de poda vitícola y residuos orgánicos permite regenerar la microbiología del suelo escolar y vincular el trabajo en la huerta con los contenidos del espacio.',
    objetivos:
      'Reconocer la importancia de la relación carbono/nitrógeno en la elaboración de compost.\nMonitorear la temperatura de la pila y registrar los datos en la bitácora.\nValorar el abono maduro como insumo de los canteros hortícolas.',
    contenidos: [
      nuevoContenido('Compostaje: materiales, relación C/N, humedad, aireación y fases de la descomposición.', {
        fuente: 'institucional',
        indicadores: ['Clasifica los residuos en materiales ricos en carbono y en nitrógeno.', 'Registra la temperatura de la pila a lo largo del proceso.']
      }),
      nuevoContenido('Uso del compost en la producción hortícola escolar.', { fuente: 'institucional', prioridad: 'complementario', indicadores: ['Explica en qué canteros y en qué momento aplicaría el abono maduro.'] })
    ],
    capacidades: ['Abordaje y resolución de situaciones problemáticas', 'Trabajo colaborativo y cooperativo'],
    formato: 'Taller',
    tiempo_estimado: '3 semanas (6 clases)',
    agrupamientos: 'Equipos de 4 estudiantes con roles rotativos (registro, medición, volteo, comunicación).',
    ambiente: 'Aula para la introducción y sector de compostaje de la huerta escolar.',
    clases: [
      { titulo: 'Qué hay en un compost', momento: 'inicio', duracion: '80 min', actividades: 'Indagación de saberes previos con fotos de chacras locales. Clasificación de materiales en secos (carbono) y verdes (nitrógeno).', recursos: 'Fotos, restos de poda, restos de cocina.', evaluativa: false },
      { titulo: 'Armado de la pila', momento: 'desarrollo', duracion: '80 min', actividades: 'Armado de la pila con capas alternadas de material seco y verde. Medición de la temperatura inicial y prueba de humedad del puño.', recursos: 'Palas, termómetro de punzón, agua.', evaluativa: false },
      { titulo: 'Seguimiento y volteo', momento: 'desarrollo', duracion: '80 min', actividades: 'Control de temperatura y humedad. Volteo de la pila y registro en la bitácora.', recursos: 'Bitácora, termómetro.', evaluativa: true },
      { titulo: 'Tamizado y prueba de germinación', momento: 'cierre', duracion: '80 min', actividades: 'Tamizado del compost, prueba de germinación en semillas de rábano y puesta en común de resultados.', recursos: 'Tamiz, semillas de rábano, macetas.', evaluativa: true }
    ],
    producto: 'Bitácora del proceso con curva de temperatura y compost obtenido.',
    evaluacion_criterios: 'Participación en el trabajo en equipo. Precisión de los registros. Explicación del proceso con vocabulario técnico.',
    evaluacion_instrumentos: 'Rúbrica de trabajo práctico colaborativo y ficha de seguimiento de temperatura.',
    recursos: 'Termómetro de punzón, tamiz, restos de poda, guano, agua, palas.',
    bibliografia: 'Diseño curricular del espacio. Guías técnicas de compostaje de organismos de extensión rural. Apuntes de cátedra.',
    tipo_articulacion: 'declarativa',
    articulacion_eje: 'Ciclos biogeoquímicos y materia orgánica del suelo',
    articulacion_materias: 'Química Aplicada y Bioquímica'
  },
  injerto: {
    titulo: 'Multiplicación agámica: técnicas de injerto en vid',
    fundamentacion:
      'La vitivinicultura de Colonia Caroya requiere conocer la técnica de injerto sobre pie americano. La secuencia propone aprender haciendo, con seguridad en el uso de herramientas cortantes.',
    objetivos:
      'Realizar cortes limpios y asegurar el contacto entre patrón e injerto.\nIdentificar las partes de la vara de injertar y justificar la elección de la técnica.\nEvaluar el porcentaje de prendimiento.',
    contenidos: [
      nuevoContenido('Propagación vegetativa: tipos de injerto y condiciones para el prendimiento.', {
        fuente: 'institucional',
        indicadores: ['Describe los pasos del injerto inglés de lengüeta.', 'Mantiene el contacto cambial entre patrón e injerto.']
      }),
      nuevoContenido('Seguridad e higiene en el uso de navajas y tijeras de injertar.', { fuente: 'institucional', indicadores: ['Utiliza las herramientas respetando las normas de seguridad.'] })
    ],
    capacidades: ['Abordaje y resolución de situaciones problemáticas', 'Gestión y monitoreo del propio aprendizaje'],
    formato: 'Taller',
    tiempo_estimado: '2 semanas (4 clases)',
    agrupamientos: 'Parejas de trabajo con rotación de roles; demostración inicial para todo el grupo.',
    ambiente: 'Vivero y taller de herramientas de la escuela.',
    clases: [
      { titulo: 'Reconocimiento del material', momento: 'inicio', duracion: '80 min', actividades: 'Muestra de sarmientos y pie americano en el vivero. Video demostrativo de un productor local y lluvia de preguntas.', recursos: 'Sarmientos, pie americano, proyector.', evaluativa: false },
      { titulo: 'Práctica de cortes', momento: 'desarrollo', duracion: '80 min', actividades: 'Práctica de corte sobre material de descarte, con control de la superficie del corte.', recursos: 'Navajas, tijeras, sarmientos.', evaluativa: false },
      { titulo: 'Ejecución del injerto', momento: 'desarrollo', duracion: '80 min', actividades: 'Ejecución de injerto inglés de lengüeta y atado con cinta biodegradable.', recursos: 'Cinta de atar, alcohol, navajas.', evaluativa: true },
      { titulo: 'Estratificación y balance', momento: 'cierre', duracion: '80 min', actividades: 'Estratificación en arena húmeda y balance de lo aprendido; definición de cómo se controlará el prendimiento.', recursos: 'Arena, bandejas.', evaluativa: false }
    ],
    producto: 'Plantas injertadas y registro fotográfico de cada paso.',
    evaluacion_criterios: 'Destreza técnica, seguridad en el uso de las herramientas y calidad del registro.',
    evaluacion_instrumentos: 'Lista de cotejo con observación directa y registro de prendimiento.',
    recursos: 'Navajas de injertar, tijeras de podar, sarmientos de vid, cinta de atar, alcohol.',
    bibliografia: 'Diseño curricular del espacio. Manuales técnicos de viticultura. Apuntes de cátedra.',
    tipo_articulacion: 'declarativa',
    articulacion_eje: 'Anatomía vegetal y tejidos meristemáticos',
    articulacion_materias: 'Biología'
  }
};

const devolucionDe = (s) => s?.devolucion || s?.devolucion_directivo || '';

function areaText(id, label, value, onChange, { rows = 3, placeholder, disabled, error } = {}) {
  return (
    <div>
      <label htmlFor={id} className="block text-[11px] font-semibold text-slate-700 mb-1">
        {label}
      </label>
      <textarea
        id={id}
        rows={rows}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={fieldCls(error)}
      />
      {error && <p className="mt-1 text-[11px] text-rose-700 font-medium">{error}</p>}
    </div>
  );
}

export default function SecuenciaForm({ secuencia, espacios, defaultEspacioId, user, onClose, onSaved }) {
  const toast = useToast();
  const isNew = !secuencia;
  const isOwner = isNew || Number(secuencia.docente_id) === Number(user.id);
  const locked = !isOwner || secuencia?.estado === 'aprobada';
  const canReview = !isNew && DIRECTIVOS.includes(user.rol) && !isOwner && secuencia.estado !== 'borrador';

  const [form, setForm] = useState(() =>
    secuencia
      ? {
          ...EMPTY,
          ...secuencia,
          planificacion_id: secuencia.planificacion_id ?? '',
          contenidos: asArray(secuencia.contenidos),
          capacidades: asArray(secuencia.capacidades),
          clases: asArray(secuencia.clases).map((c) => ({ ...emptyClase(), ...c })),
          tiempo_estimado: secuencia.tiempo_estimado || ''
        }
      : EMPTY
  );
  const [espacioId, setEspacioId] = useState(secuencia?.espacio_id ?? defaultEspacioId ?? '');
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [revision, setRevision] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [planes, setPlanes] = useState([]);
  const [printing, setPrinting] = useState(false);

  const catalog = useEspacioCurricular(espacioId);

  // Planificaciones propias del mismo espacio, para vincular
  useEffect(() => {
    if (!espacioId || !isOwner) return undefined;
    let cancelled = false;
    api
      .getMyPlanificaciones()
      .then((list) => !cancelled && setPlanes(asArray(list).filter((p) => String(p.espacio_id) === String(espacioId))))
      .catch(() => !cancelled && setPlanes([]));
    return () => {
      cancelled = true;
    };
  }, [espacioId, isOwner]);

  const planVinculado = useMemo(() => planes.find((p) => String(p.id) === String(form.planificacion_id)) || null, [planes, form.planificacion_id]);

  const set = (patch) => {
    setForm((f) => ({ ...f, ...patch }));
    setErrors((e) => {
      const next = { ...e };
      Object.keys(patch).forEach((k) => delete next[k]);
      return next;
    });
  };

  const heredar = () => {
    if (!planVinculado) return;
    set({
      contenidos: asArray(planVinculado.contenidos).map((c) => ({ ...c, indicadores: [...asArray(c.indicadores)] })),
      capacidades: asArray(planVinculado.capacidades),
      objetivos: form.objetivos.trim() ? form.objetivos : asArray(planVinculado.objetivos).join('\n')
    });
    toast.success('Se heredaron los contenidos, indicadores, capacidades y objetivos de la planificación.');
  };

  const faltantes = useMemo(() => {
    const f = {};
    if (!espacioId) f.espacio_id = 'Seleccione el espacio curricular.';
    if (!form.titulo.trim()) f.titulo = 'El título es obligatorio.';
    if (!form.objetivos.trim()) f.objetivos = 'Indique los objetivos de la secuencia.';
    if (form.contenidos.length === 0) f.contenidos = 'Seleccione o agregue al menos un contenido.';
    if (form.clases.length === 0) f.clases = 'Agregue al menos una clase con sus actividades.';
    if (!form.evaluacion_criterios.trim()) f.evaluacion_criterios = 'Indique los criterios de evaluación.';
    return f;
  }, [espacioId, form]);

  const setClase = (i, patch) => set({ clases: form.clases.map((c, j) => (j === i ? { ...c, ...patch } : c)) });

  const payload = (estado) => ({
    ...(secuencia?.id ? { id: secuencia.id } : {}),
    espacio_id: Number(espacioId),
    titulo: form.titulo.trim(),
    planificacion_id: form.planificacion_id ? Number(form.planificacion_id) : null,
    fundamentacion: form.fundamentacion,
    objetivos: form.objetivos,
    contenidos: form.contenidos,
    capacidades: form.capacidades,
    formato: form.formato || null,
    tiempo_estimado: form.tiempo_estimado,
    agrupamientos: form.agrupamientos,
    ambiente: form.ambiente,
    clases: form.clases,
    producto: form.producto,
    evaluacion_criterios: form.evaluacion_criterios,
    evaluacion_instrumentos: form.evaluacion_instrumentos,
    recursos: form.recursos,
    bibliografia: form.bibliografia,
    tipo_articulacion: form.tipo_articulacion,
    articulacion_eje: form.tipo_articulacion === 'ninguna' ? '' : form.articulacion_eje,
    articulacion_materias: form.tipo_articulacion === 'ninguna' ? '' : form.articulacion_materias,
    estado
  });

  const save = async (send) => {
    setError('');
    const found = send ? { ...faltantes } : {};
    if (!espacioId) found.espacio_id = 'Seleccione el espacio curricular.';
    if (!form.titulo.trim()) found.titulo = 'El título es obligatorio.';
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setStep(send ? 6 : 1);
      setError(send ? 'Faltan datos esenciales para enviar a revisión. Se detallan en el último paso.' : 'Complete el espacio y el título para guardar.');
      return;
    }
    setBusy(true);
    try {
      await api.saveSecuencia(payload(send ? 'pendiente_revision' : 'borrador'));
      toast.success(send ? 'Secuencia enviada a revisión.' : 'Borrador guardado.');
      onSaved();
    } catch (err) {
      const det = err.details && typeof err.details === 'object' ? err.details : null;
      if (det) {
        setErrors(det);
        const first = Object.keys(det).map((k) => FIELD_STEP[k]).filter(Boolean);
        if (first.length) setStep(send ? 6 : Math.min(...first));
      }
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const review = async (estado) => {
    setError('');
    if (estado === 'requiere_ajustes' && !revision.trim()) return setError('Indique la devolución para el docente.');
    setBusy(true);
    try {
      await api.reviewSecuencia({ secuencia_id: secuencia.id, estado, devolucion: revision.trim() });
      toast.success(estado === 'aprobada' ? 'Secuencia aprobada.' : 'Se devolvió la secuencia con ajustes.');
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const next = () => {
    if (step === 1 && (!espacioId || !form.titulo.trim())) {
      setErrors({ ...(!espacioId ? { espacio_id: 'Seleccione el espacio curricular.' } : {}), ...(!form.titulo.trim() ? { titulo: 'El título es obligatorio.' } : {}) });
      setError('Complete los campos obligatorios para continuar.');
      return;
    }
    setError('');
    setStep(step + 1);
  };

  const printable = {
    ...payload(secuencia?.estado || 'borrador'),
    estado: secuencia?.estado || 'borrador',
    espacio_nombre: espacios.find((e) => String(e.id) === String(espacioId))?.nombre || secuencia?.espacio_nombre,
    espacio_anio: espacios.find((e) => String(e.id) === String(espacioId))?.anio || secuencia?.espacio_anio,
    docente_nombre: secuencia?.docente_nombre || user.nombre,
    docente_apellido: secuencia?.docente_apellido || user.apellido
  };

  return (
    <>
      <Modal open onClose={onClose} title={isNew ? 'Nueva Secuencia Didáctica' : locked ? 'Secuencia Didáctica' : 'Editar Secuencia Didáctica'} size="max-w-4xl">
        <div className="space-y-4 text-xs text-slate-700">
          {error && (
            <div role="alert" className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800">
              {error}
            </div>
          )}

          {!isNew && devolucionDe(secuencia) && (
            <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 flex items-start gap-2">
              <MessageSquare className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <strong>Devolución:</strong> <span className="italic">"{devolucionDe(secuencia)}"</span>
              </div>
            </div>
          )}
          {secuencia?.estado === 'aprobada' && (
            <div role="status" className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900">
              Secuencia aprobada: solo lectura. Puede imprimirla o duplicarla desde el listado.
            </div>
          )}

          <ol className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {STEPS.map((s) => (
              <li key={s.step}>
                <button
                  type="button"
                  onClick={() => setStep(s.step)}
                  aria-current={step === s.step ? 'step' : undefined}
                  className={`w-full h-full p-1.5 rounded-lg border text-left text-[11px] font-bold transition ${
                    step === s.step ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {s.title}
                </button>
              </li>
            ))}
          </ol>

          {step === 1 && (
            <div className="space-y-4">
              {!locked && (
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-amber-900 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" /> Cargar plantilla modelo completa:
                  </span>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setForm((f) => ({ ...f, ...TEMPLATES.compost }))} className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 rounded-md border border-amber-300 font-semibold text-[11px]">
                      Compostaje y Abono
                    </button>
                    <button type="button" onClick={() => setForm((f) => ({ ...f, ...TEMPLATES.injerto }))} className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 rounded-md border border-amber-300 font-semibold text-[11px]">
                      Injerto en Vid
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="sec-espacio" className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Espacio curricular
                </label>
                <select
                  id="sec-espacio"
                  disabled={locked || !isNew}
                  value={espacioId}
                  aria-invalid={Boolean(errors.espacio_id)}
                  onChange={(e) => {
                    setEspacioId(e.target.value);
                    set({ planificacion_id: '', contenidos: [] });
                  }}
                  className={`${fieldCls(errors.espacio_id)} bg-white`}
                >
                  <option value="">Seleccione un espacio...</option>
                  {espacios.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.anio}° - {e.nombre}
                    </option>
                  ))}
                </select>
                {errors.espacio_id && <p className="mt-1 text-[11px] text-rose-700 font-medium">{errors.espacio_id}</p>}
              </div>

              <div>
                <label htmlFor="sec-titulo" className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Título de la secuencia
                </label>
                <input
                  id="sec-titulo"
                  type="text"
                  disabled={locked}
                  aria-invalid={Boolean(errors.titulo)}
                  value={form.titulo}
                  onChange={(e) => set({ titulo: e.target.value })}
                  placeholder="Ej. Manejo agroecológico de suelos"
                  className={`${fieldCls(errors.titulo)} font-medium`}
                />
                {errors.titulo && <p className="mt-1 text-[11px] text-rose-700 font-medium">{errors.titulo}</p>}
              </div>

              <div>
                <label htmlFor="sec-plan" className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Planificación anual a la que pertenece (opcional)
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    id="sec-plan"
                    disabled={locked || !espacioId}
                    value={form.planificacion_id}
                    onChange={(e) => set({ planificacion_id: e.target.value })}
                    className={`${fieldCls(errors.planificacion_id)} bg-white flex-1 min-w-[12rem]`}
                  >
                    <option value="">Sin vincular</option>
                    {planes.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.anio_lectivo} - División "{p.division}" ({p.estado.replace('_', ' ')})
                      </option>
                    ))}
                  </select>
                  {!locked && planVinculado && (
                    <button type="button" onClick={heredar} className={btnSecondary}>
                      <Download className="w-3.5 h-3.5" aria-hidden="true" /> Heredar contenidos de la planificación
                    </button>
                  )}
                </div>
                {errors.planificacion_id && <p className="mt-1 text-[11px] text-rose-700 font-medium">{errors.planificacion_id}</p>}
              </div>

              {areaText('sec-fundamentacion', 'Fundamentación pedagógica', form.fundamentacion, (v) => set({ fundamentacion: v }), { rows: 3, disabled: locked, placeholder: 'Por qué es importante este aprendizaje en el contexto formativo y regional...' })}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              {areaText('sec-objetivos', 'Objetivos de la secuencia', form.objetivos, (v) => set({ objetivos: v }), { rows: 3, disabled: locked, error: errors.objetivos, placeholder: 'Qué se espera que logren los estudiantes...' })}
              <CheckGroup legend="Capacidades fundamentales" options={CAPACIDADES_FUNDAMENTALES} value={form.capacidades} onChange={(v) => set({ capacidades: v })} disabled={locked} error={errors.capacidades} />
              {!espacioId ? (
                <p className="text-slate-500">Seleccione primero el espacio curricular en el paso 1.</p>
              ) : (
                <ContenidosPicker catalog={catalog} value={form.contenidos} onChange={(v) => set({ contenidos: v })} readOnly={locked} error={errors.contenidos} />
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="sec-formato" className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Formato
                  </label>
                  <select id="sec-formato" disabled={locked} value={form.formato || ''} onChange={(e) => set({ formato: e.target.value })} className={`${fieldCls(errors.formato)} bg-white`}>
                    <option value="">Sin definir</option>
                    {FORMATOS_PEDAGOGICOS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="sec-tiempo" className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Tiempo estimado
                  </label>
                  <input id="sec-tiempo" type="text" disabled={locked} value={form.tiempo_estimado} onChange={(e) => set({ tiempo_estimado: e.target.value })} placeholder="Ej. 4 clases (8 horas cátedra), 3 semanas" className={fieldCls(errors.tiempo_estimado)} />
                </div>
              </div>
              {areaText('sec-agrupamientos', 'Agrupamientos', form.agrupamientos, (v) => set({ agrupamientos: v }), { rows: 2, disabled: locked, placeholder: 'Individual, en parejas, equipos de cuatro con roles...' })}
              {areaText('sec-ambiente', 'Ambiente o espacio donde se desarrolla', form.ambiente, (v) => set({ ambiente: v }), { rows: 2, disabled: locked, placeholder: 'Aula, huerta, taller, vivero, laboratorio...' })}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800">Secuencia de clases (inicio, desarrollo y cierre)</h3>
                <span className="text-[11px] text-slate-500">{form.clases.length} clases</span>
              </div>
              {errors.clases && <p className="text-[11px] text-rose-700 font-medium">{errors.clases}</p>}
              {form.clases.length === 0 && <p className="text-slate-500 p-3 rounded-xl border border-dashed border-slate-300">Todavía no definió clases.</p>}
              <ol className="space-y-3">
                {form.clases.map((c, i) => (
                  <li key={i} className="rounded-xl border border-slate-200 p-3 space-y-2 bg-slate-50/50">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-slate-700">Clase {i + 1}</span>
                      <RowControls index={i} total={form.clases.length} label={`clase ${i + 1}`} disabled={locked} onMove={(idx, d) => set({ clases: moveItem(form.clases, idx, d) })} onRemove={(idx) => set({ clases: form.clases.filter((_, j) => j !== idx) })} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-1">
                        <label htmlFor={`sec-c${i}-titulo`} className="block text-[11px] font-semibold mb-1">Título</label>
                        <input id={`sec-c${i}-titulo`} type="text" disabled={locked} value={c.titulo} onChange={(e) => setClase(i, { titulo: e.target.value })} className={fieldCls(false)} />
                      </div>
                      <div>
                        <label htmlFor={`sec-c${i}-momento`} className="block text-[11px] font-semibold mb-1">Momento</label>
                        <select id={`sec-c${i}-momento`} disabled={locked} value={c.momento} onChange={(e) => setClase(i, { momento: e.target.value })} className={`${fieldCls(false)} bg-white`}>
                          {MOMENTOS_CLASE.map((m) => (
                            <option key={m.value} value={m.value}>
                              {m.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor={`sec-c${i}-duracion`} className="block text-[11px] font-semibold mb-1">Duración</label>
                        <input id={`sec-c${i}-duracion`} type="text" disabled={locked} value={c.duracion} onChange={(e) => setClase(i, { duracion: e.target.value })} placeholder="Ej. 80 min" className={fieldCls(false)} />
                      </div>
                    </div>
                    {areaText(`sec-c${i}-act`, 'Actividades', c.actividades, (v) => setClase(i, { actividades: v }), { rows: 3, disabled: locked })}
                    <div className="flex flex-wrap items-end gap-3">
                      <div className="flex-1 min-w-[12rem]">
                        <label htmlFor={`sec-c${i}-rec`} className="block text-[11px] font-semibold mb-1">Recursos de la clase</label>
                        <input id={`sec-c${i}-rec`} type="text" disabled={locked} value={c.recursos} onChange={(e) => setClase(i, { recursos: e.target.value })} className={fieldCls(false)} />
                      </div>
                      <label className="flex items-center gap-2 pb-2 font-semibold text-slate-700 cursor-pointer">
                        <input type="checkbox" disabled={locked} checked={Boolean(c.evaluativa)} onChange={(e) => setClase(i, { evaluativa: e.target.checked })} className="rounded text-emerald-600" />
                        Instancia evaluativa
                      </label>
                    </div>
                  </li>
                ))}
              </ol>
              {!locked && (
                <div className="flex flex-wrap gap-2">
                  {MOMENTOS_CLASE.map((m) => (
                    <button key={m.value} type="button" onClick={() => set({ clases: [...form.clases, emptyClase(m.value)] })} className={btnSecondary}>
                      <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Clase de {m.label.toLowerCase()}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              {areaText('sec-producto', 'Producto o evidencia de aprendizaje', form.producto, (v) => set({ producto: v }), { rows: 2, disabled: locked, placeholder: 'Qué producirán los estudiantes y cómo se verá lo aprendido...' })}
              {areaText('sec-criterios', 'Criterios de evaluación', form.evaluacion_criterios, (v) => set({ evaluacion_criterios: v }), { rows: 3, disabled: locked, error: errors.evaluacion_criterios, placeholder: 'Qué se valora; se recomienda compartirlos con los estudiantes...' })}
              {areaText('sec-instrumentos', 'Instrumentos de evaluación', form.evaluacion_instrumentos, (v) => set({ evaluacion_instrumentos: v }), { rows: 2, disabled: locked, placeholder: 'Rúbrica, lista de cotejo, bitácora de campo...' })}
              {areaText('sec-recursos', 'Recursos y materiales', form.recursos, (v) => set({ recursos: v }), { rows: 2, disabled: locked, placeholder: 'Materiales y herramientas...' })}
              {areaText('sec-bibliografia', 'Bibliografía', form.bibliografia, (v) => set({ bibliografia: v }), { rows: 2, disabled: locked })}
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="sec-tipoart" className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Articulación con otros espacios
                  </label>
                  <select id="sec-tipoart" disabled={locked} value={form.tipo_articulacion || 'ninguna'} onChange={(e) => set({ tipo_articulacion: e.target.value })} className={`${fieldCls(false)} bg-white`}>
                    <option value="ninguna">Sin articulación con otro espacio</option>
                    <option value="declarativa">Articulación declarativa con otro espacio</option>
                    {form.tipo_articulacion === 'colaborativa' && <option value="colaborativa">Colaborativa (proyecto articulado)</option>}
                  </select>
                </div>
              </div>
              {form.tipo_articulacion !== 'ninguna' && (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="sec-artmat" className="block text-[10px] font-semibold text-slate-600 mb-0.5">Espacio con el que articula</label>
                    <input id="sec-artmat" type="text" disabled={locked} value={form.articulacion_materias || ''} onChange={(e) => set({ articulacion_materias: e.target.value })} className={`${fieldCls(false)} bg-white`} />
                  </div>
                  <div>
                    <label htmlFor="sec-arteje" className="block text-[10px] font-semibold text-slate-600 mb-0.5">Eje integrador</label>
                    <input id="sec-arteje" type="text" disabled={locked} value={form.articulacion_eje || ''} onChange={(e) => set({ articulacion_eje: e.target.value })} className={`${fieldCls(false)} bg-white`} />
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-bold text-slate-800 mb-2">Revisión</h3>
                {Object.keys(faltantes).length === 0 ? (
                  <div role="status" className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                    Están completos los datos esenciales. Puede enviar la secuencia a revisión.
                  </div>
                ) : (
                  <div role="alert" className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 space-y-1">
                    <div className="font-bold">Faltan datos esenciales para enviar a revisión</div>
                    <ul className="space-y-1">
                      {Object.entries(faltantes).map(([campo, msg]) => (
                        <li key={campo} className="flex flex-wrap items-center gap-2">
                          <span>{errors[campo] || msg}</span>
                          <button type="button" onClick={() => setStep(FIELD_STEP[campo] || 1)} className="font-bold underline">
                            Ir al paso {FIELD_STEP[campo] || 1}
                          </button>
                        </li>
                      ))}
                    </ul>
                    <p className="text-amber-800">Puede guardar un borrador incompleto en cualquier momento.</p>
                  </div>
                )}
                <p className="mt-2 text-[11px] text-slate-500">
                  {form.contenidos.length} contenidos, {form.clases.length} clases ({form.clases.filter((c) => c.evaluativa).length} evaluativas), {form.capacidades.length} capacidades.
                </p>
              </div>
            </div>
          )}

          {canReview && (
            <div className="p-3 rounded-xl border border-sky-200 bg-sky-50 space-y-2">
              <label htmlFor="sec-revision" className="block text-[11px] font-bold text-sky-900">
                Revisión directiva: devolución al docente
              </label>
              <textarea id="sec-revision" rows={3} value={revision} onChange={(e) => setRevision(e.target.value)} placeholder="Obligatoria si se solicitan ajustes." className={fieldCls(false)} />
              <div className="flex flex-wrap justify-end gap-2">
                <button type="button" disabled={busy} onClick={() => review('requiere_ajustes')} className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-50">
                  Requiere ajustes
                </button>
                <button type="button" disabled={busy} onClick={() => review('aprobada')} className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white disabled:opacity-50">
                  Aprobar
                </button>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {step > 1 && (
                <button type="button" onClick={() => setStep(step - 1)} className={btnSecondary}>
                  <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> Anterior
                </button>
              )}
              {step < STEPS.length && (
                <button type="button" onClick={next} className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5">
                  Siguiente <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              )}
              <button type="button" onClick={() => setPrinting(true)} disabled={!espacioId} className={btnSecondary}>
                <Printer className="w-3.5 h-3.5" aria-hidden="true" /> Imprimir
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900">
                {locked ? 'Cerrar' : 'Cancelar'}
              </button>
              {!locked && (
                <>
                  <button type="button" disabled={busy} onClick={() => save(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 flex items-center gap-1.5 disabled:opacity-50">
                    <Save className="w-3.5 h-3.5" aria-hidden="true" /> Guardar borrador
                  </button>
                  <button type="button" disabled={busy} onClick={() => save(true)} className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 disabled:opacity-50">
                    <Send className="w-3.5 h-3.5" aria-hidden="true" /> Enviar a revisión
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </Modal>
      {printing && <PrintableSecuencia secuencia={printable} onClose={() => setPrinting(false)} />}
    </>
  );
}
