import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Droplets,
  Flame,
  PhoneCall,
  Shield,
  ShieldCheck,
  Truck,
  Wrench,
} from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';

function SafetyTipsPage() {
  const safetyCategories = [
    {
      title: 'Equipment Operation Safety',
      Icon: ShieldCheck,
      tips: [
        {
          title: 'Pre-Operation Inspection',
          description: 'Always perform a thorough inspection before operating any equipment',
          details: [
            'Check fluid levels (oil, coolant, hydraulic fluid)',
            'Inspect tires or tracks for wear and proper pressure',
            'Test all controls and safety systems',
            'Ensure all guards and shields are properly installed',
            'Verify that all lights and warning devices work',
          ],
        },
        {
          title: 'Safe Operating Procedures',
          description: 'Follow proper procedures to prevent accidents and equipment damage',
          details: [
            "Read and understand the operator's manual",
            'Never exceed recommended operating speeds',
            'Maintain proper seating position and use seat belts',
            'Keep hands, feet, and loose clothing away from moving parts',
            'Never leave equipment running unattended',
          ],
        },
        {
          title: 'Weather Awareness',
          description: 'Adapt operations based on weather conditions',
          details: [
            'Avoid operating during severe weather conditions',
            'Reduce speed in wet or muddy conditions',
            'Be extra cautious on slopes when conditions are slippery',
            'Allow extra time for stopping in adverse conditions',
            'Check visibility before operating in fog or heavy rain',
          ],
        },
      ],
    },
    {
      title: 'Personal Safety Equipment',
      Icon: Shield,
      tips: [
        {
          title: 'Essential Safety Gear',
          description: 'Wear appropriate personal protective equipment at all times',
          details: [
            'High-visibility safety vest or clothing',
            'Safety boots with slip-resistant soles',
            'Hard hat when working around overhead hazards',
            'Safety glasses or goggles',
            'Hearing protection in high-noise environments',
          ],
        },
        {
          title: 'Clothing Guidelines',
          description: 'Choose appropriate clothing for safe equipment operation',
          details: [
            'Avoid loose-fitting clothing that could catch on controls',
            'Remove jewelry that might get caught in machinery',
            'Wear close-fitting clothes around moving parts',
            'Use weather-appropriate clothing for comfort and safety',
            'Keep a first aid kit easily accessible',
          ],
        },
      ],
    },
    {
      title: 'Maintenance Safety',
      Icon: Wrench,
      tips: [
        {
          title: 'Lockout/Tagout Procedures',
          description: 'Ensure equipment is properly shut down before maintenance',
          details: [
            'Turn off engine and remove keys',
            'Engage parking brake and lower all implements',
            'Release hydraulic pressure safely',
            'Place lockout devices on power sources',
            'Use proper jack stands when lifting equipment',
          ],
        },
        {
          title: 'Chemical Safety',
          description: 'Handle fluids and chemicals safely during maintenance',
          details: [
            'Wear appropriate gloves when handling fluids',
            'Use proper ventilation when working with chemicals',
            'Store chemicals in approved containers',
            'Dispose of waste materials according to regulations',
            'Keep Safety Data Sheets (SDS) readily available',
          ],
        },
      ],
    },
    {
      title: 'Transport Safety',
      Icon: Truck,
      tips: [
        {
          title: 'Road Transport',
          description: 'Safely transport equipment between locations',
          details: [
            'Use proper trailer size and weight capacity',
            'Secure equipment with appropriate tie-downs',
            'Check trailer lights and braking systems',
            'Use pilot vehicles when required by law',
            'Plan route to avoid low bridges and weight restrictions',
          ],
        },
        {
          title: 'Field Movement',
          description: 'Move equipment safely within work areas',
          details: [
            'Watch for overhead power lines',
            'Be aware of underground utilities',
            'Use spotters when visibility is limited',
            'Maintain safe distances from other equipment',
            'Communicate with other operators using radios or signals',
          ],
        },
      ],
    },
  ];

  const emergencyProcedures = [
    {
      situation: 'Equipment Fire',
      Icon: Flame,
      steps: [
        'Stop equipment immediately and turn off engine',
        'Exit equipment quickly and move to safe distance',
        'Call emergency services (111 in New Zealand)',
        'Use fire extinguisher only if safe to do so',
        'Never use water on fuel or electrical fires',
      ],
    },
    {
      situation: 'Hydraulic Leak',
      Icon: Droplets,
      steps: [
        'Stop operation immediately',
        'Keep away from high-pressure hydraulic fluid',
        'Turn off equipment and release system pressure',
        'Contain leak if possible to prevent environmental damage',
        'Seek medical attention if fluid injection occurs',
      ],
    },
    {
      situation: 'Equipment Rollover',
      Icon: AlertTriangle,
      steps: [
        'If equipped with ROPS, stay in the cab and use seat belt',
        'Do not attempt to jump from rolling equipment',
        'Brace yourself and hold on to the steering wheel',
        'Exit only when equipment comes to complete stop',
        'Check for injuries and call for medical help if needed',
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
            <Badge variant="default" className="mb-4 bg-primary-100 text-primary-700 gap-2">
              <ShieldCheck className="w-4 h-4" />
              Safety First
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold text-neutral-900 mb-6">
              Equipment Safety <span className="text-gradient">Guidelines</span>
            </h1>
            <p className="text-xl text-neutral-600 mb-8 max-w-3xl mx-auto">
              Essential safety tips and best practices for operating agricultural equipment. Stay
              safe while maximizing productivity in your farming operations.
            </p>
          </div>
        </div>
      </section>

      {/* Safety Categories */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">Safety Categories</h2>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              Comprehensive safety guidelines covering all aspects of agricultural equipment use
            </p>
          </div>

          <div className="space-y-12">
            {safetyCategories.map((category, index) => (
              <Card
                key={index}
                className="shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="text-primary-600">
                      <category.Icon className="w-8 h-8" />
                    </div>
                    <h3 className="text-3xl font-bold text-neutral-900">{category.title}</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {category.tips.map((tip, tipIndex) => (
                      <div key={tipIndex} className="bg-neutral-50 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-neutral-900 mb-3">{tip.title}</h4>
                        <p className="text-neutral-600 mb-4">{tip.description}</p>
                        <ul className="space-y-2">
                          {tip.details.map((detail, detailIndex) => (
                            <li
                              key={detailIndex}
                              className="flex items-start gap-2 text-sm text-neutral-700"
                            >
                              <CheckCircle2 className="w-4 h-4 text-primary-600 mt-1" />
                              <span>{detail}</span>
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

      {/* Emergency Procedures */}
      <section className="py-20 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">Emergency Procedures</h2>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              Know what to do in emergency situations to protect yourself and others
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {emergencyProcedures.map((procedure, index) => (
              <Card
                key={index}
                className="hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-red-500"
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-red-600">
                      <procedure.Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-semibold text-neutral-900">
                      {procedure.situation}
                    </h3>
                  </div>
                  <ol className="space-y-3">
                    {procedure.steps.map((step, stepIndex) => (
                      <li key={stepIndex} className="flex items-start gap-3">
                        <span className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">
                          {stepIndex + 1}
                        </span>
                        <span className="text-neutral-700">{step}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Safety Reminders */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">Key Safety Reminders</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <AlertTriangle className="w-5 h-5 text-amber-700" />
                  <h3 className="text-lg font-semibold text-amber-800">Before Operation</h3>
                </div>
                <ul className="space-y-2 text-amber-700">
                  <li>• Complete pre-operation inspection</li>
                  <li>• Ensure all safety systems function</li>
                  <li>• Wear appropriate safety equipment</li>
                  <li>• Check weather conditions</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-green-700" />
                  <h3 className="text-lg font-semibold text-green-800">During Operation</h3>
                </div>
                <ul className="space-y-2 text-green-700">
                  <li>• Maintain awareness of surroundings</li>
                  <li>• Follow manufacturer guidelines</li>
                  <li>• Never bypass safety features</li>
                  <li>• Stop if anything seems wrong</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Wrench className="w-5 h-5 text-blue-700" />
                  <h3 className="text-lg font-semibold text-blue-800">Maintenance Safety</h3>
                </div>
                <ul className="space-y-2 text-blue-700">
                  <li>• Use lockout/tagout procedures</li>
                  <li>• Work on level, stable ground</li>
                  <li>• Use proper tools and equipment</li>
                  <li>• Follow service manual instructions</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <PhoneCall className="w-5 h-5 text-purple-700" />
                  <h3 className="text-lg font-semibold text-purple-800">Emergency Contacts</h3>
                </div>
                <ul className="space-y-2 text-purple-700">
                  <li>• Emergency Services: 111</li>
                  <li>• Poison Control: 0800 764 766</li>
                  <li>• Equipment Manufacturer Support</li>
                  <li>• Local Emergency Coordinator</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Safety is Everyone's Responsibility
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Follow these guidelines to ensure safe operations and protect yourself and others
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/maintenance-guide"
              className="bg-white text-primary-600 hover:bg-primary-50 px-8 py-3 text-lg font-semibold rounded-lg transition-colors inline-flex items-center gap-2"
            >
              <Wrench className="w-5 h-5" />
              Maintenance Guide
            </a>
            <a
              href="/best-practices"
              className="bg-white text-primary-600 hover:bg-primary-50 px-8 py-3 text-lg font-semibold rounded-lg transition-colors inline-flex items-center gap-2"
            >
              <ClipboardList className="w-5 h-5" />
              Best Practices
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default SafetyTipsPage;
