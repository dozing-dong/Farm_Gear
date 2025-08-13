import { Bookmark, ChevronDown, Cog, LogOut, Plus, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../lib/toast';
import { Button } from '../ui/button';

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { isLoggedIn, user, logout } = useAuth();
  const { showToast } = useToast();
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const handleLogin = () => {
    navigate('/login');
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsUserMenuOpen(false);
      navigate('/');
    } catch {
      // Error already handled in useAuth
      setIsUserMenuOpen(false);
      navigate('/');
    }
  };

  const handleUserProfile = () => {
    setIsUserMenuOpen(false);
    navigate('/profile');
  };

  const handleComingSoon = (feature: string) => {
    showToast({
      type: 'info',
      title: `${feature} is coming soon! 🚀`,
      description: "We're working hard to bring you this feature.",
      duration: 3000,
    });
  };

  const handleListEquipment = () => {
    setIsUserMenuOpen(false);
    navigate('/equipment/create');
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (!user) return '';
    return user.fullName || user.username;
  };

  // Get user name initials
  const getUserInitial = () => {
    if (!user) return '';
    const name = user.fullName || user.username;
    return name.charAt(0).toUpperCase();
  };

  return (
    <header className="sticky top-0 bg-white shadow-sm border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center">
              <h1 className="text-2xl font-black text-gray-900">
                FARM <span className="text-green-600 border-b-4 border-green-600">GEAR</span>
              </h1>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {/* List gear dropdown */}
            <div className="relative group">
              <button className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors flex items-center">
                List gear
                <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <Link
                  to="/how-to-list"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  How to list
                </Link>
                <Link
                  to="/pricing-guide"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Pricing guide
                </Link>

                {/* List equipment - Permission control */}
                {isLoggedIn && (user?.role === 'Provider' || user?.role === 'Official') ? (
                  <Link
                    to="/equipment/create"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    List equipment
                  </Link>
                ) : (
                  <button
                    onClick={() => {
                      if (!isLoggedIn) {
                        showToast({
                          type: 'warning',
                          title: 'Login Required',
                          description: 'Please log in to list equipment.',
                          duration: 4000,
                        });
                        navigate('/login');
                      } else {
                        showToast({
                          type: 'error',
                          title: 'Access Denied',
                          description: 'Only providers and officials can list equipment.',
                          duration: 4000,
                        });
                      }
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 cursor-not-allowed"
                  >
                    <span className="flex items-center">
                      List equipment
                      <svg
                        className="w-3 h-3 ml-1 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Rent gear dropdown */}
            <div className="relative group">
              <button className="text-gray-700 hover:text-green-600 font-medium flex items-center">
                Rent gear
                <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <Link
                  to="/equipment"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Browse equipment
                </Link>
                <button
                  onClick={() => handleComingSoon('Search by location')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  By location
                </button>
                <button
                  onClick={() => handleComingSoon('Popular equipment')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Popular equipment
                </button>
              </div>
            </div>

            {/* Guides dropdown */}
            <div className="relative group">
              <button className="text-gray-700 hover:text-green-600 font-medium flex items-center">
                Guides
                <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <Link
                  to="/safety-tips"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Safety tips
                </Link>
                <Link
                  to="/maintenance-guide"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Maintenance guide
                </Link>
                <Link
                  to="/best-practices"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Best practices
                </Link>
              </div>
            </div>

            {/* Help dropdown */}
            <div className="relative group">
              <button className="text-gray-700 hover:text-green-600 font-medium flex items-center">
                Help
                <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <Link
                  to="/contact"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Contact us
                </Link>
                <Link to="/faq" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  FAQ
                </Link>
                <Link
                  to="/support"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Support
                </Link>
              </div>
            </div>
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Watchlist */}
            <button className="text-gray-700 hover:text-green-600 transition-colors">
              <Bookmark className="h-6 w-6" />
              <span className="sr-only">Watchlist</span>
            </button>

            {/* User Menu */}
            {isLoggedIn && user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-green-600 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold overflow-hidden">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={getUserDisplayName()}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Show default avatar if image loading fails
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-full h-full bg-green-600 flex items-center justify-center ${user.avatarUrl ? 'hidden' : ''}`}
                    >
                      {getUserInitial()}
                    </div>
                  </div>
                  <div className="hidden md:block">
                    <div className="text-sm font-medium text-gray-900">{getUserDisplayName()}</div>
                    <div className="text-xs text-gray-500">{user.role}</div>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <button
                      onClick={handleUserProfile}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        Profile
                      </div>
                    </button>
                    <Link
                      to="/dashboard"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <div className="flex items-center">
                        <Cog className="w-4 h-4 mr-2" />
                        Dashboard
                      </div>
                    </Link>

                    {/* Only show publish equipment option for Provider and Official roles */}
                    {(user?.role === 'Provider' || user?.role === 'Official') && (
                      <>
                        <button
                          onClick={handleListEquipment}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <div className="flex items-center">
                            <Plus className="w-4 h-4 mr-2" />
                            List Equipment
                          </div>
                        </button>
                        <Link
                          to="/equipment/my"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <div className="flex items-center">
                            <Bookmark className="w-4 h-4 mr-2" />
                            My Equipment
                          </div>
                        </Link>
                      </>
                    )}

                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <div className="flex items-center">
                        <Cog className="w-4 h-4 mr-2" />
                        Settings
                      </div>
                    </a>
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <div className="flex items-center">
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </div>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Button
                onClick={handleLogin}
                variant="outline"
                className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white transition-colors"
              >
                Login
              </Button>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-gray-700 hover:text-green-600 transition-colors"
            >
              <span className="sr-only">Toggle Menu</span>
              <div className="h-6 w-6 relative">
                <span
                  className={`absolute left-0 right-0 top-1 block h-0.5 bg-current transition ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}
                ></span>
                <span
                  className={`absolute left-0 right-0 top-1/2 -mt-0.5 block h-0.5 bg-current transition ${isMenuOpen ? 'opacity-0' : ''}`}
                ></span>
                <span
                  className={`absolute left-0 right-0 bottom-1 block h-0.5 bg-current transition ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}
                ></span>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 pt-4 pb-4">
            <div className="space-y-3">
              {/* Mobile List gear - Permission control */}
              {isLoggedIn && (user?.role === 'Provider' || user?.role === 'Official') ? (
                <Link
                  to="/equipment/create"
                  className="block text-gray-700 hover:text-green-600 font-medium"
                >
                  List gear
                </Link>
              ) : (
                <button
                  onClick={() => {
                    if (!isLoggedIn) {
                      showToast({
                        type: 'warning',
                        title: 'Login Required',
                        description: 'Please log in to list equipment.',
                        duration: 4000,
                      });
                      navigate('/login');
                    } else {
                      showToast({
                        type: 'error',
                        title: 'Access Denied',
                        description: 'Only providers and officials can list equipment.',
                        duration: 4000,
                      });
                    }
                    setIsMenuOpen(false); // Close mobile menu
                  }}
                  className="block w-full text-left text-gray-500 hover:text-green-600 font-medium flex items-center"
                >
                  List gear
                  <svg
                    className="w-3 h-3 ml-1 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </button>
              )}
              <Link
                to="/equipment"
                className="block text-gray-700 hover:text-green-600 font-medium"
              >
                Rent gear
              </Link>
              <Link
                to="/safety-tips"
                className="block text-gray-700 hover:text-green-600 font-medium"
              >
                Guides
              </Link>
              <Link to="/contact" className="block text-gray-700 hover:text-green-600 font-medium">
                Help
              </Link>
              {!isLoggedIn && (
                <div className="pt-3 border-t border-gray-200">
                  <Button
                    onClick={handleLogin}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    Login
                  </Button>
                </div>
              )}
              {isLoggedIn && (
                <div className="pt-3 border-t border-gray-200 space-y-2">
                  <button
                    onClick={handleUserProfile}
                    className="block w-full text-left text-gray-700 hover:text-green-600 font-medium"
                  >
                    Profile
                  </button>
                  <Link
                    to="/dashboard"
                    className="block text-gray-700 hover:text-green-600 font-medium"
                  >
                    Dashboard
                  </Link>
                  {/* Also add publish equipment option for mobile */}
                  {(user?.role === 'Provider' || user?.role === 'Official') && (
                    <>
                      <button
                        onClick={handleListEquipment}
                        className="block w-full text-left text-gray-700 hover:text-green-600 font-medium"
                      >
                        List Equipment
                      </button>
                      <Link
                        to="/equipment/my"
                        className="block text-gray-700 hover:text-green-600 font-medium"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        My Equipment
                      </Link>
                    </>
                  )}
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left text-gray-700 hover:text-green-600 font-medium"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
