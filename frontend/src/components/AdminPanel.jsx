import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Shield,
  UserCheck,
  UserX,
  FileText,
  Calendar,
  Upload,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Trash2
} from 'lucide-react';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('usuarios'); // 'usuarios' | 'normativas' | 'cronograma'
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [normativas, setNormativas] = useState([]);
  const [cronograma, setCronograma] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Form states for Normativas
  const [normTitulo, setNormTitulo] = useState('');
  const [normTipo, setNormTipo] = useState('resolucion');
  const [normNumero, setNormNumero] = useState('');
  const [normUrl, setNormUrl] = useState('');
  const [normDesc, setNormDesc] = useState('');

  // Form states for Cronograma
  const [cronoTitulo, setCronoTitulo] = useState('');
  const [cronoTipo, setCronoTipo] = useState('academico');
  const [cronoInicio, setCronoInicio] = useState('');
  const [cronoFin, setCronoFin] = useState('');
  const [cronoDesc, setCronoDesc] = useState('');

  useEffect(() => {
    loadAllAdminData();
  }, [activeTab]);

  const loadAllAdminData = async () => {
    setLoading(true);
    if (activeTab === 'usuarios') {
      const pending = await api.getPendingUsers();
      const all = await api.getAllUsers();
      setPendingUsers(pending);
      setAllUsers(all);
    } else if (activeTab === 'normativas') {
      const norms = await api.getNormativas();
      setNormativas(norms);
    } else if (activeTab === 'cronograma') {
      const events = await api.getCronograma();
      setCronograma(events);
    }
    setLoading(false);
  };

  const handleUpdateUserStatus = async (userId, estado) => {
    try {
      await api.updateUserStatus(userId, estado);
      setFeedbackMsg(`Usuario ${estado === 'aprobado' ? 'aprobado' : 'rechazado'} con éxito.`);
      await loadAllAdminData();
      setTimeout(() => setFeedbackMsg(''), 4000);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleCreateNormativa = async (e) => {
    e.preventDefault();
    if (!normTitulo) return;
    try {
      await api.uploadNormativa({
        titulo: normTitulo,
        tipo: normTipo,
        resolucion_numero: normNumero,
        url_oficial: normUrl,
        descripcion: normDesc
      });
      setFeedbackMsg('Documento normativo cargado exitosamente.');
      setNormTitulo('');
      setNormNumero('');
      setNormUrl('');
      setNormDesc('');
      await loadAllAdminData();
      setTimeout(() => setFeedbackMsg(''), 4000);
    } catch (err) {
      alert('Error cargando normativa: ' + err.message);
    }
  };

  const handleCreateCronograma = async (e) => {
    e.preventDefault();
    if (!cronoTitulo || !cronoInicio) return;
    try {
      await api.saveCronogramaEvento({
        titulo: cronoTitulo,
        tipo_evento: cronoTipo,
        fecha_inicio: cronoInicio,
        fecha_fin: cronoFin || cronoInicio,
        descripcion: cronoDesc,
        anio_lectivo: 2026
      });
      setFeedbackMsg('Evento agregado al cronograma escolar con éxito.');
      setCronoTitulo('');
      setCronoInicio('');
      setCronoFin('');
      setCronoDesc('');
      await loadAllAdminData();
      setTimeout(() => setFeedbackMsg(''), 4000);
    } catch (err) {
      alert('Error en cronograma: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner de Administración General */}
      <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-emerald-950 rounded-2xl p-6 sm:p-8 text-white shadow-md">
        <div className="inline-flex items-center gap-2 bg-amber-800/80 px-3 py-1 rounded-full text-xs text-amber-200 font-semibold mb-3 border border-amber-700">
          <Shield className="w-4 h-4 text-amber-300" />
          Consola Central del Administrador
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Gestión Institucional: IPEM N° 349 "Giovanni Bosco"
        </h2>
        <p className="text-xs sm:text-sm text-amber-100 mt-2 max-w-3xl leading-relaxed">
          Aprueba o rechaza solicitudes de nuevos docentes y directivos, actualiza los Diseños Curriculares y Resoluciones Ministeriales de Córdoba, y gestiona el Cronograma Oficial del Ciclo Lectivo.
        </p>
      </div>

      {/* Selector de Pestañas de Administración */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl shadow-xs overflow-hidden">
        <button
          onClick={() => setActiveTab('usuarios')}
          className={`flex-1 py-3 px-4 text-xs font-bold text-center border-b-2 transition flex items-center justify-center gap-2 ${
            activeTab === 'usuarios'
              ? 'border-amber-600 text-amber-900 bg-amber-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4 text-amber-600" />
          Aprobación de Usuarios ({pendingUsers.length})
        </button>
        <button
          onClick={() => setActiveTab('normativas')}
          className={`flex-1 py-3 px-4 text-xs font-bold text-center border-b-2 transition flex items-center justify-center gap-2 ${
            activeTab === 'normativas'
              ? 'border-amber-600 text-amber-900 bg-amber-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4 text-emerald-600" />
          Normativas & Diseños Curriculares
        </button>
        <button
          onClick={() => setActiveTab('cronograma')}
          className={`flex-1 py-3 px-4 text-xs font-bold text-center border-b-2 transition flex items-center justify-center gap-2 ${
            activeTab === 'cronograma'
              ? 'border-amber-600 text-amber-900 bg-amber-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4 text-sky-600" />
          Cronograma del Ciclo Lectivo
        </button>
      </div>

      {feedbackMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {feedbackMsg}
        </div>
      )}

      {/* TAB 1: GESTIÓN DE USUARIOS Y APROBACIÓN */}
      {activeTab === 'usuarios' && (
        <div className="space-y-6">
          {/* Solicitudes Pendientes (Prioritario) */}
          <div className="bg-white rounded-xl border border-amber-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-700" />
                <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                  Solicitudes Pendientes de Aprobación ({pendingUsers.length})
                </h3>
              </div>
              <span className="text-[11px] text-amber-800 font-medium">
                Ningún usuario puede acceder al sistema sin la aprobación del Administrador.
              </span>
            </div>

            {pendingUsers.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No hay solicitudes pendientes en este momento. Todas las cuentas registradas han sido procesadas.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Docente / Solicitante</th>
                      <th className="py-3 px-4">DNI</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Rol Solicitado</th>
                      <th className="py-3 px-4">Cargo / Materia</th>
                      <th className="py-3 px-4 text-right">Decisión</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {pendingUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-amber-50/40 transition">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {u.nombre} {u.apellido}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">{u.dni}</td>
                        <td className="py-3.5 px-4 text-slate-600">{u.email}</td>
                        <td className="py-3.5 px-4">
                          <span className="capitalize px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            {u.rol}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">{u.cargo_descripcion}</td>
                        <td className="py-3.5 px-4 text-right space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateUserStatus(u.id, 'aprobado')}
                            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-2xs transition inline-flex items-center gap-1"
                          >
                            <UserCheck className="w-3.5 h-3.5" /> Aprobar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateUserStatus(u.id, 'rechazado')}
                            className="px-2.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-xs font-bold transition inline-flex items-center gap-1"
                          >
                            <UserX className="w-3.5 h-3.5" /> Rechazar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Listado General de Usuarios */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Padrón General de Usuarios del IPEM 349 ({allUsers.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">Usuario</th>
                    <th className="py-2.5 px-4">DNI</th>
                    <th className="py-2.5 px-4">Email</th>
                    <th className="py-2.5 px-4">Rol</th>
                    <th className="py-2.5 px-4">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {allUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-semibold text-slate-900">{u.nombre} {u.apellido}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{u.dni}</td>
                      <td className="py-3 px-4 text-slate-600">{u.email}</td>
                      <td className="py-3 px-4 capitalize font-medium text-slate-700">{u.rol}</td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          u.estado === 'aprobado'
                            ? 'bg-emerald-100 text-emerald-800'
                            : u.estado === 'rechazado'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {u.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GESTIÓN DE NORMATIVAS Y DISEÑOS CURRICULARES */}
      {activeTab === 'normativas' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario de Carga */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs h-fit space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Upload className="w-4 h-4 text-emerald-700" />
              Publicar Normativa o Diseño
            </h3>

            <form onSubmit={handleCreateNormativa} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Título del Documento</label>
                <input
                  type="text"
                  required
                  value={normTitulo}
                  onChange={(e) => setNormTitulo(e.target.value)}
                  placeholder="Ej. Diseño Curricular Agro y Ambiente 2026"
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Tipo de Documento</label>
                <select
                  value={normTipo}
                  onChange={(e) => setNormTipo(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg outline-none bg-white font-medium"
                >
                  <option value="diseno_curricular">Diseño Curricular Provincial</option>
                  <option value="resolucion">Resolución Ministerial / Disposición</option>
                  <option value="regimen_academico">Régimen Académico</option>
                  <option value="progresion">Progresión de Aprendizajes</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Número de Resolución</label>
                <input
                  type="text"
                  value={normNumero}
                  onChange={(e) => setNormNumero(e.target.value)}
                  placeholder="Ej. Res. Min. 251/14"
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Enlace Oficial de Córdoba</label>
                <input
                  type="url"
                  value={normUrl}
                  onChange={(e) => setNormUrl(e.target.value)}
                  placeholder="http://www.igualdadycalidadcba.gov.ar/..."
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Descripción Breve</label>
                <textarea
                  rows={2}
                  value={normDesc}
                  onChange={(e) => setNormDesc(e.target.value)}
                  placeholder="Objetivo y alcance de la normativa para docentes..."
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs transition"
              >
                Guardar Documento en Repositorio
              </button>
            </form>
          </div>

          {/* Listado de Normativas Existentes */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Documentos Disponibles para los Docentes ({normativas.length})
            </h3>
            <div className="space-y-3">
              {normativas.map((n) => (
                <div key={n.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        {n.tipo.replace('_', ' ')}
                      </span>
                      {n.resolucion_numero && (
                        <span className="text-[10px] font-mono font-semibold text-slate-500">
                          {n.resolucion_numero}
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-slate-900">{n.titulo}</h4>
                    <p className="text-[11px] text-slate-500 mt-1">{n.descripcion}</p>
                    {n.organismo && (
                      <div className="text-[10px] text-slate-400 mt-1">{n.organismo}</div>
                    )}
                  </div>
                  {n.url_oficial && (
                    <a
                      href={n.url_oficial}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition shrink-0"
                    >
                      <ExternalLink className="w-3 h-3 text-slate-500" />
                      Ver Oficial
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GESTIÓN DEL CRONOGRAMA ESCOLAR */}
      {activeTab === 'cronograma' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario para agregar evento */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs h-fit space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Plus className="w-4 h-4 text-sky-700" />
              Nuevo Hito en el Ciclo Lectivo
            </h3>

            <form onSubmit={handleCreateCronograma} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Título del Hito</label>
                <input
                  type="text"
                  required
                  value={cronoTitulo}
                  onChange={(e) => setCronoTitulo(e.target.value)}
                  placeholder="Ej. Coloquios de Diciembre"
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Tipo de Evento</label>
                <select
                  value={cronoTipo}
                  onChange={(e) => setCronoTipo(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg outline-none bg-white font-medium"
                >
                  <option value="inicio_clases">Inicio de Clases</option>
                  <option value="receso">Receso Escolar (Vacaciones)</option>
                  <option value="evaluacion">Período de Evaluación / Coloquios</option>
                  <option value="academico">Jornada Pedagógica / Institucional</option>
                  <option value="cierre">Cierre de Ciclo</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Fecha Inicio</label>
                  <input
                    type="date"
                    required
                    value={cronoInicio}
                    onChange={(e) => setCronoInicio(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Fecha Fin</label>
                  <input
                    type="date"
                    value={cronoFin}
                    onChange={(e) => setCronoFin(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Descripción</label>
                <textarea
                  rows={2}
                  value={cronoDesc}
                  onChange={(e) => setCronoDesc(e.target.value)}
                  placeholder="Detalles del período escolar..."
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-sky-700 hover:bg-sky-800 text-white rounded-lg text-xs font-bold shadow-xs transition"
              >
                Agregar al Cronograma Institucional
              </button>
            </form>
          </div>

          {/* Listado del Cronograma */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Cronograma Ciclo Lectivo Córdoba ({cronograma.length} hitos cargados)
            </h3>
            <div className="space-y-2.5">
              {cronograma.map((ev) => (
                <div key={ev.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800">
                        {ev.tipo_evento.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{ev.titulo}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">{ev.descripcion}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-emerald-800">{ev.fecha_inicio}</div>
                    {ev.fecha_fin && ev.fecha_fin !== ev.fecha_inicio && (
                      <div className="text-[10px] text-slate-400">al {ev.fecha_fin}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

