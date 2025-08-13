import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Handshake,
  Home,
  Loader2,
  Mail,
  MapPin,
  Search,
  Star,
  Tractor,
  User,
  Wheat,
  X,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ReviewList } from '../components/ReviewList';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { useAuth } from '../hooks/useAuth';
import { useEquipmentDetail } from '../hooks/useEquipmentDetail';
import { useOrders } from '../hooks/useOrders';
import { handleApiError } from '../lib/api';
import { getImageUrl, getStatusDisplay } from '../lib/constants';
import { useToast } from '../lib/toast';

function EquipmentDetailPage() {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();
  const { showToast } = useToast();
  const { createOrder } = useOrders();

  // Use standardized Hook to get equipment data
  const { equipment, isLoading, error } = useEquipmentDetail();

  // UI state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [imageError, setImageError] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showConfirmBooking, setShowConfirmBooking] = useState(false);

  // Derived pricing helpers
  const msPerDay = 1000 * 60 * 60 * 24;
  const startTime = startDate ? new Date(startDate).getTime() : NaN;
  const endTime = endDate ? new Date(endDate).getTime() : NaN;
  const hasValidDates =
    Number.isFinite(startTime) && Number.isFinite(endTime) && endTime > startTime;
  const rentalDays = hasValidDates ? Math.ceil((endTime - startTime) / msPerDay) : 0;
  const estimatedTotal = hasValidDates
    ? rentalDays * (equipment?.dailyPrice || 0) * (quantity || 1)
    : 0;

  // Mock related equipment
  const relatedEquipment = [
    {
      id: 2,
      name: 'Case IH Axial-Flow 250',
      category: 'Harvesters',
      dailyRate: 450,
      rating: 4.9,
      image: '🌾',
      availability: 'Available',
    },
    {
      id: 3,
      name: 'Kubota M7-172 Premium',
      category: 'Tractors',
      dailyRate: 220,
      rating: 4.7,
      image: '🚜',
      availability: 'Available',
    },
    {
      id: 4,
      name: 'New Holland T7.315',
      category: 'Tractors',
      dailyRate: 140,
      rating: 4.6,
      image: '🚜',
      availability: 'Rented',
    },
  ];

  const handleBooking = async () => {
    if (!isLoggedIn) {
      showToast({
        type: 'warning',
        title: 'Login Required',
        description: 'Please log in to book equipment.',
        duration: 4000,
      });
      navigate('/login');
      return;
    }

    if (!equipment) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Equipment data not available.',
        duration: 4000,
      });
      return;
    }

    if (isOwnEquipment) {
      showToast({
        type: 'info',
        title: 'Cannot Book Your Own Equipment',
        description: 'You cannot book your own equipment. Use the management page to view details.',
        duration: 5000,
      });
      navigate(`/equipment/my/${equipment.id}`);
      return;
    }

    if (!startDate || !endDate) {
      showToast({
        type: 'warning',
        title: 'Missing Information',
        description: 'Please select start and end dates.',
        duration: 4000,
      });
      return;
    }

    // Validate date format and logic
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      showToast({
        type: 'warning',
        title: 'Invalid Date',
        description: 'Start date cannot be in the past.',
        duration: 4000,
      });
      return;
    }

    if (end <= start) {
      showToast({
        type: 'warning',
        title: 'Invalid Date Range',
        description: 'End date must be after start date.',
        duration: 4000,
      });
      return;
    }

    // Show confirmation prompt instead of directly creating order
    setShowConfirmBooking(true);
  };

  // Confirm booking handling
  const handleConfirmBooking = async () => {
    if (!equipment) return;

    try {
      // Create order
      const response = await createOrder({
        equipmentId: equipment.id,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
      });

      if (response.success && response.data) {
        setShowConfirmBooking(false);
        showToast({
          type: 'info',
          title: 'Request Submitted!',
          description:
            'Your booking request has been sent to the owner. You can track progress in your dashboard.',
          duration: 6000,
        });

        // Navigate to dashboard instead of payment page
        navigate('/dashboard');
      } else {
        showToast({
          type: 'error',
          title: 'Booking Failed',
          description: response.message || 'Failed to create order.',
          duration: 5000,
        });
      }
    } catch (error: unknown) {
      const errorMessage = handleApiError(error);
      showToast({
        type: 'error',
        title: 'Booking Failed',
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
              <ChevronRight className="w-4 h-4" />
              <Link to="/equipment" className="hover:text-primary-600 transition-colors">
                Equipment
              </Link>
              <ChevronRight className="w-4 h-4" />
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
                onClick={() => navigate('/equipment')}
                className="bg-primary-600 hover:bg-primary-700"
              >
                Browse Equipment
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
  const isAvailable = equipment.status === 0;
  const isOwnEquipment = Boolean(user && equipment.ownerId === user.id);
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
            <ChevronRight className="w-4 h-4" />
            <Link to="/equipment" className="hover:text-primary-600 transition-colors">
              Equipment
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-neutral-900">{equipment.name}</span>
          </div>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Equipment image carousel */}
            <Card className="overflow-hidden animate-fade-in-up">
              <CardContent className="p-0">
                <div className="relative h-80 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center group cursor-pointer">
                  {processedImageUrl && !imageError ? (
                    <div className="relative w-full h-full" onClick={() => setShowImageModal(true)}>
                      <img
                        src={processedImageUrl}
                        alt={equipment.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={() => setImageError(true)}
                        onLoad={() => setImageError(false)}
                      />
                      {/* View full image button */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center space-x-2 text-neutral-800">
                          <Search className="w-5 h-5" />
                          <span className="text-sm font-medium">View Full Image</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center">
                      <Tractor className="w-24 h-24 text-primary-500 animate-pulse mb-2" />
                      {imageError && (
                        <div className="text-sm text-neutral-500">Failed to load image</div>
                      )}
                      {!equipment.imageUrl && (
                        <div className="text-sm text-neutral-500">No image available</div>
                      )}
                    </div>
                  )}
                  <div className="absolute top-4 right-4">
                    <Badge variant={statusDisplay.variant}>{statusDisplay.label}</Badge>
                  </div>
                </div>

                {/* Simplified image display */}
                {!processedImageUrl && (
                  <div className="p-4 flex space-x-3">
                    <div className="w-16 h-16 rounded-lg flex items-center justify-center bg-primary-100 border-2 border-primary-500">
                      <Tractor className="w-8 h-8 text-primary-500" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Equipment information */}
            <Card className="animate-fade-in-up animate-stagger-1">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-3xl font-bold text-neutral-900 mb-2">
                      <div className="flex items-center gap-3">
                        {equipment.name}
                        {isOwnEquipment && (
                          <Badge
                            variant="default"
                            className="bg-primary-100 text-primary-700 border-primary-200"
                          >
                            <span className="inline-flex items-center gap-1">
                              <Home className="w-3.5 h-3.5" /> Your Equipment
                            </span>
                          </Badge>
                        )}
                      </div>
                    </CardTitle>
                    <div className="flex items-center space-x-4 text-neutral-600">
                      <span className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 mr-1" />
                        {equipment.averageRating?.toFixed(1) || 'No rating'} (
                        {equipment.totalReviews || 0} reviews)
                      </span>
                      <span className="inline-flex items-center">
                        <MapPin className="w-4 h-4 mr-1" /> {equipment.latitude.toFixed(4)},{' '}
                        {equipment.longitude.toFixed(4)}
                      </span>
                      <Badge variant="outline">{equipment.type || 'Equipment'}</Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-neutral-700 text-lg leading-relaxed">{equipment.description}</p>

                {/* Basic information */}
                <div>
                  <h4 className="font-semibold text-neutral-900 mb-3">Equipment Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex justify-between py-2 border-b border-neutral-100">
                      <span className="text-neutral-600">Owner</span>
                      <span className="font-medium text-neutral-900">
                        {equipment.ownerUsername || equipment.ownerName || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-neutral-100">
                      <span className="text-neutral-600">Type</span>
                      <span className="font-medium text-neutral-900">
                        {equipment.type || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-neutral-100">
                      <span className="text-neutral-600">Daily Rate</span>
                      <span className="font-medium text-neutral-900">${equipment.dailyPrice}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-neutral-100">
                      <span className="text-neutral-600">Status</span>
                      <span className="font-medium text-neutral-900">{statusDisplay.label}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-neutral-100">
                      <span className="text-neutral-600">Coordinates</span>
                      <span className="font-medium text-neutral-900">
                        {equipment.latitude.toFixed(4)}, {equipment.longitude.toFixed(4)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* User reviews */}
            <Card className="animate-fade-in-up animate-stagger-3">
              <CardHeader>
                <CardTitle>User Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Use real review list component */}
                {equipment && <ReviewList equipmentId={equipment.id} />}
              </CardContent>
            </Card>
          </div>

          {/* Right booking card */}
          <div className="space-y-6">
            {/* Price and booking */}
            <Card className="animate-fade-in-up animate-stagger-1">
              <CardHeader>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-600 mb-1">
                    ${equipment.dailyPrice}
                  </div>
                  <div className="text-neutral-600">per day</div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Price options */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Daily Rate</span>
                    <span className="font-medium">${equipment.dailyPrice}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Weekly Rate</span>
                    <span className="font-medium">
                      ${(equipment.dailyPrice * 7 * 0.85).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Monthly Rate</span>
                    <span className="font-medium">
                      ${(equipment.dailyPrice * 30 * 0.7).toFixed(2)}
                    </span>
                  </div>
                </div>

                <hr className="border-neutral-200" />

                {/* Booking form */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-neutral-700 block mb-1">
                        Start Date
                      </label>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full"
                        placeholder="yyyy-mm-dd"
                        lang="en"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-neutral-700 block mb-1">
                        End Date
                      </label>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full"
                        placeholder="yyyy-mm-dd"
                        lang="en"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-neutral-700 block mb-1">
                      Quantity
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  {/* Estimated total */}
                  <div className="p-3 bg-neutral-50 rounded-lg text-sm flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-neutral-700">
                      <CreditCard className="w-4 h-4" /> Estimated Total
                    </span>
                    <span className="font-semibold text-neutral-900">
                      {hasValidDates && quantity > 0
                        ? `$${estimatedTotal.toFixed(2)} (${rentalDays} day${rentalDays > 1 ? 's' : ''})`
                        : '—'}
                    </span>
                  </div>

                  <Button
                    onClick={handleBooking}
                    className="w-full h-12 bg-primary-600 hover:bg-primary-700 font-semibold shadow-medium hover:shadow-large transition-all duration-300"
                    disabled={!isAvailable || isOwnEquipment}
                  >
                    {isOwnEquipment ? 'Your Equipment' : isAvailable ? 'Book Now' : 'Not Available'}
                  </Button>

                  <Button variant="outline" className="w-full h-12 inline-flex items-center gap-2">
                    <Mail className="w-5 h-5" /> Contact Owner
                  </Button>
                </div>

                {/* Policy information */}
                <div className="space-y-2 text-sm text-neutral-600">
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-primary-500 mt-0.5" />
                    <span>Equipment available for daily rental</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-primary-500 mt-0.5" />
                    <span>Contact owner for delivery options</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-primary-500 mt-0.5" />
                    <span>Cancellation policy applies</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Equipment owner information */}
            <Card className="animate-fade-in-up animate-stagger-2">
              <CardHeader>
                <CardTitle>Equipment Owner</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mt-2 flex items-start space-x-5 mb-4">
                  <div className="shrink-0 w-10 h-10 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center">
                    <User className="w-5 h-5 text-neutral-700" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-neutral-900 leading-6">
                      {equipment.ownerUsername || equipment.ownerName || 'Unknown Owner'}
                    </h4>
                    <div className="flex items-center space-x-2 text-sm text-neutral-600 mt-1">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="w-4 h-4" /> Listed on{' '}
                        {new Date(equipment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-neutral-600">
                  Contact owner for more details about this equipment
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Related equipment recommendations */}
        <div className="mt-16 animate-fade-in-up animate-stagger-3">
          <h2 className="text-3xl font-bold text-neutral-900 mb-8 text-center">
            Related Equipment
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedEquipment.map((item) => {
              const IconComp = item.category === 'Harvesters' ? Wheat : Tractor;
              return (
                <Link key={item.id} to={`/equipment/${item.id}`}>
                  <Card className="card-hover">
                    <CardContent className="p-0">
                      <div className="relative h-48 bg-gradient-to-br from-primary-100 to-primary-200 rounded-t-xl flex items-center justify-center">
                        <IconComp className="w-14 h-14 text-primary-600" />
                        <div className="absolute top-4 right-4">
                          <Badge
                            variant={item.availability === 'Available' ? 'success' : 'secondary'}
                            size="sm"
                          >
                            {item.availability}
                          </Badge>
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="font-semibold text-lg text-neutral-900 mb-2">{item.name}</h3>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span className="text-sm font-medium">{item.rating}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-primary-600">
                              ${item.dailyRate}
                            </div>
                            <div className="text-sm text-neutral-600">per day</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
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
      </div>

      {/* Simple confirmation prompt */}
      {showConfirmBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="text-center mb-4">
              <div className="mb-2 flex justify-center">
                <Handshake className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900">Confirm Booking Request</h3>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg mb-4 text-sm">
              <p className="text-blue-800 mb-2">
                <strong>Due to the special nature of agricultural equipment rental</strong>, we need
                the equipment owner to confirm your request before payment.
              </p>
              <p className="text-blue-700">
                Your request will be sent to the owner for approval. You can track the progress in
                your dashboard.
              </p>
            </div>

            <div className="bg-neutral-100 p-3 rounded text-sm mb-4">
              <p>
                <strong>Equipment:</strong> {equipment?.name}
              </p>
              <p>
                <strong>Period:</strong> {startDate} to {endDate}
              </p>
              <p>
                <strong>Total:</strong> $
                {(
                  ((new Date(endDate).getTime() - new Date(startDate).getTime()) /
                    (1000 * 60 * 60 * 24)) *
                  (equipment?.dailyPrice || 0)
                ).toFixed(2)}
              </p>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirmBooking(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onClick={handleConfirmBooking} className="flex-1">
                Send Request
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EquipmentDetailPage;
