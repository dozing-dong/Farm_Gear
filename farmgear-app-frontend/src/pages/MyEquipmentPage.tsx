import {
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Loader2,
  MapPin,
  Package,
  Pencil,
  Plus,
  Star,
  Tractor,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { useAuth } from '../hooks/useAuth';
import { farmGearAPI, handleApiError, type Equipment } from '../lib/api';
import { getImageUrl, getStatusDisplay } from '../lib/constants';
import { useToast } from '../lib/toast';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { useOrders } from '../hooks/useOrders';

function MyEquipmentPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user, isLoggedIn, isInitialized } = useAuth();
  const { orders, refreshOrders, updateOrderStatus } = useOrders();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Tab state
  const [activeTab, setActiveTab] = useState<'equipment' | 'orders'>('equipment');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(9);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Data state
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [equipmentToDelete, setEquipmentToDelete] = useState<Equipment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Statistics state
  const [stats, setStats] = useState({
    totalEquipment: 0,
    availableEquipment: 0,
    rentedEquipment: 0,
    totalRevenue: 0,
    activeOrders: 0,
  });

  // Check authentication status
  useEffect(() => {
    // Only check after auth system is initialized
    if (!isInitialized) return;

    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    // Check user role
    if (user && !['Provider', 'Official', 'Admin'].includes(user.role)) {
      showToast({
        type: 'error',
        title: 'Access Denied',
        description: 'You need to be a Provider to access this page.',
        duration: 5000,
      });
      navigate('/');
      return;
    }
  }, [isLoggedIn, user, navigate, isInitialized]); // eslint-disable-line react-hooks/exhaustive-deps -- showToast is optimized, no need as dependency

  // Simplified: Remove complex event listening system and data refresh functionality

  // Remove separate statistics data fetching, merge into main data fetching

  // Unified data fetching: equipment list + statistics
  useEffect(() => {
    const fetchEquipmentData = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        setError(null);

        // Build query parameters
        const params: Record<string, unknown> = {
          pageNumber: currentPage,
          pageSize: pageSize,
        };

        if (searchQuery.trim()) {
          params.searchTerm = searchQuery.trim();
        }

        if (selectedCategory !== 'all') {
          params.type = selectedCategory;
        }

        if (selectedStatus !== 'all') {
          const statusMap = {
            available: 'Available',
            rented: 'Rented',
            maintenance: 'Maintenance',
            offline: 'Offline',
          };
          params.status = statusMap[selectedStatus as keyof typeof statusMap];
        }

        // Only get paginated data, simplify statistics calculation
        const listResponse = await farmGearAPI.getMyEquipmentList(params);

        if (listResponse.success && listResponse.data) {
          setEquipment(listResponse.data.items || []);
          setTotalPages(listResponse.data.totalPages || 0);
          setTotalCount(listResponse.data.totalCount || 0);

          // Calculate simplified statistics based on current page data
          calculateStatsFromCurrentPage(
            listResponse.data.items || [],
            listResponse.data.totalCount || 0
          );
        } else {
          setError(listResponse.message || 'Failed to load your equipment');
        }
      } catch (error: unknown) {
        const errorMessage = handleApiError(error);
        setError(errorMessage);
        showToast({
          type: 'error',
          title: 'Loading Failed',
          description: 'Failed to load your equipment list. Please try again.',
          duration: 5000,
        });
      } finally {
        setIsLoading(false);
        setIsInitialLoading(false);
      }
    };

    fetchEquipmentData();
  }, [currentPage, pageSize, searchQuery, selectedCategory, selectedStatus, user]); // eslint-disable-line react-hooks/exhaustive-deps -- showToast is optimized, no need as dependency

  // Calculate simplified statistics based on current page data
  const calculateStatsFromCurrentPage = (currentPageItems: Equipment[], totalCount: number) => {
    const stats = {
      totalEquipment: totalCount, // Use total count returned by API
      availableEquipment: currentPageItems.filter((eq) => eq.status === 0).length,
      rentedEquipment: currentPageItems.filter((eq) => eq.status === 1).length,
      totalRevenue: currentPageItems.reduce((sum, eq) => sum + eq.dailyPrice * 30, 0), // Estimate based on current page
      activeOrders: currentPageItems.filter((eq) => eq.status === 1).length,
    };
    setStats(stats);
  };

  // Simplified delete operation logic (optimized: with feedback but no refresh)
  const handleDeleteEquipment = async () => {
    if (!equipmentToDelete) return;

    // 🔒 Protection mechanism: Rented equipment cannot be deleted
    if (equipmentToDelete.status === 1) {
      showToast({
        type: 'warning',
        title: 'Operation Not Allowed',
        description:
          'Cannot delete rented equipment. Please wait until rental period ends to protect tenant rights.',
        duration: 5000,
      });
      setDeleteDialogOpen(false);
      setEquipmentToDelete(null);
      return;
    }

    try {
      setIsDeleting(true);
      const response = await farmGearAPI.deleteEquipment(equipmentToDelete.id);

      if (response.success) {
        // Simple local state update
        const updatedEquipment = equipment.filter((item) => item.id !== equipmentToDelete.id);
        setEquipment(updatedEquipment);

        // Update statistics but don't refresh page
        calculateStatsFromCurrentPage(updatedEquipment, totalCount - 1);
        setTotalCount((prev) => prev - 1);

        // 🎯 Optimized toast: Won't cause page refresh
        showToast({
          type: 'success',
          title: 'Equipment Deleted',
          description: 'Equipment deleted successfully.',
          duration: 3000,
        });
      } else {
        showToast({
          type: 'error',
          title: 'Delete Failed',
          description: response.message || 'Failed to delete equipment.',
          duration: 5000,
        });
      }
    } catch (error: unknown) {
      const errorMessage = handleApiError(error);
      showToast({
        type: 'error',
        title: 'Delete Failed',
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setEquipmentToDelete(null);
    }
  };

  // Simplified status update logic (optimized: with feedback but no refresh)
  const handleStatusUpdate = async (equipmentId: string, newStatus: number) => {
    // 🔒 Double protection: Check if equipment is rented
    const targetEquipment = equipment.find((item) => item.id === equipmentId);
    if (targetEquipment && targetEquipment.status === 1) {
      showToast({
        type: 'warning',
        title: 'Operation Not Allowed',
        description:
          'Cannot modify status of rented equipment. Please wait until rental period ends to protect tenant rights.',
        duration: 5000,
      });
      return;
    }

    try {
      const validStatus = newStatus as 0 | 1 | 2 | 3;
      const response = await farmGearAPI.updateEquipmentStatus(equipmentId, validStatus);

      if (response.success) {
        // Update equipment status
        const updatedEquipment = equipment.map((item) =>
          item.id === equipmentId ? { ...item, status: validStatus } : item
        );
        setEquipment(updatedEquipment);

        // Also update statistics, avoid re-fetching data
        calculateStatsFromCurrentPage(updatedEquipment, totalCount);

        // 🎯 Optimized toast: Won't cause page refresh
        showToast({
          type: 'success',
          title: 'Status Updated',
          description: 'Equipment status updated successfully.',
          duration: 3000,
        });
      } else {
        showToast({
          type: 'error',
          title: 'Update Failed',
          description: response.message || 'Failed to update equipment status.',
          duration: 5000,
        });
      }
    } catch (error: unknown) {
      const errorMessage = handleApiError(error);
      showToast({
        type: 'error',
        title: 'Update Failed',
        description: errorMessage,
        duration: 5000,
      });
    }
  };

  // Confirm equipment return handler function
  const handleConfirmReturn = async (equipmentId: string) => {
    try {
      const response = await farmGearAPI.confirmEquipmentReturn(equipmentId);

      if (response.success) {
        // Update local equipment status to Available (0)
        const updatedEquipment = equipment.map((item) =>
          item.id === equipmentId ? { ...item, status: 0 as 0 | 1 | 2 | 3 | 4 } : item
        );
        setEquipment(updatedEquipment);

        // Update statistics
        calculateStatsFromCurrentPage(updatedEquipment, totalCount);

        showToast({
          type: 'success',
          title: 'Return Confirmed',
          description: 'Equipment has been confirmed as returned and is now available.',
          duration: 3000,
        });
      } else {
        showToast({
          type: 'error',
          title: 'Confirmation Failed',
          description: response.message || 'Failed to confirm equipment return.',
          duration: 5000,
        });
      }
    } catch (error: unknown) {
      const errorMessage = handleApiError(error);
      showToast({
        type: 'error',
        title: 'Confirmation Failed',
        description: errorMessage,
        duration: 5000,
      });
    }
  };

  // Status mapping

  // Handle search
  const handleSearch = () => {
    setSearchQuery(searchInput);
    setCurrentPage(1);
  };

  // Handle category change
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  // Handle status filter change
  const handleStatusFilterChange = (status: string) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle order status update (optimized: with feedback but no refresh)
  const handleOrderStatusUpdate = async (orderId: string, status: number) => {
    try {
      const response = await updateOrderStatus(orderId, status);

      if (response.success) {
        const statusMessages = {
          1: 'Order accepted successfully',
          4: 'Order rejected',
        };

        // 🎯 Optimized toast: Won't cause page refresh
        showToast({
          type: 'success',
          title: 'Order Updated',
          description:
            statusMessages[status as keyof typeof statusMessages] || 'Order status updated',
          duration: 3000,
        });

        // Refresh order data to show latest status
        refreshOrders();
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Update Failed',
        description: handleApiError(error),
        duration: 5000,
      });
    }
  };

  const categories = ['all', 'Tractors', 'Harvesters', 'Plows', 'Seeders', 'Sprayers', 'Other'];
  const statusFilters = ['all', 'available', 'rented', 'maintenance', 'offline'];

  // Show full page loading state on initial load
  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
          </div>
          <div className="text-xl text-neutral-600">Loading your equipment...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50/30">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-200/10 rounded-full blur-3xl transform translate-x-32 -translate-y-32" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary-300/10 rounded-full blur-3xl transform -translate-x-32 translate-y-32" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page title and statistics */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-neutral-900 mb-2">My Equipment</h1>
              <p className="text-xl text-neutral-600">Manage your published farm equipment</p>
            </div>
            <Button
              onClick={() => navigate('/equipment/create')}
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3"
              size="lg"
            >
              <span className="inline-flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Add New Equipment
              </span>
            </Button>
          </div>

          {/* Tab navigation */}
          <div className="flex space-x-4 mb-6">
            <Button
              variant={activeTab === 'equipment' ? 'default' : 'outline'}
              onClick={() => setActiveTab('equipment')}
              className="px-6 py-2"
            >
              <span className="inline-flex items-center gap-2">
                <Tractor className="w-4 h-4" /> My Equipment ({totalCount})
              </span>
            </Button>
            <Button
              variant={activeTab === 'orders' ? 'default' : 'outline'}
              onClick={() => {
                setActiveTab('orders');
                refreshOrders();
              }}
              className="px-6 py-2"
            >
              <span className="inline-flex items-center gap-2">
                <ClipboardList className="w-4 h-4" /> Orders ({orders.length})
              </span>
            </Button>
          </div>

          {/* Statistics cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary-600">{stats.totalEquipment}</div>
                <div className="text-sm text-neutral-600">Total Equipment</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{stats.availableEquipment}</div>
                <div className="text-sm text-neutral-600">Available</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.rentedEquipment}</div>
                <div className="text-sm text-neutral-600">Currently Rented</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {new Intl.NumberFormat('en-NZ', {
                    style: 'currency',
                    currency: 'NZD',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(stats.totalRevenue)}
                </div>
                <div className="text-sm text-neutral-600">Est. Monthly Revenue</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.activeOrders}</div>
                <div className="text-sm text-neutral-600">Active Orders</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Search and filter area */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search box */}
              <div className="md:col-span-2">
                <label htmlFor="search" className="block text-sm font-medium text-neutral-700 mb-2">
                  Search Equipment
                </label>
                <div className="relative">
                  <Input
                    id="search"
                    type="text"
                    placeholder="Search by name or description..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full pr-10"
                  />
                  <button
                    onClick={handleSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Category filter */}
              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-neutral-700 mb-2"
                >
                  Category
                </label>
                <select
                  id="category"
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full h-12 px-4 py-3 bg-white border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status filter */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-neutral-700 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  value={selectedStatus}
                  onChange={(e) => handleStatusFilterChange(e.target.value)}
                  className="w-full h-12 px-4 py-3 bg-white border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200"
                >
                  {statusFilters.map((status) => (
                    <option key={status} value={status}>
                      {status === 'all'
                        ? 'All Status'
                        : status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filter results statistics */}
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-neutral-600">
                Showing {equipment.length} of {totalCount} equipment items (Page {currentPage} of{' '}
                {totalPages})
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Equipment grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="mb-4 flex justify-center">
              <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
            </div>
            <div className="text-xl text-neutral-600">Loading your equipment...</div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="mb-4 flex justify-center">
              <XCircle className="w-12 h-12 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">
              Failed to Load Equipment
            </h3>
            <p className="text-neutral-600 mb-6">{error}</p>
            <Button
              onClick={() => {
                // 🔥 Smart retry: Re-fetch data without full page refresh
                setError(null);
                setIsLoading(true);
                setTimeout(() => {
                  // Trigger data re-fetch - by modifying currentPage to trigger useEffect
                  setCurrentPage(1); // Reset to first page, trigger data re-fetch
                }, 100);
              }}
              className="bg-primary-600 hover:bg-primary-700"
            >
              Try Again
            </Button>
          </div>
        ) : equipment.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-4 flex justify-center">
              <Package className="w-12 h-12 text-neutral-400" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">No Equipment Found</h3>
            <p className="text-neutral-600 mb-4">
              {totalCount === 0
                ? "You haven't published any equipment yet."
                : 'Try adjusting your search or filter criteria.'}
            </p>
            {totalCount === 0 && (
              <Button
                onClick={() => navigate('/equipment/create')}
                className="bg-primary-600 hover:bg-primary-700"
              >
                Create Your First Equipment
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {equipment.map((item) => {
              const statusDisplay = getStatusDisplay(item.status);
              const imageUrl = getImageUrl(item.imageUrl);

              return (
                <Card
                  key={item.id}
                  className="hover:shadow-large hover:-translate-y-1 transition-all duration-300"
                >
                  <CardContent className="p-0">
                    {/* Equipment image area */}
                    <div className="relative h-48 bg-gradient-to-br from-primary-100 to-primary-200 rounded-t-xl flex items-center justify-center">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover rounded-t-xl"
                          onError={(e) => {
                            const img = e.currentTarget;
                            const fallback = img.nextElementSibling as HTMLElement;
                            img.style.display = 'none';
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className="flex items-center justify-center w-full h-full"
                        style={{ display: imageUrl ? 'none' : 'flex' }}
                      >
                        <Tractor className="w-16 h-16 text-primary-400" />
                      </div>

                      <div className="absolute top-4 right-4">
                        <Badge variant={statusDisplay.variant} size="sm">
                          {statusDisplay.label}
                        </Badge>
                      </div>

                      {typeof item.averageRating === 'number' && (
                        <div className="absolute top-4 left-4">
                          <div className="flex items-center space-x-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1">
                            <Star className="w-3.5 h-3.5 text-yellow-500" />
                            <span className="text-sm font-medium">
                              {new Intl.NumberFormat('en-NZ', {
                                minimumFractionDigits: 1,
                                maximumFractionDigits: 1,
                              }).format(item.averageRating)}
                            </span>
                            <span className="text-xs text-neutral-600">
                              ({item.totalReviews || 0})
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Equipment information */}
                    <div className="p-6">
                      <div className="mb-3">
                        <h3 className="text-lg font-semibold text-neutral-900 mb-1">{item.name}</h3>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" size="sm">
                            {item.type || 'Equipment'}
                          </Badge>
                          <div className="flex items-center text-sm text-neutral-600">
                            <MapPin className="w-4 h-4 mr-1" />
                            {new Intl.NumberFormat('en-NZ', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }).format(item.latitude)}
                            ,{' '}
                            {new Intl.NumberFormat('en-NZ', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }).format(item.longitude)}
                          </div>
                        </div>
                      </div>

                      {/* Description preview */}
                      <div className="mb-4">
                        <p className="text-sm text-neutral-600 line-clamp-2">{item.description}</p>
                      </div>

                      {/* Price */}
                      <div className="mb-4">
                        <span className="text-2xl font-bold text-primary-600">
                          {new Intl.NumberFormat('en-NZ', {
                            style: 'currency',
                            currency: 'NZD',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          }).format(item.dailyPrice)}
                        </span>
                        <span className="text-sm text-neutral-600">/day</span>
                      </div>

                      {/* Management buttons */}
                      {item.status === 1 ? (
                        // 🔒 Rented equipment: Only show view details button and protection notice
                        <div className="space-y-2">
                          <div className="grid grid-cols-1 gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/equipment/my/${item.id}`)}
                              className="text-xs"
                            >
                              <span className="inline-flex items-center gap-1">
                                <BarChart3 className="w-4 h-4" /> View Details
                              </span>
                            </Button>
                          </div>

                          {/* Rental status notice */}
                          <div className="text-xs px-2 py-1 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-center">
                            🟡 Rented
                          </div>

                          {/* Protection notice */}
                          <div className="text-xs px-2 py-1 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-center">
                            🔒 Cannot update, modify or delete while rented
                          </div>
                        </div>
                      ) : item.status === 2 ? (
                        // 📦 Equipment pending return: Show confirm return button
                        <div className="space-y-2">
                          <div className="grid grid-cols-1 gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleConfirmReturn(item.id)}
                              className="text-xs"
                            >
                              <span className="inline-flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4" /> Confirm Return
                              </span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/equipment/my/${item.id}`)}
                              className="text-xs"
                            >
                              <span className="inline-flex items-center gap-1">
                                <BarChart3 className="w-4 h-4" /> View Details
                              </span>
                            </Button>
                          </div>

                          {/* Pending return status notice */}
                          <div className="text-xs px-2 py-1 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-center inline-flex items-center justify-center gap-1">
                            <Package className="w-4 h-4" /> Pending Return
                          </div>

                          {/* Operation notice */}
                          <div className="text-xs px-2 py-1 bg-green-50 border border-green-200 rounded-lg text-green-700 text-center inline-flex items-center justify-center gap-1">
                            Please confirm when equipment is returned
                          </div>
                        </div>
                      ) : (
                        // 🔓 Non-rented equipment: Show all management buttons
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/equipment/my/${item.id}`)}
                            className="text-xs"
                          >
                            <span className="inline-flex items-center gap-1">
                              <BarChart3 className="w-4 h-4" /> View Details
                            </span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/equipment/my/${item.id}`)}
                            className="text-xs"
                          >
                            <span className="inline-flex items-center gap-1">
                              <Pencil className="w-4 h-4" /> Manage
                            </span>
                          </Button>

                          {/* Status management buttons */}
                          <select
                            value={item.status}
                            onChange={(e) => handleStatusUpdate(item.id, parseInt(e.target.value))}
                            className="text-xs px-2 py-1 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                          >
                            <option value={0}>Available</option>
                            <option value={3}>Maintenance</option>
                            <option value={4}>Offline</option>
                          </select>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEquipmentToDelete(item);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <span className="inline-flex items-center gap-1">
                              <Trash2 className="w-4 h-4" /> Delete
                            </span>
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-12">
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-2 min-w-[40px] ${
                  currentPage === page ? 'bg-primary-600 hover:bg-primary-700' : ''
                }`}
              >
                {page}
              </Button>
            ))}

            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Button>
          </div>
        )}

        {/* Order management interface */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">Order Management</h2>
            {orders.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <div className="text-6xl mb-4">📋</div>
                  <h3 className="text-xl font-semibold text-neutral-900 mb-2">No orders found</h3>
                  <p className="text-neutral-600">Orders for your equipment will appear here.</p>
                </CardContent>
              </Card>
            ) : (
              orders
                .filter((order) => equipment.some((eq) => eq.id === order.equipmentId))
                .map((order) => {
                  const getStatusConfig = (status: number) => {
                    const configs = {
                      0: { text: 'Pending', color: 'bg-orange-100 text-orange-800', Icon: Loader2 },
                      1: {
                        text: 'Accepted',
                        color: 'bg-blue-100 text-blue-800',
                        Icon: CheckCircle2,
                      },
                      2: {
                        text: 'In Progress',
                        color: 'bg-purple-100 text-purple-800',
                        Icon: Tractor,
                      },
                      3: {
                        text: 'Completed',
                        color: 'bg-green-100 text-green-800',
                        Icon: BarChart3,
                      },
                      4: { text: 'Rejected', color: 'bg-red-100 text-red-800', Icon: XCircle },
                      5: { text: 'Cancelled', color: 'bg-gray-100 text-gray-800', Icon: XCircle },
                    } as const;
                    return configs[status as keyof typeof configs] || configs[0];
                  };

                  const statusConfig = getStatusConfig(order.status);
                  const canAccept = order.status === 0; // Pending

                  return (
                    <Card key={order.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{order.equipmentName}</h3>
                            <p className="text-sm text-neutral-600 mb-1">
                              Renter: {order.renterName}
                            </p>
                            <p className="text-sm text-neutral-600 mb-1">
                              Duration: {new Date(order.startDate).toLocaleDateString()} -{' '}
                              {new Date(order.endDate).toLocaleDateString()}
                            </p>
                            <p className="text-lg font-bold text-neutral-900">
                              ${order.totalAmount}
                            </p>
                          </div>

                          <div className="flex flex-col items-end space-y-2">
                            <div
                              className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color} inline-flex items-center gap-1`}
                            >
                              <statusConfig.Icon className="w-3.5 h-3.5" /> {statusConfig.text}
                            </div>

                            {/* Action buttons */}
                            <div className="flex space-x-2">
                              {canAccept && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleOrderStatusUpdate(order.id, 1)}
                                    className="text-xs"
                                  >
                                    Accept
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleOrderStatusUpdate(order.id, 4)}
                                    className="text-xs"
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}
                              {/* Complete button removed - orders will auto-complete based on time */}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
            )}
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteDialogOpen(false);
            setEquipmentToDelete(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete Equipment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{equipmentToDelete?.name}"? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setEquipmentToDelete(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteEquipment}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default MyEquipmentPage;
