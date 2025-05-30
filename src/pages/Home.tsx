
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Download, Users, Zap, Settings, Bookmark } from 'lucide-react';

export default function Home() {
  const features = [
    {
      icon: <Settings className="h-8 w-8 text-blue-600" />,
      title: "CAD Resources",
      description: "Access high-quality CAD drawings, 3D models, and technical diagrams for mechanical engineering projects."
    },
    {
      icon: <BookOpen className="h-8 w-8 text-green-600" />,
      title: "Study Materials",
      description: "Comprehensive notes, formulas, and reference materials for thermodynamics, mechanics, and more."
    },
    {
      icon: <Download className="h-8 w-8 text-purple-600" />,
      title: "Easy Downloads",
      description: "Download materials instantly with organized categories and search functionality."
    },
    {
      icon: <Bookmark className="h-8 w-8 text-orange-600" />,
      title: "Bookmark System",
      description: "Save your favorite resources and create personal collections for quick access."
    }
  ];

  const subjects = [
    { name: "Engineering Drawing", count: "150+ Files", color: "bg-blue-500" },
    { name: "Thermodynamics", count: "120+ Files", color: "bg-red-500" },
    { name: "Mechanics", count: "200+ Files", color: "bg-green-500" },
    { name: "Materials Science", count: "80+ Files", color: "bg-purple-500" },
    { name: "Mathematics", count: "100+ Files", color: "bg-orange-500" },
    { name: "CAD Models", count: "300+ Files", color: "bg-cyan-500" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <Badge variant="secondary" className="px-4 py-2 text-lg font-medium bg-blue-100 text-blue-800">
              For Mechanical Engineering Students
            </Badge>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Your Ultimate
            <span className="text-blue-600 block">Engineering Resource Hub</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Access thousands of CAD drawings, technical diagrams, study materials, and engineering resources. 
            Everything you need for your mechanical engineering journey in one place.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="px-8 py-3 text-lg bg-blue-600 hover:bg-blue-700">
                Start Exploring
              </Button>
            </Link>
            <Link to="/gallery">
              <Button size="lg" variant="outline" className="px-8 py-3 text-lg border-blue-600 text-blue-600 hover:bg-blue-50">
                Browse Gallery
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need to Excel
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our platform is designed specifically for mechanical engineering students with industry-standard resources.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300 border-0 shadow-md">
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Subjects Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Explore by Subject
            </h2>
            <p className="text-lg text-gray-600">
              Find resources organized by engineering disciplines and topics.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((subject, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-lg ${subject.color} flex items-center justify-center`}>
                      <BookOpen className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{subject.name}</h3>
                      <p className="text-sm text-gray-600">{subject.count}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-blue-600">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="text-white">
              <div className="text-4xl font-bold mb-2">1000+</div>
              <div className="text-xl text-blue-100">CAD Files & Resources</div>
            </div>
            <div className="text-white">
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-xl text-blue-100">Active Students</div>
            </div>
            <div className="text-white">
              <div className="text-4xl font-bold mb-2">50+</div>
              <div className="text-xl text-blue-100">Engineering Topics</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Accelerate Your Learning?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Join thousands of mechanical engineering students who are already using our platform to excel in their studies.
          </p>
          <Link to="/auth">
            <Button size="lg" className="px-8 py-3 text-lg bg-blue-600 hover:bg-blue-700">
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
