import { Link } from 'react-router-dom';
import { Shield, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import notificationIcon from '../../assets/icons/notification-icon.png';
import profileIcon from '../../assets/icons/profile-icon.png';

export const TopBar = () => {
  const { user, isAdmin } = useAuth();

  return (
    <div className="sticky top-0 right-0 z-50">
      <div className="absolute top-4 right-4 flex items-center gap-4">
        {/* Badge de Rol */}
        {user && (
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm ${
            isAdmin() 
              ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white' 
              : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
          }`}>
            {isAdmin() ? (
              <>
                <Shield size={16} />
                <span>Administrador</span>
              </>
            ) : (
              <>
                <User size={16} />
                <span>Estudiante</span>
              </>
            )}
          </div>
        )}

        <Link
          to="/notificaciones"
          className="transition-transform duration-200 hover:scale-105 active:scale-95"
        >
          <img
            src={notificationIcon}
            alt="notification"
            className="w-[33px] h-[33px] hover:drop-shadow-md"
            style={{ filter: 'drop-shadow(0 0 4px rgba(160, 120, 255, 0.4))' }}
          />
        </Link>
        <Link
          to="/perfil"
          className="transition-transform duration-200 hover:scale-105 active:scale-95"
        >
          <img
            src={profileIcon}
            alt="profile"
            className="w-[33px] h-[33px] hover:drop-shadow-md"
            style={{ filter: 'drop-shadow(0 0 4px rgba(160, 120, 255, 0.4))' }}
          />
        </Link>
      </div>
    </div>
  );
};