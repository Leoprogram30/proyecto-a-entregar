import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  Sprout,
  Award,
  BookOpen,
  Filter,
  CheckSquare,
  Square,
  Trash2
} from 'lucide-react';

export default function AgendaView({ selectedEspacio }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('docente'); // 'docente' | 'institucional'
  const [hitos, setHitos] = useState([]);
  const [metricas, setMetricas] = useState({ total: 0, completados: 0, pendientes: 0, porcentaje: 0 });
  const [cronograma, setCronograma] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states for new milestone
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipo, setTipo] = useState('practica_campo');
  const [fecha, setFecha] = useState('');

  useEffect(() => {
    loadData();
  }, [selectedEspacio, activeTab]);

  const loadData = async () => {
    setLoading(true);
    if (activeTab === 'docente') {
      const res = await api.getHitos(selectedEspacio?.id, user?.id);
      setHitos(res.hitos || []);
      setMetricas(res.metricas || { total: 0, completados: 0, pendientes: 0, porcentaje: 0 });
    } else {
      const crono = await api.getCronograma();
      setCronograma(crono);
    }
    setLoading(false);
  };

  const handleToggleHito = async (id) => {
    try {
      await api.toggleHito(id);
      await loadData();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleCreateHito = async (e) => {
    e.preventDefault();
    if (!titulo || !fecha) return;

    try {
      await api.createHito({
        docente_id: user?.id || 4,
        espacio_id: selectedEspacio?.id || 26,
        espacio_nombre: selectedEspacio?.nombre || 'Producción Vegetal I',
        titulo,
        descripcion,
        tipo,
        fecha
      });
      setShowAddModal(false);
      setTitulo('');
      setDescripcion('');
      setFecha('');
      await loadData();
    } catch (err) {
      alert('Error creando actividad: ' + err.message);
    }
  };

  const getTipoBadge = (t) => {
    switch (t) {
      case 'practica_campo':
        return { label: 'Práctica en Entorno Formativo (Huerta/Campo)', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: Sprout };
      case 'hito_evaluativo':
        return { label: 'Hito Evaluativo', bg: 'bg-amber-100 text-amber-800 border-amber-300', icon: Award };
      case 'entrega_proyecto':
        return { label: 'Entrega de Informe/Proyecto', bg: 'bg-sky-100 text-sky-800 border-sky-300', icon: CheckCircle2 };
      case 'clase':
      default:
        return { label: 'Clase Regular', bg: 'bg-slate-100 text-slate-700 border-slate-300', icon: BookOpen };
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-900 rounded-2xl p-6 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-emerald-800/80 px-3 py-1 rounded-full text-xs text-amber-300 font-semibold mb-2 border border-emerald-700">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            Cronograma Institucional & Agenda de Entornos Formativos
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">
            Agenda Docente con Hitos de Aprendizaje
          </h2>
          <p className="text-xs text-emerald-100 mt-1 max-w-2xl leading-relaxed">
            Organiza tus clases, prácticas en campo (huerta, vivero y chacras de Colonia Caroya) y fechas clave de evaluación con seguimiento visual de avance.
          </p>
        </div>

        {activeTab === 'docente' && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Agendar Práctica / Hito
          </button>
        )}
      </div>

      {/* Selector de Pestañas: Agenda Docente vs Calendario Escolar Oficial de Córdoba */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl shadow-xs overflow-hidden">
        <button
          onClick={() => setActiveTab('docente')}
          className={`flex-1 py-3 px-4 text-xs font-bold text-center border-b-2 transition flex items-center justify-center gap-2 ${
            activeTab === 'docente'
              ? 'border-emerald-600 text-emerald-900 bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sprout className="w-4 h-4 text-emerald-600" />
          Mi Agenda por Espacio Curricular ({hitos.length} actividades)
        </button>
        <button
          onClick={() => setActiveTab('institucional')}
          className={`flex-1 py-3 px-4 text-xs font-bold text-center border-b-2 transition flex items-center justify-center gap-2 ${
            activeTab === 'institucional'
              ? 'border-emerald-600 text-emerald-900 bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4 text-sky-600" />
          Cronograma del Ciclo Lectivo Oficial (Córdoba)
        </button>
      </div>

      {/* PESTAÑA 1: AGENDA DEL DOCENTE CON INDICADOR VISUAL */}
      {activeTab === 'docente' && (
        <div className="space-y-6">
          {/* Tarjeta de Métricas e Indicador Visual de Cumplimiento */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-3">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Progreso de Hitos y Prácticas en Campo
                </span>
                <div className="text-sm font-extrabold text-slate-800">
                  {metricas.completados} de {metricas.total} actividades completadas
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-emerald-700">{metricas.porcentaje}%</span>
                <span className="text-xs text-slate-500 ml-1">alcanzado</span>
              </div>
            </div>

            {/* Barra de Progreso */}
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200">
              <div
                className="bg-gradient-to-r from-emerald-600 to-teal-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${metricas.porcentaje}%` }}
              ></div>
            </div>
          </div>

          {/* Listado de Hitos y Actividades */}
          {loading ? (
            <div className="text-center py-10 text-xs text-slate-500">Cargando agenda...</div>
          ) : hitos.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500">
              No tienes actividades agendadas en este espacio. Haz clic en "Agendar Práctica / Hito" para planificar tus clases y labores de huerta.
            </div>
          ) : (
            <div className="space-y-3">
              {hitos.map((h) => {
                const tipoBadge = getTipoBadge(h.tipo);
                const TipoIcon = tipoBadge.icon;
                return (
                  <div
                    key={h.id}
                    onClick={() => handleToggleHito(h.id)}
                    className={`p-4 rounded-xl border transition cursor-pointer flex items-center justify-between gap-4 ${
                      h.completado
                        ? 'bg-emerald-50/50 border-emerald-200 opacity-90'
                        : 'bg-white border-slate-200 hover:border-emerald-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        className="mt-0.5 text-emerald-600 focus:outline-none"
                      >
                        {h.completado ? (
                          <CheckSquare className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-400" />
                        )}
                      </button>

                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border ${tipoBadge.bg}`}>
                            <TipoIcon className="w-3 h-3" />
                            {tipoBadge.label}
                          </span>
                          <span className="text-[11px] font-bold text-slate-500">
                            {h.fecha}
                          </span>
                        </div>
                        <h4 className={`text-xs font-bold ${h.completado ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                          {h.titulo}
                        </h4>
                        {h.descripcion && (
                          <p className="text-[11px] text-slate-500 mt-0.5">{h.descripcion}</p>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        h.completado ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {h.completado ? 'Cumplido' : 'Pendiente'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA 2: CRONOGRAMA OFICIAL DEL CICLO LECTIVO CÓRDOBA */}
      {activeTab === 'institucional' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-sm font-bold text-slate-900">
              Calendario Escolar Oficial del Ministerio de Educación de Córdoba
            </h3>
            <p className="text-xs text-slate-500">
              Períodos académicos, recesos e instancias obligatorias de evaluación.
            </p>
          </div>

          <div className="space-y-3">
            {cronograma.map((ev) => (
              <div key={ev.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800 uppercase">
                      {ev.tipo_evento.replace('_', ' ')}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900">{ev.titulo}</h4>
                  </div>
                  <p className="text-[11px] text-slate-600">{ev.descripcion}</p>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-emerald-800">{ev.fecha_inicio}</div>
                  {ev.fecha_fin && ev.fecha_fin !== ev.fecha_inicio && (
                    <div className="text-[10px] text-slate-500">al {ev.fecha_fin}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: AGENDAR NUEVA PRÁCTICA O HITO */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Agendar Actividad o Hito Evaluativo</h3>

            <form onSubmit={handleCreateHito} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Título de la Actividad</label>
                <input
                  type="text"
                  required
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej. Toma de muestras de suelo en canteros de huerta"
                  className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tipo de Actividad</label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg outline-none bg-white font-medium"
                >
                  <option value="practica_campo">Práctica en Entorno Formativo (Huerta/Campo/Vivero)</option>
                  <option value="hito_evaluativo">Hito Evaluativo</option>
                  <option value="entrega_proyecto">Entrega de Informe Técnico / Proyecto</option>
                  <option value="clase">Clase Teórico-Práctica</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Fecha Programada</label>
                <input
                  type="date"
                  required
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descripción / Objetivos</label>
                <textarea
                  rows={2}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Materiales requeridos, herramientas o criterios de observación..."
                  className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg shadow-xs"
                >
                  Guardar en Agenda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
