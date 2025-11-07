// src/pages/TestRatingPage.jsx

import React, { useState } from 'react';
import RatingAndComment from '../components/ui/RatingAndComment';
import CommentList from '../components/ui/CommentList';
import AppLayout from '../components/layout/AppLayout.jsx';

export default function TestRatingPage() {
  const [comments, setComments] = useState([]);

  // --- TU LÓGICA EXISTENTE---
  const handlePublishReview = (newRating, newComment) => {
    const newReview = { 
      id: Date.now(),
      author: 'Tú (Estudiante)', 
      date: 'Ahora', 
      rating: newRating, 
      text: newComment,
      isCurrentUser: true,
    };
    setComments(prevComments => [newReview, ...prevComments]);
  };

  const handleEditSave = (commentId, newRating, newComment) => {
    setComments(prevComments =>
      prevComments.map(c =>
        c.id === commentId
          ? { ...c, rating: newRating, text: newComment, date: 'Editado ahora' }
          : c
      )
    );
  };

  const handleDeleteComment = (commentId) => {
    setComments(prevComments =>
      prevComments.filter(comment => comment.id !== commentId)
    );
  };

  return (
    <AppLayout>
      <div className="page-container" style={{ margin: 0, maxWidth: '100%', padding: 0 }}>
        <header className="page-header">
          <h1>Actividad: Taller de Fotografía (Finalizada)</h1>
          <p>Has asistido a esta actividad. ¡Por favor, déjanos tu opinión!</p>
        </header>
        <div className="form-card">
          <RatingAndComment
            onSubmit={handlePublishReview}
            buttonText="Publicar Comentario"
          />
          <CommentList
            comments={comments}
            onEditSave={handleEditSave}
            onDelete={handleDeleteComment}
          />
        </div>
      </div>
    </AppLayout>
  );
}