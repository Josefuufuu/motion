import React, { useState, useEffect } from 'react'; 

export default function CreateNotificationView({ onSave, onSwitchTab, editingCampaign }) {
  // El estado se queda exactamente igual, con todos tus campos
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    message: '',
    channel: '',
    segment: '',
    userType: 'cadi',
    scheduleDate: '',
    scheduleTime: '',
  });

 // Este "efecto" llena el formulario cuando entras en modo edición
  useEffect(() => {
    if (editingCampaign) {
      // Si estamos editando, llenamos el formulario con los datos existentes
      const [date, time] = (editingCampaign.schedule || ' ').split(' ');
      setFormData({
        name: editingCampaign.name || '',
        type: editingCampaign.type || '',
        message: editingCampaign.message || '',
        channel: editingCampaign.channel || '',
        segment: editingCampaign.segment || '',
        userType: editingCampaign.userType || 'cadi', // Aseguramos que se cargue el userType
        scheduleDate: date || '',
        scheduleTime: time || '',
      });
    } else {
      // Si no estamos editando (creando uno nuevo), nos aseguramos de que el formulario esté vacío
      setFormData({
        name: '', type: '', message: '', channel: '',
        segment: '', userType: 'cadi', scheduleDate: '', scheduleTime: '',
      });
    }
  }, [editingCampaign]); // Se ejecuta solo si 'editingCampaign' cambia

  // La función handleInputChange se queda exactamente igual
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  // La función handleSubmit ahora es más simple y flexible
  const handleSubmit = (e) => {
    e.preventDefault();
    // Simplemente pasamos todos los datos del formulario a la página principal.
    // La página principal decidirá si es una creación o una edición.
    onSave(formData); 
    onSwitchTab('Campañas');
  };

  return (
    // El JSX se queda casi idéntico, solo cambiamos los textos de los títulos y botones
    <form className="create-notification-layout" onSubmit={handleSubmit}>
      
      <div className="notification-form-card">
        <h2 className="form-section-title">{editingCampaign ? 'Editar Notificación' : 'Crear nueva notificación'}</h2>
        <p className="form-section-subtitle">Configura el contenido y segmentación</p>
        
        <div className="notification-form">
          {/* Todos tus campos se quedan exactamente igual, ya que están conectados al 'formData' */}
          <div className="form-field">
            <label htmlFor="name">Título de la campaña</label>
            <input id="name" name="name" placeholder="Ej: Nuevas actividades disponibles" value={formData.name} onChange={handleInputChange} required />
          </div>

          <div className="form-field">
            <label htmlFor="type">Tipo de notificación</label>
            <select id="type" name="type" value={formData.type} onChange={handleInputChange} required>
              <option value="">Seleccionar tipo...</option>
              <option value="COMUNICADO">Comunicado General</option>
              <option value="RECORDATORIO">Recordatorio de Evento</option>
              <option value="CAMBIO">Cambio de Horario/Lugar</option>
              <option value="CANCELACION">Cancelación de Actividad</option>
              <option value="ALERTA">Alerta Importante</option>
              <option value="PREMIO">Notificación de Premio</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="message">Mensaje</label>
            <textarea id="message" name="message" placeholder="Escribe tu mensaje aquí..." rows="6" value={formData.message} onChange={handleInputChange} required></textarea>
          </div>

          <div className="form-field">
            <label htmlFor="channel">Canal de envío</label>
            <select id="channel" name="channel" value={formData.channel} onChange={handleInputChange} required>
              <option value="">Seleccionar canal...</option>
              <option value="PUSH">Notificación Push (App)</option>
              <option value="CORREO">Correo Electrónico</option>
            </select>
          </div>
        </div>
      </div>

      <div className="notification-form-card">
        <h2 className="form-section-title">Segmentación</h2>
        <p className="form-section-subtitle">Define quién recibirá la notificación</p>
        
        <div className="notification-form">
          <div className="form-field">
            <label htmlFor="segment">Destinatarios</label>
            <select id="segment" name="segment" value={formData.segment} onChange={handleInputChange} required>
              <option value="">Seleccionar audiencia...</option>
              <option value="Todos los usuarios">Todos los usuarios</option>
              <option value="Solo Estudiantes">Solo Estudiantes</option>
              <option value="Solo Profesores">Solo Profesores</option>
              <option value="Solo Egresados">Solo Egresados</option>
            </select>
          </div>

          <div className="form-field">
            <label>Tipo de notificación</label>
            <div className="radio-group">
              <div className="radio-option">
                <input type="radio" id="cadi-users" name="userType" value="cadi" checked={formData.userType === 'cadi'} onChange={handleInputChange} />
                <label htmlFor="cadi-users">Solo usuarios activos en CADI</label>
              </div>
              <div className="radio-option">
                <input type="radio" id="psychology-users" name="userType" value="psychology" checked={formData.userType === 'psychology'} onChange={handleInputChange} />
                <label htmlFor="psychology-users">Con citas psicológicas</label>
              </div>
            </div>
          </div>

          <div className="form-field">
            <label>Programación</label>
            <div className="schedule-inputs">
              <input type="date" name="scheduleDate" value={formData.scheduleDate} onChange={handleInputChange} required/>
              <input type="time" name="scheduleTime" value={formData.scheduleTime} onChange={handleInputChange} required/>
            </div>
          </div>
          
          <div className="form-actions-notifications">
            <button type="button" className="btn btn-secondary">Guardar borrador</button>
            <button type="submit" className="btn btn-primary">
              {editingCampaign ? 'Guardar Cambios' : 'Enviar ahora'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}