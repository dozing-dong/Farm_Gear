import { useCallback, useEffect, useState } from 'react';
import {
  farmGearAPI,
  handleApiError,
  type CreateOrderRequest,
  type Order,
  type OrderListParams,
} from '../lib/api';
import { checkAndCompleteExpiredOrders } from '../lib/orderUtils';

interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  isLoading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  isInitialized: boolean;
}

// Global state to avoid multiple components calling API repeatedly (reuse Auth pattern)
let globalOrderState: OrderState = {
  orders: [],
  currentOrder: null,
  isLoading: false,
  error: null,
  totalPages: 0,
  currentPage: 1,
  isInitialized: false,
};

const globalOrderListeners: Set<() => void> = new Set();

// Global state manager (completely reuse Auth pattern)
const orderStateManager = {
  getState: () => globalOrderState,

  setState: (newState: Partial<OrderState>) => {
    globalOrderState = { ...globalOrderState, ...newState };
    globalOrderListeners.forEach((listener) => listener());
  },

  subscribe: (listener: () => void) => {
    globalOrderListeners.add(listener);
    return () => {
      globalOrderListeners.delete(listener);
    };
  },

  // Get order list
  fetchOrders: async (params: OrderListParams = {}) => {
    orderStateManager.setState({ isLoading: true, error: null });

    try {
      const response = await farmGearAPI.getOrderList(params);

      if (response.success && response.data) {
        // Check and automatically complete expired orders
        const completedCount = await checkAndCompleteExpiredOrders(response.data.items);

        // If orders were auto-completed, re-fetch data to ensure state sync
        if (completedCount > 0) {
          // Recursive call once to get latest state, but don't check expiry again
          const refreshResponse = await farmGearAPI.getOrderList(params);
          if (refreshResponse.success && refreshResponse.data) {
            orderStateManager.setState({
              orders: refreshResponse.data.items,
              totalPages: refreshResponse.data.totalPages,
              currentPage: refreshResponse.data.pageNumber,
              isLoading: false,
              isInitialized: true,
            });
          }
        } else {
          orderStateManager.setState({
            orders: response.data.items,
            totalPages: response.data.totalPages,
            currentPage: response.data.pageNumber,
            isLoading: false,
            isInitialized: true,
          });
        }
      } else {
        orderStateManager.setState({
          error: response.message || 'Failed to load orders',
          isLoading: false,
        });
      }
    } catch (error) {
      orderStateManager.setState({
        error: handleApiError(error),
        isLoading: false,
      });
    }
  },

  // Create order
  createOrder: async (orderData: CreateOrderRequest) => {
    orderStateManager.setState({ isLoading: true, error: null });

    try {
      const response = await farmGearAPI.createOrder(orderData);

      if (response.success && response.data) {
        // Update local state
        orderStateManager.setState({
          orders: [response.data, ...globalOrderState.orders],
          currentOrder: response.data,
          isLoading: false,
        });

        // Send notification event (reuse Auth's event pattern)
        window.dispatchEvent(
          new CustomEvent('orderCreated', {
            detail: response.data,
          })
        );
      } else {
        orderStateManager.setState({
          error: response.message || 'Failed to create order',
          isLoading: false,
        });
      }

      return response;
    } catch (error) {
      const errorMessage = handleApiError(error);
      orderStateManager.setState({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  // Update order status
  updateOrderStatus: async (orderId: string, status: number) => {
    const response = await farmGearAPI.updateOrderStatus(orderId, status);

    if (response.success) {
      // Update local order status
      const updatedOrders = globalOrderState.orders.map((order) =>
        order.id === orderId ? { ...order, status: status as 0 | 1 | 2 | 3 | 4 | 5 } : order
      );

      orderStateManager.setState({ orders: updatedOrders });

      // Send status update event
      window.dispatchEvent(
        new CustomEvent('orderStatusUpdated', {
          detail: { orderId, status },
        })
      );
    }

    return response;
  },

  // Refresh single order and merge to cache for immediate status reflection after payment
  refreshOne: async (orderId: string) => {
    try {
      const response = await farmGearAPI.getOrderDetails(orderId);
      if (response.success && response.data) {
        const merged = globalOrderState.orders.map((o) => (o.id === orderId ? response.data! : o));
        // If current list doesn't have this order (pagination reasons), insert it at front
        const exists = merged.some((o) => o.id === orderId);
        const nextOrders = exists ? merged : [response.data, ...globalOrderState.orders];
        orderStateManager.setState({ orders: nextOrders });
      }
    } catch (error) {
      // Silent failure, maintain current state
    }
  },

  // Immediately update local order status (optimistic update)
  setLocalStatus: (orderId: string, status: number) => {
    const updatedOrders = globalOrderState.orders.map((order) =>
      order.id === orderId ? { ...order, status: status as 0 | 1 | 2 | 3 | 4 | 5 } : order
    );
    orderStateManager.setState({ orders: updatedOrders });
    window.dispatchEvent(new CustomEvent('orderStatusUpdated', { detail: { orderId, status } }));
  },

  // Reset state (if needed)
  reset: () => {
    orderStateManager.setState({
      orders: [],
      currentOrder: null,
      isLoading: false,
      error: null,
      totalPages: 0,
      currentPage: 1,
      isInitialized: false,
    });
  },
};

export const useOrders = () => {
  const [orderState, setOrderState] = useState<OrderState>(globalOrderState);

  // Sync global state (reuse Auth pattern)
  useEffect(() => {
    const unsubscribe = orderStateManager.subscribe(() => {
      setOrderState({ ...globalOrderState });
    });

    return unsubscribe;
  }, []);

  // Get data on initialization (optional, call as needed)
  const refreshOrders = useCallback((params?: OrderListParams) => {
    orderStateManager.fetchOrders(params);
  }, []);

  return {
    // State
    orders: orderState.orders,
    currentOrder: orderState.currentOrder,
    isLoading: orderState.isLoading,
    error: orderState.error,
    totalPages: orderState.totalPages,
    currentPage: orderState.currentPage,
    isInitialized: orderState.isInitialized,

    // Methods
    createOrder: orderStateManager.createOrder,
    updateOrderStatus: orderStateManager.updateOrderStatus,
    refreshOrders,
    refreshOrder: orderStateManager.refreshOne,
    setLocalStatus: orderStateManager.setLocalStatus,

    // Direct API calls (if needed)
    getOrderDetails: farmGearAPI.getOrderDetails,
  };
};
