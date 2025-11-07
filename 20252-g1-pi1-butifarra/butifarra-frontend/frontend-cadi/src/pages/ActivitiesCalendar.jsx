import React, { useState, useEffect, useMemo } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { es } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Sidebar } from "../components/Sidebar/Sidebar";
import { TopBar } from "../components/Dashboard/TopBar";
import AnimatedContainer from "../components/ui/AnimatedContainer.jsx";
import { Search, Filter, Star, MapPin, Clock, Users, Tag, X } from "lucide-react";
import { useActividades } from "../hooks/useActividades";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

// Configuración del localizador para fechas en español
const locales = { 'es': es };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Categorías disponibles para filtros
const categories = [
  "DEPORTE",
  "CULTURA",
  "BIENESTAR",
  "EVENTO",
  "OTRO"
];

export default function ActivitiesCalendar() {
  // Estados
  const [view, setView] = useState("month");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Hooks
  const { actividades, loading, error, listActividades } = useActividades();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  // Convertir actividades de la API al formato del calendario - use useMemo to prevent recalculation on every render
  const calendarActivities = useMemo(() => {
    return actividades.map(activity => ({
      id: activity.id,
      title: activity.title,
      start: new Date(activity.start),
      end: new Date(activity.end),
      location: activity.location,
      description: activity.description,
      category: activity.category,
      registerUrl: `/actividades/${activity.id}`,
      availableSpots: activity.available_spots,
      instructor: activity.instructor,
      isFavorite: false,
      allDay: false
    }));
  }, [actividades]);  // Only recalculate when actividades changes

  // Cargar actividades al montar el componente
  useEffect(() => {
    console.log("Loading activities for calendar...");
    listActividades();
  }, [listActividades]);

  // Filtrar actividades según categorías seleccionadas y término de búsqueda
  const filteredActivities = useMemo(() => {
    let filtered = [...calendarActivities];

    if (selectedCategories.length > 0) {
      filtered = filtered.filter(activity => selectedCategories.includes(activity.category));
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(activity =>
        activity.title.toLowerCase().includes(searchLower) ||
        (activity.description && activity.description.toLowerCase().includes(searchLower)) ||
        (activity.location && activity.location.toLowerCase().includes(searchLower))
      );
    }

    return filtered;
  }, [calendarActivities, selectedCategories, searchTerm]);  // Dependencies for the filtering logic

  // Manejadores de eventos
  const handleCategoryToggle = (category) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSelectEvent = (event) => {
    setSelectedActivity(event);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedActivity(null);
    setShowModal(false);
  };

  const handleRegister = (url) => {
    window.location.href = url;
  };

  const toggleFavorite = (id) => {
    // This is a placeholder - implement your favorite toggle functionality here
    console.log(`Toggle favorite for activity: ${id}`);
  };

  // Estilización de eventos en el calendario
  const eventStyleGetter = (event) => {
    const isPast = new Date(event.end) < new Date();
    const style = {
      backgroundColor: isPast ? '#CBD5E0' : '#3182CE',
      opacity: isPast ? 0.7 : 1,
      color: '#FFF',
      border: '0',
      borderRadius: '4px',
      padding: '2px 5px',
      fontSize: '90%',
      cursor: isPast ? 'default' : 'pointer',
    };
    return {
      style,
      className: isPast ? 'past-event' : ''
    };
  };

  return (
    <main
      style={{ display: "grid", gridTemplateColumns: "230px 1fr" }}
      className="h-screen w-screen overflow-x-hidden"
    >
      <Sidebar />
      <div className="h-full overflow-y-auto bg-stone-50">
        <TopBar />
        <AnimatedContainer as="section" role="main" className="p-6 md:p-8 space-y-8" variant="fade-up">
          {/* Encabezado */}
          <AnimatedContainer as="header" className="space-y-1" variant="fade">
            <h1 className="text-2xl font-bold text-gray-900">Calendario de Actividades</h1>
            <p className="text-sm text-gray-500">
              Visualiza y regístrate en las actividades programadas por Bienestar Universitario
            </p>
          </AnimatedContainer>

          {/* Barra de búsqueda y filtros */}
          <AnimatedContainer
            as="div"
            className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-200"
            variant="fade-up"
            delay={0.05}
          >
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar actividades..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-10 w-full border border-gray-300 rounded-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:flex-none">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter size={18} className="text-gray-400" />
                </div>
                <select
                  value={selectedCategories}
                  onChange={(e) => setSelectedCategories(Array.from(e.target.selectedOptions, option => option.value))}
                  multiple
                  className="pl-10 border border-gray-300 rounded-md py-2 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white appearance-none w-full"
                >
                  {categories.map((category, index) => (
                    <option key={index} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  value={view}
                  onChange={(e) => setView(e.target.value)}
                  className="border border-gray-300 rounded-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="month">Vista Mensual</option>
                  <option value="week">Vista Semanal</option>
                  <option value="day">Vista Diaria</option>
                </select>
              </div>
            </div>
          </AnimatedContainer>

          {/* Calendario */}
          <AnimatedContainer
            as="div"
            className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 h-[calc(100vh-300px)]"
            variant="fade-up"
            delay={0.1}
          >
            <Calendar
              localizer={localizer}
              events={filteredActivities}
              startAccessor="start"
              endAccessor="end"
              onSelectEvent={handleSelectEvent}
              views={['month', 'week', 'day']}
              view={view}
              onView={(newView) => setView(newView)}
              eventPropGetter={eventStyleGetter}
              messages={{
                previous: 'Anterior',
                next: 'Siguiente',
                today: 'Hoy',
                month: 'Mes',
                week: 'Semana',
                day: 'Día',
                noEventsInRange: 'No hay actividades en este período',
              }}
              className="h-full"
            />
          </AnimatedContainer>
        </AnimatedContainer>

        {/* Modal de detalles */}
        {showModal && selectedActivity && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-bold text-gray-900">{selectedActivity.title}</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleFavorite(selectedActivity.id)}
                      className="text-gray-500 hover:text-yellow-500 focus:outline-none"
                      title={selectedActivity.isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
                    >
                      <Star className={selectedActivity.isFavorite ? "fill-yellow-500 text-yellow-500" : ""} size={20} />
                    </button>
                    <button
                      onClick={closeModal}
                      className="text-gray-500 hover:text-red-500 focus:outline-none"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-gray-600">{selectedActivity.description}</p>

                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock size={16} className="mr-2" />
                      <span>
                        {format(new Date(selectedActivity.start), 'EEEE d MMMM, HH:mm', {locale: es})} -
                        {format(new Date(selectedActivity.end), ' HH:mm', {locale: es})}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin size={16} className="mr-2" />
                      <span>{selectedActivity.location}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Users size={16} className="mr-2" />
                      <span>Instructor: {selectedActivity.instructor}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Tag size={16} className="mr-2" />
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {selectedActivity.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-200 pt-4 mt-4">
                    <span className={`text-sm font-medium ${selectedActivity.availableSpots > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedActivity.availableSpots > 0
                        ? `${selectedActivity.availableSpots} cupos disponibles`
                        : 'No hay cupos disponibles'}
                    </span>
                    <button
                      onClick={() => handleRegister(selectedActivity.registerUrl)}
                      disabled={selectedActivity.availableSpots <= 0 || new Date(selectedActivity.end) < new Date()}
                      className={`px-4 py-2 rounded-md text-sm font-medium focus:outline-none 
                        ${selectedActivity.availableSpots > 0 && new Date(selectedActivity.end) >= new Date()
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                    >
                      {new Date(selectedActivity.end) < new Date()
                        ? 'Actividad finalizada'
                        : selectedActivity.availableSpots <= 0
                          ? 'Sin cupos'
                          : 'Inscribirme'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
