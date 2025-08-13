import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';

function BestPracticesPage() {
  const practiceCategories = [
    {
      title: 'Equipment Operation',
      icon: '🚜',
      description: 'Optimize performance and efficiency during operation',
      practices: [
        {
          title: 'Proper Warm-up Procedures',
          description: 'Start engines correctly to prevent damage and extend life',
          tips: [
            'Allow engine to warm up at idle for 3-5 minutes',
            'Gradually increase load during warm-up period',
            'Check gauges before beginning work',
            'Never operate under full load when cold',
            'Use block heaters in cold weather',
          ],
        },
        {
          title: 'Efficient Field Operations',
          description: 'Maximize productivity while minimizing wear',
          tips: [
            'Plan field patterns to minimize turns and overlaps',
            'Maintain proper ground speed for conditions',
            'Avoid unnecessary idling to save fuel',
            'Use GPS guidance systems for precision',
            'Monitor and record operating parameters',
          ],
        },
        {
          title: 'Load Management',
          description: 'Operate within equipment capabilities',
          tips: [
            "Never exceed manufacturer's weight limits",
            'Distribute loads evenly across implements',
            'Adjust working depth based on soil conditions',
            'Use proper tire pressure for load and conditions',
            'Monitor hydraulic pressures during operation',
          ],
        },
      ],
    },
    {
      title: 'Fuel Management',
      icon: '⛽',
      description: 'Optimize fuel efficiency and quality',
      practices: [
        {
          title: 'Fuel Quality Control',
          description: 'Ensure clean, quality fuel for optimal performance',
          tips: [
            'Use fuel from reputable suppliers only',
            'Filter fuel when transferring to equipment',
            'Keep fuel tanks full to minimize condensation',
            'Use appropriate fuel additives when needed',
            'Store fuel in clean, sealed containers',
          ],
        },
        {
          title: 'Fuel Economy Techniques',
          description: 'Reduce fuel consumption without sacrificing productivity',
          tips: [
            'Maintain optimal engine RPM for conditions',
            'Use appropriate gear selection for load',
            'Minimize excessive idling time',
            'Keep engines properly tuned',
            'Plan routes to minimize travel distance',
          ],
        },
      ],
    },
    {
      title: 'Seasonal Preparation',
      icon: '🌤️',
      description: 'Prepare equipment for changing conditions',
      practices: [
        {
          title: 'Spring Preparation',
          description: 'Get equipment ready for the busy season',
          tips: [
            'Complete comprehensive pre-season inspection',
            'Change all fluids and filters',
            'Test all systems and controls',
            'Calibrate implements and monitors',
            'Update software and GPS systems',
          ],
        },
        {
          title: 'Summer Operations',
          description: 'Manage heat and dust during peak season',
          tips: [
            'Clean air intake systems more frequently',
            'Monitor engine temperatures closely',
            'Schedule work during cooler parts of day',
            'Keep cooling systems clean and effective',
            'Protect operators from heat stress',
          ],
        },
        {
          title: 'Winter Storage',
          description: 'Properly prepare equipment for storage',
          tips: [
            'Clean equipment thoroughly before storage',
            'Change oil and add fuel stabilizer',
            'Grease all fittings and moving parts',
            'Store in dry, covered location',
            'Remove batteries and store properly',
          ],
        },
      ],
    },
    {
      title: 'Record Keeping',
      icon: '📊',
      description: 'Maintain accurate records for better management',
      practices: [
        {
          title: 'Maintenance Records',
          description: 'Track all maintenance activities and schedules',
          tips: [
            'Log all maintenance performed with dates',
            'Record operating hours and conditions',
            'Track parts usage and costs',
            'Note any unusual wear or problems',
            'Maintain warranty and service documentation',
          ],
        },
        {
          title: 'Performance Monitoring',
          description: 'Track equipment efficiency and productivity',
          tips: [
            'Monitor fuel consumption per hour/acre',
            'Track repair frequency and costs',
            'Record productivity rates by field/crop',
            'Note weather and soil conditions',
            'Compare performance year over year',
          ],
        },
      ],
    },
  ];

  const efficiencyTips = [
    {
      category: 'Field Efficiency',
      icon: '🌾',
      tips: [
        'Use GPS guidance to reduce overlaps and gaps',
        'Plan headlands and turn areas efficiently',
        'Combine operations when possible (cultivation + planting)',
        'Match equipment size to field size',
        'Use controlled traffic farming patterns',
      ],
    },
    {
      category: 'Time Management',
      icon: '⏰',
      tips: [
        'Schedule maintenance during off-peak hours',
        'Prepare equipment the night before',
        'Have spare parts readily available',
        'Cross-train operators on multiple machines',
        'Use weather windows effectively',
      ],
    },
    {
      category: 'Cost Control',
      icon: '💰',
      tips: [
        'Track all operating costs accurately',
        'Buy parts and fuel in bulk when appropriate',
        'Negotiate service contracts for major overhauls',
        'Consider leasing vs. buying for specialty equipment',
        'Evaluate total cost of ownership, not just purchase price',
      ],
    },
  ];

  const operatorBestPractices = [
    {
      title: 'Operator Training',
      icon: '🎓',
      points: [
        'Ensure all operators are properly trained on equipment',
        'Provide regular safety refresher training',
        'Train operators to recognize unusual sounds or vibrations',
        'Teach proper adjustment procedures for different crops',
        'Emphasize the importance of daily inspections',
      ],
    },
    {
      title: 'Communication',
      icon: '📞',
      points: [
        'Establish clear communication protocols',
        'Use two-way radios for field coordination',
        'Report problems immediately to prevent damage',
        'Share knowledge between experienced and new operators',
        'Maintain contact with support services',
      ],
    },
    {
      title: 'Ergonomics & Comfort',
      icon: '🪑',
      points: [
        'Adjust seats and controls for comfort',
        'Take regular breaks to prevent fatigue',
        'Use air conditioning to maintain alertness',
        'Keep cabs clean and organized',
        'Ensure good visibility in all directions',
      ],
    },
  ];

  const environmentalPractices = [
    {
      title: 'Soil Conservation',
      icon: '🌱',
      description: 'Protect and improve soil health',
      practices: [
        'Use appropriate tire pressure to minimize compaction',
        'Avoid operating in wet conditions when possible',
        'Implement controlled traffic farming',
        'Use cover crops to protect soil between seasons',
        'Vary tillage depth and patterns',
      ],
    },
    {
      title: 'Precision Agriculture',
      icon: '🎯',
      description: 'Use technology for sustainable farming',
      practices: [
        'Implement variable rate application systems',
        'Use yield mapping to optimize inputs',
        'Apply GPS guidance for consistent field operations',
        'Monitor and record application rates accurately',
        'Use soil testing to guide fertilizer applications',
      ],
    },
    {
      title: 'Waste Reduction',
      icon: '♻️',
      description: 'Minimize waste and environmental impact',
      practices: [
        'Properly dispose of used oils and filters',
        'Recycle parts and materials when possible',
        'Use biodegradable hydraulic fluids where appropriate',
        'Minimize chemical drift with proper application techniques',
        'Clean equipment to prevent contamination between fields',
      ],
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
              📋 Best Practices
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold text-neutral-900 mb-6">
              Equipment <span className="text-gradient">Best Practices</span>
            </h1>
            <p className="text-xl text-neutral-600 mb-8 max-w-3xl mx-auto">
              Proven strategies and techniques to maximize equipment performance, extend service
              life, and optimize your farming operations.
            </p>
          </div>
        </div>
      </section>

      {/* Main Practice Categories */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">Core Best Practices</h2>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              Essential practices for optimal equipment management and operation
            </p>
          </div>

          <div className="space-y-12">
            {practiceCategories.map((category, index) => (
              <Card
                key={index}
                className="shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="text-4xl">{category.icon}</div>
                    <div>
                      <h3 className="text-2xl font-bold text-neutral-900">{category.title}</h3>
                      <p className="text-neutral-600">{category.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {category.practices.map((practice, practiceIndex) => (
                      <div key={practiceIndex} className="bg-neutral-50 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-neutral-900 mb-2">
                          {practice.title}
                        </h4>
                        <p className="text-neutral-600 mb-4 text-sm">{practice.description}</p>
                        <ul className="space-y-2">
                          {practice.tips.map((tip, tipIndex) => (
                            <li
                              key={tipIndex}
                              className="flex items-start gap-2 text-sm text-neutral-700"
                            >
                              <span className="text-primary-600 mt-1">•</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Efficiency Tips */}
      <section className="py-20 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">Efficiency Optimization</h2>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              Strategies to maximize productivity and minimize costs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {efficiencyTips.map((category, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-3xl">{category.icon}</div>
                    <h3 className="text-lg font-semibold text-neutral-900">{category.category}</h3>
                  </div>
                  <ul className="space-y-3">
                    {category.tips.map((tip, tipIndex) => (
                      <li
                        key={tipIndex}
                        className="flex items-start gap-2 text-sm text-neutral-700"
                      >
                        <span className="text-primary-600 mt-1">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Operator Best Practices */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">Operator Excellence</h2>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              Building skilled operators for safe and efficient operations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {operatorBestPractices.map((practice, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-3xl">{practice.icon}</div>
                    <h3 className="text-lg font-semibold text-neutral-900">{practice.title}</h3>
                  </div>
                  <ul className="space-y-3">
                    {practice.points.map((point, pointIndex) => (
                      <li
                        key={pointIndex}
                        className="flex items-start gap-2 text-sm text-neutral-700"
                      >
                        <span className="text-primary-600 mt-1">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Environmental Practices */}
      <section className="py-20 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">Environmental Stewardship</h2>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              Sustainable practices for responsible farming
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {environmentalPractices.map((practice, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-3xl">{practice.icon}</div>
                    <h3 className="text-lg font-semibold text-neutral-900">{practice.title}</h3>
                  </div>
                  <p className="text-neutral-600 mb-4 text-sm">{practice.description}</p>
                  <ul className="space-y-2">
                    {practice.practices.map((item, itemIndex) => (
                      <li
                        key={itemIndex}
                        className="flex items-start gap-2 text-sm text-neutral-700"
                      >
                        <span className="text-green-600 mt-1">•</span>
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

      {/* Quick Reference */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">Quick Reference Guide</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-green-800 mb-4">✅ Daily Checklist</h3>
                <ul className="space-y-2 text-green-700 text-sm">
                  <li>• Complete pre-operation inspection</li>
                  <li>• Check fluid levels and tire pressure</li>
                  <li>• Test all controls and safety systems</li>
                  <li>• Plan efficient field patterns</li>
                  <li>• Monitor weather conditions</li>
                  <li>• Record operating hours and fuel usage</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-blue-800 mb-4">🎯 Performance Metrics</h3>
                <ul className="space-y-2 text-blue-700 text-sm">
                  <li>• Fuel consumption per hectare</li>
                  <li>• Field efficiency percentage</li>
                  <li>• Equipment uptime vs. downtime</li>
                  <li>• Maintenance cost per operating hour</li>
                  <li>• Operator satisfaction and comfort</li>
                  <li>• Environmental impact measures</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-amber-800 mb-4">⚠️ Warning Signs</h3>
                <ul className="space-y-2 text-amber-700 text-sm">
                  <li>• Unusual noises or vibrations</li>
                  <li>• Excessive fuel consumption</li>
                  <li>• Hydraulic fluid leaks</li>
                  <li>• Overheating indicators</li>
                  <li>• Decreased performance</li>
                  <li>• Frequent minor breakdowns</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-purple-800 mb-4">📊 Record Keeping</h3>
                <ul className="space-y-2 text-purple-700 text-sm">
                  <li>• Operating hours and fuel records</li>
                  <li>• Maintenance schedules and costs</li>
                  <li>• Field productivity data</li>
                  <li>• Weather and soil conditions</li>
                  <li>• Operator feedback and issues</li>
                  <li>• Parts inventory and usage</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Excellence Through Best Practices</h2>
          <p className="text-xl text-primary-100 mb-8">
            Implement these practices to achieve optimal equipment performance and sustainability
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/safety-tips"
              className="bg-white text-primary-600 hover:bg-primary-50 px-8 py-3 text-lg font-semibold rounded-lg transition-colors inline-block"
            >
              🦺 Safety Tips
            </a>
            <a
              href="/maintenance-guide"
              className="bg-white text-primary-600 hover:bg-primary-50 px-8 py-3 text-lg font-semibold rounded-lg transition-colors inline-block"
            >
              🔧 Maintenance Guide
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default BestPracticesPage;
