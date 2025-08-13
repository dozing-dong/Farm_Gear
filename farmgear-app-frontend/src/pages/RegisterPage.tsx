import { Store, Tractor } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { farmGearAPI, type EmailConfirmationTokenResponse } from '../lib/api';
import { useToast } from '../lib/toast';

// Removed unused local RegisterResponse type

// Helper function to get user-friendly error messages for registration
const getRegistrationErrorMessage = (error: string): { title: string; description?: string } => {
  const lowerError = error.toLowerCase();

  if (lowerError.includes('request failed with status code 409') || lowerError.includes('409')) {
    return {
      title: 'Account Already Exists',
      description:
        'An account with this username or email already exists. Please try a different one or sign in instead.',
    };
  }

  if (lowerError.includes('request failed with status code 400') || lowerError.includes('400')) {
    return {
      title: 'Invalid Information',
      description: 'Please check your input and ensure all fields are filled correctly.',
    };
  }

  if (lowerError.includes('request failed with status code 422') || lowerError.includes('422')) {
    return {
      title: 'Validation Error',
      description:
        "Some information doesn't meet our requirements. Please check the fields and try again.",
    };
  }

  if (lowerError.includes('network') || lowerError.includes('connection')) {
    return {
      title: 'Connection Error',
      description: 'Please check your internet connection and try again.',
    };
  }

  if (lowerError.includes('timeout')) {
    return {
      title: 'Request Timeout',
      description: 'The request took too long. Please try again.',
    };
  }

  // Clean up generic error messages
  if (lowerError.includes('request failed') || lowerError.includes('status code')) {
    return {
      title: 'Registration Failed',
      description: 'Unable to create account. Please check your information and try again.',
    };
  }

  if (lowerError.includes('username') && lowerError.includes('already')) {
    return {
      title: 'Username Taken',
      description: 'This username is already in use. Please choose a different one.',
    };
  }

  if (lowerError.includes('email') && lowerError.includes('already')) {
    return {
      title: 'Email Already Registered',
      description:
        'This email address is already registered. Please use a different email or sign in instead.',
    };
  }

  return {
    title: 'Registration Failed',
    description: error.length > 100 ? 'Unable to create account. Please try again.' : error,
  };
};

