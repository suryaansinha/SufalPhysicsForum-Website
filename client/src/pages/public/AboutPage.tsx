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
        <div className="animate-pulse text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-transparent">
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h1 className="text-4xl font-bold text-slate-100 mb-6">About {institute?.name}</h1>
            <div className="prose prose-lg mx-auto">
              <p className="text-slate-400 leading-relaxed whitespace-pre-wrap">
                {institute?.aboutDescription || 'Dedicated to excellence in physics education.'}
              </p>
            </div>
          </div>

          {institute?.experienceText && (
            <div className="bg-gradient-to-r from-blue-600 to-yellow-500 rounded-3xl p-8 lg:p-12 text-white">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold mb-4">Our Experience</h2>
                <p className="text-blue-50 leading-relaxed whitespace-pre-wrap">
                  {institute.experienceText}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {institute?.testimonials && institute.testimonials.length > 0 && (
        <section className="bg-slate-900/20 backdrop-blur-xl border-y border-slate-700/50 py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-100">Student Success Stories</h2>
              <p className="mt-4 text-lg text-slate-400">Hear from our accomplished students</p>
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
    <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl shadow-sm hover:shadow-lg hover:shadow-yellow-500/10 transition-all duration-300 ease-in-out hover:-translate-y-1">
      <Quote className="w-8 h-8 text-yellow-400/60 mb-4" />
      <p className="text-slate-300 mb-6 line-clamp-4">{testimonial.content}</p>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-slate-100">{testimonial.studentName}</p>
          {testimonial.examCleared && (
            <p className="text-sm text-slate-500">{testimonial.examCleared}</p>
          )}
        </div>
        <div className="flex items-center">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
