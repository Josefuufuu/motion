import PropTypes from 'prop-types';
import { formatDate } from '../../utils.js';

const STATUS_LABELS = {
  planned: 'Planificado',
  ongoing: 'En curso',
  finished: 'Finalizado',
  cancelled: 'Cancelado',
};

const STATUS_BADGES = {
  planned: 'bg-blue-100 text-blue-700',
  ongoing: 'bg-green-100 text-green-700',
  finished: 'bg-gray-200 text-gray-600',
  cancelled: 'bg-red-100 text-red-700',
};

const ENROLLMENT_STATUS_LABELS = {
  pending: 'Pendiente',
  confirmed: 'Inscrito',
  cancelled: 'Cancelada',
};

const formatInscriptionRange = (tournament) => {
  if (!tournament.inscription_start && !tournament.inscription_end) {
    return 'Fecha no definida';
  }

  if (tournament.inscription_start && tournament.inscription_end) {
    return `${tournament.inscription_start} a ${tournament.inscription_end}`;
  }

  if (tournament.inscription_start) {
    return `Desde ${tournament.inscription_start}`;
  }

  return `Hasta ${tournament.inscription_end}`;
};

const isEnrollmentOpen = (tournament) => {
  const now = new Date();
  const start = tournament.inscription_start ? new Date(`${tournament.inscription_start}T00:00:00`) : null;
  const end = tournament.inscription_end ? new Date(`${tournament.inscription_end}T23:59:59`) : null;

  if (start && now < start) return false;
  if (end && now > end) return false;

  return !['finished', 'cancelled'].includes(tournament.status);
};

const getAvailableSlots = (tournament) => {
  if (typeof tournament.available_slots === 'number') {
    return tournament.available_slots;
  }
  if (!tournament.max_teams) {
    return null;
  }
  const remaining = Math.max(tournament.max_teams - (tournament.current_teams || 0), 0);
  return remaining;
};

const TournamentCard = ({ tournament, onEnroll, onLeave, isProcessing, processingAction }) => {
  const statusLabel = STATUS_LABELS[tournament.status] || tournament.status;
  const badgeClass = STATUS_BADGES[tournament.status] || 'bg-gray-100 text-gray-600';
  const enrollment = tournament.enrollment;
  const enrollmentStatus = enrollment?.status;
  const enrollmentLabel = enrollmentStatus ? ENROLLMENT_STATUS_LABELS[enrollmentStatus] || enrollmentStatus : null;
  const enrolled = Boolean(enrollment && enrollmentStatus !== 'cancelled');
  const availableSlots = getAvailableSlots(tournament);
  const hasCapacity = availableSlots === null || availableSlots > 0;
  const enrollmentOpen = isEnrollmentOpen(tournament);

  const capacityText = tournament.max_teams
    ? `${tournament.current_teams}/${tournament.max_teams} equipos inscritos`
    : `${tournament.current_teams} equipos inscritos`;
  const availableText = tournament.max_teams
    ? `${availableSlots ?? 0} cupos disponibles`
    : 'Cupos ilimitados';

  const enrollDisabled = !enrollmentOpen || !hasCapacity || enrolled || (isProcessing && processingAction === 'enroll');
  const leaveDisabled = !enrolled || (isProcessing && processingAction === 'leave');

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex flex-col gap-4 transition hover:shadow-md">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{tournament.name}</h2>
          <p className="text-sm text-gray-500">
            {tournament.sport || 'Multidisciplinario'} · Formato {tournament.format || 'Por definir'}
          </p>
        </div>
        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${badgeClass}`}>{statusLabel}</span>
      </div>

      {tournament.description && (
        <p className="text-gray-600 text-sm leading-relaxed">{tournament.description}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500 font-medium">Ubicación</p>
          <p className="text-gray-700">{tournament.location || 'Por definir'}</p>
        </div>
        <div>
          <p className="text-gray-500 font-medium">Fechas del torneo</p>
          <p className="text-gray-700">
            {formatDate(tournament.start)}
            <span className="text-gray-400"> → </span>
            {formatDate(tournament.end)}
          </p>
        </div>
        <div>
          <p className="text-gray-500 font-medium">Inscripciones</p>
          <p className="text-gray-700">{formatInscriptionRange(tournament)}</p>
        </div>
        <div>
          <p className="text-gray-500 font-medium">Aforo</p>
          <p className="text-gray-700">{capacityText}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="text-sm text-gray-600 space-y-1">
          <p className="font-medium text-gray-700">{availableText}</p>
          {enrollmentLabel && (
            <p className="text-blue-600 font-medium text-xs uppercase tracking-wide">
              Tu estado: {enrollmentLabel}
            </p>
          )}
          {!enrollmentOpen && (
            <p className="text-orange-600 font-medium text-xs uppercase tracking-wide">Inscripciones cerradas</p>
          )}
          {enrollmentOpen && !hasCapacity && (
            <p className="text-red-600 font-medium text-xs uppercase tracking-wide">Sin cupos disponibles</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onEnroll(tournament)}
            disabled={enrollDisabled || isProcessing}
            className={`px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              enrollDisabled || isProcessing
                ? 'bg-blue-200 text-white cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isProcessing && processingAction === 'enroll' ? 'Procesando…' : 'Inscribirme'}
          </button>
          <button
            type="button"
            onClick={() => onLeave(tournament)}
            disabled={leaveDisabled || isProcessing}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 ${
              leaveDisabled || isProcessing
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {isProcessing && processingAction === 'leave' ? 'Procesando…' : 'Cancelar inscripción'}
          </button>
        </div>
      </div>
    </div>
  );
};

TournamentCard.propTypes = {
  tournament: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    sport: PropTypes.string,
    format: PropTypes.string,
    description: PropTypes.string,
    location: PropTypes.string,
    start: PropTypes.string,
    end: PropTypes.string,
    inscription_start: PropTypes.string,
    inscription_end: PropTypes.string,
    visibility: PropTypes.string,
    status: PropTypes.string.isRequired,
    max_teams: PropTypes.number,
    current_teams: PropTypes.number,
    available_slots: PropTypes.number,
    enrollment: PropTypes.shape({
      status: PropTypes.string,
    }),
  }).isRequired,
  onEnroll: PropTypes.func.isRequired,
  onLeave: PropTypes.func.isRequired,
  isProcessing: PropTypes.bool,
  processingAction: PropTypes.oneOf([null, 'enroll', 'leave']),
};

TournamentCard.defaultProps = {
  isProcessing: false,
  processingAction: null,
};

export default TournamentCard;
