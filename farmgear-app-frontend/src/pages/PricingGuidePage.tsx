import { Link } from 'react-router-dom';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { BookOpenText, CalendarDays, Droplets, MapPin, Sprout, Target, Tractor, Trophy, Wrench, Search, BarChart3, Phone, CreditCard, ClipboardList } from 'lucide-react';

const ICONS = {
  tractor: Tractor,
  sprout: Sprout,
  wrench: Wrench,
  droplets: Droplets,
  calendar: CalendarDays,
  chart: BarChart3,
  pin: MapPin,
  search: Search,
  book: BookOpenText,
  target: Target,
  phone: Phone,
  trophy: Trophy,
} as const;

function PricingGuidePage() {
  const equipmentCategories = [
    {
      category: 'Tractors',
      icon: 'tractor',
      description: 'Essential farm equipment for various agricultural tasks',
      priceRanges: [
        { type: 'Compact Tractor (25-50 HP)', min: 240, max: 400, popular: 320 },
        { type: 'Mid-size Tractor (50-100 HP)', min: 400, max: 640, popular: 510 },
        { type: 'Large Tractor (100-200 HP)', min: 640, max: 1040, popular: 830 },
        { type: 'Heavy-duty Tractor (200+ HP)', min: 1040, max: 1600, popular: 1280 },
      ],
    },
    {
      category: 'Harvesters',
      icon: 'sprout',
      description: 'Specialized equipment for crop harvesting',
      priceRanges: [
        { type: 'Combine Harvester (Small)', min: 1280, max: 1920, popular: 1600 },
        { type: 'Combine Harvester (Large)', min: 1920, max: 3200, popular: 2560 },
        { type: 'Forage Harvester', min: 960, max: 1440, popular: 1200 },
        { type: 'Windrower', min: 1600, max: 2400, popular: 2000 },
      ],
    },
    {
      category: 'Plows & Tillage',
      icon: 'wrench',
      description: 'Soil preparation and cultivation equipment',
      priceRanges: [
        { type: 'Moldboard Plow', min: 130, max: 240, popular: 185 },
        { type: 'Disc Harrow', min: 160, max: 290, popular: 225 },
        { type: 'Chisel Plow', min: 190, max: 320, popular: 255 },
        { type: 'Field Cultivator', min: 145, max: 255, popular: 200 },
      ],
    },
    {
      category: 'Planting Equipment',
      icon: 'sprout',
      description: 'Seeding and planting machinery',
      priceRanges: [
        { type: 'Grain Drill', min: 160, max: 290, popular: 225 },
        { type: 'Planter (4-row)', min: 190, max: 320, popular: 255 },
        { type: 'Planter (8-row)', min: 320, max: 560, popular: 440 },
        { type: 'Broadcast Spreader', min: 95, max: 190, popular: 145 },
      ],
    },
    {
      category: 'Sprayers',
      icon: 'droplets',
      description: 'Application equipment for fertilizers and pesticides',
      priceRanges: [
        { type: 'Pull-behind Sprayer', min: 130, max: 240, popular: 185 },
        { type: 'Self-propelled Sprayer', min: 480, max: 800, popular: 640 },
        { type: 'Boom Sprayer', min: 240, max: 400, popular: 320 },
        { type: 'High-clearance Sprayer', min: 640, max: 960, popular: 800 },
      ],
    },
    {
      category: 'Specialized Equipment',
      icon: 'wrench',
      description: 'Specialized farming machinery',
      priceRanges: [
        { type: 'Baler (Round)', min: 320, max: 560, popular: 440 },
        { type: 'Baler (Square)', min: 400, max: 640, popular: 520 },
        { type: 'Mower', min: 130, max: 225, popular: 175 },
        { type: 'Rake', min: 95, max: 160, popular: 130 },
      ],
    },
  ];

  const pricingFactors = [
    {
      icon: 'calendar',
      title: 'Equipment Age',
      description: 'Newer equipment commands higher rental rates',
      factors: [
        '0-2 years: Premium pricing (100-110% of base rate)',
        '3-5 years: Standard pricing (90-100% of base rate)',
        '6-10 years: Moderate pricing (70-90% of base rate)',
        '10+ years: Budget pricing (50-70% of base rate)',
      ],
    },
    {
      icon: 'wrench',
      title: 'Equipment Condition',
      description: 'Well-maintained equipment justifies higher prices',
      factors: [
        'Excellent condition: Full pricing potential',
        'Good condition: 85-95% of premium rates',
        'Fair condition: 70-85% of premium rates',
        'Poor condition: Consider repair before listing',
      ],
    },
    {
      icon: 'chart',
      title: 'Market Demand',
      description: 'Seasonal and regional demand affects pricing',
      factors: [
        'Peak season: 120-150% of standard rates',
        'Planting season: 110-130% for relevant equipment',
        'Harvest season: 120-140% for harvesters',
        'Off-season: 80-90% of standard rates',
      ],
    },
    {
      icon: 'pin',
      title: 'Location & Availability',
      description: 'Local supply and demand dynamics',
      factors: [
        'High-demand areas: Premium pricing',
        'Rural areas: Competitive but fair pricing',
        'Limited availability: Increase rates 10-20%',
        'High competition: Stay competitive with market',
      ],
    },
    {
      icon: 'wrench',
      title: 'Additional Services',
      description: 'Value-added services can increase rates',
      factors: [
        'Delivery/pickup service: Add NZ$80-240 per trip',
        'Operator included: Add NZ$320-640 per day',
        'Maintenance included: Premium of 15-25%',
        'Training provided: Add NZ$160-320 per session',
      ],
    },
    {
      icon: 'calendar',
      title: 'Rental Duration',
      description: 'Longer rentals may warrant discounts',
      factors: [
        'Daily rate: Full pricing',
        'Weekly rental: 10-15% discount',
        'Monthly rental: 20-25% discount',
        'Seasonal rental: 30-35% discount',
      ],
    },
  ];

  const marketTips = [
    {
      icon: 'search',
      title: 'Research Competitors',
      description: 'Check similar equipment listings in your area to understand market rates',
    },
    {
      icon: 'chart',
      title: 'Start Competitive',
      description: 'Begin with competitive pricing to build reviews and reputation',
    },
    {
      icon: 'book',
      title: 'Highlight Value',
      description: 'Emphasize unique features, excellent condition, or additional services',
    },
    {
      icon: 'target',
      title: 'Adjust Seasonally',
      description: 'Increase rates during peak demand periods and adjust for off-seasons',
    },
    {
      icon: 'phone',
      title: 'Be Responsive',
      description: 'Quick responses to inquiries can justify slightly higher rates',
    },
    {
      icon: 'trophy',
      title: 'Build Reputation',
      description: 'Excellent service leads to repeat customers willing to pay premium rates',
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
              <CreditCard className="w-4 h-4" />
              Equipment Pricing Guide
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold text-neutral-900 mb-6">
              Farm Equipment <span className="text-gradient">Pricing Guide</span>
            </h1>
            <p className="text-xl text-neutral-600 mb-8 max-w-3xl mx-auto">
              Discover competitive rental rates for farm equipment in your area. Use our
              comprehensive pricing guide to maximize your rental income and attract more customers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/equipment/create">
                <Button className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 text-lg font-semibold">
                  📋 List Your Equipment
                </Button>
              </Link>
              <Link to="/how-to-list">
                <Button
                  variant="outline"
                  className="border-primary-600 text-primary-600 hover:bg-primary-50 px-8 py-3 text-lg font-semibold"
                >
                  📖 How to List Guide
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Overview */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">Daily Rental Rates</h2>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              Current market rates for popular farm equipment categories (prices in NZD per day)
            </p>
          </div>

          <div className="space-y-12">
            {equipmentCategories.map((category, index) => (
              <Card
                key={index}
                className="shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                      <div className="text-primary-600">
                        {(() => {
                          const Ico = ICONS[category.icon as keyof typeof ICONS];
                          return Ico ? <Ico className="w-8 h-8" /> : null;
                        })()}
                      </div>
                    <div>
                      <h3 className="text-2xl font-bold text-neutral-900">{category.category}</h3>
                      <p className="text-neutral-600">{category.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {category.priceRanges.map((item, idx) => (
                      <div key={idx} className="bg-neutral-50 rounded-lg p-4">
                        <h4 className="font-semibold text-neutral-900 mb-2">{item.type}</h4>
                        <div className="space-y-1">
                          <div className="text-sm text-neutral-600">
                            Range: ${item.min} - ${item.max}
                          </div>
                          <div className="text-lg font-bold text-primary-600">
                            Popular: ${item.popular}/day
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Factors */}
      <section className="py-20 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">Pricing Factors</h2>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              Key factors that influence equipment rental pricing in the market
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {pricingFactors.map((factor, index) => (
              <Card key={index} className="h-full hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6 h-full flex flex-col">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-primary-600">
                      {(() => {
                        const Ico = ICONS[factor.icon as keyof typeof ICONS];
                        return Ico ? <Ico className="w-7 h-7" /> : null;
                      })()}
                    </div>
                    <h3 className="text-lg font-semibold text-neutral-900">{factor.title}</h3>
                  </div>
                  <p className="text-neutral-600 mb-4 flex-grow">{factor.description}</p>
                  <ul className="space-y-2">
                    {factor.factors.map((item, idx) => (
                      <li key={idx} className="text-sm text-neutral-700 flex items-start gap-2">
                        <span className="text-primary-600 mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Market Tips */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">Pricing Strategy Tips</h2>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              Expert tips to optimize your equipment pricing for maximum profitability
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {marketTips.map((tip, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-primary-600">
                      {(() => {
                        const Ico = ICONS[tip.icon as keyof typeof ICONS];
                        return Ico ? <Ico className="w-7 h-7" /> : null;
                      })()}
                    </div>
                    <h3 className="text-lg font-semibold text-neutral-900">{tip.title}</h3>
                  </div>
                  <p className="text-neutral-600">{tip.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Calculator Section */}
      <section className="py-20 bg-neutral-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">Quick Pricing Calculator</h2>
            <p className="text-xl text-neutral-600">
              Use these multipliers to estimate your equipment's rental value
            </p>
          </div>

          <Card className="shadow-lg">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 mb-4">
                    Base Rate Calculation
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-neutral-700">Equipment purchase price</span>
                      <span className="font-semibold">NZ$ XX,XXX</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-neutral-700">Daily rate (0.5-1.5% of value)</span>
                      <span className="font-semibold">NZ$ XXX</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-neutral-700">Condition multiplier</span>
                      <span className="font-semibold">0.7 - 1.1x</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b font-semibold text-lg">
                      <span className="text-neutral-900">Suggested daily rate</span>
                      <span className="text-primary-600">NZ$ XXX</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 mb-4">
                    Seasonal Adjustments
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-primary-50 p-3 rounded-lg">
                      <div className="font-semibold text-primary-700 mb-1">
                        Peak Season (Spring/Fall)
                      </div>
                      <div className="text-sm text-primary-600">Increase rates by 20-50%</div>
                    </div>
                    <div className="bg-amber-50 p-3 rounded-lg">
                      <div className="font-semibold text-amber-700 mb-1">
                        Regular Season (Summer)
                      </div>
                      <div className="text-sm text-amber-600">Standard rates apply</div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="font-semibold text-blue-700 mb-1">Off Season (Winter)</div>
                      <div className="text-sm text-blue-600">Consider 10-20% discount</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 text-center">
                <Link to="/equipment/create">
              <Button className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 inline-flex items-center gap-2">
                <ClipboardList className="w-5 h-5" />
                Start Listing with Optimal Pricing
              </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Regional Market Insights */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">Regional Market Insights</h2>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              Understanding regional pricing variations and market dynamics
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                  Canterbury Plains
                </h3>
                <ul className="space-y-2 text-sm text-neutral-600">
                  <li>• High demand for large tractors and harvesters</li>
                  <li>• Peak season: September-November, March-May</li>
                  <li>• Premium rates during sowing and harvest</li>
                  <li>• Strong competition among grain farmers</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                  North Island Horticulture
                </h3>
                <ul className="space-y-2 text-sm text-neutral-600">
                  <li>• Specialized vineyard and orchard equipment</li>
                  <li>• Premium rates for niche machinery</li>
                  <li>• Year-round equipment utilization</li>
                  <li>• Strong relationships with growers</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                  Dairy & Pastoral Regions
                </h3>
                <ul className="space-y-2 text-sm text-neutral-600">
                  <li>• Consistent demand for mowing and baling</li>
                  <li>• Seasonal equipment sharing common</li>
                  <li>• Competitive but steady pricing</li>
                  <li>• Good market for reliable providers</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Price Your Equipment?</h2>
          <p className="text-xl text-primary-100 mb-8">
            Use our pricing insights to maximize your rental income and attract more customers
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/equipment/create">
              <Button className="bg-white text-primary-600 hover:bg-primary-50 px-8 py-3 text-lg font-semibold inline-flex items-center gap-2">
                <ClipboardList className="w-5 h-5" />
                List Equipment Now
              </Button>
            </Link>
            <Link to="/how-to-list">
              <Button className="bg-white text-primary-600 hover:bg-primary-50 px-8 py-3 text-lg font-semibold inline-flex items-center gap-2">
                <BookOpenText className="w-5 h-5" />
                Read Listing Guide
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default PricingGuidePage;
