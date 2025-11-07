// src/components/Torneos/FixtureView.jsx
import React, { useState } from 'react';
import { Check, X, Edit3, ArrowLeft, ArrowRight } from 'lucide-react';

const MatchCard = ({ match, onSaveResult }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [scoreA, setScoreA] = useState(match.scoreA ?? '');
  const [scoreB, setScoreB] = useState(match.scoreB ?? '');

  const handleSave = () => { if (!isNaN(parseInt(scoreA)) && !isNaN(parseInt(scoreB))) { onSaveResult(match.id, { scoreA: parseInt(scoreA), scoreB: parseInt(scoreB) }); setIsEditing(false); } };
  const handleCancel = () => {
    // Simplemente salimos del modo edición, no necesitamos resetear los scores aquí
    setIsEditing(false);
  };
  
  const handleEditClick = () => {
    setScoreA(match.scoreA ?? '');
    setScoreB(match.scoreB ?? '');
    setIsEditing(true);
  };

  const isPlayed = match.status === 'played';
  const winner = isPlayed ? (match.scoreA > match.scoreB ? 'A' : 'B') : null;

  const Team = ({ name, score, isWinner, placeholder }) => (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${isWinner === true ? 'bg-blue-600' : 'bg-gray-400'}`}>
          {name ? name.charAt(0) : '?'}
        </div>
        <span className={`font-semibold ${isWinner === true ? 'text-gray-800' : 'text-gray-500'}`}>{name || placeholder}</span>
      </div>
      <span className={`text-lg font-bold ${isWinner === true ? 'text-gray-800' : 'text-gray-500'}`}>{score ?? '-'}</span>
    </div>
  );

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm transition-all duration-300 hover:shadow-md">
      <div className="flex items-center gap-4">
        <div className="flex-1 space-y-2">
          <Team name={match.teamA.name} score={match.scoreA} isWinner={winner === 'A'} placeholder="Equipo A"/>
          <Team name={match.teamB.name} score={match.scoreB} isWinner={winner === 'B'} placeholder="Equipo B"/>
        </div>
        
        {/* --- LÓGICA DE BOTONES CORREGIDA --- */}
        {/* Si NO estamos editando, mostramos siempre el botón de editar */}
        {!isEditing && (
          <button onClick={handleEditClick} className="bg-blue-50 text-blue-600 p-3 rounded-lg hover:bg-blue-100 transition-colors">
            <Edit3 size={20} />
          </button>
        )}
      </div>

      {/* Si SÍ estamos editando, mostramos el formulario de edición */}
      {isEditing && (
        <div className="mt-3 pt-3 border-t flex items-center justify-between animate-fadeIn">
          <div className="flex gap-2 text-sm text-gray-500 items-center">
            Resultado:
          </div>
          <div className="flex items-center gap-2">
            <input type="number" value={scoreA} onChange={e => setScoreA(e.target.value)} className="w-16 p-2 border border-gray-300 rounded-md text-center font-bold" placeholder="Pts." />
            <span className="text-gray-400">-</span>
            <input type="number" value={scoreB} onChange={e => setScoreB(e.target.value)} className="w-16 p-2 border border-gray-300 rounded-md text-center font-bold" placeholder="Pts." />
          </div>
          <div className="flex gap-2">
            <button onClick={handleCancel} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"><X size={20} /></button>
            <button onClick={handleSave} className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"><Check size={20} /></button>
          </div>
        </div>
      )}
    </div>
  );
};

const FixtureView = ({ tournament, onSaveResult }) => {
  if (!tournament || !tournament.matches || tournament.matches.length === 0) {
    return <div className="p-8 text-center text-gray-500">Este torneo aún no tiene partidos programados en el fixture.</div>;
  }

  const rounds = tournament.matches.reduce((acc, match) => { (acc[match.round] = acc[match.round] || []).push(match); return acc; }, {});
  const roundNames = Object.keys(rounds);
  const [activeRoundIndex, setActiveRoundIndex] = useState(0);
  
  const goToNextRound = () => setActiveRoundIndex(i => Math.min(i + 1, roundNames.length - 1));
  const goToPrevRound = () => setActiveRoundIndex(i => Math.max(i - 1, 0));

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
        <h3 className="text-2xl font-bold text-gray-800">{tournament.name} - Fixture</h3>
        <div className="flex items-center gap-2">
          <button onClick={goToPrevRound} disabled={activeRoundIndex === 0} className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-30"><ArrowLeft size={20} /></button>
          <div className="text-center">
            <span className="font-semibold text-gray-700">{roundNames[activeRoundIndex]}</span>
            <span className="text-sm text-gray-500 block">Ronda {activeRoundIndex + 1} de {roundNames.length}</span>
          </div>
          <button onClick={goToNextRound} disabled={activeRoundIndex === roundNames.length - 1} className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-30"><ArrowRight size={20} /></button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rounds[roundNames[activeRoundIndex]].map(match => (
          <MatchCard key={match.id} match={match} onSaveResult={onSaveResult} />
        ))}
      </div>
    </div>
  );
};

export default FixtureView;