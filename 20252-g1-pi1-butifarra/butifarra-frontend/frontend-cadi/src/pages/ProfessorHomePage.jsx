import React, { useEffect } from 'react';
import AppLayout from '../components/layout/AppLayout.jsx';
import { useActividades } from '../hooks/useActividades.js';
import { useAuth } from '../context/AuthContext.jsx';
import { ClipboardList, CalendarDays, Users, FileText, PenSquare } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const metrics = (count) => [
  { title: 'Actividades asignadas', value: String(count ?? 0), tone: 'text-blue-600', Icon: ClipboardList },
  { title: 'Asistentes totales (hoy)', value: '—', tone: 'text-emerald-600', Icon: Users },
  { title: 'Próximas 24h', value: '—', tone: 'text-violet-600', Icon: CalendarDays },
  { title: 'Notas recientes', value: '—', tone: 'text-amber-600', Icon: FileText },
];

export default function ProfessorHomePage() {
  const { actividades, listActividades } = useActividades();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { listActividades({ mine_prof: true }); }, [listActividades]);

  const profName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.username || 'Profesor';

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Hero */}
        <section className="rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 p-6 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <PenSquare size={20} />
            <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-medium uppercase tracking-wide">Panel del Profesor</span>
          </div>
          <h1 className="mt-2 text-3xl font-semibold">Bienvenido, {profName}</h1>
          <p className="mt-3 max-w-2xl text-sm text-indigo-100">Gestiona tus actividades asignadas, registra asistencia y añade observaciones.</p>
          <div className="mt-4 flex gap-3">
            <button onClick={() => navigate('/calendario')} className="rounded-full bg-white/90 px-4 py-2 text-indigo-700 font-medium hover:bg-white">
              Ver calendario
            </button>
            <button onClick={() => navigate('/profesor/actividades')} className="rounded-full bg-white/90 px-4 py-2 text-indigo-700 font-medium hover:bg-white">
              Mis actividades
            </button>
          </div>
        </section>

        {/* Métricas */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics(actividades?.length).map(({ title, value, tone, Icon }) => (
            <div key={title} className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">{title}</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-800">{value}</p>
                </div>
                <span className="rounded-full bg-violet-100 p-2 text-violet-600">
                  <Icon className="size-5" />
                </span>
              </div>
            </div>
          ))}
        </section>

        {/* Acciones rápidas */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800">⚡ Acciones rápidas</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <button onClick={() => navigate('/profesor/actividades')} className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-left hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-sm transition">
              <ClipboardList className="text-violet-600" />
              <div>
                <div className="font-semibold text-slate-800">Ver mis actividades</div>
                <div className="text-sm text-slate-500">Consulta la lista de sesiones a tu cargo</div>
              </div>
            </button>
            <button onClick={() => navigate('/calendario')} className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-left hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-sm transition">
              <CalendarDays className="text-violet-600" />
              <div>
                <div className="font-semibold text-slate-800">Ir al calendario</div>
                <div className="text-sm text-slate-500">Visualiza próximas sesiones</div>
              </div>
            </button>
            <button onClick={() => navigate('/perfil')} className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-left hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-sm transition">
              <FileText className="text-violet-600" />
              <div>
                <div className="font-semibold text-slate-800">Actualizar perfil</div>
                <div className="text-sm text-slate-500">Contactos y preferencia de notificaciones</div>
              </div>
            </button>
          </div>
        </section>

        {/* Tabla de asignadas */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Mis actividades asignadas</h2>
            <Link to="/profesor/actividades" className="text-sm font-medium text-violet-600 hover:text-violet-700">Ver todas →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-slate-600">
                  <th className="p-2 text-left">Título</th>
                  <th className="p-2 text-left">Categoría</th>
                  <th className="p-2 text-left">Inicio</th>
                  <th className="p-2 text-left">Estado</th>
                  <th className="p-2 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {(!actividades || actividades.length === 0) && (
                  <tr><td className="p-4 text-slate-500" colSpan={5}>No tienes actividades asignadas.</td></tr>
                )}
                {actividades && actividades.slice(0, 8).map(a => (
                  <tr key={a.id} className="border-b hover:bg-slate-50">
                    <td className="p-2">{a.title}</td>
                    <td className="p-2">{a.category}</td>
                    <td className="p-2">{new Date(a.start).toLocaleString()}</td>
                    <td className="p-2">{a.status}</td>
                    <td className="p-2">
                      <Link to={`/actividades/${a.id}`} className="text-violet-600 hover:underline">Abrir</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
