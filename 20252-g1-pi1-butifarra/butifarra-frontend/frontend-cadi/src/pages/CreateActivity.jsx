import React, { useState, useRef, useEffect } from 'react';
import AppLayout from '../components/layout/AppLayout.jsx';
import { useActividades } from '../hooks/useActividades.js';
import { combineDateTime } from '../utils.js';
import { useNavigate } from 'react-router-dom';

export default function CreateActivity() {
  const navigate = useNavigate();
  const { createActividad, loading, error } = useActividades();

  const initialFormState = {
    titulo: '', tipo: '', fecha: '', lugar: '',
    hora_inicio: '', hora_fin: '', descripcion: '',
    cupo: 0, instructor: '', visibility: 'public',
    status: 'active', tags: '',
  };
  const [formData, setFormData] = useState(initialFormState);
  const [imagePreview, setImagePreview] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [professors, setProfessors] = useState([]);
  const [loadingProfessors, setLoadingProfessors] = useState(false);
  const formRef = useRef(null);

  useEffect(() => {
    const loadProfessors = async () => {
      setLoadingProfessors(true);
      try {
        const resp = await fetch('/api/professors/', { credentials: 'include' });
        if (resp.ok) {
          const data = await resp.json();
          setProfessors(data);
        }
      } catch (err) {
        console.error('No se pudieron cargar profesores', err);
      } finally { setLoadingProfessors(false); }
    };
    loadProfessors();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));

    // Clear error for this field when user updates it
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview(null);
    }
  };

  const handleReset = () => {
    setFormData(initialFormState);
    setImagePreview(null);
    setFormErrors({});
    if (formRef.current) {
      formRef.current.reset();
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.titulo?.trim()) errors.titulo = 'El título es obligatorio';
    if (!formData.tipo) errors.tipo = 'Selecciona una categoría';
    if (!formData.fecha) errors.fecha = 'La fecha es obligatoria';
    if (!formData.hora_inicio) errors.hora_inicio = 'La hora de inicio es obligatoria';
    if (!formData.hora_fin) errors.hora_fin = 'La hora de fin es obligatoria';
    if (!formData.lugar?.trim()) errors.lugar = 'El lugar es obligatorio';
    if (Number.isNaN(Number(formData.cupo)) || Number(formData.cupo) < 0) {
      errors.cupo = 'El cupo debe ser un valor positivo';
    }

    if (formData.fecha && formData.hora_inicio && formData.hora_fin) {
      const start = new Date(`${formData.fecha}T${formData.hora_inicio}`);
      const end = new Date(`${formData.fecha}T${formData.hora_fin}`);
      if (end <= start) {
        errors.hora_fin = 'La hora de fin debe ser posterior a la hora de inicio';
      }
    }

    setFormErrors(errors);
    return errors;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    console.log('CreateActivity.handleSubmit called with data:', formData);

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      console.warn('Validation errors:', errors);
      return;
    }

    try {
      const tagsArray = formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [];
      const activityData = {
        title: formData.titulo,
        category: formData.tipo,
        description: formData.descripcion,
        location: formData.lugar,
        start: combineDateTime(formData.fecha, formData.hora_inicio),
        end: combineDateTime(formData.fecha, formData.hora_fin),
        capacity: parseInt(formData.cupo) || 0,
        available_spots: parseInt(formData.cupo) || 0,
        instructor: formData.instructor,
        visibility: formData.visibility || 'public',
        status: formData.status || 'active',
        tags: tagsArray,
        assigned_professor: formData.assigned_professor || null,
      };
      console.log('Submitting activity data:', activityData);

      await createActividad(activityData);
      handleReset();
      alert('Actividad creada exitosamente!');
      setTimeout(() => navigate('/actividades'), 500);
    } catch (err) {
      console.error('Error details on submit:', err);
      alert('No se pudo crear la actividad: ' + (err?.message || 'Error desconocido'));
      if (err.response && err.response.data) {
        setFormErrors(err.response.data);
      }
    }
  };

  return (
    <AppLayout>
      <div className="page-container" style={{ margin: 0, maxWidth: '100%', padding: 0 }}>
        <header className="page-header">
          <h1>Crear nueva actividad</h1>
          <p>Completa los detalles de la nueva actividad CADI</p>
        </header>
        <div className="create-activity-layout">
          <div className="form-column">
            <div className="form-card">
              <form id="create-activity-form" ref={formRef} className="form-grid" onSubmit={handleSubmit}>

                  <div className="form-field">
                    <label htmlFor="titulo">Título de la actividad</label>
                    <input
                      id="titulo"
                      name="titulo"
                      value={formData.titulo}
                      onChange={handleInputChange}
                      required
                      placeholder="Ej. Torneo de Ajedrez"
                      className={formErrors.titulo ? 'error' : ''}
                    />
                    {formErrors.titulo && <div className="error-message">{formErrors.titulo}</div>}
                  </div>

                  <div className="form-field">
                    <label htmlFor="tipo">Tipo / Categoría</label>
                    <select
                      id="tipo"
                      name="tipo"
                      value={formData.tipo}
                      onChange={handleInputChange}
                      required
                      className={formErrors.tipo ? 'error' : ''}
                    >
                      <option value="">Selecciona...</option>
                      <option value="DEPORTE">Deporte</option>
                      <option value="CULTURA">Cultura</option>
                      <option value="BIENESTAR">Salud/PSU</option>
                      <option value="EVENTO">Evento</option>
                      <option value="OTRO">Otro</option>
                    </select>
                    {formErrors.tipo && <div className="error-message">{formErrors.tipo}</div>}
                  </div>

                  <div className="form-field">
                    <label htmlFor="fecha">Fecha</label>
                    <input
                      id="fecha"
                      name="fecha"
                      type="date"
                      value={formData.fecha}
                      onChange={handleInputChange}
                      required
                      className={formErrors.fecha ? 'error' : ''}
                    />
                    {formErrors.fecha && <div className="error-message">{formErrors.fecha}</div>}
                  </div>

                  <div className="form-field">
                    <label htmlFor="lugar">Lugar</label>
                    <input
                      id="lugar"
                      name="lugar"
                      value={formData.lugar}
                      onChange={handleInputChange}
                      required
                      placeholder="Ej. Coliseo / Salón 302-C"
                      className={formErrors.lugar ? 'error' : ''}
                    />
                    {formErrors.lugar && <div className="error-message">{formErrors.lugar}</div>}
                  </div>

                  <div className="form-field">
                    <label htmlFor="hora_inicio">Hora de inicio</label>
                    <input
                      id="hora_inicio"
                      name="hora_inicio"
                      type="time"
                      value={formData.hora_inicio}
                      onChange={handleInputChange}
                      required
                      className={formErrors.hora_inicio ? 'error' : ''}
                    />
                    {formErrors.hora_inicio && <div className="error-message">{formErrors.hora_inicio}</div>}
                  </div>

                  <div className="form-field">
                    <label htmlFor="hora_fin">Hora de fin</label>
                    <input
                      id="hora_fin"
                      name="hora_fin"
                      type="time"
                      value={formData.hora_fin}
                      onChange={handleInputChange}
                      required
                      className={formErrors.hora_fin ? 'error' : ''}
                    />
                    {formErrors.hora_fin && <div className="error-message">{formErrors.hora_fin}</div>}
                  </div>

                  <div className="form-field">
                    <label htmlFor="cupo">Cupos disponibles</label>
                    <input
                      id="cupo"
                      name="cupo"
                      type="number"
                      min="0"
                      required
                      placeholder="Ej. 30"
                      value={formData.cupo}
                      onChange={handleInputChange}
                      className={formErrors.cupo ? 'error' : ''}
                    />
                    {formErrors.cupo && <div className="error-message">{formErrors.cupo}</div>}
                  </div>

                  <div className="form-field">
                    <label htmlFor="instructor">Instructor (opcional)</label>
                    <input
                      id="instructor"
                      name="instructor"
                      value={formData.instructor}
                      onChange={handleInputChange}
                      placeholder="Nombre del instructor/responsable"
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="tags">Etiquetas (opcional, separadas por comas)</label>
                    <input
                      id="tags"
                      name="tags"
                      value={formData.tags}
                      onChange={handleInputChange}
                      placeholder="Ej. deporte,tarde,principiantes"
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="visibility">Visibilidad</label>
                    <select
                      id="visibility"
                      name="visibility"
                      value={formData.visibility}
                      onChange={handleInputChange}
                    >
                      <option value="public">Pública</option>
                      <option value="private">Privada</option>
                    </select>
                  </div>

                  <div className="form-field">
                    <label htmlFor="profesor">Profesor asignado (opcional)</label>
                    <select
                      id="profesor"
                      name="assigned_professor"
                      value={formData.assigned_professor || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, assigned_professor: e.target.value }))}
                    >
                      <option value="">-- Sin asignar --</option>
                      {loadingProfessors && <option>Cargando...</option>}
                      {!loadingProfessors && professors.map(p => (
                        <option key={p.id} value={p.id}>{p.full_name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-field full-width">
                    <label htmlFor="descripcion">Descripción</label>
                    <textarea
                      id="descripcion"
                      name="descripcion"
                      placeholder="Detalles, requisitos, materiales..."
                      rows="4"
                      required
                      value={formData.descripcion}
                      onChange={handleInputChange}
                      className={formErrors.descripcion ? 'error' : ''}
                    ></textarea>
                    {formErrors.descripcion && <div className="error-message">{formErrors.descripcion}</div>}
                  </div>

                  <div className="form-field full-width">
                    <label htmlFor="portada">Imagen de portada (opcional)</label>
                    <input id="portada" name="portada" type="file" accept="image/*" onChange={handleImageChange} />
                  </div>

                  <div className="form-actions full-width">
                    <button type="button" className="btn btn-secondary" onClick={handleReset} disabled={loading}>
                      Limpiar
                    </button>
                    <button type="submit" onClick={handleSubmit} className="btn btn-primary" disabled={loading}>
                      {loading ? 'Creando...' : 'Crear actividad'}
                    </button>
                  </div>

                  {error && (
                    <div className="error-container full-width">
                      <p className="error-message">Error: {error}</p>
                    </div>
                  )}
              </form>
            </div>
          </div>
          <div className="preview-column">
            <div className="activity-preview-card">
              <div className="preview-header">Vista Previa</div>
              <div className="preview-content">
                <div className="preview-image-container">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Vista previa" className="preview-image" />
                  ) : (
                    <div className="preview-image-placeholder"><span>📷</span></div>
                  )}
                </div>
                <h3 className="preview-title">{formData.titulo || '(Título)'}</h3>
                <div className="preview-tags">
                  {formData.tipo && <span className="preview-tag">{formData.tipo}</span>}
                  {formData.tags && formData.tags.split(',').map((tag, index) => (
                    <span key={index} className="preview-tag">{tag.trim()}</span>
                  ))}
                </div>
                <ul className="preview-details">
                  <li>📍 {formData.lugar || '(Lugar)'}</li>
                  <li>🗓️ {formData.fecha || '(Fecha)'}</li>
                  <li>⏰ {formData.hora_inicio || '--:--'} - {formData.hora_fin || '--:--'}</li>
                  {formData.instructor && <li>👨‍🏫 {formData.instructor}</li>}
                  <li>👥 {formData.cupo > 0 ? `${formData.cupo} cupos` : 'Sin límite de cupo'}</li>
                </ul>
                {formData.descripcion && <p className="preview-description">{formData.descripcion}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}