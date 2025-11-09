import React from 'react';
import { useNavigate } from 'react-router-dom';

// Replace these with your actual icons
import sectionIcon from '../../assets/icons/brain-icon.png';
import actividadIcon from '../../assets/icons/brain-icon.png';
import torneoIcon from '../../assets/icons/brain-icon.png';
import notificacionIcon from '../../assets/icons/brain-icon.png';

const actions = [
  {
    icon: actividadIcon,
    title: 'Crear actividad',
    subtitle: 'Nueva actividad CADI',
    to: '/actividades/crear',
  },
  {
    icon: torneoIcon,
    title: 'Publicar torneo',
    subtitle: 'Crear nuevo torneo',
    to: '/torneos/crear',
  },
  {
    icon: notificacionIcon,
    title: 'Enviar notificación',
    subtitle: 'Comunicado masivo',
    to: '/notificaciones/enviar',
  },
];

export const QuickActions = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-white px-[32px] py-6 mt-4 rounded-lg shadow-sm mt-[60px]">
      {/* Section Title */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <img src={sectionIcon} alt="Acciones" className="w-7 h-7" />
          <h2 className="text-lg font-semibold text-slate-800">Acciones rápidas</h2>
        </div>
        <p className="text-sm text-stone-500">
          Tareas frecuentes para gestión eficiente
        </p>
      </div>

      {/* Action Cards */}
      <div className="flex justify-center gap-[22px]">
        {actions.map((action, index) => (
          <button
            type="button"
            key={index}
            onClick={() => navigate(action.to)}
            className="flex items-center gap-3 bg-stone-100 p-4 rounded-lg w-[260px] h-[100px] shadow-sm text-left"
          >
            <img src={action.icon} alt={action.title} className="w-7 h-7" />
            <div>
              <h3 className="text-base font-semibold text-slate-700">{action.title}</h3>
              <p className="text-sm text-stone-500">{action.subtitle}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};