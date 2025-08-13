import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ImageUploader } from '../components/ui/ImageUploader';
import { Input } from '../components/ui/input';
import { useAuth } from '../hooks/useAuth';
import { farmGearAPI, handleApiError, type CreateEquipmentRequest } from '../lib/api';
import { useToast } from '../lib/toast';

interface FormData {
  name: string;
  description: string;
  dailyPrice: string;
  latitude: string;
  longitude: string;
  type: string;
}

function EquipmentCreatePage() {
  const navigate = useNavigate();
  const { isLoggedIn, user, isInitialized } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    dailyPrice: '',
    latitude: '',
    longitude: '',
    type: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [accessDenied, setAccessDenied] = useState(false);

  // Image upload related state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string>('');

  // Check user permissions
  useEffect(() => {
    // Only check after auth system is initialized
    if (!isInitialized) return;

    if (!isLoggedIn) {
      showToast({
        type: 'warning',
        title: 'Authentication Required',
        description: 'Please log in to list equipment.',
        duration: 4000,
      });
      navigate('/login');
      return;
    }

    if (user?.role !== 'Provider' && user?.role !== 'Official') {
      setAccessDenied(true);
      return;
    }
  }, [isLoggedIn, user, navigate, showToast, isInitialized]);

  // Clean up preview URL
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // If user has no permission, show dedicated access denied page
  if (accessDenied) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50/30">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary-200/10 rounded-full blur-3xl transform translate-x-32 -translate-y-32" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary-300/10 rounded-full blur-3xl transform -translate-x-32 translate-y-32" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb navigation */}
          <nav className="mb-8">
            <div className="flex items-center space-x-2 text-sm text-neutral-600">
              <Link to="/" className="hover:text-primary-600 transition-colors">
                Home
              </Link>
              <span>•</span>
              <Link to="/equipment" className="hover:text-primary-600 transition-colors">
                Equipment
              </Link>
              <span>•</span>
              <span className="text-neutral-900">List Equipment</span>
            </div>
          </nav>

          {/* Insufficient permissions prompt */}
          <div className="max-w-2xl mx-auto text-center">
            <Card className="p-8">
              <CardContent className="space-y-6">
                {/* Icon */}
                <div className="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-yellow-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>

                {/* Title */}
                <div>
                  <h1 className="text-2xl font-bold text-neutral-900 mb-2">Access Denied</h1>
                  <p className="text-neutral-600">
                    Sorry, your current account type is{' '}
                    <span className="font-semibold text-primary-600">{user?.role}</span>. Only
                    equipment providers (Provider) and official personnel (Official) can list
                    equipment.
                  </p>
                </div>

                {/* Description information */}
                <div className="bg-blue-50 p-4 rounded-lg text-left">
                  <h3 className="font-semibold text-blue-900 mb-2">Want to list equipment?</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>
                      • If you are an equipment provider, please contact customer service to upgrade
                      your account type
                    </li>
                    <li>• If you need to rent equipment, you can browse our equipment listings</li>
                    <li>
                      • If you have any questions, please contact customer service for more
                      information
                    </li>
                  </ul>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={() => navigate('/equipment')}
                    className="bg-primary-600 hover:bg-primary-700"
                  >
                    Browse Equipment
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/')}>
                    Back to Home
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Here you can add contact customer service logic
                      showToast({
                        type: 'info',
                        title: 'Contact Support',
                        description: 'Please contact us through official customer service channels',
                        duration: 4000,
                      });
                    }}
                  >
                    Contact Support
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Image handling function
  const handleImageChange = (file: File | null) => {
    setSelectedImage(file);
    setImageError('');

    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setImageError('Please select a valid image file (PNG, JPG, GIF)');
        setSelectedImage(null);
        setImagePreview(null);
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setImageError('Image size cannot exceed 5MB');
        setSelectedImage(null);
        setImagePreview(null);
        return;
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    } else {
      setImagePreview(null);
    }
  };

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Equipment name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Equipment name must be at least 2 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (!formData.dailyPrice.trim()) {
      newErrors.dailyPrice = 'Daily price is required';
    } else {
      const price = parseFloat(formData.dailyPrice);
      if (isNaN(price) || price <= 0) {
        newErrors.dailyPrice = 'Daily price must be a positive number';
      }
    }

    if (!formData.latitude.trim()) {
      newErrors.latitude = 'Latitude is required';
    } else {
      const lat = parseFloat(formData.latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        newErrors.latitude = 'Latitude must be between -90 and 90';
      }
    }

    if (!formData.longitude.trim()) {
      newErrors.longitude = 'Longitude is required';
    } else {
      const lng = parseFloat(formData.longitude);
      if (isNaN(lng) || lng < -180 || lng > 180) {
        newErrors.longitude = 'Longitude must be between -180 and 180';
      }
    }

    if (!formData.type.trim()) {
      newErrors.type = 'Equipment type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form changes
  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear related errors
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast({
        type: 'error',
        title: 'Validation Failed',
        description: 'Please correct the errors in the form.',
        duration: 4000,
      });
      return;
    }

    setIsLoading(true);

    try {
      const equipmentRequest: CreateEquipmentRequest = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        dailyPrice: parseFloat(formData.dailyPrice),
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        type: formData.type.trim(),
      };

      const response = await farmGearAPI.createEquipment(
        equipmentRequest,
        selectedImage || undefined
      );

      if (response.success && response.data) {
        showToast({
          type: 'success',
          title: 'Equipment Listed Successfully',
          description: `${response.data.name} has been added to the marketplace.`,
          duration: 5000,
        });

        // Navigate to equipment details page or equipment list
        navigate(`/equipment/${response.data.id}`);
      } else {
        showToast({
          type: 'error',
          title: 'Failed to List Equipment',
          description: response.message || 'Failed to create equipment listing. Please try again.',
          duration: 5000,
        });
      }
    } catch (error: unknown) {
      const errorMessage = handleApiError(error);

      // Special handling for 403 errors
      const is403Error =
        errorMessage.includes('403') || errorMessage.toLowerCase().includes('forbidden');

      if (is403Error) {
        showToast({
          type: 'error',
          title: 'Permission Denied',
          description: `You don't have permission to create equipment. Current role: ${user?.role || 'Unknown'}. Required: Provider or Official.`,
          duration: 8000,
        });
      } else {
        showToast({
          type: 'error',
          title: 'Failed to List Equipment',
          description: errorMessage,
          duration: 6000,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50/30">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-200/10 rounded-full blur-3xl transform translate-x-32 -translate-y-32" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary-300/10 rounded-full blur-3xl transform -translate-x-32 translate-y-32" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb navigation */}
        <nav className="mb-8">
          <div className="flex items-center space-x-2 text-sm text-neutral-600">
            <Link to="/" className="hover:text-primary-600 transition-colors">
              Home
            </Link>
            <span>•</span>
            <Link to="/equipment" className="hover:text-primary-600 transition-colors">
              Equipment
            </Link>
            <span>•</span>
            <span className="text-neutral-900">List Equipment</span>
          </div>
        </nav>

        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">List Your Equipment</h1>
          <p className="text-neutral-600">
            Share your agricultural equipment with farmers in your area
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form area */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Equipment Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Equipment name */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Equipment Name *
                    </label>
                    <Input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder="e.g., John Deere 6120M Tractor"
                      className={`w-full ${errors.name ? 'border-red-500' : ''}`}
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>

                  {/* Equipment type */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Equipment Type *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => handleChange('type', e.target.value)}
                      className={`w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.type ? 'border-red-500' : ''}`}
                    >
                      <option value="">Select type</option>
                      <option value="Tractors">Tractors</option>
                      <option value="Harvesters">Harvesters</option>
                      <option value="Plows">Plows</option>
                      <option value="Seeders">Seeders</option>
                      <option value="Sprayers">Sprayers</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Description *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      placeholder="Describe your equipment, its features, condition, and any special requirements..."
                      rows={4}
                      className={`w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.description ? 'border-red-500' : ''}`}
                    />
                    {errors.description && (
                      <p className="text-red-500 text-xs mt-1">{errors.description}</p>
                    )}
                  </div>

                  {/* Daily price */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Daily Rental Price (NZD) *
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.dailyPrice}
                      onChange={(e) => handleChange('dailyPrice', e.target.value)}
                      placeholder="290.00"
                      className={`w-full ${errors.dailyPrice ? 'border-red-500' : ''}`}
                    />
                    {errors.dailyPrice && (
                      <p className="text-red-500 text-xs mt-1">{errors.dailyPrice}</p>
                    )}
                  </div>

                  {/* Location information */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Latitude *
                      </label>
                      <Input
                        type="number"
                        step="any"
                        value={formData.latitude}
                        onChange={(e) => handleChange('latitude', e.target.value)}
                        placeholder="39.9042"
                        className={`w-full ${errors.latitude ? 'border-red-500' : ''}`}
                      />
                      {errors.latitude && (
                        <p className="text-red-500 text-xs mt-1">{errors.latitude}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Longitude *
                      </label>
                      <Input
                        type="number"
                        step="any"
                        value={formData.longitude}
                        onChange={(e) => handleChange('longitude', e.target.value)}
                        placeholder="116.4074"
                        className={`w-full ${errors.longitude ? 'border-red-500' : ''}`}
                      />
                      {errors.longitude && (
                        <p className="text-red-500 text-xs mt-1">{errors.longitude}</p>
                      )}
                    </div>
                  </div>

                  {/* Equipment image upload */}
                  <div>
                    <ImageUploader
                      onImageChange={handleImageChange}
                      preview={imagePreview}
                      error={imageError}
                      disabled={isLoading}
                    />
                  </div>

                  {/* Submit button */}
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate(-1)}
                      disabled={isLoading}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 bg-primary-600 hover:bg-primary-700"
                    >
                      {isLoading ? 'Listing Equipment...' : 'List Equipment'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar information */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Listing Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-neutral-600">
                  <h4 className="font-semibold text-neutral-900 mb-2">Equipment Requirements</h4>
                  <ul className="space-y-1">
                    <li>• Equipment must be in working condition</li>
                    <li>• Provide accurate location information</li>
                    <li>• Set competitive pricing</li>
                    <li>• Include detailed description</li>
                  </ul>
                </div>

                <div className="text-sm text-neutral-600">
                  <h4 className="font-semibold text-neutral-900 mb-2">Pricing Tips</h4>
                  <ul className="space-y-1">
                    <li>• Research similar equipment in your area</li>
                    <li>• Consider equipment age and condition</li>
                    <li>• Include fuel and maintenance costs</li>
                    <li>• Offer competitive rates</li>
                  </ul>
                </div>

                <div className="bg-primary-50 p-3 rounded-lg">
                  <div className="text-sm text-primary-700">
                    <div className="font-semibold mb-1">Need Help?</div>
                    <p className="text-xs">
                      Contact our support team if you need assistance with listing your equipment.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EquipmentCreatePage;
