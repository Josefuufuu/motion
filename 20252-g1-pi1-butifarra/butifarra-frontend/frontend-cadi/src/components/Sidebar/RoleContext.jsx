import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext.jsx";

const RoleContext = createContext();

export const RoleProvider = ({ children }) => {
  const [role, setRole] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) { setRole(null); return; }
    const isAdmin = user.is_staff || user.is_superuser || user.profile?.role === 'ADMIN' || user.profile?.is_admin;
    setRole(isAdmin ? 'Administrador' : 'Estudiante');
  }, [user]);

  return (
    <RoleContext.Provider value={role}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => useContext(RoleContext);