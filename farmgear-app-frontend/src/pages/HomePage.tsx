import {
  ClipboardList,
  Cog,
  Droplets,
  Loader2,
  MapPin,
  Phone,
  Search,
  Sprout,
  Tractor,
  Wheat,
  Wrench,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { useAuth } from '../hooks/useAuth';
import { farmGearAPI, handleApiError, type Equipment } from '../lib/api';
import { getImageUrl, getStatusDisplay } from '../lib/constants';
import { useToast } from '../lib/toast';

function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [dailyEquipment, setDailyEquipment] = useState<Equipment[]>([]);
  const [isLoadingDaily, setIsLoadingDaily] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isLoggedIn, user } = useAuth();

  // Handle search functionality
  const handleSearch = () => {
    // Build query parameters
    const queryParams = new URLSearchParams();

    // Add search term (if any)
    if (searchQuery.trim()) {
      queryParams.set('search', searchQuery.trim());
    }

    // Add category (if selected)
    if (selectedCategory && selectedCategory !== '') {
      queryParams.set('category', selectedCategory);
    }

    // Ignore location input, don't add it to query parameters
    // Even if user inputs location, it won't be used

    // Navigate to equipment list page with query parameters
    const queryString = queryParams.toString();
    navigate(`/equipment${queryString ? `?${queryString}` : ''}`);
  };

  // Handle category card click
  const handleCategoryClick = (categoryName: string) => {
    // Navigate to equipment list page with category parameter
    navigate(`/equipment?category=${categoryName}`);
  };

  // Handle equipment card click
  const handleEquipmentClick = (equipmentId: string) => {
    // Navigate to equipment details page
    navigate(`/equipment/${equipmentId}`);
  };

  // Get random daily equipment
  useEffect(() => {
    const fetchDailyEquipment = async () => {
      try {
        setIsLoadingDaily(true);

        // Get all equipment, then randomly select 3
        // Use larger pageSize to get more equipment for random selection
        const response = await farmGearAPI.getEquipmentList({
          pageNumber: 1,
          pageSize: 50, // Get first 50 equipment items
        });

        if (response.success && response.data?.items) {
          const allEquipment = response.data.items;

          // Only get available equipment (status === 0)
          const availableEquipment = allEquipment.filter((eq) => eq.status === 0);

          // Randomly shuffle array and take first 3
          const shuffled = [...availableEquipment].sort(() => 0.5 - Math.random());
          const randomThree = shuffled.slice(0, 3);

          setDailyEquipment(randomThree);
        }
      } catch (error: unknown) {
        handleApiError(error);
        // If fetch fails, use empty array
        setDailyEquipment([]);
      } finally {
        setIsLoadingDaily(false);
      }
    };

    fetchDailyEquipment();
  }, []); // Only execute once on component mount

  // Check login success status and show message - only check on component first mount
  useEffect(() => {
    const checkLoginSuccess = () => {
      if (location.state?.showLoginSuccess) {
        showToast({
          type: 'success',
          title: 'Login Successful',
          description: 'Welcome back! You have been successfully logged in.',
          duration: 4000,
        });

        // Clear state immediately to avoid duplicate display
        navigate(location.pathname, { replace: true, state: {} });
      }
    };

    // Use setTimeout to ensure execution after component is fully mounted
    const timer = setTimeout(checkLoginSuccess, 100);

    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- Only execute once on component first mount

  // Status mapping

  const categories = [
    { name: 'Tractors', icon: 'tractor' },
    { name: 'Harvesters', icon: 'wheat' },
    { name: 'Plows', icon: 'wrench' },
    { name: 'Seeders', icon: 'sprout' },
    { name: 'Cultivators', icon: 'cog' },
    { name: 'Sprayers', icon: 'droplets' },
  ];

  const CATEGORY_ICON_MAP: Record<string, React.ComponentType<any>> = {
    tractor: Tractor,
    wheat: Wheat,
    wrench: Wrench,
    sprout: Sprout,
    cog: Cog,
    droplets: Droplets,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50/30">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-100/20 to-primary-200/10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-200/20 rounded-full blur-3xl transform translate-x-32 -translate-y-32" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary-300/20 rounded-full blur-3xl transform -translate-x-32 translate-y-32" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center animate-fade-in-up">
            <h1 className="text-5xl lg:text-7xl font-bold text-neutral-900 mb-6 text-balance">
              Find the perfect <span className="text-gradient">farm equipment</span> for your needs
            </h1>
            <p className="text-xl lg:text-2xl text-neutral-600 mb-12 max-w-3xl mx-auto text-balance animate-fade-in-up animate-stagger-1">
              Rent quality agricultural equipment from trusted providers in your area. Get the tools
              you need, when you need them.
            </p>

            {/* Search card */}
            <Card className="max-w-4xl mx-auto shadow-large animate-fade-in-up animate-stagger-2">
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-700">What equipment?</label>
                    <Input
                      placeholder="Search tractors, harvesters..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-14"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-700">Category</label>
                    <select
                      className="input-field h-14"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                      <option value="">All categories</option>
                      {categories.map((cat) => (
                        <option key={cat.name} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-700">Location</label>
                    <Input
                      placeholder="Enter city or postcode"
                      value={locationInput}
                      onChange={(e) => setLocationInput(e.target.value)}
                      className="h-14"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleSearch}
                  className="w-full md:w-auto px-12 py-4 text-lg font-semibold bg-primary-600 hover:bg-primary-700 shadow-medium hover:shadow-large transition-all duration-300"
                >
                  <span className="inline-flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    Search Equipment
                  </span>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Category browsing */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">Browse by Category</h2>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              Find the right equipment for every farming task
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((category, index) => (
              <Card
                key={category.name}
                className={`card-hover cursor-pointer group animate-fade-in-up animate-stagger-${(index % 3) + 1} h-full min-h-[160px]`}
                onClick={() => handleCategoryClick(category.name)}
              >
                <CardContent className="p-6 text-center h-full flex flex-col justify-center items-center space-y-2">
                  <div className="text-4xl mb-2 text-primary-700 group-hover:scale-110 transition-transform duration-200">
                    {(() => {
                      const Ico = CATEGORY_ICON_MAP[category.icon as keyof typeof CATEGORY_ICON_MAP];
                      return Ico ? <Ico className="w-8 h-8" /> : null;
                    })()}
                  </div>
                  <h3 className="font-semibold text-neutral-900 text-sm">{category.name}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured equipment */}
      <section className="py-20 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">Daily Equipment</h2>
          </div>

          {isLoadingDaily ? (
            <div className="col-span-full text-center py-12">
              <div className="mb-4 flex justify-center">
                <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
              </div>
              <div className="text-xl text-neutral-600">Loading daily equipment...</div>
            </div>
          ) : dailyEquipment.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="mb-4 flex justify-center">
                <Search className="w-12 h-12 text-neutral-400" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                No equipment available today
              </h3>
              <p className="text-neutral-600">Check back later for new equipment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {dailyEquipment.map((equipment, index) => {
                const statusDisplay = getStatusDisplay(equipment.status);
                const imageUrl = getImageUrl(equipment.imageUrl);

                return (
                  <Card
                    key={equipment.id}
                    className={`group animate-fade-in-up animate-stagger-${(index % 3) + 1} flex flex-col h-full`}
                  >
                    <CardContent className="p-0 flex-1 flex flex-col">
                      {/* Equipment image area */}
                      <div className="relative h-48 bg-gradient-to-br from-primary-100 to-primary-200 rounded-t-xl flex items-center justify-center">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={equipment.name}
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
                      </div>

                      {/* Equipment information */}
                      <div className="p-6 flex-1 flex flex-col">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-neutral-900 mb-1">
                              {equipment.name}
                            </h3>
                            <p className="text-sm text-neutral-600">
                              {equipment.ownerUsername || equipment.ownerName || 'Unknown Owner'}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary-600">
                              ${equipment.dailyPrice}
                            </div>
                            <div className="text-sm text-neutral-500">per day</div>
                          </div>
                        </div>

                        {/* Category and location */}
                        <div className="flex items-center justify-between mb-3">
                          <Badge variant="outline" size="sm">
                            {equipment.type || 'Equipment'}
                          </Badge>
                          <div className="flex items-center text-sm text-neutral-600">
                            <MapPin className="w-4 h-4 mr-1" />
                            {equipment.latitude.toFixed(2)}, {equipment.longitude.toFixed(2)}
                          </div>
                        </div>

                        {/* Description preview */}
                        <div className="mb-4 flex-1">
                          <p className="text-sm text-neutral-600 line-clamp-2">
                            {equipment.description}
                          </p>
                        </div>

                        {/* Button */}
                        <div className="mt-auto">
                          <Button
                            className="w-full h-12 bg-primary-600 hover:bg-primary-700 transition-colors"
                            onClick={() => handleEquipmentClick(equipment.id)}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold text-white mb-4">Ready to list your equipment?</h2>
            <p className="text-xl text-primary-100 mb-8">
              Join thousands of equipment owners earning extra income by renting out their farm
              equipment.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="default"
                onClick={() => {
                  if (!isLoggedIn) {
                    showToast({
                      type: 'warning',
                      title: 'Login Required',
                      description: 'Please log in to list your equipment.',
                      duration: 4000,
                    });
                    navigate('/login');
                  } else if (user?.role !== 'Provider' && user?.role !== 'Official') {
                    showToast({
                      type: 'error',
                      title: 'Access Denied',
                      description: 'Only providers and officials can list equipment.',
                      duration: 4000,
                    });
                  } else {
                    navigate('/equipment/create');
                  }
                }}
                className="bg-white text-primary-600 hover:bg-primary-50 hover:text-primary-700 border-0 h-12 px-8 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 inline-flex items-center gap-2"
              >
                <ClipboardList className="w-5 h-5" />
                List Your Equipment
              </Button>
              <Button
                variant="default"
                onClick={() => navigate('/contact')}
                className="bg-white text-primary-600 hover:bg-primary-50 hover:text-primary-700 border-0 h-12 px-8 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 inline-flex items-center gap-2"
              >
                <Phone className="w-5 h-5" />
                Contact Support
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
