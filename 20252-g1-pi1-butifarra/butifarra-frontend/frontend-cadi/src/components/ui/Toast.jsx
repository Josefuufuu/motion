import React, { useEffect } from 'react';
import './Toast.css';

export default function Toast({ message, onUndo, onDismiss }) {
  // Configura un temporizador para que el toast desaparezca solo
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 5000); // Desaparece después de 5 segundos

    // Limpia el temporizador si el componente se desmonta
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="toast-container">
      <span>{message}</span>
      {onUndo && (
        <button className="undo-button" onClick={onUndo}>
          Deshacer
        </button>
      )}
    </div>
  );
}