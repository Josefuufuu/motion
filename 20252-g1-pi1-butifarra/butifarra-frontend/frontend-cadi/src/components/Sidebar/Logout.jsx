import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import logoutIcon from "../../assets/icons/logout-icon.png";
import { useAuth } from "../../context/AuthContext.jsx";

export const Logout = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error al cerrar sesión", error);
    } finally {
      navigate("/login", { replace: true });
    }
  }, [logout, navigate]);

  return (
    <div className="w-full px-4 pt-10">
      <button
        type="button"
        onClick={handleLogout}
        className="flex w-full items-center gap-2 rounded px-4 py-2 text-left text-red-600 transition-colors hover:bg-red-100"
      >
        <img src={logoutIcon} alt="" className="h-5 w-5" aria-hidden="true" />
        <span className="text-base font-medium">Cerrar sesión</span>
      </button>
    </div>
  );
};
