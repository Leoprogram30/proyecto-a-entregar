import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import PrintablePlanning from './PrintablePlanning';
import ContenidosPicker from './planning/ContenidosPicker';
import { useEspacioCurricular } from './planning/useEspacioCurricular';
import { CheckGroup, Field, RowControls, StringListEditor, TextArea } from './planning/FormBits';
import { btnSecondary, fieldCls, moveItem } from './planning/helpers';
import { ConfirmDialog, EstadoBadge, useToast } from './ui';
import { CAPACIDADES_FUNDAMENTALES, FORMATOS_PEDAGOGICOS, TEMAS_TRANSVERSALES, asArray } from '../config/catalogos';
import { CheckCircle2, AlertCircle, ArrowRight, ArrowLeft, Save, Send, Printer, Plus, Lock, MessageSquare } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

// Diseño inverso: primero lo que se espera lograr (metas, aprendizajes, indicadores), después cómo y cuándo.
const STEPS = [
  { step: 1, title: '1. Datos y diagnóstico', desc: 'Espacio, grupo y fundamentación' },
  { step: 2, title: '2. Aprendizajes e indicadores', desc: 'Metas, contenidos e indicadores de logro' },
  { step: 3, title: '3. Objetivos y capacidades', desc: 'Qué se propone lograr' },
  { step: 4, title: '4. Unidades y tiempos', desc: 'Organización del año' },
  { step: 5, title: '5. Formatos y estrategias', desc: 'Recursos, transversales y articulación' },
  { step: 6, title: '6. Evaluación', desc: 'Criterios, instrumentos y bibliografía' },
  { step: 7, title: '7. Revisión', desc: 'Faltantes y envío' }
];
const LAST_STEP = STEPS.length;

const FIELD_STEP = {
  espacio_id: 1, anio_lectivo: 1, division: 1, diagnostico: 1, fundamentacion: 1,
  metas: 2, contenidos: 2, objetivos: 3, capacidades: 3, unidades: 4,
  formatos_pedagogicos: 5, estrategias: 5, recursos: 5, transversales: 5, articulacion: 5,
  evaluacion_criterios: 6, evaluacion_instrumentos: 6, evaluacion_momentos: 6, bibliografia: 6
};

// Lo esencial para enviar a revisión (el borrador admite incompleto)
const ESENCIALES = {
  diagnostico: 'Complete el diagnóstico del grupo.',
  objetivos: 'Agregue al menos un objetivo.',
  contenidos: 'Seleccione o agregue al menos un aprendizaje o contenido.',
  evaluacion_criterios: 'Indique los criterios de evaluación.',
  evaluacion_instrumentos: 'Indique los instrumentos de evaluación.'
};

const STEP1_REQUIRED = {
  espacio_id: 'Seleccione un espacio curricular.',
  anio_lectivo: 'Indique el año lectivo.',
  division: 'Seleccione la división.',
  diagnostico: 'Complete el diagnóstico del grupo.'
};

const emptyUnidad = () => ({ titulo: '', periodo: '', horas: '', contenidos: '', actividades: '' });

