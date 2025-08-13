import {
  BookOpenText,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  CreditCard,
  Headphones,
  HelpCircle,
  Mail,
  MessageCircle,
  PhoneCall,
  Search,
  ShieldCheck,
  Tractor,
  Wrench,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
}

function FAQPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const categories = [
    { id: 'all', name: 'All Questions', icon: 'clipboard' },
    { id: 'account', name: 'Account & Registration', icon: 'help' },
    { id: 'equipment', name: 'Equipment Listing', icon: 'tractor' },
    { id: 'rental', name: 'Rentals & Booking', icon: 'calendar' },
    { id: 'payment', name: 'Payments & Pricing', icon: 'card' },
    { id: 'safety', name: 'Safety & Insurance', icon: 'shield' },
    { id: 'technical', name: 'Technical Support', icon: 'wrench' },
  ];

  const ICONS: Record<string, React.ComponentType<any>> = {
    clipboard: ClipboardList,
    help: HelpCircle,
    tractor: Tractor,
    calendar: CalendarDays,
    card: CreditCard,
    shield: ShieldCheck,
    wrench: Wrench,
  };

  const faqs: FAQ[] = [
    // Account & Registration
    {
      id: 1,
      category: 'account',
      question: 'How do I create an account on FarmGear?',
      answer:
        'To create an account, click the "Register" button in the top right corner. Fill in your details including name, email, and choose your role (Farmer or Provider). You\'ll receive a verification email to activate your account.',
    },
    {
      id: 2,
      category: 'account',
      question: "What's the difference between Farmer and Provider accounts?",
      answer:
        'Farmer accounts can browse and rent equipment. Provider accounts can list their own equipment for rental in addition to renting from others. You can upgrade from Farmer to Provider at any time in your account settings.',
    },
    {
      id: 3,
      category: 'account',
      question: 'Can I change my account type after registration?',
      answer:
        'Yes, you can upgrade from a Farmer account to a Provider account at any time through your profile settings. This will allow you to list your equipment for rental.',
    },
    {
      id: 4,
      category: 'account',
      question: 'How do I reset my password?',
      answer:
        'Click "Forgot Password" on the login page and enter your email address. You\'ll receive instructions to reset your password. If you don\'t receive the email, check your spam folder.',
    },

    // Equipment Listing
    {
      id: 5,
      category: 'equipment',
      question: 'What types of equipment can I list on FarmGear?',
      answer:
        'You can list any agricultural equipment including tractors, harvesters, plows, seeders, sprayers, and other farming implements. Equipment must be in working condition and properly maintained.',
    },
    {
      id: 6,
      category: 'equipment',
      question: 'How do I determine the right rental price for my equipment?',
      answer:
        'Use our Pricing Guide to see market rates for similar equipment. Consider factors like age, condition, location, and included services. You can always adjust prices based on demand and feedback.',
    },
    {
      id: 7,
      category: 'equipment',
      question: 'What photos should I include in my equipment listing?',
      answer:
        'Include clear photos from multiple angles showing the overall condition. Highlight key features, controls, and any unique attachments. Good photos significantly increase rental inquiries.',
    },
    {
      id: 8,
      category: 'equipment',
      question: "Can I edit my equipment listing after it's published?",
      answer:
        'Yes, you can edit your listing anytime through the "My Equipment" section. You can update prices, descriptions, availability, and photos as needed.',
    },

    // Rentals & Booking
    {
      id: 9,
      category: 'rental',
      question: 'How does the rental booking process work?',
      answer:
        "Browse equipment, select dates, and submit a rental request. The equipment owner reviews and either accepts or declines. Once accepted, you'll receive payment instructions and pickup details.",
    },
    {
      id: 10,
      category: 'rental',
      question: 'What happens if equipment breaks down during my rental?',
      answer:
        'Contact the equipment owner immediately. Minor issues may be your responsibility, but major breakdowns are typically covered by the owner. Document any problems with photos and descriptions.',
    },
    {
      id: 11,
      category: 'rental',
      question: 'Can I cancel a confirmed rental booking?',
      answer:
        'Cancellation policies vary by owner. Check the specific terms in your rental agreement. Generally, 24-48 hours notice is required for cancellations to avoid charges.',
    },
    {
      id: 12,
      category: 'rental',
      question: 'What if the weather is bad during my rental period?',
      answer:
        'Weather policies depend on the specific rental agreement. Many owners offer flexibility for severe weather conditions. Discuss weather contingencies when booking.',
    },

    // Payments & Pricing
    {
      id: 13,
      category: 'payment',
      question: 'How do payments work on FarmGear?',
      answer:
        'Payments are processed securely through our platform. You pay after the rental is confirmed, and funds are released to the equipment owner after successful completion of the rental.',
    },
    {
      id: 14,
      category: 'payment',
      question: 'What payment methods are accepted?',
      answer:
        'We accept major credit cards, bank transfers, and other secure payment methods. Payment options may vary by region and rental amount.',
    },
    {
      id: 15,
      category: 'payment',
      question: 'Are there any additional fees beyond the rental price?',
      answer:
        'FarmGear charges a small service fee for using the platform. Some owners may charge for delivery, fuel, or cleaning. All fees are clearly displayed before you confirm your booking.',
    },
    {
      id: 16,
      category: 'payment',
      question: 'When do I get paid as an equipment owner?',
      answer:
        'Payments are released 24-48 hours after the rental period ends, provided there are no disputes or damage claims. Funds are transferred directly to your bank account.',
    },

    // Safety & Insurance
    {
      id: 17,
      category: 'safety',
      question: 'Am I covered by insurance when renting equipment?',
      answer:
        'Basic coverage is included with all rentals, but verify your own insurance covers commercial equipment rental. We recommend discussing insurance details with the equipment owner.',
    },
    {
      id: 18,
      category: 'safety',
      question: 'What safety requirements do I need to meet?',
      answer:
        'You must be properly licensed to operate the equipment and follow all safety guidelines. Some equipment may require specific certifications or training.',
    },
    {
      id: 19,
      category: 'safety',
      question: 'Who is responsible for equipment damage during rental?',
      answer:
        'Renters are responsible for damage beyond normal wear and tear. Document equipment condition before and after use. Intentional damage or misuse may result in full replacement costs.',
    },
    {
      id: 20,
      category: 'safety',
      question: 'What safety equipment is provided with rentals?',
      answer:
        'Basic safety equipment like lights and guards should be included. However, personal protective equipment (helmets, safety glasses, etc.) is typically your responsibility.',
    },

    // Technical Support
    {
      id: 21,
      category: 'technical',
      question: 'How do I report a problem with the website or app?',
      answer:
        'Use the "Contact Support" option or email our technical team. Include details about the issue, your browser/device, and screenshots if helpful.',
    },
    {
      id: 22,
      category: 'technical',
      question: "Why aren't my photos uploading?",
      answer:
        'Ensure your photos are in JPG or PNG format and under 10MB each. Clear your browser cache and try again. If problems persist, try a different browser or device.',
    },
    {
      id: 23,
      category: 'technical',
      question: 'Can I use FarmGear on my mobile device?',
      answer:
        'Yes, FarmGear is optimized for mobile browsers. We also have plans for dedicated mobile apps in the future.',
    },
    {
      id: 24,
      category: 'technical',
      question: 'How do I update my location or contact information?',
      answer:
        'Go to your profile settings and update your information. Make sure to save changes. Updated location helps show your equipment to nearby renters.',
    },
  ];

  const filteredFAQs =
    activeCategory === 'all' ? faqs : faqs.filter((faq) => faq.category === activeCategory);

  const toggleFAQ = (id: number) => {
    setOpenFAQ(openFAQ === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50/30">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-100/20 to-primary-200/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <Badge
              variant="default"
              className="mb-4 bg-primary-100 text-primary-700 inline-flex items-center gap-2"
            >
              <HelpCircle className="w-4 h-4" />
              Frequently Asked Questions
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold text-neutral-900 mb-6">
              How Can We <span className="text-gradient">Help You?</span>
            </h1>
            <p className="text-xl text-neutral-600 mb-8 max-w-3xl mx-auto">
              Find answers to common questions about using FarmGear. Can't find what you're looking
              for? Contact our support team.
            </p>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                  activeCategory === category.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                <span className="text-primary-600">
                  {(() => {
                    const Ico = ICONS[category.icon as keyof typeof ICONS];
                    return Ico ? <Ico className="w-4 h-4" /> : null;
                  })()}
                </span>
                <span className="text-sm font-medium">{category.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 bg-neutral-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
            {filteredFAQs.map((faq) => (
              <Card key={faq.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <button
                    onClick={() => toggleFAQ(faq.id)}
                    className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-neutral-50 transition-colors"
                  >
                    <h3 className="text-lg font-semibold text-neutral-900 pr-4">{faq.question}</h3>
                    <div
                      className={`transition-transform duration-200 ${openFAQ === faq.id ? 'rotate-180' : ''}`}
                    >
                      <ChevronDown className="w-5 h-5" />
                    </div>
                  </button>

                  {openFAQ === faq.id && (
                    <div className="px-6 pb-4 border-t bg-neutral-25">
                      <p className="text-neutral-700 leading-relaxed pt-4">{faq.answer}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredFAQs.length === 0 && (
            <div className="text-center py-12">
              <div className="mb-4 flex justify-center">
                <Search className="w-12 h-12 text-neutral-400" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">No FAQs found</h3>
              <p className="text-neutral-600">
                Try selecting a different category or contact our support team.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Help Resources */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">Additional Help Resources</h2>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              Explore our comprehensive guides and support resources
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-6 text-center">
                <div className="mb-4 text-primary-600">
                  <BookOpenText className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">How to List Guide</h3>
                <p className="text-neutral-600 mb-4 text-sm">
                  Step-by-step guide to listing your equipment
                </p>
                <a
                  href="/how-to-list"
                  className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                >
                  Read Guide →
                </a>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-6 text-center">
                <div className="mb-4 text-primary-600">
                  <CreditCard className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">Pricing Guide</h3>
                <p className="text-neutral-600 mb-4 text-sm">Market rates and pricing strategies</p>
                <a
                  href="/pricing-guide"
                  className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                >
                  View Pricing →
                </a>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-6 text-center">
                <div className="mb-4 text-primary-600">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">Safety Tips</h3>
                <p className="text-neutral-600 mb-4 text-sm">
                  Essential safety guidelines for equipment use
                </p>
                <a
                  href="/safety-tips"
                  className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                >
                  Safety Guide →
                </a>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-6 text-center">
                <div className="mb-4 text-primary-600">
                  <PhoneCall className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">Contact Support</h3>
                <p className="text-neutral-600 mb-4 text-sm">Get personalized help from our team</p>
                <a
                  href="/contact"
                  className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                >
                  Contact Us →
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Search Help */}
      <section className="py-20 bg-neutral-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-primary-200 bg-primary-50">
            <CardContent className="p-8 text-center">
              <div className="mb-4 flex justify-center">
                <MessageCircle className="w-12 h-12 text-primary-600" />
              </div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">Still Have Questions?</h2>
              <p className="text-neutral-600 mb-6">
                Our support team is here to help you with any questions not covered in our FAQ.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/contact"
                  className="bg-primary-600 text-white hover:bg-primary-700 px-8 py-3 text-lg font-semibold rounded-lg transition-colors inline-block"
                >
                  <Mail className="w-5 h-5" /> Contact Support
                </a>
                <a
                  href="/support"
                  className="bg-white text-primary-600 hover:bg-primary-50 border border-primary-600 px-8 py-3 text-lg font-semibold rounded-lg transition-colors inline-block"
                >
                  <Headphones className="w-5 h-5" /> Live Chat
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

export default FAQPage;
