import { Link } from 'react-router-dom';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

function HowToListPage() {
  const steps = [
    {
      number: 1,
      title: 'Create Your Account',
      description:
        'Sign up as a Provider to start listing your farm equipment. Your account will be verified to ensure quality and safety.',
      icon: '👤',
      details: [
        'Complete registration with accurate information',
        'Upload identification documents',
        'Wait for account verification (24-48 hours)',
      ],
    },
    {
      number: 2,
      title: 'Prepare Your Equipment',
      description: 'Make sure your equipment is in good working condition and ready for rental.',
      icon: '🔧',
      details: [
        'Perform thorough maintenance check',
        'Clean and inspect equipment',
        'Gather all necessary documentation',
        'Take high-quality photos from multiple angles',
      ],
    },
    {
      number: 3,
      title: 'Create Equipment Listing',
      description:
        'Provide detailed information about your equipment to attract potential renters.',
      icon: '📝',
      details: [
        'Fill in equipment specifications',
        'Set competitive daily pricing',
        'Upload clear, high-quality images',
        'Write detailed description and features',
        'Set availability calendar',
      ],
    },
    {
      number: 4,
      title: 'Set Your Pricing',
      description: 'Research market rates and set competitive prices for your equipment rental.',
      icon: '💰',
      details: [
        'Research comparable equipment prices',
        'Consider equipment age and condition',
        'Factor in maintenance and NZ insurance costs',
        'Set seasonal pricing adjustments',
      ],
    },
    {
      number: 5,
      title: 'Manage Bookings',
      description: 'Respond to rental requests and manage your equipment availability.',
      icon: '📅',
      details: [
        'Review and approve rental requests',
        'Coordinate pickup and return times',
        'Conduct equipment inspections',
        'Maintain communication with renters',
      ],
    },
    {
      number: 6,
      title: 'Get Paid',
      description: 'Receive payments securely through our platform after successful rentals.',
      icon: '💳',
      details: [
        'Automatic payment processing',
        'Secure fund transfers to your account',
        'Track earnings through dashboard',
        'Receive payment within 24-48 hours after return',
      ],
    },
  ];

  const requirements = [
    {
      icon: '🆔',
      title: 'Valid Documentation',
      description: "NZ Driver's License/Passport and business registration (if applicable)",
    },
    {
      icon: '🚜',
      title: 'Quality Equipment',
      description: 'Well-maintained agricultural equipment in working condition',
    },
    {
      icon: '🛡️',
      title: 'Insurance Coverage',
      description: 'Valid NZ insurance policy covering commercial equipment rental',
    },
    {
      icon: '📱',
      title: 'Active Communication',
      description: 'Responsive to rental inquiries and maintenance requests',
    },
  ];

  const tips = [
    {
      icon: '📸',
      title: 'High-Quality Photos',
      description:
        'Take clear photos from multiple angles, including close-ups of important features and any wear or damage.',
    },
    {
      icon: '📊',
      title: 'Competitive Pricing',
      description:
        "Research market rates in your area and price competitively while considering your equipment's condition and features.",
    },
    {
      icon: '📝',
      title: 'Detailed Descriptions',
      description:
        'Provide comprehensive information about specifications, capabilities, and any special requirements or restrictions.',
    },
    {
      icon: '⚡',
      title: 'Quick Response',
      description:
        'Respond to rental inquiries promptly to increase your booking success rate and build a good reputation.',
    },
    {
      icon: '🔍',
      title: 'Regular Maintenance',
      description:
        'Keep your equipment well-maintained and document maintenance records to build trust with renters.',
    },
    {
      icon: '🤝',
      title: 'Clear Communication',
      description:
        'Be transparent about equipment condition, usage requirements, and rental terms to avoid disputes.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50/30">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-100/20 to-primary-200/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <Badge variant="default" className="mb-4 bg-primary-100 text-primary-700">
              🚜 Equipment Listing Guide
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold text-neutral-900 mb-6">
              How to List Your <span className="text-gradient">Farm Equipment</span>
            </h1>
            <p className="text-xl text-neutral-600 mb-8 max-w-3xl mx-auto">
              Start earning extra income by renting out your farm equipment. Follow our
              comprehensive guide to create successful listings and maximize your rental potential.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/equipment/create">
                <Button className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 text-lg font-semibold">
                  📋 Start Listing Now
                </Button>
              </Link>
              <Link to="/pricing-guide">
                <Button
                  variant="outline"
                  className="border-primary-600 text-primary-600 hover:bg-primary-50 px-8 py-3 text-lg font-semibold"
                >
                  💰 View Pricing Guide
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Step-by-Step Guide */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">Step-by-Step Guide</h2>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              Follow these simple steps to start listing your equipment and earning rental income
            </p>
          </div>

          <div className="space-y-12">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className={`flex flex-col lg:flex-row items-center gap-8 ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}
              >
                <div className="flex-1">
                  <Card className="h-full shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardContent className="p-8">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
                          {step.number}
                        </div>
                        <div className="text-4xl">{step.icon}</div>
                        <h3 className="text-2xl font-bold text-neutral-900">{step.title}</h3>
                      </div>
                      <p className="text-lg text-neutral-600 mb-6">{step.description}</p>
                      <ul className="space-y-2">
                        {step.details.map((detail, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-primary-600 mt-1">✓</span>
                            <span className="text-neutral-700">{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
                <div className="lg:w-64 flex justify-center">
                  <div className="w-32 h-32 bg-primary-100 rounded-full flex items-center justify-center text-6xl">
                    {step.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements Section */}
      <section className="py-20 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">Requirements</h2>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              Make sure you meet these basic requirements before listing your equipment
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {requirements.map((req, index) => (
              <Card
                key={index}
                className="text-center hover:shadow-lg transition-shadow duration-300"
              >
                <CardContent className="p-6">
                  <div className="text-4xl mb-4">{req.icon}</div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">{req.title}</h3>
                  <p className="text-neutral-600">{req.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Tips for Success */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">Tips for Success</h2>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              Follow these best practices to maximize your rental success and build a great
              reputation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tips.map((tip, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-3xl">{tip.icon}</div>
                    <h3 className="text-lg font-semibold text-neutral-900">{tip.title}</h3>
                  </div>
                  <p className="text-neutral-600">{tip.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-neutral-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  How much can I earn by listing my equipment?
                </h3>
                <p className="text-neutral-600">
                  Earnings vary based on equipment type, condition, and local demand. Popular
                  equipment like tractors can earn NZ$320-800 per day, while specialized equipment
                  may command higher rates. Check our pricing guide for market rates.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  What insurance coverage do I need?
                </h3>
                <p className="text-neutral-600">
                  You need valid New Zealand insurance that covers commercial rental activities.
                  FarmGear also provides additional protection during active rentals, but your
                  primary insurance must comply with NZ regulations.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  How do I handle equipment damage during rental?
                </h3>
                <p className="text-neutral-600">
                  All rentals include damage protection. Document equipment condition before and
                  after rental. Report any damage immediately through the platform for quick
                  resolution and compensation.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  Can I set my own rental terms and conditions?
                </h3>
                <p className="text-neutral-600">
                  Yes, you can set specific terms including usage restrictions, operator
                  requirements, and delivery options. However, all terms must comply with platform
                  policies and local regulations.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Start Earning?</h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of equipment owners who are already earning extra income through FarmGear
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/equipment/create">
              <Button className="bg-white text-primary-600 hover:bg-primary-50 px-8 py-3 text-lg font-semibold">
                📋 List Your Equipment Now
              </Button>
            </Link>
            <Link to="/register">
              <Button className="bg-white text-primary-600 hover:bg-primary-50 px-8 py-3 text-lg font-semibold">
                👤 Create Account
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HowToListPage;
