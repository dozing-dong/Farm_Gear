import { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { farmGearAPI, type Equipment } from '../lib/api';
import { useApiData } from './useApiData';

export function useEquipmentDetail() {
  const { id } = useParams<{ id: string }>();

  const apiCall = useCallback(() => {
    if (!id) {
      throw new Error('Equipment ID is required');
    }
    return farmGearAPI.getEquipmentById(id);
  }, [id]);

  const {
    data: equipment,
    isLoading,
    error,
    refetch,
    setData: setEquipment,
  } = useApiData<Equipment>(apiCall, {
    redirectOnError: '/equipment',
    showErrorToast: true,
    autoFetch: true, // Simplified: use auto-fetch directly
  });

  return {
    equipment,
    equipmentId: id,
    isLoading,
    error,
    refetch,
    updateEquipment: setEquipment,
  };
}
