import { Star } from 'lucide-react';
import { useEffect } from 'react';
import { useReviews } from '../hooks/useReviews';
import { Card, CardContent } from './ui/card';

interface ReviewListProps {
  equipmentId: string;
}

export function ReviewList({ equipmentId }: ReviewListProps) {
  const { reviews, isLoading, error, fetchReviews } = useReviews();

  useEffect(() => {
    if (equipmentId) {
      fetchReviews({ equipmentId, pageSize: 10 });
    }
  }, [equipmentId, fetchReviews]);

  const renderStars = (rating: number) => {
    return (
      <span className="inline-flex">
        {Array.from({ length: 5 }).map((_, idx) => (
          <Star
            key={idx}
            className={idx < rating ? 'w-4 h-4 text-yellow-400' : 'w-4 h-4 text-gray-300'}
            aria-hidden="true"
          />
        ))}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-12 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">Failed to load reviews: {error}</div>;
  }

  if (!reviews || reviews.length === 0) {
    return <div className="text-center py-8 text-gray-500">No reviews yet</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">User Reviews ({reviews.length})</h3>

      {reviews.map((review) => (
        <Card key={review.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-medium">{review.userName}</p>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  {renderStars(review.rating)}
                  <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <p className="text-gray-700 whitespace-pre-wrap">{review.content}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
