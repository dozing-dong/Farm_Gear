import { Loader2, MapPin, Search, Star, Tractor, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { farmGearAPI, handleApiError, type Equipment } from '../lib/api';
import { EQUIPMENT_FILTER_CATEGORIES, getImageUrl, getStatusDisplay } from '../lib/constants';
import { useToast } from '../lib/toast';

function EquipmentListPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  // Get initial values from URL parameters
  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || 'all';

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [searchInput, setSearchInput] = useState(initialSearch); // For input field display
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(9); // Display 9 equipment per page (3x3 grid)
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Data state
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get equipment list
  useEffect(() => {
    const fetchEquipment = async () => {
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

        const response = await farmGearAPI.getEquipmentList(params);

        if (response.success && response.data) {
          setEquipment(response.data.items || []);
          setTotalPages(response.data.totalPages || 0);
          setTotalCount(response.data.totalCount || 0);
        } else {
          setError(response.message || 'Failed to load equipment');
        }
      } catch (error: unknown) {
        const errorMessage = handleApiError(error);
        setError(errorMessage);
        showToast({
          type: 'error',
          title: 'Loading Failed',
          description: 'Failed to load equipment list. Please try again.',
          duration: 5000,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEquipment();
  }, [currentPage, pageSize, searchQuery, selectedCategory, showToast]);

  // Handle equipment click navigation
  const handleEquipmentClick = (equipmentId: string) => {
    navigate(`/equipment/${equipmentId}`);
  };

  // Handle image URL

  // Status mapping

  // Handle search
  const handleSearch = () => {
    setSearchQuery(searchInput);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Handle category change
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1); // Reset to first page when switching categories
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top when switching pages
  };

  const categories = EQUIPMENT_FILTER_CATEGORIES;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
          </div>
          <div className="text-xl text-neutral-600">Loading equipment...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50/30 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="mb-4 flex justify-center">
            <XCircle className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Failed to Load Equipment</h1>
          <p className="text-neutral-600 mb-6">{error}</p>
          <Button
            onClick={() => {
              // 🔥 Smart retry: re-fetch data without refreshing entire page
              setError(null);
              setCurrentPage(1); // Reset to first page to trigger data re-fetch
            }}
            className="bg-primary-600 hover:bg-primary-700"
          >
            Try Again
          </Button>
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
        {/* Page title */}
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-4xl font-bold text-neutral-900 mb-2">Browse Equipment</h1>
          <p className="text-xl text-neutral-600">Find the perfect farm equipment for your needs</p>
        </div>

        {/* Search and filter area */}
        <Card className="mb-8 animate-fade-in-up animate-stagger-1">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        {equipment.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-4 flex justify-center">
              <Search className="w-12 h-12 text-neutral-400" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">No Equipment Found</h3>
            <p className="text-neutral-600">Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          <div
            key={`equipment-grid-${selectedCategory}-${searchQuery}-${currentPage}`}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up animate-stagger-2"
          >
            {equipment.map((item) => {
              const statusDisplay = getStatusDisplay(item.status);
              const imageUrl = getImageUrl(item.imageUrl);

              return (
                <Card
                  key={item.id}
                  className="hover:shadow-large hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                  onClick={() => handleEquipmentClick(item.id)}
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

                      {item.averageRating && (
                        <div className="absolute top-4 left-4">
                          <div className="flex items-center space-x-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1">
                            <Star className="w-3.5 h-3.5 text-yellow-500" />
                            <span className="text-sm font-medium">
                              {item.averageRating.toFixed(1)}
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
                        <p className="text-sm text-neutral-600">
                          {item.ownerUsername || item.ownerName || 'Unknown Owner'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="outline" size="sm">
                          {item.type || 'Equipment'}
                        </Badge>
                        <div className="flex items-center text-sm text-neutral-600">
                          <MapPin className="w-4 h-4 mr-1" />
                          {item.latitude.toFixed(2)}, {item.longitude.toFixed(2)}
                        </div>
                      </div>

                      {/* Description preview */}
                      <div className="mb-4">
                        <p className="text-sm text-neutral-600 line-clamp-2">{item.description}</p>
                      </div>

                      {/* Price and actions */}
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-2xl font-bold text-primary-600">
                            ${item.dailyPrice}
                          </span>
                          <span className="text-sm text-neutral-600">/day</span>
                        </div>
                        <Button
                          size="sm"
                          disabled={item.status !== 0}
                          className="min-w-[80px]"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEquipmentClick(item.id);
                          }}
                        >
                          {item.status === 0 ? 'View Details' : 'Unavailable'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-12 animate-fade-in-up animate-stagger-3">
            {/* Previous page button */}
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

            {/* Page number buttons */}
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

            {/* Next page button */}
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
      </div>
    </div>
  );
}

export default EquipmentListPage;
