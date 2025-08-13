import { render, screen, waitFor } from '@/test/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import HomePage from '../HomePage';

// Mock API
vi.mock('@/lib/api', () => ({
  farmGearAPI: {
    getEquipmentList: vi.fn(),
  },
  handleApiError: vi.fn(),
}));

// Mock hooks
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    isLoggedIn: false,
    user: null,
  })),
}));

const mockShowToast = vi.fn();
vi.mock('@/lib/toast', () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
}));

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/', search: '', state: null }),
  };
});

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockShowToast.mockClear();
  });

  it('renders welcome message', async () => {
    render(<HomePage />);

    expect(screen.getByText(/find the perfect/i)).toBeInTheDocument();
    expect(screen.getByText('farm equipment')).toBeInTheDocument();
  });

  it('renders search form', () => {
    render(<HomePage />);

    expect(screen.getByPlaceholderText(/search tractors, harvesters/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search equipment/i })).toBeInTheDocument();
  });

  it('renders equipment categories', () => {
    render(<HomePage />);

    // Check if some category cards are rendered
    expect(screen.getByText('Tractors')).toBeInTheDocument();
    expect(screen.getByText('Harvesters')).toBeInTheDocument();
    expect(screen.getByText('Plows')).toBeInTheDocument();
  });

  it('handles search functionality', async () => {
    const { user } = render(<HomePage />);

    const searchInput = screen.getByPlaceholderText(/search tractors, harvesters/i);
    const searchButton = screen.getByRole('button', { name: /search equipment/i });

    await user.type(searchInput, 'tractor');
    await user.click(searchButton);

    expect(mockNavigate).toHaveBeenCalledWith('/equipment?search=tractor');
  });

  it('handles category click', async () => {
    const { user } = render(<HomePage />);

    const tractorCategory = screen.getByText('Tractors');
    await user.click(tractorCategory);

    expect(mockNavigate).toHaveBeenCalledWith('/equipment?category=Tractors');
  });

  it('renders CTA section', () => {
    render(<HomePage />);

    expect(screen.getByText(/ready to list your equipment/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /list your equipment/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /contact support/i })).toBeInTheDocument();
  });

  it('shows loading state for daily equipment', () => {
    render(<HomePage />);

    expect(screen.getByText(/loading daily equipment/i)).toBeInTheDocument();
  });

  it('shows empty state when no equipment available', async () => {
    const { farmGearAPI } = await import('@/lib/api');
    farmGearAPI.getEquipmentList = vi.fn().mockResolvedValue({
      success: true,
      data: [],
    });

    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText(/no equipment available today/i)).toBeInTheDocument();
    });
  });

  it('handles equipment list API error gracefully', async () => {
    const { farmGearAPI } = await import('@/lib/api');
    farmGearAPI.getEquipmentList = vi.fn().mockRejectedValue(new Error('API Error'));

    render(<HomePage />);

    // Should handle error gracefully and show empty state
    await waitFor(() => {
      expect(screen.getByText(/no equipment available today/i)).toBeInTheDocument();
    });
  });

  it('handles list equipment button click when not logged in', async () => {
    const { user } = render(<HomePage />);

    const listButton = screen.getByRole('button', { name: /list your equipment/i });
    await user.click(listButton);

    expect(mockShowToast).toHaveBeenCalledWith({
      type: 'warning',
      title: 'Login Required',
      description: 'Please log in to list your equipment.',
      duration: 4000,
    });
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});
