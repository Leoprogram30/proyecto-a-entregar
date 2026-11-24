import PrintFrame, { Bullets, ContenidosPrint, Fila, Section, Text } from './planning/PrintFrame';
import { asArray, MOMENTOS_CLASE } from '../config/catalogos';

const momentoLabel = (m) => MOMENTOS_CLASE.find((x) => x.value === m)?.label || m;

// Impresión completa de una secuencia didáctica.
export default function PrintableSecuencia({ secuencia: s, onClose }) {
  const clases = asArray(s.clases);
  const docente = `${s.docente_nombre || ''} ${s.docente_apellido || ''}`.trim();
  const anio = s.espacio_anio;
  const art =
    s.tipo_articulacion && s.tipo_articulacion !== 'ninguna'
      ? `${s.tipo_articulacion === 'colaborativa' ? 'Colaborativa' : 'Declarativa'}${s.articulacion_eje ? `. Eje: ${s.articulacion_eje}` : ''}${
          s.articulacion_materias ? `. Con: ${s.articulacion_materias}` : ''
        }`
      : '';

  return (
    <PrintFrame
      titulo="SECUENCIA DIDÁCTICA"
      ariaLabel="Vista previa de impresión de la secuencia didáctica"
      estado={s.estado}
      anioLectivo={s.anio_lectivo}
      onClose={onClose}
      datos={[
        ['Título', s.titulo],
        ['Espacio Curricular', s.espacio_nombre ? `${s.espacio_nombre}${anio ? ` (${anio}° año)` : ''}` : ''],
        ['Tiempo', s.tiempo_estimado],
        ['Docente a Cargo', docente]
      ]}
    >
      <Section title="1. Fundamentación y objetivos">
        <div className="text-xs text-slate-700 leading-relaxed space-y-2">
          <Fila label="Fundamentación">{s.fundamentacion}</Fila>
          <Fila label="Objetivos">{s.objetivos}</Fila>
        </div>
      </Section>

      <Section title="2. Capacidades fundamentales">
        <Bullets items={s.capacidades} />
      </Section>

      <Section title="3. Aprendizajes y contenidos, con sus indicadores de logro">
        <ContenidosPrint contenidos={s.contenidos} />
      </Section>

      <Section title="4. Formato, agrupamientos y ambiente">
        <div className="text-xs text-slate-700 space-y-2">
          <Fila label="Formato">{s.formato}</Fila>
          <Fila label="Tiempo estimado">{s.tiempo_estimado}</Fila>
          <Fila label="Agrupamientos">{s.agrupamientos}</Fila>
          <Fila label="Ambiente o espacio">{s.ambiente}</Fila>
        </div>
      </Section>

      <Section title="5. Secuencia de clases">
        {clases.length === 0 ? (
          <p className="text-xs text-slate-700">
            <Text />
          </p>
        ) : (
          <ol className="space-y-3 text-xs text-slate-700">
            {clases.map((c, i) => (
              <li key={i} className="print-avoid-break border border-slate-300 rounded-lg p-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-slate-900">
                    Clase {i + 1}
                    {c.titulo ? `: ${c.titulo}` : ''}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-slate-600">{momentoLabel(c.momento)}</span>
                  {c.duracion && <span className="text-[11px] text-slate-600">{c.duracion}</span>}
                  {c.evaluativa && (
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border border-amber-600 text-amber-800">Instancia evaluativa</span>
                  )}
                </div>
                <p className="mt-1 whitespace-pre-line leading-relaxed">{c.actividades}</p>
                {c.recursos && <p className="mt-1 text-[11px]"><strong>Recursos:</strong> {c.recursos}</p>}
              </li>
            ))}
          </ol>
        )}
      </Section>

      <Section title="6. Evaluación, recursos, producto y bibliografía">
        <div className="text-xs text-slate-700 space-y-2">
          <Fila label="Producto o evidencia">{s.producto}</Fila>
          <Fila label="Criterios de evaluación">{s.evaluacion_criterios}</Fila>
          <Fila label="Instrumentos">{s.evaluacion_instrumentos}</Fila>
          <Fila label="Recursos y materiales">{s.recursos}</Fila>
          <Fila label="Bibliografía">{s.bibliografia}</Fila>
        </div>
      </Section>

      <Section title="7. Articulación">
        <p className="text-xs text-slate-700">
          <Text>{art}</Text>
        </p>
      </Section>
    </PrintFrame>
  );
}
