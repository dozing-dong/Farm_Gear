import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

const SuccessStoriesPage: React.FC = () => {
  const successStories = [
    {
      name: 'Michael Thompson',
      location: 'Canterbury Plains, NZ',
      equipment: 'John Deere 9600 Combine Harvester',
      earnings: 'NZ$28,000',
      period: '2023 Harvest Season',
      story:
        "I initially purchased this combine harvester for my own farm, but during off-season periods, I rented it out to neighboring farms through the Farm Gear platform. Just during the 2023 harvest season, I earned NZ$28,000 in additional income, completely covering the equipment's annual maintenance costs.",
      tips: 'Maintaining equipment in good condition, providing flexible rental schedules, and building a good reputation are key to success.',
      avatar: '🚜',
    },
    {
      name: 'Sarah Wilson',
      location: 'North Island, NZ',
      equipment: 'Kubota M7-172 Tractor',
      earnings: 'NZ$15,600',
      period: '6 months',
      story:
        'As a medium-sized farm owner, I found my tractor had long idle periods during non-farming seasons. Through Farm Gear, I successfully rented it to nearby small farmers and horticulture companies. In six months, I earned NZ$15,600 in income.',
      tips: 'Detailed equipment maintenance records and timely response to renter needs are the secrets to good reviews.',
      avatar: '🚛',
    },
    {
      name: 'David Chen',
      location: 'Waikato Region, NZ',
      equipment: 'Seeding Equipment Set + Tillage Tools',
      earnings: 'NZ$22,400',
      period: 'Spring Planting Season',
      story:
        'I specifically purchased a set of modern seeding equipment with the primary goal of renting to local farmers. Spring planting season had high demand, and through reasonable pricing and quality service, I achieved NZ$22,400 in income. The equipment investment paid for itself within 18 months.',
      tips: 'Choosing equipment types with high local demand will result in faster investment returns.',
      avatar: '🌱',
    },
    {
      name: 'Emma Rodriguez',
      location: 'South Island, NZ',
      equipment: 'Claas Lexion 760 Combine',
      earnings: 'NZ$35,200',
      period: '2023 Annual',
      story:
        "This large combine harvester is my farm's main equipment, but it's only used 30-40 days per year. Through the Farm Gear platform, I rent it to other farms, earning NZ$35,200 annually, equivalent to 70% of the equipment's annual depreciation.",
      tips: 'Large equipment generates higher returns, but ensure operator training and insurance coverage are adequate.',
      avatar: '🌾',
    },
    {
      name: 'James Miller',
      location: 'Otago Region, NZ',
      equipment: 'Multi-Purpose Farm Tool Package',
      earnings: 'NZ$18,800',
      period: 'Full Year',
      story:
        "I provide a complete farm tool rental service, including plows, harrows, seeders, etc. While individual equipment values aren't high, through package rentals and year-round service, I achieved a stable annual income of NZ$18,800.",
      tips: 'Providing supporting services and one-stop solutions can attract more long-term customers.',
      avatar: '🔧',
    },
    {
      name: 'Lisa Brown',
      location: "Hawke's Bay, NZ",
      equipment: 'Orchard Specialized Equipment',
      earnings: 'NZ$12,600',
      period: '8 months',
      story:
        "In the horticulture-rich Hawke's Bay region, I specialize in renting orchard equipment, including pruning machines, sprayers, etc. While the equipment is smaller, demand is stable, earning NZ$12,600 in 8 months.",
      tips: 'Targeting specific industry needs, even small equipment can generate good returns.',
      avatar: '🍎',
    },
  ];

  const platformStats = [
    {
      metric: 'NZ$2.8M+',
      description: 'Total income generated for equipment owners',
      icon: '💰',
    },
    {
      metric: '1,200+',
      description: 'Successful equipment owners',
      icon: '👥',
    },
    {
      metric: '95%',
      description: 'User satisfaction rate',
      icon: '⭐',
    },
    {
      metric: '85%',
      description: 'Repeat rental rate',
      icon: '🔄',
    },
  ];

  const successTips = [
    {
      title: 'Equipment Maintenance',
      description: 'Regular maintenance for optimal condition',
      tips: [
        'Establish regular maintenance schedule',
        'Keep detailed maintenance records',
        'Replace wear items promptly',
        'Inspect equipment after each rental',
      ],
    },
    {
      title: 'Pricing Strategy',
      description: 'Smart pricing for maximum returns',
      tips: [
        'Research local market prices',
        'Consider equipment costs and maintenance fees',
        'Offer flexible rental period options',
        'Seasonal pricing differences',
      ],
    },
    {
      title: 'Customer Service',
      description: 'Quality service builds reputation',
      tips: [
        'Respond quickly to rental inquiries',
        'Provide detailed operation instructions',
        'Build long-term partnerships',
        'Collect customer feedback for improvement',
      ],
    },
    {
      title: 'Marketing',
      description: 'Increase equipment visibility',
      tips: [
        'Take high-quality equipment photos',
        'Write detailed equipment descriptions',
        'Actively collect user reviews',
        'Participate in local agricultural events',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">🌟 Success Stories</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Learn how real equipment owners achieve additional income through the Farm Gear
            platform, and discover their success strategies and practical tips.
          </p>
        </div>

        {/* Platform Stats */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            📊 Platform Achievements
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {platformStats.map((stat, index) => (
              <Card key={index} className="p-6 text-center">
                <div className="text-4xl mb-2">{stat.icon}</div>
                <div className="text-3xl font-bold text-primary-600 mb-2">{stat.metric}</div>
                <div className="text-gray-600">{stat.description}</div>
              </Card>
            ))}
          </div>
        </section>

        {/* Success Stories */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">💡 Real Success Stories</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {successStories.map((story, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-start mb-4">
                  <div className="text-4xl mr-4">{story.avatar}</div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{story.name}</h3>
                    <p className="text-gray-600">{story.location}</p>
                    <p className="text-sm text-primary-600 font-medium">{story.equipment}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Earnings</span>
                    <span className="text-lg font-bold text-green-600">{story.earnings}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Period</span>
                    <span className="text-sm text-gray-900">{story.period}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Success Story:</h4>
                  <p className="text-gray-700 text-sm leading-relaxed">{story.story}</p>
                </div>

                <div className="bg-primary-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-primary-800 mb-2">💡 Success Tips:</h4>
                  <p className="text-primary-700 text-sm">{story.tips}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Success Tips */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">🎯 Success Guide</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {successTips.map((category, index) => (
              <Card key={index} className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{category.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{category.description}</p>
                <ul className="space-y-2">
                  {category.tips.map((tip, tipIndex) => (
                    <li key={tipIndex} className="text-sm text-gray-700 flex items-start">
                      <span className="text-primary-600 mr-2 mt-1">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </section>

        {/* Earnings Calculator */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            💰 Earnings Potential Calculator
          </h2>
          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600 mb-2">NZ$180-400</div>
                <div className="text-gray-600">Tractor daily rental range</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600 mb-2">NZ$320-800</div>
                <div className="text-gray-600">Harvester daily rental range</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600 mb-2">60-90 days</div>
                <div className="text-gray-600">Average annual rental days</div>
              </div>
            </div>
            <div className="mt-6 p-4 bg-green-50 rounded-lg text-center">
              <p className="text-green-800 font-medium">
                💡 A medium tractor can generate NZ$10,800 - NZ$36,000 additional income annually
              </p>
            </div>
          </Card>
        </section>

        {/* ROI Examples */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            📈 Return on Investment Examples
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Medium Tractor</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Equipment value:</span>
                  <span className="font-medium">NZ$85,000</span>
                </div>
                <div className="flex justify-between">
                  <span>Annual rental income:</span>
                  <span className="font-medium text-green-600">NZ$18,000</span>
                </div>
                <div className="flex justify-between">
                  <span>Annual maintenance cost:</span>
                  <span className="font-medium text-red-600">NZ$3,200</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span>Net annual income:</span>
                  <span className="font-bold text-green-600">NZ$14,800</span>
                </div>
                <div className="flex justify-between">
                  <span>Return on investment:</span>
                  <span className="font-bold text-primary-600">17.4%</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Combine Harvester</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Equipment value:</span>
                  <span className="font-medium">NZ$220,000</span>
                </div>
                <div className="flex justify-between">
                  <span>Annual rental income:</span>
                  <span className="font-medium text-green-600">NZ$32,000</span>
                </div>
                <div className="flex justify-between">
                  <span>Annual maintenance cost:</span>
                  <span className="font-medium text-red-600">NZ$5,800</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span>Net annual income:</span>
                  <span className="font-bold text-green-600">NZ$26,200</span>
                </div>
                <div className="flex justify-between">
                  <span>Return on investment:</span>
                  <span className="font-bold text-primary-600">11.9%</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Seeding Equipment</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Equipment value:</span>
                  <span className="font-medium">NZ$45,000</span>
                </div>
                <div className="flex justify-between">
                  <span>Annual rental income:</span>
                  <span className="font-medium text-green-600">NZ$12,000</span>
                </div>
                <div className="flex justify-between">
                  <span>Annual maintenance cost:</span>
                  <span className="font-medium text-red-600">NZ$1,800</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span>Net annual income:</span>
                  <span className="font-bold text-green-600">NZ$10,200</span>
                </div>
                <div className="flex justify-between">
                  <span>Return on investment:</span>
                  <span className="font-bold text-primary-600">22.7%</span>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">🚀 Start Your Success Story</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Join our successful equipment owner community and turn your idle equipment into a steady
            income source.
          </p>
          <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
            <Link to="/equipment/create">
              <Button className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 text-lg font-semibold w-full sm:w-auto">
                💼 List Equipment Now
              </Button>
            </Link>
            <Link to="/how-to-list">
              <Button className="bg-white text-primary-600 hover:bg-primary-50 px-8 py-3 text-lg font-semibold w-full sm:w-auto">
                📚 Learn Listing Guide
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SuccessStoriesPage;
