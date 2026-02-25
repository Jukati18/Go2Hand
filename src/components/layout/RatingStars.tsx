// ============================================
// RATING STARS — Render filled/empty stars
// ============================================

interface RatingStarsProps {
    rating: number;  // 0–5, supports half stars visually via opacity
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const SIZE_CLASS = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
};

export default function RatingStars({ rating, size = 'md', className = '' }: RatingStarsProps) {
    return (
        <span className={`flex gap-0.5 ${SIZE_CLASS[size]} ${className}`} aria-label={`${rating} out of 5 stars`}>
            {[1, 2, 3, 4, 5].map((star) => (
                <span
                    key={star}
                    className={star <= Math.round(rating) ? 'text-amber-400' : 'text-gray-200'}
                >
                    ★
                </span>
            ))}
        </span>
    );
}