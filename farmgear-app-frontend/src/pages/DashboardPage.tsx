// React import removed - using new JSX Transform
import {
  BarChart3,
  BookOpenText,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Eye,
  Factory,
  Hourglass,
  Loader2,
  Plus,
  Search,
  Target,
  Tractor,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReviewDialog } from '../components/ReviewDialog';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useAuth } from '../hooks/useAuth';
import { useOrders } from '../hooks/useOrders';
import { useReviews } from '../hooks/useReviews';
import { farmGearAPI, type Order } from '../lib/api';
import { getOrderTimeRemaining } from '../lib/orderUtils';
import { useToast } from '../lib/toast';

function DashboardPage() {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  const { orders, isLoading, refreshOrders, updateOrderStatus, refreshOrder, setLocalStatus } =
    useOrders();
  const { showToast } = useToast();
  const { fetchUserReviewForEquipment } = useReviews();

  // Review related state
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedOrderForReview, setSelectedOrderForReview] = useState<Order | null>(null);
  const [reviewedOrders, setReviewedOrders] = useState<Set<string>>(new Set());

  // Use useMemo to optimize order grouping logic, avoid unnecessary recalculations
  const orderGroups = useMemo(() => {
    if (!user?.id)
      return {
        myOrders: [],
        equipmentOrders: [],
        myPendingOrders: [],
        myAcceptedOrders: [],
        myActiveRentals: [],
        myCompletedOrders: [],
        pendingRequests: [],
        acceptedRentOuts: [],
        activeRentOuts: [],
        completedRentOuts: [],
      };

    const myOrders = orders.filter((order) => user.id === order.renterId);
    const equipmentOrders = orders.filter((order) => user.id !== order.renterId);

    return {
      myOrders,
      equipmentOrders,
      myPendingOrders: myOrders.filter((o) => o.status === 0), // Pending approval
      myAcceptedOrders: myOrders.filter((o) => o.status === 1), // Accepted, pending payment
      myActiveRentals: myOrders.filter((o) => o.status === 2), // Currently renting
      myCompletedOrders: myOrders.filter((o) => o.status === 3), // Historical orders
      pendingRequests: equipmentOrders.filter((o) => o.status === 0), // Pending requests
      acceptedRentOuts: equipmentOrders.filter((o) => o.status === 1), // Accepted pending payment
      activeRentOuts: equipmentOrders.filter((o) => o.status === 2), // Currently rented out
      completedRentOuts: equipmentOrders.filter((o) => o.status === 3), // Historical rent-outs
    };
  }, [orders, user?.id]);

  const {
    myPendingOrders,
    myAcceptedOrders,
    myActiveRentals,
    myCompletedOrders,
    pendingRequests,
    acceptedRentOuts,
    activeRentOuts,
    completedRentOuts,
  } = orderGroups;

  // Calculate statistics
  const activeCount = myActiveRentals.length;
  // Unified collapse/expand control (avoid list height affecting overall layout)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggleSection = (key: string) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  const getVisible = <T,>(key: string, items: T[], defaultCount = 3) =>
    expanded[key] ? items : items.slice(0, defaultCount);

  // Initialize data
  useEffect(() => {
    if (isLoggedIn) {
      refreshOrders();
    }
  }, [isLoggedIn, refreshOrders]);

  // Cache checked equipment IDs to avoid duplicate API calls
  const [checkedEquipmentIds, setCheckedEquipmentIds] = useState<Set<string>>(new Set());

  // Create stable callback function
  const checkReviewedOrders = useCallback(async () => {
    if (!user || myCompletedOrders.length === 0) return;

    const reviewed = new Set<string>();
    const newCheckedIds = new Set(checkedEquipmentIds);

    for (const order of myCompletedOrders) {
      // If already checked this equipment, skip
      if (checkedEquipmentIds.has(order.equipmentId)) {
        // Check if local state already has record
        if (reviewedOrders.has(order.id)) {
          reviewed.add(order.id);
        }
        continue;
      }

      try {
        const review = await fetchUserReviewForEquipment(order.equipmentId);
        newCheckedIds.add(order.equipmentId);
        if (review) {
          reviewed.add(order.id);
        }
      } catch {
        // Error handled silently
        newCheckedIds.add(order.equipmentId); // Mark as checked even on error to avoid repeated attempts
      }
    }

    setCheckedEquipmentIds(newCheckedIds);
    setReviewedOrders(reviewed);
  }, [myCompletedOrders, user, fetchUserReviewForEquipment, checkedEquipmentIds, reviewedOrders]);

  // Check reviewed orders - only execute when truly needed
  useEffect(() => {
    if (!user || myCompletedOrders.length === 0) return;

    // Check if there are new completed orders that need checking
    const hasNewCompletedOrders = myCompletedOrders.some(
      (order) => !checkedEquipmentIds.has(order.equipmentId)
    );

    if (hasNewCompletedOrders) {
      checkReviewedOrders();
    }
  }, [myCompletedOrders, user, checkedEquipmentIds, checkReviewedOrders]);

  // Periodically check expired orders (every 5 minutes)
  useEffect(() => {
    if (!isLoggedIn) return;

    const interval = setInterval(
      () => {
        refreshOrders(); // This will trigger automatic expiry check
      },
      5 * 60 * 1000
    ); // 5 minutes

    return () => clearInterval(interval);
  }, [isLoggedIn, refreshOrders]);

  // Listen for auto-completion events
  useEffect(() => {
    const handleAutoComplete = (event: CustomEvent) => {
      const { equipmentName, renterName } = event.detail;
      showToast({
        type: 'info',
        title: 'Order Auto-Completed',
        description: `Rental of ${equipmentName} by ${renterName} has ended and been completed automatically.`,
        duration: 6000,
      });
    };

    window.addEventListener('orderAutoCompleted', handleAutoComplete as EventListener);

    return () => {
      window.removeEventListener('orderAutoCompleted', handleAutoComplete as EventListener);
    };
  }, [showToast]);

  // Handle review click
  const handleReviewClick = (order: Order) => {
    if (reviewedOrders.has(order.id)) {
      // If already reviewed, navigate to equipment details to view review
      navigate(`/equipment/${order.equipmentId}`);
    } else {
      // If not reviewed yet, open review dialog
      setSelectedOrderForReview(order);
      setReviewDialogOpen(true);
    }
  };

  // Handle after review submission success
  const handleReviewSubmitted = () => {
    if (selectedOrderForReview) {
      setReviewedOrders((prev) => new Set([...prev, selectedOrderForReview.id]));
    }
    refreshOrders(); // Refresh order list
  };

  // Mock payment handling function
  const handleMockPayment = async (orderId: string) => {
    try {
      const response = await farmGearAPI.mockPayOrder(orderId);

      if (response.success) {
        // Optimistic update: immediately set order to InProgress(2)
        setLocalStatus(orderId, 2);
        showToast({
          type: 'success',
          title: 'Payment Successful',
          description: 'Mock payment completed successfully. Order status updated.',
          duration: 3000,
        });

        // Precise refresh: only refresh this order, avoid waiting for pagination API
        // Fallback: fetch entire list
        await refreshOrder(orderId);
        refreshOrders();
      } else {
        showToast({
          type: 'error',
          title: 'Payment Failed',
          description: response.message || 'Failed to process mock payment.',
          duration: 5000,
        });
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Payment Error',
        description: 'An error occurred while processing payment.',
        duration: 5000,
      });
    }
  };

  // Reuse order status update logic from MyEquipmentPage
  const handleOrderStatusUpdate = async (orderId: string, status: number) => {
    try {
      const response = await updateOrderStatus(orderId, status);

      if (response.success) {
        const statusMessages = {
          1: 'Order accepted successfully',
          4: 'Order rejected',
        };

        showToast({
          type: 'success',
          title: 'Order Updated',
          description:
            statusMessages[status as keyof typeof statusMessages] || 'Order status updated',
          duration: 3000,
        });

        refreshOrders();
      }
    } catch {
      showToast({
        type: 'error',
        title: 'Update Failed',
        description: 'Failed to update order status. Please try again later.',
        duration: 5000,
      });
    }
  };

  // Update statistics
  const mockStats = {
    totalEquipment: 12,
    activeRentals: activeCount, // Number of equipment I'm currently renting
    totalEarnings: 2450,
    pendingRequests: pendingRequests.length, // Number of requests I need to handle
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50/30">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-200/10 rounded-full blur-3xl transform translate-x-32 -translate-y-32" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary-300/10 rounded-full blur-3xl transform -translate-x-32 translate-y-32" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page title */}
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-4xl font-bold text-neutral-900 mb-2">Dashboard</h1>
          <p className="text-xl text-neutral-600">
            Welcome back{user?.fullName ? `, ${user.fullName}` : ''}! Here's your rental activity.
          </p>
        </div>

        {/* Statistics card grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in-up animate-stagger-1">
          <Card className="hover:shadow-medium transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Total Equipment</p>
                  <p className="text-3xl font-bold text-neutral-900">{mockStats.totalEquipment}</p>
                </div>
                <div className="text-4xl">
                  <Tractor className="w-8 h-8 text-primary-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-success-600 font-medium">+2</span>
                <span className="text-neutral-600 ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-medium transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Active Rentals</p>
                  <p className="text-3xl font-bold text-neutral-900">{mockStats.activeRentals}</p>
                </div>
                <div className="text-4xl">
                  <BarChart3 className="w-8 h-8 text-primary-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-success-600 font-medium">+5</span>
                <span className="text-neutral-600 ml-1">from last week</span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-medium transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Total Earnings</p>
                  <p className="text-3xl font-bold text-neutral-900">${mockStats.totalEarnings}</p>
                </div>
                <div className="text-4xl">
                  <CreditCard className="w-8 h-8 text-primary-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-success-600 font-medium">+12%</span>
                <span className="text-neutral-600 ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-medium transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Pending Requests</p>
                  <p className="text-3xl font-bold text-neutral-900">{mockStats.pendingRequests}</p>
                </div>
                <div className="text-4xl">
                  <Hourglass className="w-8 h-8 text-primary-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-warning-600 font-medium">Needs attention</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main content area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pending payment orders */}
          {myAcceptedOrders.length > 0 && (
            <div className="animate-fade-in-up animate-stagger-2">
              <Card className="h-[380px] flex flex-col">
                <CardHeader className="pb-2 border-b border-neutral-200">
                  <CardTitle className="flex items-center justify-between">
                    Awaiting Payment
                    <Badge variant="warning">{myAcceptedOrders.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="overflow-hidden pt-3">
                  <div className="space-y-4 max-h-[260px] overflow-y-auto pr-2">
                    {getVisible('myAcceptedOrders', myAcceptedOrders).map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl border border-yellow-200"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="text-2xl">💰</div>
                          <div>
                            <p className="font-medium text-neutral-900">{order.equipmentName}</p>
                            <p className="text-sm text-neutral-600">
                              {new Date(order.startDate).toLocaleDateString()} -{' '}
                              {new Date(order.endDate).toLocaleDateString()}
                            </p>
                            <p className="text-sm font-medium text-yellow-700">
                              Total: ${order.totalAmount}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="warning" size="sm">
                            🕑 Payment Required
                          </Badge>
                          <div className="mt-2">
                            <Button
                              size="sm"
                              onClick={() => handleMockPayment(order.id)}
                              className="text-xs"
                            >
                              💳 Pay Now
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {myAcceptedOrders.length > 3 && (
                    <div className="mt-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleSection('myAcceptedOrders')}
                      >
                        {expanded['myAcceptedOrders'] ? 'Collapse' : 'Show more'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* My current rentals */}
          <div className="animate-fade-in-up animate-stagger-2">
            <Card className="h-[380px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  My Active Rentals
                  <Badge variant="default">{myActiveRentals.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-hidden pt-3">
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="mb-2 flex justify-center">
                      <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
                    </div>
                    <p className="text-neutral-600">Loading rentals...</p>
                  </div>
                ) : myActiveRentals.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">
                      <Tractor className="w-8 h-8 text-neutral-400" />
                    </div>
                    <p className="text-neutral-600 mb-4">No active rentals</p>
                    <Button onClick={() => navigate('/equipment')} size="sm">
                      Browse Equipment
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[280px] overflow-y-auto pr-2">
                    {myActiveRentals.map((order) => {
                      const timeRemaining = getOrderTimeRemaining(order);

                      return (
                        <div
                          key={order.id}
                          className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="text-2xl">
                              <Tractor className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium text-neutral-900">{order.equipmentName}</p>
                              <p className="text-sm text-neutral-600">
                                {new Date(order.startDate).toLocaleDateString()} -{' '}
                                {new Date(order.endDate).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-green-600 font-medium">
                                <span className="inline-flex items-center gap-1 text-green-600">
                                  <Hourglass className="w-3.5 h-3.5" /> {timeRemaining}
                                </span>
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge
                              variant="success"
                              size="sm"
                              className="inline-flex items-center gap-1"
                            >
                              <Tractor className="w-3.5 h-3.5" /> In Progress
                            </Badge>
                            <p className="text-xs text-neutral-500 mt-1">Rental active</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Accepted orders - waiting for payment */}
          {acceptedRentOuts.length > 0 && (
            <div className="animate-fade-in-up animate-stagger-3">
              <Card className="h-[380px] flex flex-col">
                <CardHeader className="pb-2 border-b border-neutral-200">
                  <CardTitle className="flex items-center justify-between">
                    Accepted Orders - Awaiting Payment
                    <Badge variant="warning">{acceptedRentOuts.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="overflow-hidden pt-3">
                  <div className="space-y-4 max-h-[260px] overflow-y-auto pr-2">
                    {getVisible('acceptedRentOuts', acceptedRentOuts).map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl border border-yellow-200"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="text-2xl">💰</div>
                          <div>
                            <p className="font-medium text-neutral-900">{order.equipmentName}</p>
                            <p className="text-sm text-neutral-600">Rented by {order.renterName}</p>
                            <p className="text-sm text-neutral-600">
                              {new Date(order.startDate).toLocaleDateString()} -{' '}
                              {new Date(order.endDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="warning" size="sm">
                            💳 Awaiting Payment
                          </Badge>
                          <p className="text-xs text-neutral-500 mt-1">${order.totalAmount}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {acceptedRentOuts.length > 3 && (
                    <div className="mt-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleSection('acceptedRentOuts')}
                      >
                        {expanded['acceptedRentOuts'] ? 'Collapse' : 'Show more'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* My equipment rental status */}
          <div className="animate-fade-in-up animate-stagger-3">
            <Card className="h-[380px] flex flex-col">
              <CardHeader className="pb-2 border-b border-neutral-200">
                <CardTitle className="flex items-center justify-between">
                  My Equipment Rented Out
                  <Badge variant="default">{activeRentOuts.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-hidden pt-3">
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="mb-2 flex justify-center">
                      <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
                    </div>
                    <p className="text-neutral-600">Loading...</p>
                  </div>
                ) : activeRentOuts.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">
                      <Factory className="w-8 h-8 text-neutral-400" />
                    </div>
                    <p className="text-neutral-600 mb-4">No equipment rented out</p>
                    <Button onClick={() => navigate('/equipment/create')} size="sm">
                      Add Equipment
                    </Button>
                  </div>
                ) : (
                  <div>
                    <div className="space-y-4 max-h-[280px] overflow-y-auto pr-2">
                      {getVisible('activeRentOuts', activeRentOuts, 4).map((order) => {
                        const timeRemaining = getOrderTimeRemaining(order);

                        return (
                          <div
                            key={order.id}
                            className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="text-2xl">
                                <Factory className="w-6 h-6 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium text-neutral-900">
                                  {order.equipmentName}
                                </p>
                                <p className="text-sm text-neutral-600">
                                  Rented by {order.renterName}
                                </p>
                                <p className="text-sm text-neutral-600">
                                  {new Date(order.startDate).toLocaleDateString()} -{' '}
                                  {new Date(order.endDate).toLocaleDateString()}
                                </p>
                                <p className="text-xs text-blue-600 font-medium">
                                  <span className="inline-flex items-center gap-1 text-blue-600">
                                    <Hourglass className="w-3.5 h-3.5" /> {timeRemaining}
                                  </span>
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge
                                variant="default"
                                size="sm"
                                className="inline-flex items-center gap-1"
                              >
                                <Factory className="w-3.5 h-3.5" /> Rented Out
                              </Badge>
                              <p className="text-xs text-neutral-500 mt-1">${order.totalAmount}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {activeRentOuts.length > 4 && (
                      <div className="mt-3 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleSection('activeRentOuts')}
                        >
                          {expanded['activeRentOuts'] ? 'Collapse' : 'Show more'}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Second row: pending requests and history */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Pending items */}
          <div className="animate-fade-in-up animate-stagger-4">
            <Card className="h-[360px] flex flex-col">
              <CardHeader className="pb-2 border-b border-neutral-200">
                <CardTitle className="flex items-center justify-between">
                  Pending Items
                  <Badge variant="warning">{pendingRequests.length + myPendingOrders.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-hidden pt-3">
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="mb-2 flex justify-center">
                      <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
                    </div>
                    <p className="text-neutral-600">Loading...</p>
                  </div>
                ) : pendingRequests.length + myPendingOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="text-neutral-600">All caught up!</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[260px] overflow-y-auto pr-2">
                    {/* Requests that need my approval */}
                    {getVisible('pendingRequests', pendingRequests).map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl border border-yellow-200"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="text-2xl">
                            <ClipboardList className="w-6 h-6 text-yellow-600" />
                          </div>
                          <div>
                            <p className="font-medium text-neutral-900">{order.equipmentName}</p>
                            <p className="text-sm text-neutral-600">
                              Request by {order.renterName}
                            </p>
                            <p className="text-sm text-neutral-600">
                              {new Date(order.startDate).toLocaleDateString()} -{' '}
                              {new Date(order.endDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          <Badge
                            variant="warning"
                            size="sm"
                            className="inline-flex items-center gap-1"
                          >
                            <Hourglass className="w-3.5 h-3.5" /> Needs Approval
                          </Badge>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => handleOrderStatusUpdate(order.id, 1)}
                              className="text-xs"
                            >
                              <span className="inline-flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4" /> Accept
                              </span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOrderStatusUpdate(order.id, 4)}
                              className="text-xs"
                            >
                              <span className="inline-flex items-center gap-1">
                                <XCircle className="w-4 h-4" /> Reject
                              </span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* My pending approval orders */}
                    {getVisible('myPendingOrdersPending', myPendingOrders).map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-4 bg-orange-50 rounded-xl border border-orange-200"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="text-2xl">
                            <Hourglass className="w-6 h-6 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-medium text-neutral-900">{order.equipmentName}</p>
                            <p className="text-sm text-neutral-600">Waiting for approval</p>
                            <p className="text-sm text-neutral-600">
                              {new Date(order.startDate).toLocaleDateString()} -{' '}
                              {new Date(order.endDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant="warning"
                            size="sm"
                            className="inline-flex items-center gap-1"
                          >
                            <Hourglass className="w-3.5 h-3.5" /> Awaiting Response
                          </Badge>
                          <p className="text-xs text-neutral-500 mt-1">${order.totalAmount}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {pendingRequests.length + myPendingOrders.length > 3 && (
                  <div className="mt-3 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleSection('pendingRequests')}
                    >
                      {expanded['pendingRequests'] ? 'Collapse' : 'Show more'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* History summary */}
          <div className="animate-fade-in-up animate-stagger-5">
            <Card className="h-[360px] flex flex-col">
              <CardHeader className="pb-2 border-b border-neutral-200">
                <CardTitle className="flex items-center justify-between">
                  Recent History
                  <Badge variant="secondary">
                    {myCompletedOrders.length + completedRentOuts.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-hidden pt-3">
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="mb-2 flex justify-center">
                      <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
                    </div>
                    <p className="text-neutral-600">Loading history...</p>
                  </div>
                ) : myCompletedOrders.length + completedRentOuts.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">
                      <BookOpenText className="w-8 h-8 text-neutral-400" />
                    </div>
                    <p className="text-neutral-600">No completed transactions yet</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[260px] overflow-y-auto pr-2">
                    {/* Display recent completed orders (mix of my rentals and my rent-outs) */}
                    {getVisible('history', [...myCompletedOrders, ...completedRentOuts])
                      .sort(
                        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                      )
                      .slice(0, 3)
                      .map((order) => {
                        const isMyRental = order.renterId === user?.id;
                        return (
                          <div
                            key={order.id}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="text-2xl">
                                {isMyRental ? (
                                  <Tractor className="w-6 h-6 text-primary-600" />
                                ) : (
                                  <Factory className="w-6 h-6 text-neutral-500" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-neutral-900">
                                  {order.equipmentName}
                                </p>
                                <p className="text-sm text-neutral-600">
                                  {isMyRental ? 'You rented' : `Rented by ${order.renterName}`}
                                </p>
                                <p className="text-xs text-neutral-500">
                                  Completed {new Date(order.updatedAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge
                                variant="success"
                                size="sm"
                                className="inline-flex items-center gap-1"
                              >
                                <Target className="w-3.5 h-3.5" /> Completed
                              </Badge>
                              <p className="text-xs text-neutral-500 mt-1">${order.totalAmount}</p>
                              {/* Add review button - only show when user is renter */}
                              {isMyRental && (
                                <Button
                                  size="sm"
                                  variant={reviewedOrders.has(order.id) ? 'ghost' : 'outline'}
                                  className="mt-2"
                                  onClick={() => handleReviewClick(order)}
                                >
                                  {reviewedOrders.has(order.id) ? (
                                    <span className="inline-flex items-center gap-1">
                                      <Eye className="w-4 h-4" /> View Review
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1">
                                      <Star className="w-4 h-4" /> Write Review
                                    </span>
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
                {myCompletedOrders.length + completedRentOuts.length > 3 && (
                  <div className="mt-3 text-right">
                    <Button size="sm" variant="ghost" onClick={() => toggleSection('history')}>
                      {expanded['history'] ? 'Collapse' : 'Show more'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick actions */}
        <div className="mt-8 animate-fade-in-up animate-stagger-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  className="justify-start h-auto p-4"
                  variant="outline"
                  onClick={() => navigate('/equipment')}
                >
                  <div className="text-left">
                    <div className="text-2xl mb-1">
                      <Search className="w-6 h-6" />
                    </div>
                    <div className="font-medium">Browse Equipment</div>
                    <div className="text-sm text-neutral-600">Find equipment to rent</div>
                  </div>
                </Button>
                <Button
                  className="justify-start h-auto p-4"
                  variant="outline"
                  onClick={() => navigate('/equipment/my')}
                >
                  <div className="text-left">
                    <div className="text-2xl mb-1">
                      <Tractor className="w-6 h-6" />
                    </div>
                    <div className="font-medium">My Equipment</div>
                    <div className="text-sm text-neutral-600">Manage your equipment</div>
                  </div>
                </Button>
                <Button
                  className="justify-start h-auto p-4"
                  variant="outline"
                  onClick={() => navigate('/equipment/create')}
                >
                  <div className="text-left">
                    <div className="text-2xl mb-1">
                      <Plus className="w-6 h-6" />
                    </div>
                    <div className="font-medium">Add Equipment</div>
                    <div className="text-sm text-neutral-600">List new equipment</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Review popup */}
      {selectedOrderForReview && (
        <ReviewDialog
          open={reviewDialogOpen}
          onOpenChange={setReviewDialogOpen}
          order={selectedOrderForReview}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}
    </div>
  );
}

export default DashboardPage;
