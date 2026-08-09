import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';
import type { InstitutePublic } from '../types';
import { fetchInstitutePublicProfile } from '../lib/api';

interface PublicLayoutProps {
  children: React.ReactNode;
}

const INSTITUTE_SLUG = 'sufal-physics-forum';

export default function PublicLayout({ children }: PublicLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [institute, setInstitute] = useState<InstitutePublic | null>(null);
  const location = useLocation();

  useEffect(() => {
    fetchInstitutePublicProfile(INSTITUTE_SLUG)
      .then(setInstitute)
      .catch(console.error);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center space-x-2">
              {institute?.logoUrl ? (
                <img src={institute.logoUrl} alt={institute.name} className="h-10 w-auto" />
              ) : (
                <div className="flex items-center gap-2">
                  {/* The New Professional Branding */}
                  <img
                    src="/logo.PNG"
                    alt="SufalPhysicsForum Logo"
                    className="h-12 w-auto object-contain"
                  />
                  {/* Optional: Keep the text if the logo is just an icon, or remove this span if the logo includes the text */}
                  <span className="text-xl font-bold text-gray-900">SufalPhysicsForum</span>
                </div>
              )}
            </Link>

            <div className="hidden md:flex items-center space-x-8">
              <Link
                to="/"
                className={`text-sm font-medium transition-colors ${isActive('/') ? 'text-indigo-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Home
              </Link>
              <Link
                to="/about"
                className={`text-sm font-medium transition-colors ${isActive('/about') ? 'text-indigo-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                About
              </Link>
              <Link
                to="/blog"
                className={`text-sm font-medium transition-colors ${isActive('/blog') ? 'text-indigo-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Blog
              </Link>
              <a
                href={institute?.youtubeUrl || 'https://www.youtube.com/@SufalPhysicsForum'}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visit our YouTube Channel"
                className="text-gray-500 hover:text-red-600 transition-colors duration-200"
              >
                <YoutubeIcon className="w-5 h-5" />
              </a>
              <Link
                to="/login"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Login
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </nav>

        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white">
            <div className="px-4 py-4 space-y-3">
              <Link
                to="/"
                onClick={() => setIsMenuOpen(false)}
                className={`block text-sm font-medium ${isActive('/') ? 'text-indigo-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Home
              </Link>
              <Link
                to="/about"
                onClick={() => setIsMenuOpen(false)}
                className={`block text-sm font-medium ${isActive('/about') ? 'text-indigo-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                About
              </Link>
              <Link
                to="/blog"
                onClick={() => setIsMenuOpen(false)}
                className={`block text-sm font-medium ${isActive('/blog') ? 'text-indigo-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Blog
              </Link>
              <a
                href={institute?.youtubeUrl || 'https://www.youtube.com/@SufalPhysicsForum'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-red-600 transition-colors"
              >
                <YoutubeIcon className="w-4 h-4" />
                YouTube
              </a>
              <Link
                to="/login"
                onClick={() => setIsMenuOpen(false)}
                className="block text-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
              >
                Login
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{institute?.name || 'Sufal Physics Forum'}</h3>
              <p className="text-sm text-gray-600 mb-4">
                {institute?.aboutDescription?.slice(0, 150) || 'Excellence in Physics Education'}
                {institute?.aboutDescription && institute.aboutDescription.length > 150 ? '...' : ''}
              </p>
              {institute?.youtubeUrl && (
                <a
                  href={institute.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Watch on YouTube →
                </a>
              )}
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="text-sm text-gray-600 hover:text-gray-900">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900">
                    Login
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Contact</h4>
              <ul className="space-y-2">
                {institute?.email && (
                  <li>
                    <a href={`mailto:${institute.email}`} className="text-sm text-gray-600 hover:text-gray-900">
                      {institute.email}
                    </a>
                  </li>
                )}
                {institute?.phone && (
                  <li>
                    <a href={`tel:${institute.phone}`} className="text-sm text-gray-600 hover:text-gray-900">
                      {institute.phone}
                    </a>
                  </li>
                )}
                {institute?.whatsappNumber && (
                  <li>
                    <a
                      href={`https://wa.me/${institute.whatsappNumber.replace(/^[\+\-]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-green-600 hover:text-green-700 font-medium"
                    >
                      Chat on WhatsApp →
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              © {new Date().getFullYear()} {institute?.name || 'SufalPhysicsForum'}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <path d="m10 15 5-3-5-3z" />
    </svg>
  );
}
