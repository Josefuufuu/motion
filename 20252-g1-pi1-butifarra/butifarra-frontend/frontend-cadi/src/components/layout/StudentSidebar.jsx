import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiHome, FiGrid, FiHeart, FiUsers, FiCalendar, FiLogOut } from 'react-icons/fi';

const NavItem = ({ to, icon, children }) => (
  <NavLink 
    to={to} 
    className={({ isActive }) => (isActive ? "sidebar-nav-item active" : "sidebar-nav-item")}
  >
    {icon}
    <span>{children}</span>
  </NavLink>
);

export default function StudentSidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        {/* Podemos añadir un logo más adelante si es necesario */}
        <h1>Icesi Bienestar</h1>
        <span>Estudiante</span>
      </div>
      <nav className="sidebar-nav">
        <NavItem to="/inicio" icon={<FiHome />}>Inicio</NavItem>
        <NavItem to="/explorar-cadi" icon={<FiGrid />}>Explorar CADI</NavItem>
        <NavItem to="/citas" icon={<FiHeart />}>Citas psicológicas</NavItem>
        <NavItem to="/eventos-psu" icon={<FiUsers />}>Eventos y PSU</NavItem>
        <NavItem to="/mi-calendario" icon={<FiCalendar />}>Mi calendario</NavItem>
      </nav>
      <div className="sidebar-footer">
        <button className="sidebar-nav-item">
          <FiLogOut />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}