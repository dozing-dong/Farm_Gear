import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';

function MaintenanceGuidePage() {
  const maintenanceSchedules = [
    {
      interval: 'Daily Inspection',
      icon: '📅',
      color: 'bg-green-50 border-green-200',
      tasks: [
        'Check engine oil level',
        'Inspect coolant level',
        'Check hydraulic fluid level',
        'Inspect tire pressure and condition',
        'Test lights and warning devices',
        'Clean air intake screen',
        'Check for loose bolts or components',
        'Inspect belts for wear or damage',
      ],
    },
    {
      interval: 'Weekly Maintenance',
      icon: '📆',
      color: 'bg-blue-50 border-blue-200',
      tasks: [
        'Grease all fittings per manual',
        'Check battery terminals and charge',
        'Inspect air filter condition',
        'Check transmission fluid level',
        'Test parking brake operation',
        'Inspect hydraulic hoses for leaks',
        'Clean equipment exterior thoroughly',
        'Check PTO (Power Take-Off) operation',
      ],
    },
    {
      interval: 'Monthly Service',
      icon: '🗓️',
      color: 'bg-amber-50 border-amber-200',
      tasks: [
        'Change engine oil and filter',
        'Replace fuel filter',
        'Check alternator belt tension',
        'Inspect exhaust system',
        'Test all gauges and indicators',
        'Check steering system operation',
        'Inspect brake system components',
        'Calibrate spray equipment (if applicable)',
      ],
    },
    {
      interval: 'Seasonal Overhaul',
      icon: '🔧',
      color: 'bg-purple-50 border-purple-200',
      tasks: [
        'Complete engine service and tune-up',
        'Replace hydraulic filters',
        'Service transmission and differential',
        'Inspect and service cooling system',
        'Replace worn belts and hoses',
        'Service air conditioning system',
        'Inspect and repair implement attachments',
        'Update software and calibrations',
      ],
    },
  ];

  const maintenanceAreas = [
    {
      title: 'Engine Maintenance',
      icon: '🔧',
      description: 'Keep your engine running efficiently and reliably',
      procedures: [
        {
          task: 'Oil Change',
          frequency: 'Every 250 hours or monthly',
          steps: [
            'Warm engine to operating temperature',
            'Position drain pan under drain plug',
            'Remove drain plug and drain oil completely',
            'Replace oil filter with new one',
            'Install drain plug with new gasket',
            'Add new oil to specified level',
            'Run engine and check for leaks',
          ],
        },
        {
          task: 'Air Filter Service',
          frequency: 'Every 500 hours or as needed',
          steps: [
            'Remove air filter housing cover',
            'Remove primary air filter element',
            'Inspect filter for damage or excessive dirt',
            'Clean or replace filter as needed',
            'Check for debris in housing',
            'Install filter ensuring proper seal',
            'Replace housing cover securely',
          ],
        },
      ],
    },
    {
      title: 'Hydraulic System',
      icon: '💧',
      description: 'Maintain optimal hydraulic performance and prevent costly failures',
      procedures: [
        {
          task: 'Hydraulic Fluid Check',
          frequency: 'Daily before operation',
          steps: [
            'Park on level ground with engine off',
            'Allow system to cool for 30 minutes',
            'Check fluid level on dipstick or sight gauge',
            'Add fluid if below minimum mark',
            'Check for leaks around cylinders and hoses',
            'Inspect hoses for wear or damage',
            'Test all hydraulic functions for smooth operation',
          ],
        },
        {
          task: 'Filter Replacement',
          frequency: 'Every 1000 hours or annually',
          steps: [
            'Position equipment safely and shut down',
            'Release system pressure safely',
            'Locate and access hydraulic filter',
            'Clean area around filter housing',
            'Remove old filter and dispose properly',
            'Install new filter with proper torque',
            'Check system for leaks after startup',
          ],
        },
      ],
    },
    {
      title: 'Transmission & Drivetrain',
      icon: '⚙️',
      description: 'Ensure smooth power transfer and extend component life',
      procedures: [
        {
          task: 'Transmission Service',
          frequency: 'Every 1500 hours or annually',
          steps: [
            'Check transmission fluid level and condition',
            'Drain old fluid from transmission',
            'Replace transmission filter if equipped',
            'Refill with specified fluid type and quantity',
            'Check for proper shift operation',
            'Inspect CV joints and universal joints',
            'Grease driveline components per schedule',
          ],
        },
      ],
    },
    {
      title: 'Electrical System',
      icon: '⚡',
      description: 'Maintain reliable electrical performance and prevent failures',
      procedures: [
        {
          task: 'Battery Maintenance',
          frequency: 'Monthly inspection',
          steps: [
            'Check battery terminals for corrosion',
            'Clean terminals with baking soda solution',
            'Test battery voltage (should be 12.6V or higher)',
            'Check electrolyte level in serviceable batteries',
            'Inspect battery case for cracks or damage',
            'Ensure battery is securely mounted',
            'Test charging system operation',
          ],
        },
      ],
    },
  ];

  const troubleshootingGuide = [
    {
      problem: "Engine Won't Start",
      icon: '🚫',
      causes: [
        'Dead battery or poor connections',
        'Empty fuel tank or contaminated fuel',
        'Clogged fuel filter',
        'Faulty starter motor',
        'Safety switches engaged',
      ],
      solutions: [
        'Check battery voltage and clean terminals',
        'Verify fuel supply and quality',
        'Replace fuel filter if clogged',
        'Test starter motor operation',
        'Ensure all safety switches are disengaged',
      ],
    },
    {
      problem: 'Overheating',
      icon: '🌡️',
      causes: [
        'Low coolant level',
        'Clogged radiator or screen',
        'Faulty thermostat',
        'Damaged water pump',
        'Slipping fan belt',
      ],
      solutions: [
        'Check and top up coolant level',
        'Clean radiator and air intake screen',
        'Replace thermostat if faulty',
        'Inspect water pump for leaks',
        'Adjust or replace fan belt',
      ],
    },
    {
      problem: 'Hydraulic System Slow',
      icon: '🐌',
      causes: [
        'Low hydraulic fluid level',
        'Contaminated hydraulic fluid',
        'Clogged hydraulic filter',
        'Worn hydraulic pump',
        'Internal cylinder leakage',
      ],
      solutions: [
        'Check and add hydraulic fluid',
        'Change hydraulic fluid and filter',
        'Replace clogged hydraulic filter',
        'Test and repair hydraulic pump',
        'Inspect and service cylinders',
      ],
    },
  ];

  const maintenanceTools = [
    {
      category: 'Basic Hand Tools',
      icon: '🔨',
      items: [
        'Socket and wrench sets (metric and imperial)',
        'Screwdriver set (flathead and Phillips)',
        'Pliers set (needle nose, standard, wire cutters)',
        'Adjustable wrenches',
        'Torque wrench',
        'Oil filter wrench',
        'Grease gun with fittings',
      ],
    },
    {
      category: 'Diagnostic Equipment',
      icon: '📊',
      items: [
        'Digital multimeter',
        'Battery tester',
        'Compression gauge',
        'Hydraulic pressure gauge',
        'Infrared thermometer',
        'Diagnostic scan tool (for newer equipment)',
        'Stethoscope for engine diagnosis',
      ],
    },
    {
      category: 'Safety Equipment',
      icon: '🦺',
      items: [
        'Safety glasses and gloves',
        'Jack stands and hydraulic jacks',
        'Wheel chocks',
        'Fire extinguisher',
        'First aid kit',
        'Spill containment materials',
        'Lockout/tagout devices',
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
              🔧 Maintenance Excellence
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold text-neutral-900 mb-6">
              Equipment Maintenance <span className="text-gradient">Guide</span>
            </h1>
            <p className="text-xl text-neutral-600 mb-8 max-w-3xl mx-auto">
              Comprehensive maintenance procedures to keep your agricultural equipment running
              efficiently, reduce downtime, and extend equipment life.
            </p>
          </div>
        </div>
      </section>

      {/* Maintenance Schedule */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">Maintenance Schedule</h2>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              Follow this schedule to maintain peak equipment performance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {maintenanceSchedules.map((schedule, index) => (
              <Card
                key={index}
                className={`${schedule.color} hover:shadow-lg transition-shadow duration-300`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-3xl">{schedule.icon}</div>
                    <h3 className="text-lg font-semibold text-neutral-900">{schedule.interval}</h3>
                  </div>
                  <ul className="space-y-2">
                    {schedule.tasks.map((task, taskIndex) => (
                      <li
                        key={taskIndex}
                        className="flex items-start gap-2 text-sm text-neutral-700"
                      >
                        <span className="text-primary-600 mt-1">•</span>
                        <span>{task}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed Maintenance Procedures */}
      <section className="py-20 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">Maintenance Procedures</h2>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              Step-by-step procedures for major maintenance tasks
            </p>
          </div>

          <div className="space-y-12">
            {maintenanceAreas.map((area, index) => (
              <Card
                key={index}
                className="shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="text-4xl">{area.icon}</div>
                    <div>
                      <h3 className="text-2xl font-bold text-neutral-900">{area.title}</h3>
                      <p className="text-neutral-600">{area.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {area.procedures.map((procedure, procIndex) => (
                      <div key={procIndex} className="bg-white rounded-lg p-6 border">
                        <div className="mb-4">
                          <h4 className="text-lg font-semibold text-neutral-900 mb-1">
                            {procedure.task}
                          </h4>
                          <p className="text-sm text-primary-600 font-medium">
                            {procedure.frequency}
                          </p>
                        </div>
                        <ol className="space-y-2">
                          {procedure.steps.map((step, stepIndex) => (
                            <li key={stepIndex} className="flex items-start gap-3">
                              <span className="bg-primary-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">
                                {stepIndex + 1}
                              </span>
                              <span className="text-neutral-700 text-sm">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Troubleshooting Guide */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">Troubleshooting Guide</h2>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              Common problems and their solutions to get you back to work quickly
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {troubleshootingGuide.map((issue, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-3xl">{issue.icon}</div>
                    <h3 className="text-lg font-semibold text-neutral-900">{issue.problem}</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-red-700 mb-2">Possible Causes:</h4>
                      <ul className="space-y-1">
                        {issue.causes.map((cause, causeIndex) => (
                          <li
                            key={causeIndex}
                            className="text-sm text-neutral-600 flex items-start gap-2"
                          >
                            <span className="text-red-500 mt-1">•</span>
                            <span>{cause}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-green-700 mb-2">Solutions:</h4>
                      <ul className="space-y-1">
                        {issue.solutions.map((solution, solutionIndex) => (
                          <li
                            key={solutionIndex}
                            className="text-sm text-neutral-600 flex items-start gap-2"
                          >
                            <span className="text-green-500 mt-1">•</span>
                            <span>{solution}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Essential Tools */}
      <section className="py-20 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">
              Essential Maintenance Tools
            </h2>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              Tools and equipment needed for proper maintenance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {maintenanceTools.map((toolCategory, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-3xl">{toolCategory.icon}</div>
                    <h3 className="text-lg font-semibold text-neutral-900">
                      {toolCategory.category}
                    </h3>
                  </div>
                  <ul className="space-y-2">
                    {toolCategory.items.map((item, itemIndex) => (
                      <li
                        key={itemIndex}
                        className="flex items-start gap-2 text-sm text-neutral-700"
                      >
                        <span className="text-primary-600 mt-1">•</span>
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

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Preventive Maintenance Saves Money</h2>
          <p className="text-xl text-primary-100 mb-8">
            Regular maintenance prevents costly breakdowns and extends equipment life
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/safety-tips"
              className="bg-white text-primary-600 hover:bg-primary-50 px-8 py-3 text-lg font-semibold rounded-lg transition-colors inline-block"
            >
              🦺 Safety Tips
            </a>
            <a
              href="/best-practices"
              className="bg-white text-primary-600 hover:bg-primary-50 px-8 py-3 text-lg font-semibold rounded-lg transition-colors inline-block"
            >
              📋 Best Practices
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default MaintenanceGuidePage;
