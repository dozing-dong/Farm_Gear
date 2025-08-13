import {
  CheckCircle2,
  ClipboardList,
  Loader2,
  Lock,
  MapPin,
  Package,
  Pencil,
  Star,
  Tractor,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { useAuth } from '../hooks/useAuth';
import { useEquipmentDetail } from '../hooks/useEquipmentDetail';
import { farmGearAPI, handleApiError } from '../lib/api';
import { getImageUrl, getStatusDisplay } from '../lib/constants';
import { useToast } from '../lib/toast';

function MyEquipmentDetailPage() {
  const navigate = useNavigate();
  const { user, isLoggedIn, isInitialized } = useAuth();
  const { showToast } = useToast();

  // Use standardized Hook to get equipment data
  const { equipment, isLoading, error, updateEquipment } = useEquipmentDetail();

  // UI state
  const [imageError, setImageError] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check authentication status
  useEffect(() => {
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
  }, [isLoggedIn, user, navigate, showToast, isInitialized]);

  // Handle equipment deletion (with rental protection)
  const handleDeleteEquipment = async () => {
    if (!equipment) return;

    // 🔒 Protection mechanism: rented equipment cannot be deleted
    if (equipment.status === 1) {
      showToast({
        type: 'warning',
        title: 'Operation Not Allowed',
        description:
          'Cannot delete rented equipment. Please wait until rental period ends to protect tenant rights.',
        duration: 5000,
      });
      setDeleteDialogOpen(false);
      return;
    }

    try {
      setIsDeleting(true);
      const response = await farmGearAPI.deleteEquipment(equipment.id);

      if (response.success) {
        showToast({
          type: 'success',
          title: 'Equipment Deleted',
          description: 'Equipment deleted successfully.',
          duration: 3000,
        });

        // Navigate back to my equipment page
        navigate('/equipment/my');
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
    }
  };

  // Handle status update (with rental protection)
  const handleStatusUpdate = async (newStatus: number) => {
    if (!equipment) return;

    // 🔒 Protection mechanism: rented equipment status cannot be modified
    if (equipment.status === 1) {
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
      // Ensure status is a valid enum value
      const validStatus = newStatus as 0 | 1 | 2 | 3;

      // Use new dedicated status update API
      const response = await farmGearAPI.updateEquipmentStatus(equipment.id, validStatus);

      if (response.success) {
        showToast({
          type: 'success',
          title: 'Status Updated',
          description: 'Equipment status has been updated successfully.',
          duration: 3000,
        });

        // Update local state
        const updatedEquipment = {
          ...equipment,
          status: validStatus,
        };
        updateEquipment(updatedEquipment);
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
  const handleConfirmReturn = async () => {
    if (!equipment) return;

    try {
      const response = await farmGearAPI.confirmEquipmentReturn(equipment.id);

      if (response.success) {
        showToast({
          type: 'success',
          title: 'Return Confirmed',
          description: 'Equipment has been confirmed as returned and is now available.',
          duration: 3000,
        });

        // Update local state to Available (0)
        const updatedEquipment = {
          ...equipment,
          status: 0 as 0 | 1 | 2 | 3 | 4,
        };
        updateEquipment(updatedEquipment);
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

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
          </div>
          <div className="text-xl text-neutral-600">Loading equipment details...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !equipment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50/30">
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav className="mb-8">
            <div className="flex items-center space-x-2 text-sm text-neutral-600">
              <Link to="/" className="hover:text-primary-600 transition-colors">
                Home
              </Link>
              <span>•</span>
              <Link to="/equipment/my" className="hover:text-primary-600 transition-colors">
                My Equipment
              </Link>
              <span>•</span>
              <span className="text-neutral-900">Error</span>
            </div>
          </nav>

          <Card className="p-8 text-center">
            <div className="mb-4 flex justify-center">
              <XCircle className="w-12 h-12 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">Equipment Not Found</h1>
            <p className="text-neutral-600 mb-6">
              {error || 'The equipment you are looking for does not exist or could not be loaded.'}
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => navigate('/equipment/my')}
                className="bg-primary-600 hover:bg-primary-700"
              >
                Back to My Equipment
              </Button>
              <Button variant="outline" onClick={() => navigate('/')}>
                Go Home
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Status mapping

  const statusDisplay = getStatusDisplay(equipment.status);
  const processedImageUrl = getImageUrl(equipment.imageUrl);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50/30">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-200/10 rounded-full blur-3xl transform translate-x-32 -translate-y-32" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary-300/10 rounded-full blur-3xl transform -translate-x-32 translate-y-32" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb navigation */}
        <nav className="mb-8 animate-fade-in-up">
          <div className="flex items-center space-x-2 text-sm text-neutral-600">
            <Link to="/" className="hover:text-primary-600 transition-colors">
              Home
            </Link>
            <span>•</span>
            <Link to="/equipment/my" className="hover:text-primary-600 transition-colors">
              My Equipment
            </Link>
            <span>•</span>
            <span className="text-neutral-900">{equipment.name}</span>
          </div>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Equipment image and basic info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Equipment image */}
            <Card className="animate-fade-in-up">
              <CardContent className="p-0">
                <div className="relative h-96 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center overflow-hidden">
                  {processedImageUrl && !imageError ? (
                    <img
                      src={processedImageUrl}
                      alt={equipment.name}
                      className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                      onClick={() => setShowImageModal(true)}
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="flex items-center justify-center">
                      <Tractor className="w-24 h-24 text-primary-500" />
                    </div>
                  )}

                  <div className="absolute top-4 right-4">
                    <Badge variant={statusDisplay.variant} size="lg">
                      {statusDisplay.label}
                    </Badge>
                  </div>

                  {typeof equipment.averageRating === 'number' && (
                    <div className="absolute top-4 left-4">
                      <div className="flex items-center space-x-1 bg-white/90 backdrop-blur-sm rounded-full px-3 py-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="font-medium">
                          {new Intl.NumberFormat('en-NZ', {
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 1,
                          }).format(equipment.averageRating)}
                        </span>
                        <span className="text-sm text-neutral-600">
                          ({equipment.totalReviews || 0})
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Equipment basic information */}
            <Card className="animate-fade-in-up animate-stagger-1">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-3xl font-bold text-neutral-900 mb-2">
                      {equipment.name}
                    </CardTitle>
                    <div className="flex items-center space-x-4 text-neutral-600">
                      <span className="inline-flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {new Intl.NumberFormat('en-NZ', {
                          minimumFractionDigits: 4,
                          maximumFractionDigits: 4,
                        }).format(equipment.latitude)}
                        ,{' '}
                        {new Intl.NumberFormat('en-NZ', {
                          minimumFractionDigits: 4,
                          maximumFractionDigits: 4,
                        }).format(equipment.longitude)}
                      </span>
                      <Badge variant="outline">{equipment.type || 'Equipment'}</Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-primary-600">
                      {new Intl.NumberFormat('en-NZ', {
                        style: 'currency',
                        currency: 'NZD',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(equipment.dailyPrice)}
                    </div>
                    <div className="text-neutral-600">per day</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg text-neutral-900 mb-2">Description</h3>
                    <p className="text-neutral-600 leading-relaxed">{equipment.description}</p>
                  </div>

                  {/* Price options */}
                  <div className="bg-neutral-50 rounded-lg p-4">
                    <h4 className="font-medium text-neutral-900 mb-3">Pricing Options</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-600">Daily Rate</span>
                        <span className="font-medium">
                          {new Intl.NumberFormat('en-NZ', {
                            style: 'currency',
                            currency: 'NZD',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          }).format(equipment.dailyPrice)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-600">Weekly Rate (15% discount)</span>
                        <span className="font-medium">
                          {new Intl.NumberFormat('en-NZ', {
                            style: 'currency',
                            currency: 'NZD',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          }).format(equipment.dailyPrice * 7 * 0.85)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-600">Monthly Rate (30% discount)</span>
                        <span className="font-medium">
                          {new Intl.NumberFormat('en-NZ', {
                            style: 'currency',
                            currency: 'NZD',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          }).format(equipment.dailyPrice * 30 * 0.7)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Management panel */}
          <div className="space-y-6">
            {/* Equipment management */}
            <Card className="animate-fade-in-up animate-stagger-1">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-neutral-900">
                  Equipment Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status management */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Equipment Status
                  </label>
                  {equipment.status === 1 ? (
                    // If equipment is rented out, show read-only status
                    <div className="w-full px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
                      <span className="inline-flex items-center gap-2">
                        <Lock className="w-4 h-4" /> Rented (Managed by system)
                      </span>
                    </div>
                  ) : equipment.status === 2 ? (
                    // If equipment is pending return, show confirm return button
                    <div className="space-y-2">
                      <div className="w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
                        <span className="inline-flex items-center gap-2">
                          <Package className="w-4 h-4" /> Pending Return
                        </span>
                      </div>
                      <Button
                        onClick={handleConfirmReturn}
                        className="w-full inline-flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-5 h-5" /> Confirm Equipment Return
                      </Button>
                      <p className="text-xs text-blue-600">
                        Please confirm when you have received the equipment back from the renter.
                      </p>
                    </div>
                  ) : (
                    // User manageable status selector (excluding Rented option)
                    <select
                      value={equipment.status}
                      onChange={(e) => handleStatusUpdate(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200"
                    >
                      <option value="0">Available</option>
                      <option value="3">Maintenance</option>
                      <option value="4">Offline</option>
                    </select>
                  )}
                  {equipment.status === 1 && (
                    <p className="text-xs text-yellow-600 mt-1">
                      Equipment status cannot be changed while rented. Status will automatically
                      return to Available when the rental ends.
                    </p>
                  )}
                  {equipment.status === 2 && (
                    <p className="text-xs text-blue-600 mt-1">
                      The rental period has ended. Please confirm receipt of the equipment to make
                      it available for future rentals.
                    </p>
                  )}
                </div>

                <hr className="border-neutral-200" />

                {/* Action buttons */}
                <div className="space-y-3">
                  {equipment.status === 1 ? (
                    // 🔒 Rented equipment: only show return button and protection notice
                    <>
                      <div className="w-full px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <Lock className="w-4 h-4" />
                          <span className="font-medium">
                            Cannot update, modify or delete while rented
                          </span>
                        </div>
                        <p className="text-sm text-blue-600 mt-1">
                          Equipment is currently rented. All modification operations are disabled to
                          protect tenant rights.
                        </p>
                      </div>

                      <Button
                        onClick={() => navigate('/equipment/my')}
                        variant="outline"
                        className="w-full inline-flex items-center justify-center gap-2"
                        size="lg"
                      >
                        <ClipboardList className="w-5 h-5" /> Back to My Equipment
                      </Button>
                    </>
                  ) : (
                    // 🔓 Non-rented equipment: show all action buttons
                    <>
                      <Button
                        onClick={() =>
                          showToast({
                            type: 'info',
                            title: 'Feature Coming Soon',
                            description: 'Equipment editing will be available in a future update.',
                            duration: 3000,
                          })
                        }
                        className="w-full bg-primary-600 hover:bg-primary-700 inline-flex items-center justify-center gap-2"
                        size="lg"
                      >
                        <Pencil className="w-5 h-5" /> Edit Equipment
                      </Button>

                      <Button
                        onClick={() => navigate('/equipment/my')}
                        variant="outline"
                        className="w-full inline-flex items-center justify-center gap-2"
                        size="lg"
                      >
                        <ClipboardList className="w-5 h-5" /> Back to My Equipment
                      </Button>

                      <Button
                        onClick={() => setDeleteDialogOpen(true)}
                        variant="outline"
                        className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 inline-flex items-center justify-center gap-2"
                        size="lg"
                      >
                        <Trash2 className="w-5 h-5" /> Delete Equipment
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Equipment statistics */}
            <Card className="animate-fade-in-up animate-stagger-2">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-neutral-900">
                  Equipment Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-neutral-50 rounded-lg">
                    <div className="text-lg font-bold text-primary-600">
                      {equipment.totalReviews || 0}
                    </div>
                    <div className="text-xs text-neutral-600">Total Reviews</div>
                  </div>
                  <div className="text-center p-3 bg-neutral-50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">
                      {typeof equipment.averageRating === 'number'
                        ? new Intl.NumberFormat('en-NZ', {
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 1,
                          }).format(equipment.averageRating)
                        : 'N/A'}
                    </div>
                    <div className="text-xs text-neutral-600">Avg Rating</div>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-neutral-600">
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                    <span>Equipment listed and visible</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                    <span>Pricing competitive in market</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                    <span>Professional listing quality</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Image preview modal */}
        {showImageModal && processedImageUrl && (
          <div
            className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4"
            onClick={() => setShowImageModal(false)}
          >
            <div className="relative max-w-4xl max-h-full">
              <img
                src={processedImageUrl}
                alt={equipment.name}
                className="max-w-full max-h-full object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
              {/* Close button */}
              <button
                onClick={() => setShowImageModal(false)}
                className="absolute top-4 right-4 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 transition-all duration-200 shadow-lg"
              >
                <X className="w-6 h-6 text-neutral-800" />
              </button>
            </div>
          </div>
        )}

        {/* Delete confirmation dialog */}
        <Dialog
          open={deleteDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              setDeleteDialogOpen(false);
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Delete Equipment</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{equipment.name}"? This action cannot be undone,
                and it will remove the equipment from all listings.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
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
                {isDeleting ? 'Deleting...' : 'Delete Equipment'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default MyEquipmentDetailPage;
