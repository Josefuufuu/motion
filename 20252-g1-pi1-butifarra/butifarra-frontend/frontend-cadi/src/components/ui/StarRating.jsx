import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FaStar } from 'react-icons/fa';
import './StarRating.css'; 

export default function StarRating({
  totalStars = 5,
  initialRating = 0,
  disabled = false,
  onRate = () => {},
}) {
  const [rating, setRating] = useState(initialRating);
  const [hover, setHover] = useState(null);

  const handleClick = (ratingValue) => {
    if (disabled) return;
    setRating(ratingValue);
    onRate(ratingValue);
  };

  return (
    <div className={`star-rating-container ${disabled ? 'disabled' : ''}`}>
      {[...Array(totalStars)].map((star, index) => {
        const ratingValue = index + 1;
        return (
          <label key={index}>
            <input
              type="radio"
              name="rating"
              value={ratingValue}
              onClick={() => handleClick(ratingValue)}
              disabled={disabled}
            />
            <FaStar
              className="star"
              color={ratingValue <= (hover || rating) ? "#ffc107" : "#e4e5e9"}
              size={30}
              onMouseEnter={() => !disabled && setHover(ratingValue)}
              onMouseLeave={() => !disabled && setHover(null)}
            />
          </label>
        );
      })}
    </div>
  );
}

StarRating.propTypes = {
  totalStars: PropTypes.number,
  initialRating: PropTypes.number,
  disabled: PropTypes.bool,
  onRate: PropTypes.func,
};