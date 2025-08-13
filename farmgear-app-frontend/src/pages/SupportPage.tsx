import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { AlertTriangle, BookOpenText, CalendarDays, Camera, Headphones, HelpCircle, Mail, MessageCircle, PhoneCall, ShieldCheck, Tractor, Wrench } from 'lucide-react';

const ICONS = {
  user: HelpCircle,
  tractor: Tractor,
  calendar: CalendarDays,
  shield: ShieldCheck,
  wrench: Wrench,
  shieldCheck: ShieldCheck,
  chat: MessageCircle,
  mail: Mail,
  phone: PhoneCall,
  camera: Camera,
  help: HelpCircle,
} as const;

function SupportPage() {
  const supportCategories = [
    {
      title: 'Account & Login Issues',
      icon: 'user',
      description: 'Problems with account access, registration, or login',
      commonIssues: [
        "Can't log into my account",
        'Forgot password',
        'Email not verified',
        'Account locked or suspended',
        'Want to change account type',
      ],
      quickSolutions: [
        "Use the 'Forgot Password' link on the login page",
        'Check your spam folder for verification emails',
        'Clear browser cache and cookies',
        'Try logging in from a different browser',
      ],
    },
    {
      title: 'Equipment Listing Help',
      icon: 'tractor',
      description: 'Assistance with creating and managing equipment listings',
      commonIssues: [
        "Can't upload photos",
        'Listing not appearing in search',
        'Need to update equipment details',
        'Questions about pricing',
        'Managing availability calendar',
      ],
      quickSolutions: [
        'Ensure photos are JPG/PNG format under 10MB',
        'Check that all required fields are completed',
        'Use our pricing guide for market rates',
        "Update listing status to 'Active'",
      ],
    },
    {
      title: 'Booking & Rental Support',
      icon: 'calendar',
      description: 'Help with rental bookings and managing reservations',
      commonIssues: [
        "Can't complete booking",
        'Need to cancel reservation',
        'Equipment not available',
        'Communication with owner/renter',
        'Pickup/return coordination',
      ],
      quickSolutions: [
        'Check equipment availability calendar',
        'Review cancellation policy in booking details',
        'Use in-app messaging to contact the other party',
        'Confirm pickup location and time in advance',
      ],
    },
    {
      title: 'Payment & Billing',
      icon: 'shield',
      description: 'Payment processing and billing related questions',
      commonIssues: [
        'Payment failed or declined',
        'Refund requests',
        'Invoice questions',
        'Service fee inquiries',
        'Payment method issues',
      ],
      quickSolutions: [
        'Verify payment method details are correct',
        'Check if your bank allows online transactions',
        'Review our refund policy in terms of service',
        'Contact your bank if payment keeps failing',
      ],
    },
    {
      title: 'Technical Issues',
      icon: 'wrench',
      description: 'Website functionality and technical problems',
      commonIssues: [
        'Website not loading properly',
        'Features not working',
        'Mobile app problems',
        'Browser compatibility',
        'Connection issues',
      ],
      quickSolutions: [
        'Clear browser cache and refresh page',
        'Try a different browser (Chrome, Firefox, Safari)',
        'Check your internet connection',
        'Disable browser extensions temporarily',
      ],
    },
    {
      title: 'Safety & Insurance',
      icon: 'shieldCheck',
      description: 'Safety concerns and insurance related questions',
      commonIssues: [
        'Equipment damage during rental',
        'Safety incident reporting',
        'Insurance coverage questions',
        'Equipment malfunction',
        'Liability concerns',
      ],
      quickSolutions: [
        'Document any damage with photos immediately',
        'Contact equipment owner and FarmGear support',
        'Review insurance terms in your rental agreement',
        'For emergencies, call our 24/7 emergency line',
      ],
    },
  ];

  const supportChannels = [
    {
      name: 'Live Chat',
      icon: 'chat',
      status: 'Online',
      description: 'Get instant help from our support team',
      availability: 'Mon-Fri 9AM-5PM NZST',
      responseTime: 'Usually within 2 minutes',
      color: 'bg-green-50 border-green-200',
      action: 'Start Chat',
    },
    {
      name: 'Email Support',
      icon: 'mail',
      status: 'Available',
      description: 'Send detailed questions via email',
      availability: '24/7 submission',
      responseTime: 'Within 4-24 hours',
      color: 'bg-blue-50 border-blue-200',
      action: 'Send Email',
    },
    {
      name: 'Phone Support',
      icon: 'phone',
      status: 'Available',
      description: 'Speak directly with our team',
      availability: 'Mon-Fri 8AM-6PM NZST',
      responseTime: 'Immediate',
      color: 'bg-purple-50 border-purple-200',
      action: 'Call Now',
    },
    {
      name: 'Video Call',
      icon: 'camera',
      status: 'By Appointment',
      description: 'Screen sharing for complex issues',
      availability: 'Mon-Fri by appointment',
      responseTime: 'Scheduled sessions',
      color: 'bg-amber-50 border-amber-200',
      action: 'Schedule Call',
    },
  ];

  const knowledgeBase = [
    {
      category: 'Getting Started',
      icon: 'help',
      articles: [
        'How to create your first equipment listing',
        'Setting up your profile and payment methods',
        'Understanding FarmGear fees and charges',
        'Safety requirements for equipment rental',
        'How to verify your account and identity',
      ],
    },
    {
      category: 'For Equipment Owners',
      icon: '🚜',
      articles: [
        'Optimizing your equipment listing for visibility',
        'Setting competitive rental prices',
        'Managing bookings and availability',
        'Equipment handover best practices',
        'Handling damage claims and disputes',
      ],
    },
    {
      category: 'For Renters',
      icon: '👨‍🌾',
      articles: [
        'How to find and book equipment',
        'Understanding rental terms and conditions',
        'Equipment inspection checklist',
        'What to do if equipment breaks down',
        'Leaving reviews after rental',
      ],
    },
    {
      category: 'Troubleshooting',
      icon: '🔧',
      articles: [
        'Common website issues and solutions',
        'Payment and billing troubleshooting',
        'Mobile app troubleshooting guide',
        'Account and login problem resolution',
        'Photo upload and technical issues',
      ],
    },
  ];

  const prioritySupport = [
    {
      title: 'Equipment Emergency',
      description: 'Equipment breakdown during active rental',
      icon: '🚨',
      action: 'Call 0800 URGENT (0800 874 368)',
      available: '24/7',
    },
    {
      title: 'Safety Incident',
      description: 'Accident or injury involving equipment',
      icon: '🏥',
      action: 'Call 111 first, then notify us',
      available: 'Immediate',
    },
    {
      title: 'Security Issue',
      description: 'Account compromise or fraud',
      icon: '🔒',
      action: 'Contact security@farmgear.co.nz',
      available: 'Within 1 hour',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50/30">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-100/20 to-primary-200/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <Badge variant="default" className="mb-4 bg-primary-100 text-primary-700 inline-flex items-center gap-2">
              <Headphones className="w-4 h-4" />
              Support Center
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold text-neutral-900 mb-6">
              Get the <span className="text-gradient">Help You Need</span>
            </h1>
            <p className="text-xl text-neutral-600 mb-8 max-w-3xl mx-auto">
              Our support team is here to help you succeed with FarmGear. Find answers, get
              assistance, and resolve issues quickly.
            </p>
          </div>
        </div>
      </section>

      {/* Priority Support */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-red-800 mb-4 inline-flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Need Immediate Help?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {prioritySupport.map((support, index) => (
                <div key={index} className="bg-white rounded-lg p-4 border border-red-200">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl text-red-600">
                      <AlertTriangle className="w-5 h-5" />
                    </span>
                    <h3 className="font-semibold text-red-800">{support.title}</h3>
                  </div>
                  <p className="text-sm text-red-700 mb-3">{support.description}</p>
                  <p className="font-medium text-red-800">{support.action}</p>
                  <p className="text-xs text-red-600">Response: {support.available}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Support Channels */}
      <section className="py-20 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">
              Choose Your Support Channel
            </h2>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              Select the best way to get help based on your preference and urgency
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {supportChannels.map((channel, index) => (
              <Card
                key={index}
                className={`${channel.color} hover:shadow-lg transition-shadow duration-300`}
              >
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-4 text-primary-600">
                    {(() => {
                      const Ico = ICONS[channel.icon as keyof typeof ICONS];
                      return Ico ? <Ico className="w-8 h-8" /> : null;
                    })()}
                  </div>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-neutral-900">{channel.name}</h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        channel.status === 'Online'
                          ? 'bg-green-100 text-green-800'
                          : channel.status === 'Available'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {channel.status}
                    </span>
                  </div>
                  <p className="text-neutral-600 mb-4 text-sm">{channel.description}</p>
                  <div className="space-y-2 mb-4">
                    <p className="text-xs text-neutral-500">{channel.availability}</p>
                    <p className="text-xs font-medium text-neutral-700">{channel.responseTime}</p>
                  </div>
                  <Button className="w-full bg-primary-600 hover:bg-primary-700 text-white">
                    {channel.action}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Support Categories */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">
              What Do You Need Help With?
            </h2>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              Browse common issues and solutions by category
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {supportCategories.map((category, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-3xl text-primary-600">
                      {(() => {
                        const Ico = ICONS[category.icon as keyof typeof ICONS];
                        return Ico ? <Ico className="w-7 h-7" /> : null;
                      })()}
                    </div>
                    <h3 className="text-lg font-semibold text-neutral-900">{category.title}</h3>
                  </div>
                  <p className="text-neutral-600 mb-4 text-sm">{category.description}</p>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-neutral-900 mb-2">Common Issues:</h4>
                      <ul className="text-sm text-neutral-600 space-y-1">
                        {category.commonIssues.slice(0, 3).map((issue, issueIndex) => (
                          <li key={issueIndex} className="flex items-start gap-2">
                            <span className="text-primary-600 mt-1">•</span>
                            <span>{issue}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-neutral-900 mb-2">Quick Solutions:</h4>
                      <ul className="text-sm text-neutral-600 space-y-1">
                        {category.quickSolutions.slice(0, 2).map((solution, solutionIndex) => (
                          <li key={solutionIndex} className="flex items-start gap-2">
                            <span className="text-green-600 mt-1">✓</span>
                            <span>{solution}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full mt-4 border-primary-600 text-primary-600 hover:bg-primary-50"
                  >
                    Get Help with This
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Knowledge Base */}
      <section className="py-20 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">Knowledge Base</h2>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              Self-service resources and guides to help you succeed
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {knowledgeBase.map((section, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-3xl">{section.icon}</div>
                    <h3 className="text-lg font-semibold text-neutral-900">{section.category}</h3>
                  </div>
                  <ul className="space-y-3">
                    {section.articles.map((article, articleIndex) => (
                      <li key={articleIndex}>
                        <a
                          href="#"
                          className="text-sm text-neutral-600 hover:text-primary-600 transition-colors flex items-start gap-2"
                        >
                          <BookOpenText className="w-4 h-4 text-primary-600 mt-1" />
                          <span>{article}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Support Stats */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">Our Support Performance</h2>
            <p className="text-xl text-neutral-600">
              We're committed to providing excellent support
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="text-4xl font-bold text-primary-600 mb-2">&lt; 2 min</div>
                <h3 className="font-semibold text-neutral-900 mb-1">Live Chat Response</h3>
                <p className="text-sm text-neutral-600">Average first response time</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <div className="text-4xl font-bold text-primary-600 mb-2">4.8⭐</div>
                <h3 className="font-semibold text-neutral-900 mb-1">Customer Satisfaction</h3>
                <p className="text-sm text-neutral-600">Based on support ratings</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <div className="text-4xl font-bold text-primary-600 mb-2">24/7</div>
                <h3 className="font-semibold text-neutral-900 mb-1">Emergency Support</h3>
                <p className="text-sm text-neutral-600">For urgent equipment issues</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <div className="text-4xl font-bold text-primary-600 mb-2">95%</div>
                <h3 className="font-semibold text-neutral-900 mb-1">First Contact Resolution</h3>
                <p className="text-sm text-neutral-600">Issues resolved on first contact</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Still Need Help?</h2>
          <p className="text-xl text-primary-100 mb-8">
            Our support team is standing by to help you succeed with FarmGear
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-white text-primary-600 hover:bg-primary-50 px-8 py-3 text-lg font-semibold inline-flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Start Live Chat
              </Button>
              <Button className="bg-white text-primary-600 hover:bg-primary-50 px-8 py-3 text-lg font-semibold inline-flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Send Email
              </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default SupportPage;
