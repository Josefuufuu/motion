import React, { useState } from 'react';
import PropTypes from 'prop-types';
import RatingAndComment from './RatingAndComment';
import StarRating from './StarRating';
import './CommentList.css';

// Añadimos una nueva propiedad: onDelete
export default function CommentList({ comments = [], onEditSave = () => {}, onDelete = () => {} }) {
  const [editingId, setEditingId] = useState(null);

  const handleEditSave = (id, newRating, newComment) => {
    onEditSave(id, newRating, newComment);
    setEditingId(null);
  };

  // NUEVO: Función para confirmar antes de borrar
  const handleDeleteClick = (id) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este comentario?")) {
      onDelete(id);
    }
  };

  if (comments.length === 0) {
    return (
      <div className="comment-list">
        <h3>Comentarios publicados</h3>
        <p className="no-comments-message">Aún no hay comentarios para esta actividad.</p>
      </div>
    );
  }

  return (
    <div className="comment-list">
      {/* 1. Cambiamos el título */}
      <h3>Comentarios publicados</h3>
      {comments.map((comment) => (
        <div key={comment.id} className="comment-item">
          {editingId === comment.id ? (
            <div className="editing-container">
              <RatingAndComment
                initialRating={comment.rating}
                initialComment={comment.text}
                buttonText="Guardar Cambios"
                onSubmit={(newRating, newComment) => handleEditSave(comment.id, newRating, newComment)}
              />
              <button className="cancel-button" onClick={() => setEditingId(null)}>
                Cancelar
              </button>
            </div>
          ) : (
            <>
              <div className="comment-header">
                <span className="comment-author">{comment.author}</span>
                <span className="comment-date">{comment.date}</span>
              </div>
              <StarRating initialRating={comment.rating} disabled={true} />
              <p className="comment-text">{comment.text}</p>
              {comment.isCurrentUser && (
                <div className="comment-actions">
                  <button className="edit-button" onClick={() => setEditingId(comment.id)}>
                    Editar
                  </button>
                  {/* 2. Añadimos el botón "Eliminar" */}
                  <button className="delete-button" onClick={() => handleDeleteClick(comment.id)}>
                    Eliminar
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}

CommentList.propTypes = {
  comments: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      author: PropTypes.string.isRequired,
      date: PropTypes.string.isRequired,
      rating: PropTypes.number.isRequired,
      text: PropTypes.string,
      isCurrentUser: PropTypes.bool,
    })
  ),
  onEditSave: PropTypes.func,
  onDelete: PropTypes.func, // Añadimos la nueva propiedad
};