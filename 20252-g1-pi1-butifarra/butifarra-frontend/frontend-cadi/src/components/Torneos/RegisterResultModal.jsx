// src/components/Torneos/RegisterResultModal.jsx
import React, { useState } from 'react';

const RegisterResultModal = ({ match, onSave, onCancel }) => {
  const [scoreA, setScoreA] = useState('');
  const [scoreB, setScoreB] = useState('');

  const handleSave = () => {
    if (!isNaN(parseInt(scoreA)) && !isNaN(parseInt(scoreB))) {
      onSave(match.id, { scoreA: parseInt(scoreA), scoreB: parseInt(scoreB) });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onCancel}>
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm text-left" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Registrar Resultado</h3>
        <div className="flex justify-between items-center mb-4 text-center">
          <span className="font-bold w-2/5">{match.teamA.name}</span>
          <span className="text-gray-400">vs</span>
          <span className="font-bold w-2/5">{match.teamB.name}</span>
        </div>
        <div className="flex justify-between items-center mb-6">
          <input 
            type="number" 
            value={scoreA}
            onChange={(e) => setScoreA(e.target.value)}
            className="w-2/5 p-2 border border-gray-300 rounded-md text-center text-lg font-bold"
            placeholder="-"
          />
          <span className="text-lg font-bold">-</span>
          <input 
            type="number" 
            value={scoreB}
            onChange={(e) => setScoreB(e.target.value)}
            className="w-2/5 p-2 border border-gray-300 rounded-md text-center text-lg font-bold"
            placeholder="-"
          />
        </div>
        <div className="flex justify-end gap-4">
          <button onClick={onCancel} className="bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300">Cancelar</button>
          <button onClick={handleSave} className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700">Guardar Resultado</button>
        </div>
      </div>
    </div>
  );
};

export default RegisterResultModal;