import { useState, useMemo } from 'react';
import AppLayout from "../components/layout/AppLayout.jsx";
import { useTorneos } from '../hooks/useTorneos.js';
import TournamentCard from '../components/Torneos/TournamentCard.jsx';

export default function TorneosPage() {
  const {
    torneos,
    loading,
    error,
    enrollInTournament,
    leaveTournament,
    refreshTorneos,
  } = useTorneos();
  const [processing, setProcessing] = useState({ id: null, action: null });

  const handleEnroll = async (tournament) => {
    setProcessing({ id: tournament.id, action: 'enroll' });
    try {
      await enrollInTournament(tournament.id);
    } finally {
      setProcessing({ id: null, action: null });
    }
  };

  const handleLeave = async (tournament) => {
    setProcessing({ id: tournament.id, action: 'leave' });
    try {
      await leaveTournament(tournament.id);
    } finally {
      setProcessing({ id: null, action: null });
    }
  };

  const orderedTorneos = useMemo(() => {
    const toTimestamp = (value) => {
      if (!value) return Number.MAX_SAFE_INTEGER;
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? Number.MAX_SAFE_INTEGER : date.getTime();
    };
    return [...torneos].sort((a, b) => toTimestamp(a.start) - toTimestamp(b.start));
  }, [torneos]);

  return (
    <AppLayout>
      <section className="rounded-2xl bg-white shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Torneos disponibles</h1>
            <p className="text-gray-600 mt-2 max-w-2xl">
              Descubre los torneos deportivos y culturales del CADI. Inscríbete como beneficiario para participar y
              recibir actualizaciones sobre fechas, sedes y cupos disponibles.
            </p>
          </div>
          <button
            type="button"
            onClick={refreshTorneos}
            className="self-start px-4 py-2 text-sm font-semibold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Actualizar
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p className="font-semibold">No pudimos cargar los torneos.</p>
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="space-y-4" role="status">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="animate-pulse rounded-xl border border-gray-200 bg-gray-50 p-6">
                <div className="mb-4 h-4 w-1/3 rounded bg-gray-200" />
                <div className="mb-2 h-3 w-full rounded bg-gray-200" />
                <div className="mb-2 h-3 w-5/6 rounded bg-gray-200" />
                <div className="h-3 w-2/3 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        ) : orderedTorneos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-500">
            Aún no hay torneos publicados. ¡Vuelve pronto para conocer las próximas convocatorias!
          </div>
        ) : (
          <div className="space-y-6">
            {orderedTorneos.map((torneo) => (
              <TournamentCard
                key={torneo.id}
                tournament={torneo}
                onEnroll={handleEnroll}
                onLeave={handleLeave}
                isProcessing={processing.id === torneo.id}
                processingAction={processing.id === torneo.id ? processing.action : null}
              />
            ))}
          </div>
        )}
      </section>
    </AppLayout>
  );
}
