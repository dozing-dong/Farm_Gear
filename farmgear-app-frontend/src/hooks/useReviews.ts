import { useCallback, useEffect, useState } from 'react';
import {
  farmGearAPI,
  handleApiError,
  type CreateReviewRequest,
  type Review,
  type ReviewListParams,
} from '../lib/api';

interface ReviewState {
  reviews: Review[];
  userReview: Review | null;
  isLoading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  isInitialized: boolean;
}

// Global state to avoid multiple components calling API repeatedly
let globalReviewState: ReviewState = {
  reviews: [],
  userReview: null,
  isLoading: false,
  error: null,
  totalPages: 0,
  currentPage: 1,
  isInitialized: false,
};

const listeners: Set<() => void> = new Set();

const reviewStateManager = {
  getState: () => globalReviewState,

  setState: (newState: Partial<ReviewState>) => {
    globalReviewState = { ...globalReviewState, ...newState };
    listeners.forEach((listener) => listener());
  },

  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  // Get review list
  fetchReviews: async (params: ReviewListParams = {}) => {
    reviewStateManager.setState({ isLoading: true, error: null });

    try {
      const response = await farmGearAPI.getReviewList(params);

      if (response.success && response.data) {
        reviewStateManager.setState({
          reviews: response.data.items,
          totalPages: response.data.totalPages,
          currentPage: response.data.pageNumber,
          isLoading: false,
          isInitialized: true,
        });
      } else {
        reviewStateManager.setState({
          error: response.message || 'Failed to fetch reviews',
          isLoading: false,
        });
      }

      return response;
    } catch (error) {
      const errorMessage = handleApiError(error);
      reviewStateManager.setState({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  // Get user's review for specific equipment
  fetchUserReviewForEquipment: async (equipmentId: string) => {
    try {
      const response = await farmGearAPI.getUserReviewForEquipment(equipmentId);

      if (response.success) {
        reviewStateManager.setState({
          userReview: response.data || null,
        });
      }

      return response.data || null;
    } catch {
      // Error handled silently
      return null;
    }
  },

  // Create review
  createReview: async (reviewData: CreateReviewRequest) => {
    reviewStateManager.setState({ isLoading: true, error: null });

    try {
      const response = await farmGearAPI.createReview(reviewData);

      if (response.success && response.data) {
        // Update local state
        reviewStateManager.setState({
          reviews: [response.data, ...globalReviewState.reviews],
          userReview: response.data,
          isLoading: false,
        });

        // Send notification event
        window.dispatchEvent(
          new CustomEvent('reviewCreated', {
            detail: response.data,
          })
        );
      } else {
        reviewStateManager.setState({
          error: response.message || 'Failed to create review',
          isLoading: false,
        });
      }

      return response;
    } catch (error) {
      const errorMessage = handleApiError(error);
      reviewStateManager.setState({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  // Check review permission
  checkReviewPermission: async (orderId: string): Promise<boolean> => {
    try {
      const response = await farmGearAPI.checkReviewPermission(orderId);
      return response.success && response.data === true;
    } catch {
      // Error handled silently
      return false;
    }
  },

  // Reset state
  reset: () => {
    reviewStateManager.setState({
      reviews: [],
      userReview: null,
      isLoading: false,
      error: null,
      totalPages: 0,
      currentPage: 1,
      isInitialized: false,
    });
  },
};

export const useReviews = () => {
  const [localState, setLocalState] = useState(reviewStateManager.getState());

  useEffect(() => {
    const unsubscribe = reviewStateManager.subscribe(() => {
      setLocalState(reviewStateManager.getState());
    });

    return unsubscribe;
  }, []);

  const fetchReviews = useCallback(async (params: ReviewListParams = {}) => {
    return reviewStateManager.fetchReviews(params);
  }, []);

  const fetchUserReviewForEquipment = useCallback(async (equipmentId: string) => {
    return reviewStateManager.fetchUserReviewForEquipment(equipmentId);
  }, []);

  const createReview = useCallback(async (reviewData: CreateReviewRequest) => {
    return reviewStateManager.createReview(reviewData);
  }, []);

  const checkReviewPermission = useCallback(async (orderId: string) => {
    return reviewStateManager.checkReviewPermission(orderId);
  }, []);

  const reset = useCallback(() => {
    reviewStateManager.reset();
  }, []);

  return {
    ...localState,
    fetchReviews,
    fetchUserReviewForEquipment,
    createReview,
    checkReviewPermission,
    reset,
  };
};
