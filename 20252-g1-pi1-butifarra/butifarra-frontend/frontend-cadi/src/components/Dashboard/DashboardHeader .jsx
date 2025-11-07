import React from 'react';
import homeIcon from '../../assets/icons/home-icon.png';

export const DashboardHeader = () => {
  return (
    <div className="px-6 py-4 bg-white">
      <div className="flex items-center gap-3">
        <img src={homeIcon} alt="Home" className="w-6 h-6" />
        <h1 className="text-xl font-bold text-slate-800">Panel general</h1>
      </div>
      <p className="text-[16px] text-stone-500 mt-1 whitespace-nowrap">
         Vista general del sistema de Bienestar Universitario
      </p>
    </div>
  );
};