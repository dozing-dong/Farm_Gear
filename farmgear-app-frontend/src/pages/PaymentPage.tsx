import { CheckCircle2, CreditCard, Info, Loader2, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useAuth } from '../hooks/useAuth';
import { farmGearAPI, handleApiError, type Order } from '../lib/api';
import { useToast } from '../lib/toast';

function PaymentPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'details' | 'processing' | 'success'>('details');

  // Check authentication status
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
  }, [isLoggedIn, navigate]);

  // Get order details
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await farmGearAPI.getOrderDetails(orderId);
        if (response.success && response.data) {
          setOrder(response.data);

          // Check order status, only Accepted status can be paid
          if (response.data.status !== 1) {
            showToast({
              type: 'warning',
              title: 'Payment Not Available',
              description: 'This order is not ready for payment. Please wait for approval.',
              duration: 6000,
            });
            setTimeout(() => navigate('/dashboard'), 2000);
          }
        } else {
          showToast({
            type: 'error',
            title: 'Error',
            description: 'Failed to load order details',
            duration: 5000,
          });
        }
      } catch (error) {
        showToast({
          type: 'error',
          title: 'Error',
          description: handleApiError(error),
          duration: 5000,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, showToast, navigate]);

  // Simplified one-click payment processing
  const handleMockPayment = async () => {
    if (!order || order.status !== 1) return;

    setIsProcessingPayment(true);
    setPaymentStep('processing');

    try {
      // Simplified: direct delay 1 second then success
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Directly call payment completion
      await farmGearAPI.mockPaymentComplete(order.id);

      setPaymentStep('success');

      showToast({
        type: 'success',
        title: 'Payment Successful!',
        description: 'Your equipment rental is confirmed.',
        duration: 5000,
      });

      // Navigate to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      setPaymentStep('details');
      showToast({
        type: 'error',
        title: 'Payment Failed',
        description: handleApiError(error),
        duration: 5000,
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Loading state (reuse existing pattern)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
          </div>
          <div className="text-xl text-neutral-600">Loading payment details...</div>
        </div>
      </div>
    );
  }

  // Order does not exist (reuse existing error page pattern)
  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50/30">
        <div className="relative max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="p-8 text-center">
            <div className="mb-4 flex justify-center">
              <XCircle className="w-12 h-12 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">Order Not Found</h1>
            <p className="text-neutral-600 mb-6">The order you are looking for does not exist.</p>
            <Button
              onClick={() => navigate('/equipment')}
              className="bg-primary-600 hover:bg-primary-700"
            >
              Browse Equipment
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50/30">
      <div className="relative max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="shadow-large border-0 animate-fade-in-up">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-neutral-900">
              {paymentStep === 'success' ? 'Payment Successful!' : 'Payment'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Order summary */}
            <div className="bg-neutral-50 p-4 rounded-lg space-y-2">
              <h3 className="font-semibold text-neutral-900">Order Summary</h3>
              <p className="text-sm text-neutral-600">Equipment: {order.equipmentName}</p>
              <p className="text-sm text-neutral-600">
                Duration: {new Date(order.startDate).toLocaleDateString()} -{' '}
                {new Date(order.endDate).toLocaleDateString()}
              </p>
              <p className="text-lg font-bold text-neutral-900">Total: ${order.totalAmount}</p>
            </div>

            {/* Payment step interface */}
            {paymentStep === 'details' && (
              <div className="space-y-4">
                <div className="p-4 border border-dashed border-orange-300 rounded-lg text-center text-orange-600 bg-orange-50">
                  <p className="font-semibold inline-flex items-center justify-center gap-2">
                    <Info className="w-4 h-4" /> Mock Payment Mode
                  </p>
                  <p className="text-sm">
                    This is a demo payment - Click "Pay Now" to simulate payment
                  </p>
                </div>

                <Button
                  onClick={handleMockPayment}
                  disabled={isProcessingPayment}
                  className="w-full h-12 bg-primary-600 hover:bg-primary-700 font-semibold shadow-medium hover:shadow-large transition-all duration-300"
                >
                  <span className="inline-flex items-center gap-2">
                    <CreditCard className="w-5 h-5" /> Pay ${order.totalAmount}
                  </span>
                </Button>
              </div>
            )}

            {paymentStep === 'processing' && (
              <div className="text-center space-y-4">
                <div className="mb-2 flex justify-center">
                  <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
                </div>
                <p className="text-lg font-semibold text-neutral-900">Processing Payment...</p>
                <p className="text-sm text-neutral-600">
                  Please wait while we process your payment
                </p>
              </div>
            )}

            {paymentStep === 'success' && (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <CheckCircle2 className="w-12 h-12 text-green-600" />
                </div>
                <p className="text-lg font-semibold text-success-600">Payment Completed!</p>
                <p className="text-sm text-neutral-600">
                  Redirecting to equipment list in 3 seconds...
                </p>
                <Button onClick={() => navigate('/equipment')} variant="outline" className="w-full">
                  Browse More Equipment
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default PaymentPage;
