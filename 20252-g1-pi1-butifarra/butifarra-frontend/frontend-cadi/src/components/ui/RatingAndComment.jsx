import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import StarRating from './StarRating';
import './RatingAndComment.css';

// Añadimos una nueva propiedad: buttonText
export default function RatingAndComment({
  initialRating = 0,
  initialComment = '',
  disabled = false,
  onSubmit,
  buttonText = "Guardar Calificación", // Texto por defecto
}) {
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment);
  const [error, setError] = useState('');

  // Sincroniza el estado interno si las propiedades iniciales cambian
  useEffect(() => {
    setRating(initialRating);
    setComment(initialComment);
  }, [initialRating, initialComment]);

  const handleSave = () => {
    if (comment.length > 500) {
      setError('Máximo 500 caracteres');
      return;
    }
    if (rating === 0) {
      setError('Debes seleccionar al menos una estrella');
      return;
    }
    setError('');
    onSubmit(rating, comment);
    // Limpiamos los campos después de enviar si es un nuevo comentario
    if (initialRating === 0 && initialComment === '') {
      setRating(0);
      setComment('');
    }
  };

  return (
    <div className={`rating-comment-container ${disabled ? 'disabled' : ''}`}>
      <StarRating initialRating={rating} onRate={setRating} disabled={disabled} />
      
      <textarea
        className="comment-textarea"
        placeholder="Añade un comentario opcional..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength="500"
        disabled={disabled}
      />
      
      <div className="footer">
        <span className="char-counter">{comment.length} / 500</span>
        {/* Usamos el nuevo texto del botón */}
        <button className="save-button" onClick={handleSave} disabled={disabled}>
          {buttonText}
        </button>
      </div>
      {error && <p className="error-message">{error}</p>}
    </div>
  );
}

RatingAndComment.propTypes = {
  initialRating: PropTypes.number,
  initialComment: PropTypes.string,
  disabled: PropTypes.bool,
  onSubmit: PropTypes.func.isRequired,
  buttonText: PropTypes.string, // Añadimos la nueva propiedad
};