import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

const EquipmentPhotosPage: React.FC = () => {
  const photoTips = [
    {
      title: 'Overall Equipment Photos',
      description: 'Capture the complete appearance and overall condition of your equipment',
      tips: [
        'Choose well-lit outdoor environments',
        'Ensure equipment is clean and remove unnecessary clutter',
        'Shoot from multiple angles: front, side, and rear views',
        'Keep camera level and avoid tilted shots',
      ],
    },
    {
      title: 'Detail Close-up Photos',
      description: 'Highlight key components and special features of the equipment',
      tips: [
        'Engine bay and power systems',
        'Operator controls and dashboard',
        'Working components (plows, harvest heads, etc.)',
        'Tire or track condition',
      ],
    },
    {
      title: 'Functional Demonstration Photos',
      description: 'Show equipment in working condition and practical application',
      tips: [
        'Equipment operating in field conditions',
        'Key functional components in action',
        'Operator using the equipment',
        'Work results and output quality',
      ],
    },
    {
      title: 'Maintenance Condition Photos',
      description: 'Demonstrate the maintenance and care status of equipment',
      tips: [
        'Recently serviced components',
        'Lubrication points and service records',
        'Replaced wear items',
        'Service manuals and maintenance logs',
      ],
    },
  ];

  const technicalSpecs = [
    'Image resolution: Minimum 1920x1080 pixels',
    'File format: JPG or PNG',
    'File size: Maximum 5MB per image',
    'Quantity: At least 8-12 high-quality photos',
  ];

  const commonMistakes = [
    {
      mistake: 'Poor lighting or overexposure',
      solution: 'Choose soft morning or evening light on clear days',
    },
    {
      mistake: 'Cluttered background',
      solution: 'Select clean backgrounds that highlight the equipment',
    },
    {
      mistake: 'Blurry photos',
      solution: 'Use tripod or steady hand-held shooting with proper focus',
    },
    {
      mistake: 'Limited angles',
      solution: 'Show equipment from multiple perspectives including overhead views',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">📸 Equipment Photography Guide</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Professional equipment photos significantly increase rental success rates. Learn how to
            capture high-quality photos that attract renters.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-primary-600 mb-2">85%</div>
            <div className="text-gray-600">Higher rental rates with quality photos</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-primary-600 mb-2">12+</div>
            <div className="text-gray-600">Recommended photo count</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-primary-600 mb-2">3倍</div>
            <div className="text-gray-600">More inquiries with quality photos</div>
          </Card>
        </div>

        {/* Photo Categories */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">📷 Photography Type Guide</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {photoTips.map((category, index) => (
              <Card key={index} className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{category.title}</h3>
                <p className="text-gray-600 mb-4">{category.description}</p>
                <ul className="space-y-2">
                  {category.tips.map((tip, tipIndex) => (
                    <li key={tipIndex} className="flex items-start">
                      <span className="text-primary-600 mr-2">•</span>
                      <span className="text-gray-700">{tip}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </section>

        {/* Technical Requirements */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">⚙️ Technical Requirements</h2>
          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Photo Specifications</h3>
                <ul className="space-y-2">
                  {technicalSpecs.map((spec, index) => (
                    <li key={index} className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      <span className="text-gray-700">{spec}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Photography Tips</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Enable HDR mode when using mobile phone cameras</li>
                  <li>• Avoid digital zoom to maintain original quality</li>
                  <li>• Clean equipment surfaces before photographing</li>
                  <li>• Check photo clarity before finishing the shoot</li>
                </ul>
              </div>
            </div>
          </Card>
        </section>

        {/* Common Mistakes */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">❌ Common Mistakes & Solutions</h2>
          <div className="space-y-4">
            {commonMistakes.map((item, index) => (
              <Card key={index} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-red-600 mb-2">❌ Common Mistake</h3>
                    <p className="text-gray-700">{item.mistake}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-green-600 mb-2">✅ Solution</h3>
                    <p className="text-gray-700">{item.solution}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Photo Checklist */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">📋 Photo Checklist</h2>
          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Essential Photos</h3>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <input type="checkbox" className="mr-3" />
                    <span>Front full view</span>
                  </li>
                  <li className="flex items-center">
                    <input type="checkbox" className="mr-3" />
                    <span>Side full view</span>
                  </li>
                  <li className="flex items-center">
                    <input type="checkbox" className="mr-3" />
                    <span>Rear full view</span>
                  </li>
                  <li className="flex items-center">
                    <input type="checkbox" className="mr-3" />
                    <span>Operator cabin interior</span>
                  </li>
                  <li className="flex items-center">
                    <input type="checkbox" className="mr-3" />
                    <span>Engine compartment</span>
                  </li>
                  <li className="flex items-center">
                    <input type="checkbox" className="mr-3" />
                    <span>Working components close-up</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Bonus Photos</h3>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <input type="checkbox" className="mr-3" />
                    <span>Field operation scenes</span>
                  </li>
                  <li className="flex items-center">
                    <input type="checkbox" className="mr-3" />
                    <span>Maintenance records</span>
                  </li>
                  <li className="flex items-center">
                    <input type="checkbox" className="mr-3" />
                    <span>Accessories and tools</span>
                  </li>
                  <li className="flex items-center">
                    <input type="checkbox" className="mr-3" />
                    <span>Operation manual</span>
                  </li>
                  <li className="flex items-center">
                    <input type="checkbox" className="mr-3" />
                    <span>Equipment nameplate</span>
                  </li>
                  <li className="flex items-center">
                    <input type="checkbox" className="mr-3" />
                    <span>Work results display</span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </section>

        {/* Pro Tips */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">💡 Professional Tips</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 text-center">
              <div className="text-4xl mb-4">🌅</div>
              <h3 className="text-lg font-semibold mb-2">Golden Hour Photography</h3>
              <p className="text-gray-600">
                Soft light 1 hour after sunrise or before sunset is ideal for equipment photography
              </p>
            </Card>
            <Card className="p-6 text-center">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-lg font-semibold mb-2">Highlight Features</h3>
              <p className="text-gray-600">
                Focus on unique equipment features and recently maintained components
              </p>
            </Card>
            <Card className="p-6 text-center">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-lg font-semibold mb-2">Mobile Photography Tips</h3>
              <p className="text-gray-600">
                Use your phone's professional mode and adjust exposure and focus for better results
              </p>
            </Card>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="text-center space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
          <Link to="/equipment/create">
            <Button className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 text-lg font-semibold w-full sm:w-auto">
              📷 Start Uploading Equipment Photos
            </Button>
          </Link>
          <Link to="/how-to-list">
            <Button className="bg-white text-primary-600 hover:bg-primary-50 px-8 py-3 text-lg font-semibold w-full sm:w-auto">
              📖 View Complete Listing Guide
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EquipmentPhotosPage;
