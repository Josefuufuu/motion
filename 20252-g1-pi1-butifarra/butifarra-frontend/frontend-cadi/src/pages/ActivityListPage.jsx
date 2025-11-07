import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import { useActividades } from '../hooks/useActividades';
import { formatDate } from '../utils';
import '../styles/ActivityList.css'; // Import the CSS file

export default function ActivityListPage() {
  const location = useLocation();
  const { actividades, loading, error, listActividades } = useActividades();
  const [filters, setFilters] = useState({
    category: '',
    q: '',
    from: '',
    to: ''
  });

  // Load activities when component mounts or when location changes (redirected here)
  useEffect(() => {
    console.log("ActivityListPage mounted or location changed, loading activities...");
    listActividades();
  }, [listActividades, location.key]);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Apply filters
  const handleApplyFilters = () => {
    listActividades(filters);
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      category: '',
      q: '',
      from: '',
      to: ''
    });
    listActividades();
  };

  // Get category label
  const getCategoryLabel = (category) => {
    const categories = {
      'DEPORTE': 'Deporte',
      'CULTURA': 'Cultura',
      'BIENESTAR': 'Bienestar',
      'EVENTO': 'Evento',
      'OTRO': 'Otro'
    };
    return categories[category] || category;
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    const classes = {
      'active': 'badge-success',
      'cancelled': 'badge-danger',
      'finished': 'badge-secondary'
    };
    return classes[status] || 'badge-info';
  };

  return (
    <AppLayout>
      <div className="page-container">
        <header className="page-header">
          <h1>Actividades CADI</h1>
          <div className="header-actions">
            <Link to="/actividades/crear" className="btn btn-primary">
              <i className="fas fa-plus"></i> Nueva Actividad
            </Link>
          </div>
        </header>

        {/* Filter Section */}
        <div className="filter-section card mb-4">
          <div className="card-body">
            <h5 className="card-title">Filtros</h5>
            <div className="row">
              <div className="col-md-3 mb-2">
                <label htmlFor="category" className="form-label">Categoría</label>
                <select
                  id="category"
                  name="category"
                  className="form-select"
                  value={filters.category}
                  onChange={handleFilterChange}
                >
                  <option value="">Todas las categorías</option>
                  <option value="DEPORTE">Deporte</option>
                  <option value="CULTURA">Cultura</option>
                  <option value="BIENESTAR">Bienestar</option>
                  <option value="EVENTO">Evento</option>
                  <option value="OTRO">Otro</option>
                </select>
              </div>
              <div className="col-md-3 mb-2">
                <label htmlFor="from" className="form-label">Desde</label>
                <input
                  type="date"
                  id="from"
                  name="from"
                  className="form-control"
                  value={filters.from}
                  onChange={handleFilterChange}
                />
              </div>
              <div className="col-md-3 mb-2">
                <label htmlFor="to" className="form-label">Hasta</label>
                <input
                  type="date"
                  id="to"
                  name="to"
                  className="form-control"
                  value={filters.to}
                  onChange={handleFilterChange}
                />
              </div>
              <div className="col-md-3 mb-2">
                <label htmlFor="q" className="form-label">Buscar</label>
                <input
                  type="text"
                  id="q"
                  name="q"
                  className="form-control"
                  value={filters.q}
                  onChange={handleFilterChange}
                  placeholder="Título, lugar..."
                />
              </div>
            </div>
            <div className="filter-actions mt-3">
              <button className="btn btn-outline-secondary me-2" onClick={handleResetFilters}>
                Limpiar
              </button>
              <button className="btn btn-primary" onClick={handleApplyFilters}>
                Aplicar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Activities List */}
        <div className="activities-container">
          {loading ? (
            <div className="loading-spinner">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
              <p>Cargando actividades...</p>
            </div>
          ) : error ? (
            <div className="alert alert-danger" role="alert">
              Error al cargar actividades: {error}
            </div>
          ) : actividades.length === 0 ? (
            <div className="no-activities">
              <p>No hay actividades disponibles con los filtros seleccionados.</p>
              {(filters.category || filters.q || filters.from || filters.to) && (
                <button className="btn btn-link" onClick={handleResetFilters}>
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            <div className="activities-grid">
              {actividades.map(activity => (
                <div key={activity.id} className="activity-card">
                  <div className="activity-header">
                    <span className={`activity-badge ${getStatusBadgeClass(activity.status)}`}>
                      {activity.status === 'active' ? 'Activa' :
                       activity.status === 'cancelled' ? 'Cancelada' : 'Finalizada'}
                    </span>
                    <span className="activity-category">{getCategoryLabel(activity.category)}</span>
                  </div>
                  <h3 className="activity-title">{activity.title}</h3>
                  <div className="activity-details">
                    <p><i className="fas fa-map-marker-alt"></i> {activity.location}</p>
                    <p><i className="fas fa-calendar"></i> {formatDate(activity.start)}</p>
                    {activity.instructor && (
                      <p><i className="fas fa-chalkboard-teacher"></i> {activity.instructor}</p>
                    )}
                    <p><i className="fas fa-users"></i> {activity.available_spots} / {activity.capacity} cupos disponibles</p>
                  </div>
                  <div className="activity-tags">
                    {activity.tags && activity.tags.map((tag, index) => (
                      <span key={index} className="activity-tag">{tag}</span>
                    ))}
                  </div>
                  <div className="activity-footer">
                    <Link to={`/actividades/${activity.id}`} className="btn btn-outline-primary btn-sm">
                      Ver detalles
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
