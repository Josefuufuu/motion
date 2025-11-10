import React from "react";
import PropTypes from "prop-types";
import homeIcon from "../../assets/icons/home-icon.png";

export const DashboardHeader = ({ onExport, loading, exporting, hasError }) => {
  const hasHandler = typeof onExport === "function";
  const disabled = !hasHandler || loading || exporting || hasError;

  return (
    <div className="px-6 py-4 bg-white">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <img src={homeIcon} alt="Home" className="w-6 h-6" />
          <h1 className="text-xl font-bold text-slate-800">Panel general</h1>
        </div>
        {hasHandler ? (
          <button
            type="button"
            onClick={onExport}
            disabled={disabled}
            className={`inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
              disabled
                ? "cursor-not-allowed border-emerald-300 bg-emerald-200 text-emerald-700"
                : "border-emerald-600 bg-emerald-500 text-white hover:bg-emerald-600"
            }`}
          >
            {exporting ? "Descargando..." : "Descargar métricas"}
          </button>
        ) : null}
      </div>
      <p className="text-[16px] text-stone-500 mt-1 whitespace-nowrap">
        Vista general del sistema de Bienestar Universitario
      </p>
    </div>
  );
};

DashboardHeader.propTypes = {
  onExport: PropTypes.func,
  loading: PropTypes.bool,
  exporting: PropTypes.bool,
  hasError: PropTypes.bool,
};

DashboardHeader.defaultProps = {
  onExport: undefined,
  loading: false,
  exporting: false,
  hasError: false,
};