function RegisterPage() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: 'Farmer' as 'Farmer' | 'Provider',
  });

  const [isLoading, setIsLoading] = useState(false);
  // Remove success/emailSent UI path; use only simulation dialog flow
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [confirmationUrl, setConfirmationUrl] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required';
    }

    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters long';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password.trim()) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }

    if (!formData.confirmPassword.trim()) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
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
      // Call registration API
      const response = await farmGearAPI.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        fullName: formData.fullName,
        role: formData.role,
      });

      if (response.success) {
        // After successful registration, open dev dialog to simulate email confirmation
        // Handle multiple possible response structures: userId can be at top level or in data
        const newUserId = response.data?.userId;
        if (newUserId) {
          setPendingUserId(newUserId);
          setShowConfirmDialog(true);
        }
        // Do NOT show immediate success toast or email-sent success page here
      } else {
        const errorMsg = getRegistrationErrorMessage(response.message || 'Registration failed');
        showToast({
          type: 'error',
          title: errorMsg.title,
          description: errorMsg.description,
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Registration failed. Please try again.';
      const errorMsg = getRegistrationErrorMessage(errorMessage);
      showToast({
        type: 'error',
        title: errorMsg.title,
        description: errorMsg.description,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetTokenAndConfirm = async () => {
    if (!pendingUserId) return;
    setConfirmError(null);
    setConfirming(true);
    try {
      // 1) Get confirmation token
      const tokenResp = (await farmGearAPI.getEmailConfirmationToken(
        pendingUserId
      )) as EmailConfirmationTokenResponse & {
        userId?: string;
        token?: string;
        confirmationUrl?: string;
      };
      setConfirmationUrl(tokenResp.confirmationUrl ?? tokenResp.ConfirmationUrl ?? null);

      // 2) Confirm email using userId + token
      const uid = tokenResp.userId ?? tokenResp.UserId ?? pendingUserId;
      const tok = tokenResp.token ?? tokenResp.Token;
      const result = await farmGearAPI.confirmEmail(uid, tok);
      if (result.success) {
        showToast({
          type: 'success',
          title: 'Email Verified',
          description: 'Your account has been activated successfully.',
        });
        setShowConfirmDialog(false);
        navigate('/login', { replace: true });
      } else {
        setConfirmError(result.message || 'Email confirmation failed.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Email confirmation failed.';
      setConfirmError(msg);
      showToast({
        type: 'error',
        title: 'Email Verification Failed',
        description: msg,
      });
    } finally {
      setConfirming(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  // If registration is successful and email verification was sent, show success page
  // Removed email-sent success screen path

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100/30 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-200/20 rounded-full blur-3xl transform translate-x-32 -translate-y-32" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary-300/20 rounded-full blur-3xl transform -translate-x-32 translate-y-32" />
      </div>

      <div className="relative w-full max-w-lg animate-fade-in-up">
        {/* Logo area */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <h1 className="text-4xl font-black text-neutral-900">
              FARM <span className="text-gradient border-b-4 border-primary-600">GEAR</span>
            </h1>
          </Link>
          <p className="text-neutral-600 mt-2">Join the farm equipment sharing community</p>
        </div>

        {/* Registration card */}
        <Card className="shadow-large border-0 animate-fade-in-up animate-stagger-1">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-neutral-900">Create Account</CardTitle>
            <CardDescription className="text-neutral-600">
              Get started with your farm equipment marketplace
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Full Name Input */}
              <div className="space-y-2">
                <label htmlFor="fullName" className="text-sm font-medium text-neutral-700">
                  Full Name
                </label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className={`h-12 ${fieldErrors.fullName ? 'border-red-500 focus:border-red-500' : ''}`}
                />
                {fieldErrors.fullName && (
                  <p className="text-sm text-red-600 mt-1">{fieldErrors.fullName}</p>
                )}
              </div>

              {/* Username and Email Side by Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-medium text-neutral-700">
                    Username
                  </label>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Choose username"
                    className={`h-12 ${fieldErrors.username ? 'border-red-500 focus:border-red-500' : ''}`}
                  />
                  {fieldErrors.username && (
                    <p className="text-sm text-red-600 mt-1">{fieldErrors.username}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-neutral-700">
                    Email
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    className={`h-12 ${fieldErrors.email ? 'border-red-500 focus:border-red-500' : ''}`}
                  />
                  {fieldErrors.email && (
                    <p className="text-sm text-red-600 mt-1">{fieldErrors.email}</p>
                  )}
                </div>
              </div>

              {/* Role selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-neutral-700">I want to</label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`relative flex w-full justify-center cursor-pointer rounded-xl border-2 p-4 transition-all ${
                      formData.role === 'Farmer'
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="Farmer"
                      checked={formData.role === 'Farmer'}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className="flex flex-col items-center text-center">
                      <div className="text-2xl mb-2">
                        <Tractor className="w-6 h-6" />
                      </div>
                      <div className="font-medium text-sm">Rent Equipment</div>
                      <div className="text-xs text-neutral-600 mt-1">
                        I'm a farmer looking to rent
                      </div>
                    </div>
                    {formData.role === 'Farmer' && (
                      <Badge className="absolute -top-2 -right-2" size="sm">
                        Selected
                      </Badge>
                    )}
                  </label>

                  <label
                    className={`relative flex w-full justify-center cursor-pointer rounded-xl border-2 p-4 transition-all ${
                      formData.role === 'Provider'
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="Provider"
                      checked={formData.role === 'Provider'}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className="flex flex-col items-center text-center">
                      <div className="text-2xl mb-2">
                        <Store className="w-6 h-6" />
                      </div>
                      <div className="font-medium text-sm">List Equipment</div>
                      <div className="text-xs text-neutral-600 mt-1">
                        I want to rent out my gear
                      </div>
                    </div>
                    {formData.role === 'Provider' && (
                      <Badge className="absolute -top-2 -right-2" size="sm">
                        Selected
                      </Badge>
                    )}
                  </label>
                </div>
              </div>

              {/* Password Input */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-neutral-700">
                    Password
                  </label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create password"
                    className={`h-12 ${fieldErrors.password ? 'border-red-500 focus:border-red-500' : ''}`}
                  />
                  {fieldErrors.password && (
                    <p className="text-sm text-red-600 mt-1">{fieldErrors.password}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium text-neutral-700">
                    Confirm Password
                  </label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm password"
                    className={`h-12 ${fieldErrors.confirmPassword ? 'border-red-500 focus:border-red-500' : ''}`}
                  />
                  {fieldErrors.confirmPassword && (
                    <p className="text-sm text-red-600 mt-1">{fieldErrors.confirmPassword}</p>
                  )}
                </div>
              </div>

              {/* Terms Agreement */}
              <div className="flex items-start space-x-3">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  required
                  className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                />
                <label htmlFor="terms" className="text-sm text-neutral-700 leading-relaxed">
                  I agree to the{' '}
                  <Link
                    to="/terms"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowTermsDialog(true);
                    }}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link
                    to="/privacy"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowPrivacyDialog(true);
                    }}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Privacy Policy
                  </Link>
                </label>
              </div>

              {/* Register button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-primary-600 hover:bg-primary-700 text-white font-semibold shadow-medium hover:shadow-large transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating Account...
                  </div>
                ) : (
                  'Create Account'
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

            {/* Google registration */}
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
              Sign up with Google
            </Button>

            {/* Login link */}
            <div className="text-center pt-4">
              <p className="text-sm text-neutral-600">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-medium text-primary-600 hover:text-primary-700 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer information */}
        <div className="text-center mt-8 text-sm text-neutral-500 animate-fade-in-up animate-stagger-2">
          <p>Join over 1,200+ farmers and equipment providers already using FarmGear</p>
        </div>

        {/* Development environment: mock email verification dialog */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Email Verification Simulation</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {confirmationUrl && (
                <div className="text-xs break-all p-2 bg-neutral-50 border rounded">
                  {confirmationUrl}
                </div>
              )}
              {confirmError && <p className="text-sm text-red-600">{confirmError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={handleGetTokenAndConfirm}
                  disabled={confirming}
                  className="flex-1 h-10 px-4 rounded bg-primary-600 text-white disabled:opacity-50"
                >
                  {confirming ? 'Processing...' : 'Complete Registration'}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Terms of Service Dialog */}
        <Dialog open={showTermsDialog} onOpenChange={setShowTermsDialog}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Terms of Service</DialogTitle>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-auto pr-2 space-y-4 text-sm text-neutral-700">
              <p>
                Welcome to FarmGear. By accessing or using our services, you agree to be bound by
                these Terms. If you do not agree, please do not use the service.
              </p>
              <h3 className="font-semibold text-neutral-900">1. Use of Service</h3>
              <p>
                You may use the service only in compliance with applicable laws. You are responsible
                for your activities, content you upload, and information you provide.
              </p>
              <h3 className="font-semibold text-neutral-900">2. Accounts</h3>
              <p>
                You must provide accurate information and keep your account secure. You are
                responsible for all activities under your account.
              </p>
              <h3 className="font-semibold text-neutral-900">3. Prohibited Conduct</h3>
              <p>
                Do not misuse the service, including but not limited to fraud, infringement,
                security violations, or any illegal activity.
              </p>
              <h3 className="font-semibold text-neutral-900">4. Disclaimers</h3>
              <p>
                The service is provided on an “as is” basis without warranties of any kind to the
                fullest extent permitted by law.
              </p>
              <h3 className="font-semibold text-neutral-900">5. Limitation of Liability</h3>
              <p>
                FarmGear will not be liable for any indirect, incidental, special, consequential or
                punitive damages.
              </p>
              <h3 className="font-semibold text-neutral-900">6. Changes</h3>
              <p>
                We may update these Terms from time to time. Continued use constitutes acceptance of
                the updated Terms.
              </p>
              <h3 className="font-semibold text-neutral-900">7. Contact</h3>
              <p>If you have any questions, contact us at support@farmgear.local.</p>
            </div>
            <div className="flex justify-end pt-4">
              <Button onClick={() => setShowTermsDialog(false)}>I Understand</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Privacy Policy Dialog */}
        <Dialog open={showPrivacyDialog} onOpenChange={setShowPrivacyDialog}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Privacy Policy</DialogTitle>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-auto pr-2 space-y-4 text-sm text-neutral-700">
              <p>
                This Privacy Policy explains how we collect, use, and safeguard your information
              </p>
              <p>when you use FarmGear.</p>
              <h3 className="font-semibold text-neutral-900">1. Information We Collect</h3>
              <p>
                We collect information you provide (e.g., account details) and information generated
                through your use (e.g., usage logs). We may also use cookies.
              </p>
              <h3 className="font-semibold text-neutral-900">2. How We Use Information</h3>
              <p>
                To provide and improve the service, verify accounts, ensure security, and
                communicate with you.
              </p>
              <h3 className="font-semibold text-neutral-900">3. Cookies</h3>
              <p>
                Cookies help us remember your preferences and enhance functionality. You can manage
                cookies via your browser settings.
              </p>
              <h3 className="font-semibold text-neutral-900">4. Data Sharing</h3>
              <p>
                We do not sell personal data. We may share data with service providers for
                operational purposes or when required by law.
              </p>
              <h3 className="font-semibold text-neutral-900">5. Data Retention</h3>
              <p>
                We retain data as long as necessary to provide the service and meet legal
                obligations, then delete or anonymize it.
              </p>
              <h3 className="font-semibold text-neutral-900">6. Your Rights</h3>
              <p>
                You may request access, correction, or deletion of your personal data, subject to
                applicable laws.
              </p>
              <h3 className="font-semibold text-neutral-900">7. Security</h3>
              <p>
                We implement reasonable safeguards to protect your data. No method is 100% secure.
              </p>
              <h3 className="font-semibold text-neutral-900">8. Contact</h3>
              <p>If you have any questions, contact us at privacy@farmgear.local.</p>
            </div>
            <div className="flex justify-end pt-4">
              <Button onClick={() => setShowPrivacyDialog(false)}>I Understand</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default RegisterPage;
