import React from 'react';
import { Printer, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function PrintablePlanning({ plan, espacio, onClose }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-300">
        {/* Barra superior de herramientas (no se imprime) */}
        <div className="print:hidden bg-slate-800 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Volver al Asistente
            </button>
            <span className="text-xs text-slate-300">
              Vista previa para exportar / imprimir en formato oficial PDF
            </span>
          </div>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm transition"
          >
            <Printer className="w-4 h-4" />
            Imprimir / Guardar como PDF
          </button>
        </div>

        {/* Contenedor Imprimible con Membrete Oficial */}
        <div className="p-8 sm:p-12 overflow-y-auto printable-content text-slate-900 font-sans">
          {/* Membrete Institucional Oficial de Córdoba */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 border-2 border-emerald-800 rounded-xl p-1 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="w-12 h-12">
                    <path d="M32 4 L56 12 V34 C56 48 32 60 32 60 C32 60 8 48 8 34 V12 Z" fill="#15803d" />
                    <path d="M32 18 C38 22 42 28 42 34 C42 40 38 42 32 44 C26 42 22 40 22 34 C22 28 26 22 32 18 Z" fill="#ffffff" />
                    <circle cx="32" cy="14" r="3" fill="#f59e0b" />
                  </svg>
                </div>
                <div>
                  <div className="text-[11px] font-bold tracking-wider text-slate-600 uppercase">
                    Gobierno de la Provincia de Córdoba • Ministerio de Educación
                  </div>
                  <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    IPEM N° 349 "GIOVANNI BOSCO"
                  </h1>
                  <div className="text-xs font-semibold text-emerald-800">
                    Colonia Caroya - Orientación: Agro y Ambiente
                  </div>
                  <div className="text-[10px] text-slate-500">
                    D.G.E.Sec. - Inspección General de Educación Secundaria
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-slate-800">PLANIFICACIÓN CURRICULAR ANUAL</div>
                <div className="text-xs text-slate-600">Ciclo Lectivo {plan.anio_lectivo || 2026}</div>
                <div className="mt-1">
                  <span className="inline-block text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-emerald-700 bg-emerald-50 text-emerald-800">
                    Estado: {plan.estado?.toUpperCase() || 'APROBADA'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Ficha Técnica del Espacio Curricular */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs mb-6">
            <div>
              <span className="font-bold text-slate-600 block text-[10px] uppercase">Espacio Curricular</span>
              <span className="font-semibold text-slate-900">{espacio?.nombre || plan.espacio_nombre}</span>
            </div>
            <div>
              <span className="font-bold text-slate-600 block text-[10px] uppercase">Curso y División</span>
              <span className="font-semibold text-slate-900">{espacio?.anio || plan.espacio_anio}° Año "{plan.division || 'A'}"</span>
            </div>
            <div>
              <span className="font-bold text-slate-600 block text-[10px] uppercase">Carga Horaria</span>
              <span className="font-semibold text-slate-900">{espacio?.horas_catedra || 4} Horas Cátedra Semanales</span>
            </div>
            <div>
              <span className="font-bold text-slate-600 block text-[10px] uppercase">Docente a Cargo</span>
              <span className="font-semibold text-slate-900">{plan.docente_nombre || 'Docente Titular'}</span>
            </div>
          </div>

          {/* 1. Diagnóstico del Grupo */}
          <section className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-900 border-b border-emerald-200 pb-1 mb-2">
              1. Diagnóstico Inicial y Contexto Institucional
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed text-justify">
              {plan.diagnostico || 'Diagnóstico del grupo y vinculación con el entorno socioproductivo de Colonia Caroya.'}
            </p>
          </section>

          {/* 2. Objetivos de Aprendizaje */}
          <section className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-900 border-b border-emerald-200 pb-1 mb-2">
              2. Objetivos de Aprendizaje Institucionales (Malla Córdoba)
            </h2>
            <ul className="list-disc list-inside space-y-1 text-xs text-slate-700">
              {Array.isArray(plan.objetivos) ? (
                plan.objetivos.map((obj, i) => <li key={i} className="leading-relaxed">{obj}</li>)
              ) : (
                <li>{plan.objetivos}</li>
              )}
            </ul>
          </section>

          {/* 3. Aprendizajes y Contenidos Fundamentales */}
          <section className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-900 border-b border-emerald-200 pb-1 mb-2">
              3. Aprendizajes y Contenidos Seleccionados
            </h2>
            <ul className="list-disc list-inside space-y-1 text-xs text-slate-700">
              {Array.isArray(plan.contenidos) ? (
                plan.contenidos.map((cnt, i) => <li key={i} className="leading-relaxed">{cnt}</li>)
              ) : (
                <li>{plan.contenidos}</li>
              )}
            </ul>
          </section>

          {/* 4. Estrategias y Formatos Pedagógicos */}
          <section className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-900 border-b border-emerald-200 pb-1 mb-2">
              4. Formatos Pedagógicos y Estrategias Metodológicas
            </h2>
            <div className="text-xs text-slate-700 space-y-2">
              <p><strong>Formatos Pedagógicos:</strong> {plan.formatos_pedagogicos}</p>
              <p><strong>Estrategias:</strong> {plan.estrategias}</p>
              <p><strong>Recursos Didácticos y de Entorno:</strong> {plan.recursos}</p>
            </div>
          </section>

          {/* 5. Evaluación y Bibliografía */}
          <section className="mb-8">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-900 border-b border-emerald-200 pb-1 mb-2">
              5. Criterios e Instrumentos de Evaluación y Bibliografía
            </h2>
            <div className="text-xs text-slate-700 space-y-2">
              <p><strong>Criterios e Instrumentos:</strong> {plan.evaluacion}</p>
              <p><strong>Bibliografía del Docente y del Estudiante:</strong> {plan.bibliografia}</p>
            </div>
          </section>

          {/* Espacio para Firmas Institucionales */}
          <div className="pt-8 mt-12 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <div className="h-14"></div>
              <div className="border-t border-slate-400 pt-1 font-semibold text-slate-800">
                Firma y Aclaración del Docente
              </div>
              <div className="text-[10px] text-slate-500">IPEM N° 349 "Giovanni Bosco"</div>
            </div>
            <div>
              <div className="h-14"></div>
              <div className="border-t border-slate-400 pt-1 font-semibold text-slate-800">
                V° B° Equipo Directivo / Coordinación
              </div>
              <div className="text-[10px] text-slate-500">Supervisión Pedagógica y Acreditación</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
