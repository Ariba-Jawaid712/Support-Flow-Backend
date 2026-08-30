import React, { useState } from 'react';
import { Star } from 'lucide-react';

export const StarRating = ({ rating = 0, onChange = null, readonly = false, size = 20 }) => {
  const [hoverRating, setHoverRating] = useState(0);

  const displayRating = hoverRating || rating;

  return (
    <div className="star-rating" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= displayRating;

        if (readonly || !onChange) {
          return (
            <Star
              key={star}
              size={size}
              className={isFilled ? 'star-filled' : 'star-empty'}
              fill={isFilled ? '#f59e0b' : 'none'}
              color={isFilled ? '#f59e0b' : '#cbd5e1'}
            />
          );
        }

        return (
          <button
            type="button"
            key={star}
            className={`star-btn ${isFilled ? 'filled' : ''}`}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <Star
              size={size}
              fill={isFilled ? '#f59e0b' : 'none'}
              color={isFilled ? '#f59e0b' : '#94a3b8'}
            />
          </button>
        );
      })}
    </div>
  );
};
