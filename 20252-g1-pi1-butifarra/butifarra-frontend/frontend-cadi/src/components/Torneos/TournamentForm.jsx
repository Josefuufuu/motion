// src/components/Torneos/TournamentForm.jsx
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check } from 'lucide-react';

const Step = ({ number, title, active }) => ( <div className="flex items-center"><div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>{active ? <Check size={18} /> : number}</div><div className={`ml-3 font-medium transition-colors ${active ? 'text-gray-800' : 'text-gray-400'}`}>{title}</div></div>);

const initialFormState = {
  name: '', sport: '', format: '', maxTeams: '',
  inscriptionStartDate: '', 
  inscriptionEndDate: '',  
  startDate: '', endDate: '', description: ''
};

const TournamentForm = ({ onSave, onCancel, initialData, isEditing = false }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEditing && initialData) {

      setFormData({ ...initialFormState, ...initialData });
    } else {
      setFormData(initialFormState);
    }
    setStep(1);
    setErrors({});
  }, [isEditing, initialData]);

  const handleChange = (e) => { const { name, value } = e.target; setFormData(p => ({ ...p, [name]: value })); if (errors[name]) { setErrors(p => ({ ...p, [name]: null })); } };
  
 
  const validateStep = () => {
    const newErrors = {};
    if (step === 1) {
        if (!formData.name.trim()) newErrors.name = 'El nombre del torneo es obligatorio.';
        if (!formData.sport) newErrors.sport = 'Debes seleccionar un deporte.';
    }
    if (step === 2) {
        if (!formData.format) newErrors.format = 'Debes seleccionar un formato.';
        if (!formData.maxTeams || formData.maxTeams <= 1) newErrors.maxTeams = 'Debe haber al menos 2 equipos.';
    }
    if (step === 3) {
      if (!formData.startDate) newErrors.startDate = 'La fecha de inicio del torneo es obligatoria.';
      if (!formData.endDate) newErrors.endDate = 'La fecha de fin del torneo es obligatoria.';

      if (!formData.inscriptionStartDate) newErrors.inscriptionStartDate = 'El inicio de inscripciones es obligatorio.';
      if (!formData.inscriptionEndDate) newErrors.inscriptionEndDate = 'El fin de inscripciones es obligatorio.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => { if (validateStep()) { setStep(p => p + 1); } };
  const prevStep = () => setStep(p => p - 1);
  const handleSubmit = (e) => { e.preventDefault(); onSave(formData); };
  const labelClasses = "block mb-1 font-medium text-sm text-gray-700";
  const baseInputClasses = "w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Barra de Progreso (sin cambios) */}
      <div className="flex justify-between items-center mb-8 border-b pb-4"><Step number={1} title="Básicos" active={step >= 1} /><div className="flex-1 h-0.5 bg-gray-200 mx-4"><div className={`h-full bg-blue-600`} style={{ width: `${((step - 1) / 3) * 100}%` }}></div></div><Step number={2} title="Formato" active={step >= 2} /><div className="flex-1 h-0.5 bg-gray-200 mx-4"><div className={`h-full bg-blue-600`} style={{ width: `${((step - 2) / 3) * 100}%` }}></div></div><Step number={3} title="Fechas" active={step >= 3} /><div className="flex-1 h-0.5 bg-gray-200 mx-4"><div className={`h-full bg-blue-600`} style={{ width: `${((step - 3) / 3) * 100}%` }}></div></div><Step number={4} title="Confirmar" active={step >= 4} /></div>
      
      {/* Pasos 1 y 2 (sin cambios) */}
      {step === 1 && (<div className="space-y-4 animate-fadeIn"><h3 className="text-xl font-semibold">Información Básica</h3><div><label htmlFor="name" className={labelClasses}>Nombre del Torneo</label><input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className={`${baseInputClasses} ${errors.name ? 'border-red-500' : 'border-gray-300'}`} placeholder="Ej: Copa ICESI Apertura"/>{errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}</div><div><label htmlFor="sport" className={labelClasses}>Deporte</label><select id="sport" name="sport" value={formData.sport} onChange={handleChange} className={`${baseInputClasses} ${errors.sport ? 'border-red-500' : 'border-gray-300'}`}><option value="" disabled>Selecciona un deporte...</option><option>Fútbol</option><option>Baloncesto</option><option>Voleibol</option><option>Tenis de Mesa</option></select>{errors.sport && <p className="text-red-500 text-xs mt-1">{errors.sport}</p>}</div></div>)}
      {step === 2 && (<div className="space-y-4 animate-fadeIn"><h3 className="text-xl font-semibold">Formato y Reglas</h3><div><label htmlFor="format" className={labelClasses}>Formato</label><select id="format" name="format" value={formData.format} onChange={handleChange} className={`${baseInputClasses} ${errors.format ? 'border-red-500' : 'border-gray-300'}`}><option value="" disabled>Selecciona un formato...</option><option>Eliminación Directa</option><option>Round Robin</option><option>Mixto</option></select>{errors.format && <p className="text-red-500 text-xs mt-1">{errors.format}</p>}</div><div><label htmlFor="maxTeams" className={labelClasses}>Máximo de Equipos</label><input type="number" id="maxTeams" name="maxTeams" value={formData.maxTeams} onChange={handleChange} className={`${baseInputClasses} ${errors.maxTeams ? 'border-red-500' : 'border-gray-300'}`} placeholder="Ej: 16"/>{errors.maxTeams && <p className="text-red-500 text-xs mt-1">{errors.maxTeams}</p>}</div><div><label htmlFor="description" className={labelClasses}>Descripción (Opcional)</label><textarea id="description" name="description" value={formData.description} onChange={handleChange} className={`${baseInputClasses} border-gray-300`} rows="3" placeholder="Añade reglas, premios u otra información relevante..."></textarea></div></div>)}

      {/* --- 3. PASO DE FECHAS MODIFICADO --- */}
      {step === 3 && (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <h3 className="text-xl font-semibold">Fechas de Inscripción</h3>
            <p className="text-sm text-gray-500">Define el período en que los usuarios podrán inscribirse.</p>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label htmlFor="inscriptionStartDate" className={labelClasses}>Inicio de inscripciones</label>
                <input type="date" id="inscriptionStartDate" name="inscriptionStartDate" value={formData.inscriptionStartDate} onChange={handleChange} className={`${baseInputClasses} ${errors.inscriptionStartDate ? 'border-red-500' : 'border-gray-300'}`} />
                {errors.inscriptionStartDate && <p className="text-red-500 text-xs mt-1">{errors.inscriptionStartDate}</p>}
              </div>
              <div>
                <label htmlFor="inscriptionEndDate" className={labelClasses}>Fin de inscripciones</label>
                <input type="date" id="inscriptionEndDate" name="inscriptionEndDate" value={formData.inscriptionEndDate} onChange={handleChange} className={`${baseInputClasses} ${errors.inscriptionEndDate ? 'border-red-500' : 'border-gray-300'}`} />
                {errors.inscriptionEndDate && <p className="text-red-500 text-xs mt-1">{errors.inscriptionEndDate}</p>}
              </div>
            </div>
          </div>
          <div className="border-t pt-6">
            <h3 className="text-xl font-semibold">Fechas del Torneo</h3>
            <p className="text-sm text-gray-500">Define cuándo se jugará el torneo.</p>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label htmlFor="startDate" className={labelClasses}>Inicio del torneo</label>
                <input type="date" id="startDate" name="startDate" value={formData.startDate} onChange={handleChange} className={`${baseInputClasses} ${errors.startDate ? 'border-red-500' : 'border-gray-300'}`} />
                {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
              </div>
              <div>
                <label htmlFor="endDate" className={labelClasses}>Fin del torneo</label>
                <input type="date" id="endDate" name="endDate" value={formData.endDate} onChange={handleChange} className={`${baseInputClasses} ${errors.endDate ? 'border-red-500' : 'border-gray-300'}`} />
                {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- 4. PASO DE RESUMEN MODIFICADO --- */}
      {step === 4 && ( <div className="animate-fadeIn"><h3 className="text-xl font-semibold">Resumen del Torneo</h3><div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-2 text-sm"><p><strong>Nombre:</strong> {formData.name}</p><p><strong>Deporte:</strong> {formData.sport}</p><p><strong>Formato:</strong> {formData.format} con {formData.maxTeams} equipos</p><p><strong>Período de Inscripción:</strong> {formData.inscriptionStartDate} al {formData.inscriptionEndDate}</p><p><strong>Fechas del Torneo:</strong> {formData.startDate} al {formData.endDate}</p>{formData.description && <p><strong>Descripción:</strong> {formData.description}</p>}</div></div>)}

      {/* Botones (sin cambios) */}
      <div className="flex justify-between items-center pt-4 border-t"><div className="w-28">{step > 1 && <button type="button" onClick={prevStep} className="bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition flex items-center gap-2"><ArrowLeft size={16} /> Atrás</button>}</div><div className="flex items-center gap-3"><button type="button" onClick={onCancel} className="text-sm font-semibold text-gray-600 hover:text-gray-800">Cancelar</button>{step < 4 && <button type="button" onClick={nextStep} className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition">Siguiente</button>}{step === 4 && <button type="submit" className={`${isEditing ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white font-semibold py-2 px-4 rounded-lg transition`}>{isEditing ? 'Guardar Cambios' : 'Crear Torneo'}</button>}</div></div>
    </form>
  );
};

export default TournamentForm;