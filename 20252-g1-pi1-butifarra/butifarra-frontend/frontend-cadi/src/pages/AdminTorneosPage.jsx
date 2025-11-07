// src/pages/AdminTorneosPage.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useTorneos } from '../hooks/useTorneos';
import TournamentTable from '../components/Torneos/TournamentTable';
import TournamentForm from '../components/Torneos/TournamentForm';
import AppLayout from '../components/layout/AppLayout.jsx';
import { Trophy, X } from 'lucide-react'; 
import FixtureView from '../components/Torneos/FixtureView';

const mapFormToPayload = (data) => ({
  name: data.name?.trim() || '',
  sport: data.sport || '',
  format: data.format || '',
  description: data.description || '',
  location: data.location || '',
  inscription_start: data.inscriptionStartDate || null,
  inscription_end: data.inscriptionEndDate || null,
  start: data.startDate ? `${data.startDate}T00:00:00` : null,
  end: data.endDate ? `${data.endDate}T23:59:59` : null,
  visibility: 'public',
  status: 'planned',
  max_teams: data.maxTeams ? parseInt(data.maxTeams, 10) : 0,
  current_teams: 0,
  fixtures: [],
});

const mapBackendToForm = (t) => ({
  name: t.name || '',
  sport: t.sport || '',
  format: t.format || '',
  description: t.description || '',
  location: t.location || '',
  inscriptionStartDate: t.inscription_start || '',
  inscriptionEndDate: t.inscription_end || '',
  startDate: t.start ? String(t.start).slice(0, 10) : '',
  endDate: t.end ? String(t.end).slice(0, 10) : '',
  maxTeams: String(t.max_teams ?? ''),
});

