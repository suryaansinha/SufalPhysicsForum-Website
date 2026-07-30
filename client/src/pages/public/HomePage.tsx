import { Link } from 'react-router-dom';
import { BookOpen, Award, Users, PlayCircle, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="bg-white">
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Master Physics with{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                  Expert Guidance
                </span>
              </h1>
              <p className="mt-6 text-lg text-gray-600 leading-relaxed">
                Join India&apos;s most trusted physics learning platform. Live classes, structured study materials,
                and personalized attention to help you excel in JEE, NEET, and board exams.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  to="/about"
                  className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20"
                >
                  Learn More
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors"
                >
                  Student Login
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100 p-8">
  <img 
  src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1200&auto=format&fit=crop" 
  alt="Students learning physics" 
  className="w-full h-full object-cover rounded-3xl shadow-xl" 
/>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Why Choose Sufal Physics Forum?</h2>
            <p className="mt-4 text-lg text-gray-600">Everything you need to ace your physics exams</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                <PlayCircle className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Live Classes</h3>
              <p className="text-gray-600">Interactive online sessions with real-time doubt solving</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Study Materials</h3>
              <p className="text-gray-600">Comprehensive notes, videos, and practice resources</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <Award className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Proven Results</h3>
              <p className="text-gray-600">Track record of students clearing JEE, NEET, and boards</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Expert Faculty</h3>
              <p className="text-gray-600">Learn from experienced educators dedicated to your success</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Ready to Start Your Journey?</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Join hundreds of successful students who have transformed their physics learning experience with us.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center px-8 py-4 text-base font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20"
          >
            Get Started Now
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </section>
    </div>
  );
}
