import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout.jsx';
import { useActividades } from '../hooks/useActividades.js';
import { formatDate } from '../utils.js';
import { Calendar as CalendarIcon, MapPin, Clock, Users, Tag as TagIcon, Eye } from 'lucide-react';

const CATEGORY_LABELS = {
  DEPORTE: 'Deporte',
  CULTURA: 'Cultura',
  BIENESTAR: 'Bienestar',
  EVENTO: 'Evento',
  OTRO: 'Otro',
};

export default function ActivityDetailPage() {
  const { id } = useParams();
  const { getActividad, loading, error } = useActividades();
  const [activity, setActivity] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const data = await getActividad(id);
      if (!isMounted) return;
      if (data) { setActivity(data); setNotFound(false); } else { setActivity(null); setNotFound(true); }
    })();
    return () => { isMounted = false; };
  }, [id, getActividad]);

  const Header = () => (
    <header className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Detalle de actividad</h1>
        <p className="text-sm text-slate-500">Consulta la información detallada de la actividad seleccionada</p>
      </div>
      <Link to="/actividades" className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
        ← Volver al listado
      </Link>
    </header>
  );

  const Content = () => {
    if (loading && !activity) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
          <p className="mt-3 text-sm">Cargando información de la actividad...</p>
        </div>
      );
    }
    if (error) {
      return <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">Error al cargar la actividad: {error}</div>;
    }
    if (notFound || !activity) {
      return <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">No se encontró la actividad solicitada.</div>;
    }

    const {
      title,
      description,
      category,
      location,
      start,
      end,
      instructor,
      capacity,
      available_spots,
      status,
      tags,
      visibility,
    } = activity;

    return (
      <section className="space-y-6">
        {/* Hero card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-700">
                  <CalendarIcon className="h-3.5 w-3.5" /> {CATEGORY_LABELS[category] || category || 'Sin categoría'}
                </span>
                {status && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 uppercase">{status}</span>
                )}
                {visibility && (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 uppercase">{visibility}</span>
                )}
              </div>
              <h2 className="mt-3 text-2xl font-semibold text-slate-900">{title}</h2>
              {description && (
                <p className="mt-2 max-w-3xl text-slate-600 whitespace-pre-line">{description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Info grid */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Detalles</h3>
            <div className="space-y-2 text-sm text-slate-700">
              <div className="flex items-center"><MapPin className="mr-2 h-4 w-4 text-violet-600" /> <span><span className="font-medium">Lugar:</span> {location || 'Por definir'}</span></div>
              <div className="flex items-center"><Clock className="mr-2 h-4 w-4 text-violet-600" /> <span><span className="font-medium">Inicio:</span> {formatDate(start) || 'No definido'}</span></div>
              <div className="flex items-center"><Clock className="mr-2 h-4 w-4 text-violet-600" /> <span><span className="font-medium">Fin:</span> {formatDate(end) || 'No definido'}</span></div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Participación</h3>
            <div className="space-y-2 text-sm text-slate-700">
              <div className="flex items-center"><Users className="mr-2 h-4 w-4 text-violet-600" /> <span><span className="font-medium">Cupo total:</span> {capacity ?? 'No definido'}</span></div>
              <div className="flex items-center"><Users className="mr-2 h-4 w-4 text-violet-600" /> <span><span className="font-medium">Cupos disponibles:</span> {available_spots ?? 'No definido'}</span></div>
              {instructor && (
                <div className="flex items-center"><Eye className="mr-2 h-4 w-4 text-violet-600" /> <span><span className="font-medium">Instructor:</span> {instructor}</span></div>
              )}
            </div>
          </div>
        </div>

        {Array.isArray(tags) && tags.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Etiquetas</h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <span key={`${tag}-${index}`} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
                  <TagIcon className="h-3.5 w-3.5 text-violet-600" /> {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <Header />
        <Content />
      </div>
    </AppLayout>
  );
}
