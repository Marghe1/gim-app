import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  onChange: (n: number) => void;
  size?: number;
}

/** A simple 1–5 star picker. Clicking a star sets the rating to that number. */
export default function StarRating({ value, onChange, size = 32 }: StarRatingProps) {
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-label={`${n} / 5`}
            aria-pressed={filled}
            style={{
              background: 'none',
              border: 'none',
              padding: 4,
              cursor: 'pointer',
              lineHeight: 0,
            }}
          >
            <Star
              size={size}
              style={{ color: 'var(--amber)' }}
              fill={filled ? 'var(--amber)' : 'none'}
            />
          </button>
        );
      })}
    </div>
  );
}