const AdminTorneosPage = () => {
  const { torneos, loading, error, createTorneo, deleteTorneo, updateTorneo, registerResult } = useTorneos();
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false); 
  const [editingTournament, setEditingTournament] = useState(null);
  const [formKey, setFormKey] = useState(Date.now());
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [tournamentPendingDeletion, setTournamentPendingDeletion] = useState(null);
  const deleteTimerRef = useRef(null); 
  
  const [activeTab, setActiveTab] = useState('Torneos');
  const [selectedTournamentId, setSelectedTournamentId] = useState(null);

  useEffect(() => { return () => clearTimeout(deleteTimerRef.current); }, []);
  
  const handleSaveTorneo = async (formData) => {
    const payload = mapFormToPayload(formData);
    if (editingTournament) {
      await updateTorneo({ id: editingTournament.id, ...payload });
    } else {
      await createTorneo(payload);
    }
    setIsDrawerOpen(false);
    setEditingTournament(null);
  };

  const handleEditClick = (torneo) => {
    setFormKey(torneo.id);
    setEditingTournament({ id: torneo.id, ...mapBackendToForm(torneo) });
    setIsDrawerOpen(true);
  };
  const handleCreateClick = () => { setFormKey(Date.now()); setEditingTournament(null); setIsDrawerOpen(true); };
  const handleCloseDrawer = () => { setIsDrawerOpen(false); setEditingTournament(null); };
  const handleViewClick = (torneoId) => { setExpandedRowId(prevId => (prevId === torneoId ? null : torneoId)); };
  const handleDeleteClick = (torneo) => { if (deleteTimerRef.current) { clearTimeout(deleteTimerRef.current); deleteTorneo(tournamentPendingDeletion.id); } setTournamentPendingDeletion(torneo); deleteTimerRef.current = setTimeout(() => { deleteTorneo(torneo.id); setTournamentPendingDeletion(null); deleteTimerRef.current = null; }, 5000); };
  const handleUndoDelete = () => { clearTimeout(deleteTimerRef.current); setTournamentPendingDeletion(null); deleteTimerRef.current = null; };
  
  useEffect(() => { if (!loading && torneos.length > 0 && !selectedTournamentId) { setSelectedTournamentId(torneos[0].id) } }, [loading, torneos, selectedTournamentId]);
  
  const handleSaveResult = (matchId, scores) => { if (selectedTournamentId) { registerResult(selectedTournamentId, matchId, scores); } };
  
  return (
    <AppLayout>
      <div className="flex justify-between items-center mb-6"><div className="flex items-center gap-4"><Trophy className="text-blue-600" size={40} /><div><h1 className="text-3xl font-bold text-gray-800">Gestión de torneos</h1><p className="mt-1 text-gray-500">Administra torneos deportivos, equipos y resultados</p></div></div><button onClick={handleCreateClick} className="bg-blue-600 text-white font-semibold py-2 px-5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"><span className="text-xl">+</span> Crear Torneo</button></div>
      <div className="mb-6"><div className="border-b border-gray-200"><nav className="-mb-px flex space-x-6"><button onClick={() => setActiveTab('Torneos')} className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'Torneos' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Torneos</button><button onClick={() => setActiveTab('Fixture')} className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'Fixture' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Fixture</button><button onClick={() => setActiveTab('Resultados')} className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'Resultados' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Resultados</button><button onClick={() => setActiveTab('Estadisticas')} className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'Estadisticas' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Estadísticas</button></nav></div></div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {activeTab === 'Torneos' && ( <> <div className="p-4 border-b border-gray-200"><h3 className="text-lg font-semibold text-gray-800">Torneos activos</h3><p className="text-sm text-gray-500">{torneos.length} torneos registrados</p></div> {loading ? <p className="p-4 text-center">Cargando torneos...</p> : <TournamentTable torneos={torneos} onDeleteClick={handleDeleteClick} onEditClick={handleEditClick} onViewClick={handleViewClick} tournamentPendingDeletion={tournamentPendingDeletion?.id} expandedRowId={expandedRowId} />} </> )}
        
        {/* --- LÓGICA DE LA PESTAÑA FIXTURE SIMPLIFICADA --- */}
        {activeTab === 'Fixture' && (
          <div className="p-4">
            <label htmlFor="tournament-select" className="block text-sm font-medium text-gray-700 mb-2">Selecciona un torneo para gestionar:</label>
            <select id="tournament-select" value={selectedTournamentId || ''} onChange={(e) => setSelectedTournamentId(Number(e.target.value))} className="mb-6 w-full max-w-xs p-2 border border-gray-300 rounded-md">
              {loading ? <option>Cargando...</option> : torneos.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            
            {/* Ahora simplemente le pasamos el torneo seleccionado al FixtureView.
                El FixtureView ya sabe qué hacer si el torneo no tiene partidos. */}
            {loading ? (
              <p className="text-center p-8">Cargando fixture...</p>
            ) : (
              <FixtureView 
                tournament={torneos.find(t => t.id === selectedTournamentId)} 
                onSaveResult={handleSaveResult} 
              />
            )}
          </div>
        )}
      </div>
      
      {isDrawerOpen && <div onClick={handleCloseDrawer} className="fixed inset-0 z-40 bg-transparent"></div>}
      <div className={`fixed top-0 right-0 h-full w-full max-w-2xl bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 h-full flex flex-col"><div className="flex justify-between items-center border-b pb-4 mb-4"><h2 className="text-2xl font-bold">{editingTournament ? 'Editar Torneo' : 'Asistente para Crear Torneo'}</h2><button onClick={handleCloseDrawer} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"><X size={24} /></button></div><div className="overflow-y-auto flex-1 pr-2"><TournamentForm key={formKey} onSave={handleSaveTorneo} onCancel={handleCloseDrawer} isEditing={!!editingTournament} initialData={editingTournament} /></div></div>
      </div>
      {tournamentPendingDeletion && (<div key={tournamentPendingDeletion.id} className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white rounded-lg shadow-lg flex flex-col overflow-hidden animate-fadeIn pointer-events-auto"><div className="py-3 px-5 flex items-center gap-4"><p>Torneo "{tournamentPendingDeletion.name}" eliminado.</p><button onClick={handleUndoDelete} className="font-bold text-blue-400 hover:text-blue-300 whitespace-nowrap">Deshacer</button></div><div className="h-1 bg-blue-500 animate-shrink"></div></div>)}
    </AppLayout>
  );
};

export default AdminTorneosPage;

