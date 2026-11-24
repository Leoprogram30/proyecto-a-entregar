import PrintFrame, { Bullets, ContenidosPrint, Fila, Section, Text } from './planning/PrintFrame';
import { asArray } from '../config/catalogos';

// Impresión completa de la planificación anual.
export default function PrintablePlanning({ plan, espacio, onClose }) {
  const nombreEspacio = espacio?.nombre || plan.espacio_nombre;
  const anio = espacio?.anio || plan.espacio_anio;
  const horas = espacio?.horas_catedra || plan.horas_catedra;
  const docente = `${plan.docente_nombre || ''} ${plan.docente_apellido || ''}`.trim();
  const unidades = asArray(plan.unidades);
  const transversales = asArray(plan.transversales);

  return (
    <PrintFrame
      titulo="PLANIFICACIÓN CURRICULAR ANUAL"
      ariaLabel="Vista previa de impresión de la planificación"
      estado={plan.estado}
      anioLectivo={plan.anio_lectivo}
      onClose={onClose}
      datos={[
        ['Espacio Curricular', nombreEspacio],
        ['Curso y División', anio ? `${anio}° Año "${plan.division || '-'}"` : `División "${plan.division || '-'}"`],
        ['Carga Horaria', horas ? `${horas} Horas Cátedra Semanales` : ''],
        ['Docente a Cargo', docente]
      ]}
    >
      <Section title="1. Diagnóstico y fundamentación">
        <div className="text-xs text-slate-700 leading-relaxed space-y-2">
          <Fila label="Diagnóstico del grupo">{plan.diagnostico}</Fila>
          <Fila label="Fundamentación">{plan.fundamentacion}</Fila>
        </div>
      </Section>

      <Section title="2. Metas por ciclo">
        {plan.metas?.length ? <Bullets items={plan.metas} /> : <p>Los contenidos seleccionados no tienen metas por ciclo publicadas.</p>}
      </Section>

      <Section title="3. Aprendizajes y contenidos, con sus indicadores de logro">
        <ContenidosPrint contenidos={plan.contenidos} />
      </Section>

      <Section title="4. Objetivos y capacidades fundamentales">
        <div className="text-xs text-slate-700 space-y-2">
          <strong>Objetivos:</strong>
          <Bullets items={plan.objetivos} />
          <strong className="block pt-1">Capacidades fundamentales:</strong>
          <Bullets items={plan.capacidades} />
        </div>
      </Section>

      <Section title="5. Unidades y tiempos">
        {unidades.length === 0 ? (
          <p className="text-xs text-slate-700">
            <Text />
          </p>
        ) : (
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-left">
                <th className="border border-slate-300 p-1.5">Unidad</th>
                <th className="border border-slate-300 p-1.5">Período</th>
                <th className="border border-slate-300 p-1.5">Horas</th>
                <th className="border border-slate-300 p-1.5">Contenidos</th>
                <th className="border border-slate-300 p-1.5">Actividades</th>
              </tr>
            </thead>
            <tbody>
              {unidades.map((u, i) => (
                <tr key={i} className="align-top print-avoid-break">
                  <td className="border border-slate-300 p-1.5 font-semibold">{i + 1}. {u.titulo}</td>
                  <td className="border border-slate-300 p-1.5">{u.periodo}</td>
                  <td className="border border-slate-300 p-1.5">{u.horas ?? ''}</td>
                  <td className="border border-slate-300 p-1.5 whitespace-pre-line">{u.contenidos}</td>
                  <td className="border border-slate-300 p-1.5 whitespace-pre-line">{u.actividades}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      <Section title="6. Formatos, estrategias, recursos, transversales y articulación">
        <div className="text-xs text-slate-700 space-y-2">
          <Fila label="Formatos pedagógicos">{asArray(plan.formatos_pedagogicos).join(', ')}</Fila>
          <Fila label="Estrategias">{plan.estrategias}</Fila>
          <Fila label="Recursos">{plan.recursos}</Fila>
          <div>
            <strong>Temas transversales:</strong>
            {transversales.length === 0 ? (
              <> <Text /></>
            ) : (
              <ul className="list-disc pl-5">
                {transversales.map((t, i) => (
                  <li key={i}>
                    <strong>{t.tema}</strong>
                    {t.como ? `: ${t.como}` : ''}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Fila label="Articulación con otros espacios">{plan.articulacion}</Fila>
        </div>
      </Section>

      <Section title="7. Evaluación y bibliografía">
        <div className="text-xs text-slate-700 space-y-2">
          <Fila label="Criterios de evaluación">{plan.evaluacion_criterios}</Fila>
          <Fila label="Instrumentos">{plan.evaluacion_instrumentos}</Fila>
          <Fila label="Momentos, autoevaluación y coevaluación">{plan.evaluacion_momentos}</Fila>
          <Fila label="Bibliografía">{plan.bibliografia}</Fila>
        </div>
      </Section>
    </PrintFrame>
  );
}
