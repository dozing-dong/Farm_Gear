import { useCallback } from 'react';
import { farmGearAPI, type User } from '../lib/api';
import { useApiData } from './useApiData';

export function useUserProfile() {
  // Use useCallback to stabilize function reference, avoid infinite loop
  const getUserProfileApi = useCallback(() => farmGearAPI.getUserProfile(), []);

  const {
    data: user,
    isLoading,
    error,
    refetch,
    setData: setUser,
  } = useApiData<User>(getUserProfileApi, {
    redirectOnError: '/login',
    showErrorToast: false,
  });

  return {
    user,
    isLoading,
    error,
    refetch,
    updateUser: setUser,
  };
}
