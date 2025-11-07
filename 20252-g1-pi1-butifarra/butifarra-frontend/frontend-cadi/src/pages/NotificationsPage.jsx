import React, { useState, useRef } from 'react';
import AppLayout from '../components/layout/AppLayout.jsx';
import CampaignsView from './CampaignsView'; 
import CreateNotificationView from './CreateNotificationView';
import Toast from '../components/ui/Toast';
import Modal from '../components/ui/Modal'; // 1. Importamos el Modal

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState('Campañas');
  const [campaigns, setCampaigns] = useState([]);
  
  // --- LÓGICA DE EDICIÓN ---
  const [editingCampaign, setEditingCampaign] = useState(null);

  // --- LÓGICA DEL MODAL ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', body: '' });
  
  // --- LÓGICA DE ELIMINACIÓN---
  const [recentlyDeleted, setRecentlyDeleted] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const deleteTimeoutRef = useRef(null);
  const handleDelete = (campaignId) => {
    if (deleteTimeoutRef.current) clearTimeout(deleteTimeoutRef.current);
    const campaignToDelete = campaigns.find(c => c.id === campaignId);
    setRecentlyDeleted(campaignToDelete);
    setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, isHiding: true } : c));
    setShowToast(true);
    setTimeout(() => {
      setCampaigns(prev => prev.filter(c => c.id !== campaignId));
    }, 500);
    deleteTimeoutRef.current = setTimeout(() => {
      setRecentlyDeleted(null);
      setShowToast(false);
    }, 5000);
  };
  const handleUndoDelete = () => {
    if (recentlyDeleted) {
      setCampaigns(prev => [recentlyDeleted, ...prev].sort((a, b) => b.id - a.id));
      setRecentlyDeleted(null);
      setShowToast(false);
      if (deleteTimeoutRef.current) clearTimeout(deleteTimeoutRef.current);
    }
  };
  // --- FIN DE LÓGICA DE ELIMINACIÓN ---

  // --- FUNCIÓN UNIFICADA PARA CREAR Y EDITAR ---
  const handleSaveCampaign = (formData) => {
    if (editingCampaign) {
      // MODO EDICIÓN: Actualiza la campaña existente
      setCampaigns(prev => 
        prev.map(c => 
          c.id === editingCampaign.id 
            ? { 
                ...c, // Mantiene ID, métricas y estado originales
                name: formData.name,
                type: formData.type,
                message: formData.message,
                channel: formData.channel,
                segment: formData.segment,
                schedule: `${formData.scheduleDate} ${formData.scheduleTime || '09:00'}`,
              } 
            : c
        )
      );
      setEditingCampaign(null); // Sale del modo edición
    } else {
      // MODO CREACIÓN: Añade una nueva campaña
      const newCampaign = {
        id: Date.now(),
        name: formData.name,
        type: formData.type,
        message: formData.message,
        channel: formData.channel,
        segment: formData.segment,
        schedule: `${formData.scheduleDate} ${formData.scheduleTime || '09:00'}`,
        metrics: '0 enviados',
        metricsSubtitle: 'Pendiente',
        status: 'Programada',
      };
      setCampaigns(prev => [newCampaign, ...prev]);
    }
  };

  // --- NUEVAS FUNCIONES PARA LOS BOTONES DE ACCIÓN ---
  const handleEdit = (campaignId) => {
    const campaignToEdit = campaigns.find(c => c.id === campaignId);
    setEditingCampaign(campaignToEdit); // Guardamos la campaña a editar en el estado
    setActiveTab('Crear notificación'); // Cambiamos a la pestaña del formulario
  };

  const handleViewDetails = (campaign) => {
    setModalContent({
      title: `Detalles de: ${campaign.name}`,
      body: campaign.message || "Esta campaña no tiene un mensaje detallado."
    });
    setIsModalOpen(true); // Abrimos el modal
  };
  
  return (
    <AppLayout>
      <div className="notifications-page">
        <header className="page-header-notifications">
          <div>
            <h1 className="title">Gestión de notificaciones</h1>
            <p className="subtitle">Crea y gestiona campañas de comunicación para estudiantes y personal</p>
          </div>
          {activeTab === 'Campañas' && (
            <button className="btn btn-primary" onClick={() => {
              setEditingCampaign(null);
              setActiveTab('Crear notificación');
            }}>
              + Nueva campaña
            </button>
          )}
        </header>

        <nav className="tabs-nav">
          <button className={`tab ${activeTab === 'Campañas' ? 'active' : ''}`} onClick={() => setActiveTab('Campañas')}>Campañas</button>
          <button className={`tab ${activeTab === 'Crear notificación' ? 'active' : ''}`} onClick={() => setActiveTab('Crear notificación')}>Crear notificación</button>
          <button className={`tab ${activeTab === 'Plantillas' ? 'active' : ''}`} onClick={() => setActiveTab('Plantillas')}>Plantillas</button>
          <button className={`tab ${activeTab === 'Logs de envío' ? 'active' : ''}`} onClick={() => setActiveTab('Logs de envío')}>Logs de envío</button>
        </nav>

        {activeTab === 'Campañas' &&
          <CampaignsView
            campaigns={campaigns}
            onDelete={handleDelete}
            onEdit={handleEdit}
            onViewDetails={handleViewDetails}
          />
        }
        {activeTab === 'Crear notificación' &&
          <CreateNotificationView
            onSave={handleSaveCampaign}
            onSwitchTab={setActiveTab}
            editingCampaign={editingCampaign}
          />
        }
      </div>

      {showToast && <Toast message="Campaña eliminada." onUndo={handleUndoDelete} onDismiss={() => setShowToast(false)} />}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalContent.title}
      >
        <p>{modalContent.body}</p>
      </Modal>
    </AppLayout>
  );
}