export default function PlanningWizard({ espacio, initialPlan = null, onSaved, onCancel }) {
  const { user } = useAuth();
  const toast = useToast();

  const [planId, setPlanId] = useState(initialPlan?.id ?? null);
  const [estado, setEstado] = useState(initialPlan?.estado || 'borrador');
  const [espacioId, setEspacioId] = useState(espacio?.id ?? initialPlan?.espacio_id ?? '');
  const [espacios, setEspacios] = useState([]);
  const [comentarios, setComentarios] = useState([]);

  const [form, setForm] = useState(() => {
    const contenidos = asArray(initialPlan?.contenidos).map((c) => (typeof c === 'string' ? { texto: c, indicadores: [], prioridad: 'esencial' } : c));
    const metasContenido = new Set(contenidos.map((c) => c.meta).filter(Boolean));
    return {
      anio_lectivo: initialPlan?.anio_lectivo || CURRENT_YEAR,
      division: initialPlan?.division || 'A',
      diagnostico: initialPlan?.diagnostico || '',
      fundamentacion: initialPlan?.fundamentacion || '',
      metasPropias: asArray(initialPlan?.metas).filter((m) => !metasContenido.has(m)),
      contenidos,
      objetivos: asArray(initialPlan?.objetivos),
      capacidades: asArray(initialPlan?.capacidades),
      unidades: asArray(initialPlan?.unidades).map((u) => ({ ...emptyUnidad(), ...u, horas: u.horas ?? '' })),
      estrategias: initialPlan?.estrategias || '',
      formatos_pedagogicos: asArray(initialPlan?.formatos_pedagogicos),
      recursos: initialPlan?.recursos || '',
      transversales: asArray(initialPlan?.transversales),
      articulacion: initialPlan?.articulacion || '',
      evaluacion_criterios: initialPlan?.evaluacion_criterios || '',
      evaluacion_instrumentos: initialPlan?.evaluacion_instrumentos || '',
      evaluacion_momentos: initialPlan?.evaluacion_momentos || '',
      bibliografia: initialPlan?.bibliografia || ''
    };
  });

  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState('');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const [showPrint, setShowPrint] = useState(false);

  const readOnly = estado === 'aprobada';
  const isEditing = Boolean(initialPlan?.id);

  // Lista de espacios para el selector (solo al crear una planificación)
  useEffect(() => {
    if (isEditing) return undefined;
    let cancelled = false;
    api
      .getEspacios({})
      .then((list) => !cancelled && setEspacios(list || []))
      .catch((e) => !cancelled && setBanner(e.message));
    return () => {
      cancelled = true;
    };
  }, [isEditing]);

  // Catálogo curricular del espacio elegido
  const catalog = useEspacioCurricular(espacioId);

  // Devolución del equipo directivo (comentarios) de una planificación existente
  useEffect(() => {
    if (!initialPlan?.id) return undefined;
    let cancelled = false;
    api
      .getPlanificacionDetail(initialPlan.id)
      .then((d) => !cancelled && setComentarios(asArray(d?.comentarios)))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [initialPlan?.id]);

  const espacioInfo = useMemo(() => {
    const fromList = espacios.find((e) => String(e.id) === String(espacioId));
    if (fromList) return fromList;
    if (espacio && String(espacio.id) === String(espacioId)) return espacio;
    if (initialPlan && String(initialPlan.espacio_id) === String(espacioId)) {
      return { id: initialPlan.espacio_id, nombre: initialPlan.espacio_nombre, anio: initialPlan.espacio_anio, horas_catedra: initialPlan.horas_catedra };
    }
    return null;
  }, [espacios, espacio, initialPlan, espacioId]);

  const update = (patch) => {
    setForm((f) => ({ ...f, ...patch }));
    setDirty(true);
    setErrors((e) => {
      const next = { ...e };
      Object.keys(patch).forEach((k) => delete next[k]);
      if ('metasPropias' in patch) delete next.metas;
      return next;
    });
  };

  const handleEspacioChange = (value) => {
    setEspacioId(value);
    setForm((f) => ({ ...f, objetivos: [], contenidos: [], metasPropias: [] }));
    setDirty(true);
    setErrors((e) => ({ ...e, espacio_id: undefined }));
  };

  // Metas de la planificación: las de los contenidos elegidos y las propias
  const metas = useMemo(
    () => [...new Set([...form.contenidos.map((c) => c.meta).filter(Boolean), ...form.metasPropias])],
    [form.contenidos, form.metasPropias]
  );

  const faltantes = useMemo(() => {
    const f = {};
    if (!espacioId) f.espacio_id = STEP1_REQUIRED.espacio_id;
    if (!form.diagnostico.trim()) f.diagnostico = ESENCIALES.diagnostico;
    if (form.objetivos.length === 0) f.objetivos = ESENCIALES.objetivos;
    if (form.contenidos.length === 0) f.contenidos = ESENCIALES.contenidos;
    if (!form.evaluacion_criterios.trim()) f.evaluacion_criterios = ESENCIALES.evaluacion_criterios;
    if (!form.evaluacion_instrumentos.trim()) f.evaluacion_instrumentos = ESENCIALES.evaluacion_instrumentos;
    return f;
  }, [espacioId, form]);

  const goNext = () => {
    const found = {};
    if (step === 1) {
      const values = { ...form, espacio_id: espacioId };
      Object.entries(STEP1_REQUIRED).forEach(([field, msg]) => {
        if (!String(values[field] ?? '').trim()) found[field] = msg;
      });
    }
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setBanner('Complete los campos obligatorios para continuar.');
      return;
    }
    setBanner('');
    setStep(step + 1);
  };

  const payload = (target) => ({
    ...(planId ? { id: planId } : {}),
    espacio_id: Number(espacioId),
    anio_lectivo: Number(form.anio_lectivo),
    division: form.division,
    diagnostico: form.diagnostico,
    fundamentacion: form.fundamentacion,
    metas,
    contenidos: form.contenidos,
    objetivos: form.objetivos,
    capacidades: form.capacidades,
    unidades: form.unidades
      .filter((u) => u.titulo.trim())
      .map((u) => ({ ...u, horas: u.horas === '' ? null : Number(u.horas) })),
    estrategias: form.estrategias,
    formatos_pedagogicos: form.formatos_pedagogicos,
    recursos: form.recursos,
    transversales: form.transversales,
    articulacion: form.articulacion,
    evaluacion_criterios: form.evaluacion_criterios,
    evaluacion_instrumentos: form.evaluacion_instrumentos,
    evaluacion_momentos: form.evaluacion_momentos,
    bibliografia: form.bibliografia,
    estado: target
  });

  const handleSave = async (send) => {
    setBanner('');
    const found = send ? { ...faltantes } : {};
    if (!espacioId) found.espacio_id = STEP1_REQUIRED.espacio_id;
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setStep(send ? LAST_STEP : 1);
      setBanner(send ? 'Faltan datos esenciales para enviar a revisión. Se detallan en este paso.' : 'Seleccione un espacio curricular para guardar.');
      return;
    }

    const target = send ? 'pendiente_revision' : 'borrador';
    setSaving(true);
    try {
      const res = await api.savePlanificacion(payload(target));
      setPlanId(res?.id ?? planId);
      setEstado(res?.estado || target);
      setDirty(false);
      toast.success(send ? 'Planificación enviada al Equipo Directivo para su revisión.' : 'Borrador guardado correctamente.');
      if (send) onSaved?.(res);
    } catch (err) {
      const det = err.details && typeof err.details === 'object' ? err.details : null;
      if (det) {
        setErrors(det);
        const first = Object.keys(det).map((k) => FIELD_STEP[k]).filter(Boolean);
        if (first.length) setStep(send ? LAST_STEP : Math.min(...first));
      }
      setBanner(err.message || 'Error al guardar la planificación.');
    } finally {
      setSaving(false);
    }
  };

  const requestClose = () => (dirty ? setConfirmExit(true) : onCancel?.());

  const lastComment = comentarios[comentarios.length - 1] || comentarios[0];
  const devolucion = lastComment?.comentario || initialPlan?.devolucion_directivo || '';

  const printablePlan = {
    ...payload(estado),
    id: planId,
    estado,
    espacio_nombre: espacioInfo?.nombre,
    espacio_anio: espacioInfo?.anio,
    horas_catedra: espacioInfo?.horas_catedra,
    docente_nombre: initialPlan?.docente_nombre || user?.nombre,
    docente_apellido: initialPlan?.docente_apellido || user?.apellido
  };

  const objetivosOficiales = catalog.objetivos.filter((o) => o.vigente).map((o) => o.descripcion || o.titulo);
  const totalHoras = form.unidades.reduce((acc, u) => acc + (Number(u.horas) || 0), 0);

  const setUnidad = (i, patch) => update({ unidades: form.unidades.map((u, j) => (j === i ? { ...u, ...patch } : u)) });

  const toggleTransversal = (tema) => {
    const on = form.transversales.some((t) => t.tema === tema);
    update({ transversales: on ? form.transversales.filter((t) => t.tema !== tema) : [...form.transversales, { tema, como: '' }] });
  };

  const appendMomento = (texto) => {
    const base = form.evaluacion_momentos.trim();
    if (base.includes(texto)) return;
    update({ evaluacion_momentos: base ? `${base}\n${texto}` : texto });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">Asistente Paso a Paso</span>
            <EstadoBadge estado={estado} />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1">Planificación Anual{espacioInfo?.nombre ? `: ${espacioInfo.nombre}` : ''}</h2>
          <p className="text-xs text-slate-500">
            IPEM N° 349 "Giovanni Bosco" - Ciclo Lectivo {form.anio_lectivo}
            {espacioInfo?.anio ? ` - ${espacioInfo.anio}° Año "${form.division}"` : ''}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPrint(true)}
            disabled={!espacioId}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <Printer className="w-4 h-4 text-slate-600" aria-hidden="true" />
            Imprimir
          </button>
          {onCancel && (
            <button type="button" onClick={requestClose} className="px-3.5 py-2 text-slate-600 hover:text-slate-900 text-xs font-bold transition">
              Cerrar
            </button>
          )}
        </div>
      </div>

      {readOnly && (
        <div role="status" className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
          <Lock className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          Esta planificación está aprobada y no puede modificarse. Puede imprimirla o duplicarla desde el listado.
        </div>
      )}

      {devolucion && (
        <div className="bg-sky-50 border border-sky-300 rounded-2xl p-4 text-sky-900 text-xs flex items-start gap-3 shadow-xs">
          <MessageSquare className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1">
            <div className="font-bold">Devolución del Equipo Directivo</div>
            <p className="leading-relaxed text-slate-700 italic">"{devolucion}"</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-xs">
        <ol className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {STEPS.map((item) => (
            <li key={item.step}>
              <button
                type="button"
                onClick={() => setStep(item.step)}
                aria-current={step === item.step ? 'step' : undefined}
                title={item.desc}
                className={`w-full h-full p-2 rounded-xl text-left border transition ${
                  step === item.step
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                    : step > item.step
                    ? 'border-emerald-200 bg-slate-50 text-slate-700'
                    : 'border-slate-200 text-slate-500'
                }`}
              >
                <div className="text-[11px] font-bold flex items-center justify-between gap-1">
                  <span>{item.title}</span>
                  {step > item.step && <CheckCircle2 className="hidden sm:block w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />}
                </div>
              </button>
            </li>
          ))}
        </ol>
      </div>

      {(banner || catalog.error) && (
        <div role="alert" className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" aria-hidden="true" />
          {banner || catalog.error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
        {step === 1 && (
          <div className="space-y-4">
            <Field id="pw-espacio" label="Espacio curricular" error={errors.espacio_id}>
              <select
                id="pw-espacio"
                disabled={readOnly || isEditing}
                value={espacioId}
                aria-invalid={Boolean(errors.espacio_id)}
                onChange={(e) => handleEspacioChange(e.target.value)}
                className={`${fieldCls(errors.espacio_id)} bg-white`}
              >
                <option value="">Seleccione un espacio...</option>
                {isEditing && espacioInfo && <option value={espacioInfo.id}>{espacioInfo.nombre}</option>}
                {espacios.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.anio}° - {e.nombre}
                  </option>
                ))}
              </select>
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field id="pw-anio" label="Año lectivo" error={errors.anio_lectivo}>
                <input
                  id="pw-anio"
                  type="number"
                  min="2000"
                  max="2100"
                  disabled={readOnly}
                  value={form.anio_lectivo}
                  onChange={(e) => update({ anio_lectivo: e.target.value })}
                  className={fieldCls(errors.anio_lectivo)}
                />
              </Field>
              <Field id="pw-division" label="División" error={errors.division}>
                <select id="pw-division" disabled={readOnly} value={form.division} onChange={(e) => update({ division: e.target.value })} className={`${fieldCls(errors.division)} bg-white`}>
                  {['A', 'B', 'C'].map((d) => (
                    <option key={d} value={d}>División "{d}"</option>
                  ))}
                </select>
              </Field>
              <Field id="pw-docente" label="Docente responsable">
                <input id="pw-docente" type="text" disabled value={`${printablePlan.docente_nombre || ''} ${printablePlan.docente_apellido || ''}`.trim()} className={fieldCls(false)} />
              </Field>
            </div>

            <TextArea
              id="pw-diag"
              label="Diagnóstico del grupo y contexto socioproductivo de Colonia Caroya"
              rows={5}
              disabled={readOnly}
              error={errors.diagnostico}
              value={form.diagnostico}
              onChange={(v) => update({ diagnostico: v })}
              placeholder="Describa las características del curso, conocimientos previos, intereses y necesidades pedagógicas específicas..."
            />
            <TextArea
              id="pw-fund"
              label="Fundamentación (finalidades formativas del espacio)"
              rows={4}
              disabled={readOnly}
              error={errors.fundamentacion}
              value={form.fundamentacion}
              onChange={(v) => update({ fundamentacion: v })}
              placeholder="Por qué y para qué se enseña este espacio en este grupo..."
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <p className="text-xs text-slate-600 leading-relaxed">
              Elija los aprendizajes y contenidos del diseño curricular; cada uno trae su meta y sus indicadores de logro (acciones que hacen evidente el aprendizaje). Marque cuáles son esenciales y cuáles complementarios.
            </p>
            {!espacioId ? (
              <p className="text-xs text-slate-500">Seleccione primero un espacio curricular en el paso 1.</p>
            ) : (
              <ContenidosPicker catalog={catalog} value={form.contenidos} onChange={(v) => update({ contenidos: v })} readOnly={readOnly} error={errors.contenidos} />
            )}
            <StringListEditor
              legend="Metas por ciclo"
              items={metas}
              onChange={(list) => update({ metasPropias: list.filter((m) => !form.contenidos.some((c) => c.meta === m)) })}
              disabled={readOnly}
              addLabel="Agregar otra meta"
              placeholder="Las metas de los contenidos elegidos se agregan solas; escriba aquí una meta propia..."
              error={errors.metas}
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <StringListEditor
              legend="Objetivos"
              items={form.objetivos}
              onChange={(v) => update({ objetivos: v })}
              disabled={readOnly}
              addLabel="Agregar otro objetivo"
              placeholder="Agregar otro objetivo específico..."
              error={errors.objetivos}
              suggestions={objetivosOficiales}
            />
            <CheckGroup
              legend="Capacidades fundamentales que se desarrollan"
              options={CAPACIDADES_FUNDAMENTALES}
              value={form.capacidades}
              onChange={(v) => update({ capacidades: v })}
              disabled={readOnly}
              error={errors.capacidades}
            />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-bold text-slate-800">Unidades didácticas y tiempos</h3>
              <span className="text-[11px] text-slate-500 font-medium">
                {form.unidades.length} unidades{totalHoras > 0 ? ` · ${totalHoras} horas planificadas` : ''}
                {espacioInfo?.horas_catedra ? ` · ${espacioInfo.horas_catedra} h cátedra semanales` : ''}
              </span>
            </div>
            {errors.unidades && <p className="text-[11px] text-rose-700 font-medium">{errors.unidades}</p>}
            {form.unidades.length === 0 && <p className="text-xs text-slate-500 p-3 rounded-xl border border-dashed border-slate-300">Todavía no definió unidades.</p>}
            <ol className="space-y-3">
              {form.unidades.map((u, i) => (
                <li key={i} className="rounded-xl border border-slate-200 p-3 space-y-3 bg-slate-50/50">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-slate-700">Unidad {i + 1}</span>
                    <RowControls
                      index={i}
                      total={form.unidades.length}
                      label={`unidad ${i + 1}`}
                      disabled={readOnly}
                      onMove={(idx, d) => update({ unidades: moveItem(form.unidades, idx, d) })}
                      onRemove={(idx) => update({ unidades: form.unidades.filter((_, j) => j !== idx) })}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Field id={`pw-u${i}-titulo`} label="Título">
                      <input id={`pw-u${i}-titulo`} type="text" disabled={readOnly} value={u.titulo} onChange={(e) => setUnidad(i, { titulo: e.target.value })} className={fieldCls(false)} />
                    </Field>
                    <Field id={`pw-u${i}-periodo`} label="Período (ej. 1.er trimestre)">
                      <input id={`pw-u${i}-periodo`} type="text" disabled={readOnly} value={u.periodo} onChange={(e) => setUnidad(i, { periodo: e.target.value })} className={fieldCls(false)} />
                    </Field>
                    <Field id={`pw-u${i}-horas`} label="Horas estimadas">
                      <input id={`pw-u${i}-horas`} type="number" min="0" max="1000" disabled={readOnly} value={u.horas} onChange={(e) => setUnidad(i, { horas: e.target.value })} className={fieldCls(false)} />
                    </Field>
                  </div>
                  <TextArea id={`pw-u${i}-cont`} label="Contenidos de la unidad" rows={2} disabled={readOnly} value={u.contenidos} onChange={(v) => setUnidad(i, { contenidos: v })} />
                  <TextArea id={`pw-u${i}-act`} label="Actividades principales" rows={2} disabled={readOnly} value={u.actividades} onChange={(v) => setUnidad(i, { actividades: v })} />
                </li>
              ))}
            </ol>
            {!readOnly && (
              <button type="button" onClick={() => update({ unidades: [...form.unidades, emptyUnidad()] })} className={btnSecondary}>
                <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Agregar unidad
              </button>
            )}
          </div>
        )}

        {step === 5 && (
          <div className="space-y-5">
            <CheckGroup
              legend="Formatos curriculares y pedagógicos"
              options={FORMATOS_PEDAGOGICOS}
              value={form.formatos_pedagogicos}
              onChange={(v) => update({ formatos_pedagogicos: v })}
              disabled={readOnly}
              error={errors.formatos_pedagogicos}
              columns="sm:grid-cols-3"
            />
            <TextArea id="pw-estrategias" label="Estrategias de enseñanza" rows={4} disabled={readOnly} error={errors.estrategias} value={form.estrategias} onChange={(v) => update({ estrategias: v })} placeholder="Aprendizaje basado en proyectos, estudio de casos, demostraciones prácticas..." />
            <TextArea id="pw-recursos" label="Recursos didácticos y entorno formativo" rows={3} disabled={readOnly} error={errors.recursos} value={form.recursos} onChange={(v) => update({ recursos: v })} placeholder="Materiales, herramientas, espacios de la escuela..." />

            <fieldset>
              <legend className="text-xs font-bold text-slate-800 mb-2">Temas transversales (indique cómo se trabajan)</legend>
              <div className="space-y-2">
                {TEMAS_TRANSVERSALES.map((tema, idx) => {
                  const t = form.transversales.find((x) => x.tema === tema);
                  return (
                    <div key={tema} className={`rounded-xl border p-2.5 ${t ? 'border-emerald-500 bg-emerald-50/70' : 'border-slate-200'}`}>
                      <label className="flex items-center gap-2.5 text-xs cursor-pointer">
                        <input type="checkbox" checked={Boolean(t)} disabled={readOnly} onChange={() => toggleTransversal(tema)} className="text-emerald-600 rounded" />
                        <span className="font-medium text-slate-800">{tema}</span>
                      </label>
                      {t && (
                        <input
                          type="text"
                          aria-label={`Cómo se trabaja: ${tema}`}
                          id={`pw-trans-${idx}`}
                          disabled={readOnly}
                          value={t.como}
                          onChange={(e) => update({ transversales: form.transversales.map((x) => (x.tema === tema ? { ...x, como: e.target.value } : x)) })}
                          placeholder="Cómo se aborda en este espacio..."
                          className="mt-2 w-full p-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
              {errors.transversales && <p className="mt-1 text-[11px] text-rose-700 font-medium">{errors.transversales}</p>}
            </fieldset>

            <TextArea
              id="pw-art"
              label="Articulación con otros espacios o proyectos"
              rows={3}
              disabled={readOnly}
              error={errors.articulacion}
              value={form.articulacion}
              onChange={(v) => update({ articulacion: v })}
              hint="Con qué espacios curriculares o proyectos institucionales se trabaja en conjunto y para qué."
            />
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4">
            <TextArea
              id="pw-eval"
              label="Criterios de evaluación"
              rows={4}
              disabled={readOnly}
              error={errors.evaluacion_criterios}
              value={form.evaluacion_criterios}
              onChange={(v) => update({ evaluacion_criterios: v })}
              hint="Lo que se valora en las producciones y desempeños; conviene compartirlos con los estudiantes."
            />
            <TextArea id="pw-eval-inst" label="Instrumentos de evaluación" rows={3} disabled={readOnly} error={errors.evaluacion_instrumentos} value={form.evaluacion_instrumentos} onChange={(v) => update({ evaluacion_instrumentos: v })} placeholder="Rúbricas, listas de cotejo, informes, bitácora, producciones..." />
            <TextArea id="pw-eval-mom" label="Momentos de evaluación, retroalimentación, autoevaluación y coevaluación" rows={3} disabled={readOnly} error={errors.evaluacion_momentos} value={form.evaluacion_momentos} onChange={(v) => update({ evaluacion_momentos: v })} placeholder="Al inicio, durante y al final de cada unidad..." />
            {!readOnly && (
              <div className="flex flex-wrap gap-2">
                {['Autoevaluación de los estudiantes', 'Coevaluación entre pares', 'Heteroevaluación docente', 'Retroalimentación sobre los avances'].map((t) => (
                  <button key={t} type="button" onClick={() => appendMomento(t)} className={btnSecondary}>
                    <Plus className="w-3 h-3" aria-hidden="true" /> {t}
                  </button>
                ))}
              </div>
            )}
            <TextArea id="pw-biblio" label="Bibliografía docente y del estudiante" rows={3} disabled={readOnly} error={errors.bibliografia} value={form.bibliografia} onChange={(v) => update({ bibliografia: v })} placeholder="Diseño curricular, manuales técnicos..." />
          </div>
        )}

        {step === 7 && (
          <div className="space-y-5">
            <h3 className="text-sm font-bold text-slate-900">Revisión antes de enviar</h3>
            {Object.keys(faltantes).length === 0 ? (
              <div role="status" className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                Están completos los datos esenciales. Puede enviar la planificación al Equipo Directivo.
              </div>
            ) : (
              <div role="alert" className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-2">
                <div className="font-bold">Faltan datos esenciales para enviar a revisión</div>
                <ul className="space-y-1">
                  {Object.entries(faltantes).map(([campo, msg]) => (
                    <li key={campo} className="flex flex-wrap items-center gap-2">
                      <span>{errors[campo] || msg}</span>
                      <button type="button" onClick={() => setStep(FIELD_STEP[campo] || 1)} className="font-bold underline text-amber-900">
                        Ir al paso {FIELD_STEP[campo] || 1}
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="text-amber-800">Puede guardar un borrador incompleto en cualquier momento.</p>
              </div>
            )}

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {[
                ['Espacio', espacioInfo ? `${espacioInfo.nombre}${espacioInfo.anio ? ` (${espacioInfo.anio}° año)` : ''}` : 'Sin elegir'],
                ['Año lectivo y división', `${form.anio_lectivo} · División "${form.division}"`],
                ['Metas', `${metas.length}`],
                ['Aprendizajes y contenidos', `${form.contenidos.length} (${form.contenidos.filter((c) => c.prioridad !== 'complementario').length} esenciales)`],
                ['Indicadores de logro', `${form.contenidos.reduce((a, c) => a + asArray(c.indicadores).length, 0)}`],
                ['Objetivos', `${form.objetivos.length}`],
                ['Capacidades', `${form.capacidades.length} de ${CAPACIDADES_FUNDAMENTALES.length}`],
                ['Unidades', `${form.unidades.filter((u) => u.titulo.trim()).length}${totalHoras ? ` · ${totalHoras} horas` : ''}`],
                ['Formatos', form.formatos_pedagogicos.join(', ') || 'Sin elegir'],
                ['Temas transversales', form.transversales.map((t) => t.tema).join(', ') || 'Ninguno']
              ].map(([k, v]) => (
                <div key={k} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                  <dt className="font-bold text-slate-600 text-[10px] uppercase">{k}</dt>
                  <dd className="text-slate-900 font-medium mt-0.5">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="text-[11px] text-slate-500">Sugeridos, sin ser obligatorios: capacidades, unidades, formatos, estrategias, transversales y articulación.</p>
          </div>
        )}

        <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button type="button" onClick={() => setStep(step - 1)} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-300 flex items-center gap-1.5 transition">
                <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> Anterior
              </button>
            )}
            {step < LAST_STEP && (
              <button type="button" onClick={goNext} className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5 transition shadow-xs">
                Siguiente <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
          </div>

          {!readOnly && (
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" disabled={saving} onClick={() => handleSave(false)} className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1.5 transition disabled:opacity-50">
                <Save className="w-3.5 h-3.5" aria-hidden="true" /> {saving ? 'Guardando...' : 'Guardar Borrador'}
              </button>
              <button type="button" disabled={saving} onClick={() => handleSave(true)} className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5 shadow-sm transition disabled:opacity-50">
                <Send className="w-3.5 h-3.5" aria-hidden="true" /> Enviar a Revisión Directiva
              </button>
            </div>
          )}
        </div>
      </div>

      {showPrint && <PrintablePlanning plan={printablePlan} espacio={espacioInfo} onClose={() => setShowPrint(false)} />}

      <ConfirmDialog
        open={confirmExit}
        title="Cambios sin guardar"
        message="Hay cambios sin guardar. Si sale ahora se perderán."
        confirmLabel="Salir sin guardar"
        onCancel={() => setConfirmExit(false)}
        onConfirm={() => {
          setConfirmExit(false);
          onCancel?.();
        }}
      />
    </div>
  );
}
