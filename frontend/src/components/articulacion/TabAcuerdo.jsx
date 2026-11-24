import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { formatFecha } from '../ui';
import { MODALIDADES, VIGENCIAS } from './constantes';
import { Seccion } from './comunes';
import EditorCampos from './EditorCampos';

export default function TabAcuerdo({ d, run, busy }) {
  const [editando, setEditando] = useState(false);
  const { proyecto: p, permisos, calculo } = d;
  const tc = p.modalidad === 'tiempo_compartido';

  const campos = [
    { k: 'titulo', label: 'Título', tipo: 'text', requerido: true },
    { k: 'eje', label: 'Eje común: tema, problema, desafío o pregunta', tipo: 'area', requerido: true, hint: 'Si cambia el eje, se anulan las conformidades.' },
    { k: 'modalidad', label: 'Modalidad', tipo: 'modalidad', hint: 'Si cambia la modalidad, se anulan las conformidades.' },
    { k: 'division', label: 'División', tipo: 'text' },
    { k: 'vigencia', label: 'Vigencia', tipo: 'vigencia' },
    { k: 'fecha_inicio', label: 'Fecha de inicio', tipo: 'date' },
    { k: 'fecha_fin', label: 'Fecha de fin', tipo: 'date' },
    ...(tc ? [] : [{ k: 'horas_compartidas', label: 'Horas semanales compartidas (si las hay)', tipo: 'number' }]),
    { k: 'fundamentacion', label: 'Fundamentación: por qué y para qué articular', tipo: 'area' },
    { k: 'marco_integrador', label: 'Marco integrador: núcleos conceptuales básicos', tipo: 'area' },
    { k: 'objetivos', label: 'Objetivos de enseñanza y de aprendizaje', tipo: 'area' },
    { k: 'capacidades', label: 'Capacidades fundamentales (una por línea)', tipo: 'lines' },
    { k: 'transversales', label: 'Ejes transversales: EDS, ESI, etc. (uno por línea)', tipo: 'lines' },
    { k: 'producto_final', label: 'Producto o evidencia final', tipo: 'area' },
    { k: 'organizacion', label: 'Organización de tiempos, espacios y agrupamientos', tipo: 'area' }
  ];

  if (editando) {
    return <EditorCampos proyecto={p} campos={campos} run={run} busy={busy} titulo="Editar acuerdo" onDone={() => setEditando(false)} />;
  }

  const vigencia = p.vigencia === 'fechas' ? `Del ${formatFecha(p.fecha_inicio)} al ${formatFecha(p.fecha_fin)}` : VIGENCIAS[p.vigencia];
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <dl className="grid gap-x-6 gap-y-1 text-xs sm:grid-cols-2">
          <div><dt className="inline font-semibold">Modalidad: </dt><dd className="inline">{MODALIDADES[p.modalidad]?.label}</dd></div>
          <div><dt className="inline font-semibold">Vigencia: </dt><dd className="inline">{vigencia}</dd></div>
          <div>
            <dt className="inline font-semibold">Horas semanales compartidas: </dt>
            <dd className="inline">{calculo.horas_compartidas}{tc ? ' (calculadas según los espacios)' : ''}</dd>
          </div>
        </dl>
        {permisos.puede_editar && (
          <button type="button" onClick={() => setEditando(true)} className="px-3 py-1.5 bg-white border border-slate-300 text-xs font-bold rounded-lg flex items-center gap-1.5">
            <Pencil className="w-3.5 h-3.5" aria-hidden="true" /> Editar acuerdo
          </button>
        )}
      </div>
      <p className="text-[11px] text-slate-500">{MODALIDADES[p.modalidad]?.corta} Fuente: {MODALIDADES[p.modalidad]?.fuente}</p>
      {permisos.nivel === 'completo' ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Seccion titulo="Fundamentación">{p.fundamentacion}</Seccion>
          <Seccion titulo="Marco integrador">{p.marco_integrador}</Seccion>
          <Seccion titulo="Objetivos">{p.objetivos}</Seccion>
          <Seccion titulo="Producto o evidencia final">{p.producto_final}</Seccion>
          <Seccion titulo="Capacidades fundamentales">{p.capacidades.join('\n')}</Seccion>
          <Seccion titulo="Ejes transversales">{p.transversales.join('\n')}</Seccion>
          <Seccion titulo="Organización de tiempos, espacios y agrupamientos">{p.organizacion}</Seccion>
        </div>
      ) : (
        <p className="text-xs text-slate-600">Para ver el detalle del acuerdo, sume su espacio al proyecto.</p>
      )}
    </div>
  );
}
