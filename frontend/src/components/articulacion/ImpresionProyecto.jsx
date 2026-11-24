import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { formatFecha } from '../ui';
import { ESTADOS_ART, FUENTE_LABEL, MODALIDADES, VIGENCIAS, nombreCompleto } from './constantes';
import { Seccion } from './comunes';

// Se monta en document.body; el CSS de impresión (index.css) oculta el resto de la aplicación.
export default function ImpresionProyecto({ d, onClose }) {
  const closeRef = useRef(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });
  useEffect(() => {
    const previous = document.activeElement;
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onCloseRef.current?.();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, []);

  const { proyecto: p, participantes, encuentros, calculo } = d;
  const aceptados = participantes.filter((x) => x.invitacion === 'aceptado');
  const mod = MODALIDADES[p.modalidad];

  return createPortal(
    <div className="print-overlay fixed inset-0 bg-slate-900/60 z-50 overflow-y-auto p-2 sm:p-4">
      <div role="dialog" aria-modal="true" aria-label="Vista previa de impresión del proyecto de articulación" className="print-sheet bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-auto border border-slate-300">
        <div className="no-print bg-slate-800 text-white p-3 sm:p-4 flex flex-wrap items-center justify-between gap-2 rounded-t-2xl sticky top-0">
          <button ref={closeRef} type="button" onClick={onClose} className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-semibold flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> Volver
          </button>
          <button type="button" onClick={() => window.print()} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-2">
            <Printer className="w-4 h-4" aria-hidden="true" /> Imprimir / Guardar como PDF
          </button>
        </div>

        <div className="p-5 sm:p-12 text-slate-900 font-sans space-y-5">
          <div className="border-b-2 border-slate-900 pb-3">
            <div className="text-[11px] font-bold tracking-wider text-slate-600 uppercase">Gobierno de la Provincia de Córdoba • Ministerio de Educación</div>
            <h1 className="text-xl font-extrabold">IPEM N° 349 "GIOVANNI BOSCO"</h1>
            <div className="text-xs font-semibold text-emerald-800">Colonia Caroya - Orientación: Agro y Ambiente</div>
            <div className="text-xs font-bold mt-2">PROYECTO DE ARTICULACIÓN ENTRE ESPACIOS CURRICULARES</div>
          </div>

          <div>
            <h2 className="text-lg font-extrabold">{p.titulo}</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-0.5 text-xs mt-2">
              <div><dt className="inline font-semibold">Modalidad: </dt><dd className="inline">{mod?.label}</dd></div>
              <div><dt className="inline font-semibold">Estado: </dt><dd className="inline">{ESTADOS_ART[p.estado]?.label}</dd></div>
              <div><dt className="inline font-semibold">Curso: </dt><dd className="inline">{p.curso}.° año{p.division ? ` ${p.division}` : ''} · {p.anio_lectivo}</dd></div>
              <div>
                <dt className="inline font-semibold">Vigencia: </dt>
                <dd className="inline">{p.vigencia === 'fechas' ? `Del ${formatFecha(p.fecha_inicio)} al ${formatFecha(p.fecha_fin)}` : VIGENCIAS[p.vigencia]}</dd>
              </div>
              <div><dt className="inline font-semibold">Horas semanales compartidas: </dt><dd className="inline">{calculo.horas_compartidas}</dd></div>
              <div><dt className="inline font-semibold">Responsable: </dt><dd className="inline">{p.creador_nombre} {p.creador_apellido}</dd></div>
            </dl>
            <p className="text-[10px] text-slate-500 mt-1">Fuente de la modalidad: {mod?.fuente}</p>
          </div>

          <Seccion titulo="Eje común">{p.eje}</Seccion>
          <Seccion titulo="Fundamentación">{p.fundamentacion}</Seccion>
          <Seccion titulo="Marco integrador">{p.marco_integrador}</Seccion>
          <Seccion titulo="Objetivos">{p.objetivos}</Seccion>
          <Seccion titulo="Capacidades fundamentales">{p.capacidades.join('\n')}</Seccion>
          <Seccion titulo="Ejes transversales">{p.transversales.join('\n')}</Seccion>
          <Seccion titulo="Producto o evidencia final">{p.producto_final}</Seccion>
          <Seccion titulo="Organización de tiempos, espacios y agrupamientos">{p.organizacion}</Seccion>

          <section>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 border-b border-emerald-200 pb-1 mb-2">Aportes de cada espacio</h3>
            <div className="space-y-3">
              {aceptados.map((x) => (
                <div key={x.id} className="print-avoid-break text-xs">
                  <p className="font-bold">{x.espacio_nombre} ({x.espacio_horas} hs) · {nombreCompleto(x)}{x.conformidad ? ' · Conforme' : ''}</p>
                  <p><span className="font-semibold">Tema:</span> {x.tema || 'Sin datos consignados.'}</p>
                  {x.contenidos.length > 0 && (
                    <ul className="list-disc ml-5">
                      {x.contenidos.map((c, i) => (
                        <li key={i}>
                          {c.titulo}{c.fuente ? ` (${FUENTE_LABEL[c.fuente] || c.fuente})` : ''}
                          {c.indicadores?.length > 0 && <ul className="list-[circle] ml-5">{c.indicadores.map((ind) => <li key={ind}>{ind}</li>)}</ul>}
                        </li>
                      ))}
                    </ul>
                  )}
                  {x.actividades && <p className="whitespace-pre-line"><span className="font-semibold">Actividades:</span> {x.actividades}</p>}
                  {x.recursos && <p className="whitespace-pre-line"><span className="font-semibold">Recursos:</span> {x.recursos}</p>}
                  {x.saberes_propios && <p className="whitespace-pre-line"><span className="font-semibold">Saberes en horas propias:</span> {x.saberes_propios}</p>}
                  {x.evaluacion_aporte && <p className="whitespace-pre-line"><span className="font-semibold">Evaluación de su parte:</span> {x.evaluacion_aporte}</p>}
                </div>
              ))}
            </div>
            {calculo.por_espacio.length > 0 && (
              <table className="w-full text-xs mt-3 border border-slate-300">
                <thead><tr className="bg-slate-100 text-left"><th className="p-1">Espacio</th><th className="p-1">Hs semanales</th><th className="p-1">Hs compartidas</th><th className="p-1">Hs propias</th></tr></thead>
                <tbody>
                  {calculo.por_espacio.map((e) => (
                    <tr key={e.espacio_id} className="border-t border-slate-200"><td className="p-1">{e.espacio_nombre}</td><td className="p-1">{e.horas_catedra}</td><td className="p-1">{calculo.horas_compartidas}</td><td className="p-1">{e.horas_propias}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 border-b border-emerald-200 pb-1 mb-2">Plan de trabajo</h3>
            {encuentros.length === 0 ? (
              <p className="text-xs text-slate-400">Sin encuentros planificados.</p>
            ) : (
              <table className="w-full text-xs border border-slate-300">
                <thead><tr className="bg-slate-100 text-left"><th className="p-1">N.°</th><th className="p-1">Fecha</th><th className="p-1">Hs</th><th className="p-1">Encuentro y actividades</th><th className="p-1">Contenidos</th></tr></thead>
                <tbody>
                  {encuentros.map((e, i) => (
                    <tr key={e.id} className="border-t border-slate-200 align-top print-avoid-break">
                      <td className="p-1">{i + 1}</td><td className="p-1">{formatFecha(e.fecha)}</td><td className="p-1">{e.horas}</td>
                      <td className="p-1"><strong>{e.titulo}</strong>{e.actividades ? <span className="whitespace-pre-line block">{e.actividades}</span> : null}</td>
                      <td className="p-1">{e.contenidos.join('; ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <Seccion titulo="Evaluación: criterios">{p.evaluacion_criterios}</Seccion>
          <Seccion titulo="Evaluación: instrumentos">{p.evaluacion_instrumentos}</Seccion>
          <Seccion titulo="Evaluación: momentos">{p.evaluacion_momentos}</Seccion>
          {p.evaluacion_instancia && <Seccion titulo="Evaluación de la instancia">{p.evaluacion_instancia}</Seccion>}
          {calculo.advertencias.length > 0 && <Seccion titulo="Advertencias">{calculo.advertencias.join('\n')}</Seccion>}
          {p.devolucion && <Seccion titulo="Devolución de la Dirección">{p.devolucion}</Seccion>}

          <div className="grid grid-cols-3 gap-6 pt-12 text-[10px] text-center print-avoid-break">
            {['Docentes responsables', 'Dirección', 'Supervisión (si corresponde)'].map((l) => (
              <div key={l} className="border-t border-slate-700 pt-1">{l}</div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
