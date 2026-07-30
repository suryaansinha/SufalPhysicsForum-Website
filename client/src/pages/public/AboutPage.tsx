import { useEffect, useState } from 'react';
import { Star, Quote } from 'lucide-react';
import type { InstitutePublic, Testimonial } from '../../types';
import { fetchInstitutePublicProfile } from '../../lib/api';

const INSTITUTE_SLUG = 'sufal-physics-forum';

export default function AboutPage() {
  const [institute, setInstitute] = useState<InstitutePublic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInstitutePublicProfile(INSTITUTE_SLUG)
      .then((data) => {
        setInstitute(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Failed to fetch institute data:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">About {institute?.name}</h1>
            <div className="prose prose-lg mx-auto">
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                {institute?.aboutDescription || 'Dedicated to excellence in physics education.'}
              </p>
            </div>
          </div>

          {institute?.experienceText && (
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 lg:p-12 text-white">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold mb-4">Our Experience</h2>
                <p className="text-indigo-100 leading-relaxed whitespace-pre-wrap">
                  {institute.experienceText}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {institute?.testimonials && institute.testimonials.length > 0 && (
        <section className="bg-gray-50 py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900">Student Success Stories</h2>
              <p className="mt-4 text-lg text-gray-600">Hear from our accomplished students</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {institute.testimonials.map((testimonial) => (
                <TestimonialCard key={testimonial.id} testimonial={testimonial} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

interface TestimonialCardProps {
  testimonial: Testimonial;
}

function TestimonialCard({ testimonial }: TestimonialCardProps) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      <Quote className="w-8 h-8 text-indigo-200 mb-4" />
      <p className="text-gray-700 mb-6 line-clamp-4">{testimonial.content}</p>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-gray-900">{testimonial.studentName}</p>
          {testimonial.examCleared && (
            <p className="text-sm text-gray-500">{testimonial.examCleared}</p>
          )}
        </div>
        <div className="flex items-center">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
