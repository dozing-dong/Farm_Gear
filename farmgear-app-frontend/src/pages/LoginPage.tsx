import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../lib/toast';

// Helper function to get user-friendly error messages for authentication
const getAuthErrorMessage = (error: string): { title: string; description?: string } => {
  const lowerError = error.toLowerCase();

  // Handle specific backend error messages first
  if (error === 'Invalid login credentials') {
    return {
      title: 'Invalid Credentials',
      description:
        'Your username/email or password is incorrect. Please check your credentials and try again.',
    };
  }

  if (error === 'Token has expired. Please log in again.') {
    return {
      title: 'Session Expired',
      description: 'Your session has expired. Please log in again.',
    };
  }

  // Handle 403 errors - Access Denied / Invalid credentials
  if (lowerError.includes('request failed with status code 403') || lowerError.includes('403')) {
    return {
      title: 'Invalid Credentials',
      description:
        'Your username/email or password is incorrect. Please check your credentials and try again.',
    };
  }

  // Handle 401 errors - Authentication failed
  if (lowerError.includes('request failed with status code 401') || lowerError.includes('401')) {
    return {
      title: 'Authentication Failed',
      description: 'Invalid username/email or password. Please try again.',
    };
  }

  // Handle 400 errors - Bad request
  if (lowerError.includes('request failed with status code 400') || lowerError.includes('400')) {
    return {
      title: 'Invalid Request',
      description: 'Please check your input and try again.',
    };
  }

  // Handle 422 errors - Validation failed
  if (lowerError.includes('request failed with status code 422') || lowerError.includes('422')) {
    return {
      title: 'Validation Error',
      description: 'Please check your username/email and password format.',
    };
  }

  // Handle 429 errors - Too many requests
  if (lowerError.includes('request failed with status code 429') || lowerError.includes('429')) {
    return {
      title: 'Too Many Attempts',
      description: 'Please wait a moment before trying again.',
    };
  }

  // Handle 500 errors - Server error
  if (lowerError.includes('request failed with status code 500') || lowerError.includes('500')) {
    return {
      title: 'Server Error',
      description: 'Something went wrong on our end. Please try again later.',
    };
  }

  // Handle network/connection errors
  if (lowerError.includes('network') || lowerError.includes('connection')) {
    return {
      title: 'Connection Error',
      description: 'Please check your internet connection and try again.',
    };
  }

  // Handle timeout errors
  if (lowerError.includes('timeout')) {
    return {
      title: 'Request Timeout',
      description: 'The request took too long. Please try again.',
    };
  }

  // Clean up any remaining technical error messages
  if (lowerError.includes('request failed') || lowerError.includes('status code')) {
    return {
      title: 'Sign In Failed',
      description: 'Unable to sign in. Please check your credentials and try again.',
    };
  }

  // For any other error messages that are too long or technical
  if (error.length > 100 || lowerError.includes('axios') || lowerError.includes('xhr')) {
    return {
      title: 'Sign In Failed',
      description: 'Unable to sign in. Please try again.',
    };
  }

  return {
    title: 'Sign In Failed',
    description: error,
  };
};

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    usernameOrEmail: '',
    password: '',
    rememberMe: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.usernameOrEmail.trim()) {
      errors.usernameOrEmail = 'Username or email is required';
    }

    if (!formData.password.trim()) {
      errors.password = 'Password is required';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setFieldErrors({});

    try {
      const response = await login({
        usernameOrEmail: formData.usernameOrEmail,
        password: formData.password,
        rememberMe: formData.rememberMe,
      });

      if (response.success && response.data) {
        showToast({
          type: 'success',
          title: 'Welcome Back!',
          description: 'You have been successfully signed in',
        });
        // Navigate to home page
        navigate('/');
      } else {
        const errorMsg = getAuthErrorMessage(response.message || 'Invalid credentials');
        showToast({
          type: 'error',
          title: errorMsg.title,
          description: errorMsg.description,
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Login failed. Please try again.';
      const errorMsg = getAuthErrorMessage(errorMessage);
      showToast({
        type: 'error',
        title: errorMsg.title,
        description: errorMsg.description,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100/30 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-200/20 rounded-full blur-3xl transform translate-x-32 -translate-y-32" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary-300/20 rounded-full blur-3xl transform -translate-x-32 translate-y-32" />
      </div>

      {/* Back to home button */}
      <div className="absolute top-4 left-4 z-10">
        <Link to="/" className="inline-flex items-center">
          <Button
            variant="outline"
            className="bg-white/80 backdrop-blur-sm border-neutral-200 hover:bg-white hover:border-primary-600 text-neutral-700 hover:text-primary-600 transition-all duration-200"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Home
          </Button>
        </Link>
      </div>

      <div className="relative w-full max-w-md animate-fade-in-up">
        {/* Logo area */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <h1 className="text-4xl font-black text-neutral-900">
              FARM <span className="text-gradient border-b-4 border-primary-600">GEAR</span>
            </h1>
          </Link>
          <p className="text-neutral-600 mt-2">Welcome back to your farm equipment marketplace</p>
        </div>

        {/* Login card */}
        <Card className="shadow-large border-0 animate-fade-in-up animate-stagger-1">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-neutral-900">Sign In</CardTitle>
            <CardDescription className="text-neutral-600">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username/Email input */}
              <div className="space-y-2">
                <label htmlFor="usernameOrEmail" className="text-sm font-medium text-neutral-700">
                  Username or Email
                </label>
                <Input
                  id="usernameOrEmail"
                  name="usernameOrEmail"
                  type="text"
                  autoComplete="username"
                  value={formData.usernameOrEmail}
                  onChange={handleChange}
                  placeholder="Enter your username or email"
                  className={`h-12 ${fieldErrors.usernameOrEmail ? 'border-red-500 focus:border-red-500' : ''}`}
                />
                {fieldErrors.usernameOrEmail && (
                  <p className="text-sm text-red-600 mt-1">{fieldErrors.usernameOrEmail}</p>
                )}
              </div>

              {/* Password input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium text-neutral-700">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className={`h-12 pr-12 ${fieldErrors.password ? 'border-red-500 focus:border-red-500' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-500 hover:text-neutral-700 focus:outline-none"
                  >
                    {showPassword ? (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-sm text-red-600 mt-1">{fieldErrors.password}</p>
                )}
              </div>

              {/* Remember me */}
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-neutral-700">
                  Remember me for 30 days
                </label>
              </div>

              {/* Login button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-primary-600 hover:bg-primary-700 text-white font-semibold shadow-medium hover:shadow-large transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Signing In...
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-neutral-500">Or continue with</span>
              </div>
            </div>

            {/* Google login */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 border-neutral-200 hover:bg-neutral-50 transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>

            {/* Register link */}
            <div className="text-center pt-4">
              <p className="text-sm text-neutral-600">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="font-medium text-primary-600 hover:text-primary-700 transition-colors"
                >
                  Create account
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer info */}
        <div className="text-center mt-8 text-sm text-neutral-500 animate-fade-in-up animate-stagger-2">
          <p>
            By signing in, you agree to our{' '}
            <Link to="/terms" className="text-primary-600 hover:text-primary-700">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-primary-600 hover:text-primary-700">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
