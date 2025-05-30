
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Download, Filter, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Welcome to <span className="text-blue-600">Lavable</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Your comprehensive educational resource platform for mechanical engineering students. 
            Access, view, and download high-quality educational images and documents.
          </p>
          
          {user ? (
            <div className="space-x-4">
              <Link to="/gallery">
                <Button size="lg" className="px-8 py-3">
                  Browse Gallery
                </Button>
              </Link>
              <Link to="/bookmarks">
                <Button variant="outline" size="lg" className="px-8 py-3">
                  My Bookmarks
                </Button>
              </Link>
            </div>
          ) : (
            <Link to="/auth">
              <Button size="lg" className="px-8 py-3">
                Get Started
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Features for Engineering Students
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-6">
              <CardContent className="pt-6">
                <BookOpen className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-3">Comprehensive Library</h3>
                <p className="text-gray-600">
                  Access diagrams, notes, charts, formulas, and examples across all engineering subjects.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6">
              <CardContent className="pt-6">
                <Filter className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-3">Smart Filtering</h3>
                <p className="text-gray-600">
                  Filter by subject, type, semester, and tags to find exactly what you need.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6">
              <CardContent className="pt-6">
                <Download className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-3">Easy Downloads</h3>
                <p className="text-gray-600">
                  Download high-quality educational resources for offline study and reference.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Subjects Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Available Subjects
          </h2>
          
          <div className="grid md:grid-cols-4 gap-4">
            {[
              'Engineering Drawing',
              'Thermodynamics', 
              'Mechanics',
              'Materials Science',
              'Mathematics',
              'Physics',
              'Chemistry',
              'General'
            ].map((subject) => (
              <Card key={subject} className="text-center p-4 hover:shadow-lg transition-shadow">
                <CardContent className="pt-4">
                  <h3 className="font-semibold text-gray-800">{subject}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Excel in Your Studies?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of mechanical engineering students already using Lavable.
          </p>
          
          {!user && (
            <Link to="/auth">
              <Button size="lg" variant="secondary" className="px-8 py-3">
                Sign Up Now
              </Button>
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
