import { Link } from 'react-router-dom';
import { BookOpen, Award, Users, PlayCircle, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="bg-transparent">
      <section className="relative isolate overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 h-full w-full bg-[radial-gradient(#475569_1px,transparent_1px)] [background-size:24px_24px] opacity-100 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_80%,transparent_100%)] pointer-events-none"
        ></div>
        <div
          aria-hidden="true"
          className="absolute top-[-10%] left-[20%] -z-20 h-[400px] w-[500px] rounded-full bg-blue-600/30 blur-[150px] pointer-events-none"
        ></div>
        <div
          aria-hidden="true"
          className="absolute top-[10%] right-[20%] -z-20 h-[300px] w-[400px] rounded-full bg-yellow-500/20 blur-[150px] pointer-events-none"
        ></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-100 leading-tight">
                Master Physics with{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-yellow-400">
                  Expert Guidance
                </span>
              </h1>
              <p className="mt-6 text-lg text-slate-400 leading-relaxed">
                Join India&apos;s most trusted physics learning platform. Live classes, structured study materials,
                and personalized attention to help you excel in JEE, NEET, and board exams.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  to="/about"
                  className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-slate-950 bg-yellow-400 rounded-xl hover:bg-yellow-300 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg hover:shadow-yellow-500/20"
                >
                  Learn More
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-yellow-300 bg-blue-600/20 backdrop-blur-xl border border-blue-500/30 rounded-xl hover:bg-blue-600/30 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/20"
                >
                  Student Login
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-blue-500/20 to-yellow-400/10 backdrop-blur-xl border border-slate-700/50 p-8">
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

      <section className="bg-slate-900/20 backdrop-blur-xl border-y border-slate-700/50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-100">Why Choose Sufal Physics Forum?</h2>
            <p className="mt-4 text-lg text-slate-400">Everything you need to ace your physics exams</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl shadow-sm hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 ease-in-out hover:-translate-y-1">
              <div className="w-12 h-12 bg-blue-600/30 rounded-xl flex items-center justify-center mb-4">
                <PlayCircle className="w-6 h-6 text-blue-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Live Classes</h3>
              <p className="text-slate-400">Interactive online sessions with real-time doubt solving</p>
            </div>
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl shadow-sm hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 ease-in-out hover:-translate-y-1">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-yellow-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Study Materials</h3>
              <p className="text-slate-400">Comprehensive notes, videos, and practice resources</p>
            </div>
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl shadow-sm hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 ease-in-out hover:-translate-y-1">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4">
                <Award className="w-6 h-6 text-emerald-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Proven Results</h3>
              <p className="text-slate-400">Track record of students clearing JEE, NEET, and boards</p>
            </div>
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl shadow-sm hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 ease-in-out hover:-translate-y-1">
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-orange-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Expert Faculty</h3>
              <p className="text-slate-400">Learn from experienced educators dedicated to your success</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-slate-100 mb-8">Ready to Start Your Journey?</h2>
          <p className="text-lg text-slate-400 mb-8 max-w-2xl mx-auto">
            Join hundreds of successful students who have transformed their physics learning experience with us.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center px-8 py-4 text-base font-medium text-slate-950 bg-yellow-400 rounded-xl hover:bg-yellow-300 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg hover:shadow-yellow-500/20"
          >
            Get Started Now
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </section>
    </div>
  );
}
