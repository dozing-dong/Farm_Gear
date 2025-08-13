import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Briefcase, Handshake, Leaf, Lightbulb, ShieldCheck, Sprout, Tractor } from 'lucide-react';

const ICONS = {
  handshake: Handshake,
  sprout: Sprout,
  lightbulb: Lightbulb,
  shield: ShieldCheck,
  briefcase: Briefcase,
  tractor: Tractor,
} as const;

const AboutPage: React.FC = () => {
  const teamMembers = [
    {
      name: 'Sarah Mitchell',
      role: 'Founder & CEO',
      bio: 'Agricultural engineer with 15+ years in farm equipment management',
      avatar: 'briefcase',
    },
    {
      name: 'James Wilson',
      role: 'CTO',
      bio: 'Technology leader specializing in agricultural innovation platforms',
      avatar: 'briefcase',
    },
    {
      name: 'Emma Thompson',
      role: 'Head of Operations',
      bio: 'Logistics expert ensuring seamless equipment rental experiences',
      avatar: 'briefcase',
    },
    {
      name: 'Michael Chen',
      role: 'Customer Success Director',
      bio: 'Dedicated to farmer success and sustainable agricultural practices',
      avatar: 'tractor',
    },
  ];

  const milestones = [
    {
      year: '2019',
      title: 'Company Founded',
      description: 'Started with a vision to make farm equipment accessible to all farmers',
    },
    {
      year: '2020',
      title: 'Platform Launch',
      description: 'Launched the first version of Farm Gear rental platform',
    },
    {
      year: '2021',
      title: 'NZ Expansion',
      description: "Expanded operations across New Zealand's agricultural regions",
    },
    {
      year: '2022',
      title: '1,000+ Equipment',
      description: 'Reached milestone of 1,000+ equipment listings on platform',
    },
    {
      year: '2023',
      title: 'Carbon Neutral',
      description: 'Achieved carbon neutral operations through sustainable practices',
    },
    {
      year: '2024',
      title: 'AI Integration',
      description: 'Integrated AI-powered matching for optimal equipment recommendations',
    },
  ];

  const values = [
    {
      title: 'Accessibility',
      description: 'Making modern farm equipment accessible to farmers of all sizes',
      icon: 'handshake',
    },
    {
      title: 'Sustainability',
      description: 'Promoting efficient equipment utilization for environmental benefits',
      icon: 'sprout',
    },
    {
      title: 'Innovation',
      description: 'Leveraging technology to revolutionize agricultural equipment sharing',
      icon: 'lightbulb',
    },
    {
      title: 'Community',
      description: 'Building strong connections within the farming community',
      icon: 'sprout',
    },
    {
      title: 'Trust',
      description: 'Ensuring secure, reliable transactions for all platform users',
      icon: 'shield',
    },
    {
      title: 'Growth',
      description: 'Supporting agricultural growth through smart equipment sharing',
      icon: 'sprout',
    },
  ];

  const stats = [
    {
      number: '2,400+',
      label: 'Active Users',
      description: 'Farmers and equipment owners',
    },
    {
      number: '1,800+',
      label: 'Equipment Listed',
      description: 'Available for rental',
    },
    {
      number: '15,000+',
      label: 'Successful Rentals',
      description: 'Completed transactions',
    },
    {
      number: 'NZ$3.2M+',
      label: 'Revenue Generated',
      description: 'For equipment owners',
    },
    {
      number: '98%',
      label: 'Customer Satisfaction',
      description: 'Based on user feedback',
    },
    {
      number: '35%',
      label: 'Equipment Utilization',
      description: 'Increase through sharing',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">About Farm Gear</h1>
          <p className="text-2xl text-gray-600 mb-8 max-w-4xl mx-auto">
            Revolutionizing agriculture through smart equipment sharing, connecting farmers with the
            tools they need for sustainable and profitable farming.
          </p>
          <div className="bg-primary-600 text-white p-8 rounded-lg max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
            <p className="text-lg leading-relaxed">
              To democratize access to modern agricultural equipment, reduce farming costs, and
              promote sustainable agriculture through innovative technology and community-driven
              sharing.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Our Impact</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="p-6 text-center">
                <div className="text-4xl font-bold text-primary-600 mb-2">{stat.number}</div>
                <div className="text-lg font-semibold text-gray-900 mb-1">{stat.label}</div>
                <div className="text-gray-600 text-sm">{stat.description}</div>
              </Card>
            ))}
          </div>
        </section>

        {/* Story Section */}
        <section className="mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  Farm Gear was born from a simple observation: expensive agricultural equipment
                  often sits idle for months, while neighboring farmers struggle to access the tools
                  they need for optimal crop production.
                </p>
                <p>
                  Founded in 2019 by agricultural engineer Sarah Mitchell, Farm Gear began as a
                  small initiative to help farmers in Canterbury Plains share equipment during peak
                  seasons. What started as a community notice board has evolved into New Zealand's
                  leading agricultural equipment sharing platform.
                </p>
                <p>
                  Today, we're proud to serve over 2,400 active users across New Zealand,
                  facilitating more than 15,000 successful equipment rentals and generating over
                  NZ$3.2 million in additional income for equipment owners.
                </p>
                <p>
                  Our platform doesn't just save money – it reduces the environmental impact of
                  agriculture by maximizing equipment utilization and minimizing the need for
                  redundant purchases.
                </p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-100 to-green-200 p-8 rounded-lg">
              <h3 className="text-2xl font-bold text-green-800 mb-4">Why It Matters</h3>
              <ul className="space-y-3 text-green-700">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2 mt-1">•</span>
                  <span>Reduces farming costs by up to 40% through equipment sharing</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2 mt-1">•</span>
                  <span>Increases equipment utilization from 15% to 50% annually</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2 mt-1">•</span>
                  <span>Supports small and medium farms with access to modern technology</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2 mt-1">•</span>
                  <span>Promotes sustainable agriculture through resource optimization</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow">
                <div className="mb-4 text-primary-600">
                  {(() => {
                    const Ico = ICONS[value.icon as keyof typeof ICONS];
                    return Ico ? <Ico className="w-8 h-8" /> : null;
                  })()}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Timeline Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Our Journey</h2>
          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-px h-full w-0.5 bg-primary-200"></div>
            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <div
                  key={index}
                  className={`relative flex items-center ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`w-5/12 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8 text-left'}`}
                  >
                    <Card className="p-4">
                      <div className="text-primary-600 font-bold text-lg mb-2">
                        {milestone.year}
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">{milestone.title}</h3>
                      <p className="text-gray-600 text-sm">{milestone.description}</p>
                    </Card>
                  </div>
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-primary-600 rounded-full border-4 border-white"></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Meet Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <Card key={index} className="p-6 text-center">
                <div className="mb-4 text-primary-600">
                  {(() => {
                    const Ico = ICONS[member.avatar as keyof typeof ICONS];
                    return Ico ? <Ico className="w-12 h-12" /> : null;
                  })()}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{member.name}</h3>
                <div className="text-primary-600 font-medium mb-3">{member.role}</div>
                <p className="text-gray-600 text-sm">{member.bio}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Vision Section */}
        <section className="mb-16">
          <Card className="p-8 bg-gradient-to-r from-primary-600 to-green-600 text-white">
            <div className="text-center max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-6">Our Vision for 2030</h2>
              <p className="text-xl leading-relaxed mb-8">
                To be the global leader in agricultural equipment sharing, powering sustainable
                farming communities worldwide through innovative technology, while contributing to
                food security and environmental conservation.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold mb-2">50,000+</div>
                  <div>Active Farmers</div>
                </div>
                <div>
                  <div className="text-3xl font-bold mb-2">15 Countries</div>
                  <div>Platform Presence</div>
                </div>
                <div>
                  <div className="text-3xl font-bold mb-2">Carbon Negative</div>
                  <div>Operations Goal</div>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Call to Action */}
        <section className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Join Our Community</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Whether you're a farmer looking for equipment or an owner wanting to share, join
            thousands who are already part of the Farm Gear community.
          </p>
          <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
            <Link to="/equipment">
              <Button className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 text-lg font-semibold w-full sm:w-auto inline-flex items-center gap-2">
                <Tractor className="w-5 h-5" />
                Browse Equipment
              </Button>
            </Link>
            <Link to="/equipment/create">
              <Button className="bg-white text-primary-600 hover:bg-primary-50 px-8 py-3 text-lg font-semibold w-full sm:w-auto inline-flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                List Your Equipment
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;
