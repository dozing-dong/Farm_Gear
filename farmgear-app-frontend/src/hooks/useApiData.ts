import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../lib/toast';
import { handleApiError, type ApiResponse } from '../lib/api';

interface UseApiDataOptions {
  redirectOnError?: string;
  showErrorToast?: boolean;
  autoFetch?: boolean;
}

export function useApiData<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  options: UseApiDataOptions = {}
) {
  const { redirectOnError, showErrorToast = true, autoFetch = true } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiCall();

      if (response.success && response.data) {
        setData(response.data);
      } else {
        const errorMessage = response.message || 'Failed to load data';
        setError(errorMessage);

        if (showErrorToast) {
          showToast({
            type: 'error',
            title: 'Loading Failed',
            description: errorMessage,
            duration: 5000,
          });
        }

        if (redirectOnError) {
          navigate(redirectOnError);
        }
      }
    } catch (err: unknown) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);

      if (errorMessage.includes('404') && redirectOnError) {
        if (showErrorToast) {
          showToast({
            type: 'error',
            title: 'Not Found',
            description: 'The requested resource does not exist.',
            duration: 5000,
          });
        }
        navigate(redirectOnError);
        return;
      }

      if (showErrorToast) {
        showToast({
          type: 'error',
          title: 'Loading Failed',
          description: errorMessage,
          duration: 5000,
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [apiCall, navigate, redirectOnError, showErrorToast, showToast]);

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch, fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch,
    setData,
  };
}
