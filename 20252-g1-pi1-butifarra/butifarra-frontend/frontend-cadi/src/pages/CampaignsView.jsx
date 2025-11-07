import React from 'react';
import { FiUsers, FiCalendar, FiBarChart2, FiEdit, FiEye, FiTrash2 } from 'react-icons/fi';

// 1. Recibimos las nuevas props 'onEdit' y 'onViewDetails'
export default function CampaignsView({ campaigns = [], onDelete, onEdit, onViewDetails }) {
  const kpiData = [
    { icon: <FiUsers />, label: 'Enviadas hoy', value: '324' },
    { icon: <FiCalendar />, label: 'Tasa de apertura', value: '78%' },
    { icon: <FiBarChart2 />, label: 'Alcance total', value: '2.451' },
  ];

  return (
    <>
      <section className="kpi-grid-notifications">
        {kpiData.map((kpi, index) => (
          <div key={index} className="kpi-card-notifications">
            <div className="kpi-header">
              <span className="kpi-label">{kpi.label}</span>
              <span className="kpi-icon">{kpi.icon}</span>
            </div>
            <p className="kpi-value">{kpi.value}</p>
          </div>
        ))}
      </section>

      <section className="campaign-table-card">
        <header className="table-header">
          <h2 className="table-title">Campañas de notificación</h2>
          <span className="table-subtitle">{campaigns.length} campañas registradas</span>
        </header>
        <div className="table-container">
          <table className="campaign-table">
            <thead>
              <tr>
                <th>Campaña</th><th>Segmento</th><th>Programación</th>
                <th>Métricas</th><th>Estado</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className={campaign.isHiding ? 'campaign-row-hiding' : ''}>
                  <td>
                    <div className="campaign-name">{campaign.name}</div>
                    <div className="campaign-type">{campaign.type}</div>
                  </td>
                  <td>{campaign.segment}</td>
                  <td>{campaign.schedule}</td>
                  <td>
                    <div className="metric-value">{campaign.metrics}</div>
                    <div className="metric-subtitle">{campaign.metricsSubtitle}</div>
                  </td>
                  <td><span className="status-badge programada">{campaign.status}</span></td>
                  <td>
                    <div className="action-buttons">
                      {/* 2. Conectamos los onClick a las nuevas funciones */}
                      <button className="action-btn" data-tooltip="Editar" onClick={() => onEdit(campaign.id)}>
                        <FiEdit />
                      </button>
                      <button className="action-btn" data-tooltip="Ver detalles" onClick={() => onViewDetails(campaign)}>
                        <FiEye />
                      </button>
                      <button className="action-btn delete" data-tooltip="Eliminar" onClick={() => onDelete(campaign.id)}>
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}