import { BookOpenText, HelpCircle, Mail, Send, Wrench } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

const ContactPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">Contact Us</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Have questions or need assistance? We're here to help you with all your agricultural
            equipment needs.
          </p>
        </div>

        {/* Main Contact Card */}
        <div className="mb-16">
          <Card className="p-12 text-center bg-gradient-to-br from-primary-50 to-green-50 border-2 border-primary-200">
            <div className="mb-8 flex justify-center">
              <Mail className="w-16 h-16 text-primary-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Get in Touch</h2>
            <p className="text-lg text-gray-600 mb-8">
              Send us an email and we'll get back to you as soon as possible.
            </p>
            <div className="bg-white p-6 rounded-lg shadow-sm border-2 border-primary-100 mb-8">
              <div className="text-2xl font-bold text-primary-600 mb-2">hello@farmgear.co.nz</div>
              <div className="text-gray-600">We typically respond within 24 hours</div>
            </div>
            <a href="mailto:hello@farmgear.co.nz" className="inline-block">
              <Button className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 text-lg font-semibold inline-flex items-center gap-2">
                <Send className="w-5 h-5" />
                Send Email
              </Button>
            </a>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Need Quick Help?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="mb-4 flex justify-center text-primary-600">
                <HelpCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">FAQ</h3>
              <p className="text-gray-600 mb-4">
                Check our frequently asked questions for quick answers.
              </p>
              <Link to="/faq">
                <Button className="bg-white text-primary-600 hover:bg-primary-50 w-full">
                  View FAQ
                </Button>
              </Link>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="mb-4 flex justify-center text-primary-600">
                <Wrench className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Support</h3>
              <p className="text-gray-600 mb-4">Get technical support and assistance.</p>
              <Link to="/support">
                <Button className="bg-white text-primary-600 hover:bg-primary-50 w-full">
                  Get Support
                </Button>
              </Link>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="mb-4 flex justify-center text-primary-600">
                <BookOpenText className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Guides</h3>
              <p className="text-gray-600 mb-4">Learn how to use our platform effectively.</p>
              <Link to="/how-to-list">
                <Button className="bg-white text-primary-600 hover:bg-primary-50 w-full">
                  View Guides
                </Button>
              </Link>
            </Card>
          </div>
        </div>

        {/* Additional Info */}
        <div className="text-center">
          <Card className="p-8 bg-gray-100">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Farm Gear New Zealand</h3>
            <p className="text-gray-600 leading-relaxed">
              We're committed to supporting New Zealand's agricultural community through innovative
              equipment sharing solutions. Whether you're a seasoned farmer or just starting out,
              we're here to help you access the tools you need for success.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
