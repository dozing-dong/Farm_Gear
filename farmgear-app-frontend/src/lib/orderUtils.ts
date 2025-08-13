// Lightweight order time checking utility
import { farmGearAPI, type Order } from './api';

/**
 * Check if order has expired (end time has passed)
 */
export const isOrderExpired = (order: Order): boolean => {
  const now = new Date();
  const endDate = new Date(order.endDate);
  return endDate < now && order.status === 1; // Only check orders with Accepted status
};

/**
 * Check and automatically complete expired orders
 * Returns the number of completed orders
 */
export const checkAndCompleteExpiredOrders = async (orders: Order[]): Promise<number> => {
  const expiredOrders = orders.filter(isOrderExpired);

  if (expiredOrders.length === 0) {
    return 0;
  }

  let completedCount = 0;

  // Process expired orders in batch
  for (const order of expiredOrders) {
    try {
      const response = await farmGearAPI.updateOrderStatus(order.id, 3); // 3 = Completed
      if (response.success) {
        completedCount++;

        // Send custom event to notify other components
        window.dispatchEvent(
          new CustomEvent('orderAutoCompleted', {
            detail: {
              orderId: order.id,
              equipmentName: order.equipmentName,
              renterName: order.renterName,
            },
          })
        );
      }
    } catch {
      // Error handled silently - continue processing other orders
    }
  }

  return completedCount;
};

/**
 * Get order remaining time (human readable format)
 */
export const getOrderTimeRemaining = (order: Order): string => {
  const now = new Date();
  const endDate = new Date(order.endDate);
  const diffMs = endDate.getTime() - now.getTime();

  if (diffMs <= 0) {
    return 'Expired';
  }

  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    return '1 day left';
  } else if (diffDays > 1) {
    return `${diffDays} days left`;
  } else {
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
    return `${diffHours} hours left`;
  }
};
