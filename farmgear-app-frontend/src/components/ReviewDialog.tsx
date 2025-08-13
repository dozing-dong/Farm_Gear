import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

import { CalendarDays, ClipboardList, DollarSign, Star, Tractor } from 'lucide-react';
import { useReviews } from '../hooks/useReviews';
import type { Order } from '../lib/api';
import { useToast } from '../lib/toast';

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
  onReviewSubmitted?: () => void;
}

export function ReviewDialog({ open, onOpenChange, order, onReviewSubmitted }: ReviewDialogProps) {
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createReview } = useReviews();
  const { showToast } = useToast();

  // Reset form
  useEffect(() => {
    if (open) {
      setRating(5);
      setContent('');
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!rating) {
      showToast({
        title: 'Error',
        description: 'Please select a rating',
        type: 'error',
      });
      return;
    }

    if (!content.trim()) {
      showToast({
        title: 'Error',
        description: 'Please enter review content',
        type: 'error',
      });
      return;
    }

    if (content.length > 500) {
      showToast({
        title: 'Error',
        description: 'Review content cannot exceed 500 characters',
        type: 'error',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create review directly, rely on backend permission validation
      const response = await createReview({
        equipmentId: order.equipmentId,
        orderId: order.id,
        rating,
        content: content.trim(),
      });

      if (response.success) {
        showToast({
          title: 'Success',
          description: 'Review submitted successfully',
          type: 'success',
        });
        onOpenChange(false);
        onReviewSubmitted?.();
      } else {
        showToast({
          title: 'Error',
          description: response.message || 'Failed to submit review',
          type: 'error',
        });
      }
    } catch {
      showToast({
        title: 'Error',
        description: 'Failed to submit review, please try again later',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRating(value)}
            className="transition-colors"
            disabled={isSubmitting}
            aria-label={`Rate ${value} star${value > 1 ? 's' : ''}`}
          >
            <Star
              className={value <= rating ? 'w-6 h-6 text-yellow-400' : 'w-6 h-6 text-gray-300'}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600">
          {rating === 1 && 'Very Dissatisfied'}
          {rating === 2 && 'Dissatisfied'}
          {rating === 3 && 'Average'}
          {rating === 4 && 'Satisfied'}
          {rating === 5 && 'Very Satisfied'}
        </span>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Rate Equipment
          </DialogTitle>
          <DialogDescription>
            Please rate your rental experience. Your feedback will help other users make better
            choices.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Equipment information */}
          <div className="bg-gray-50 p-3 rounded-md space-y-1">
            <p className="font-medium flex items-center gap-2">
              <Tractor className="w-4 h-4 text-gray-600" />
              {order.equipmentName}
            </p>
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              Order #{order.id.slice(0, 8)}
            </p>
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              {new Date(order.startDate).toLocaleDateString()} -{' '}
              {new Date(order.endDate).toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />${order.totalAmount.toFixed(2)}
            </p>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium mb-2">Rating</label>
            {renderStars()}
          </div>

          {/* Review content */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Review Content <span className="text-gray-400">({content.length}/500)</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Please share your experience, including equipment performance, ease of operation, service quality, etc..."
              className="w-full min-h-[120px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              maxLength={500}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
