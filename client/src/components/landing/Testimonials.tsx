import { Star, Quote } from 'lucide-react';

interface Testimonial {
  quote: string;
  name: string;
  achievement: string;
}

const testimonials: Testimonial[] = [
  {
    quote:
      "Sir's teaching style makes even the toughest mechanics problems feel intuitive. My JEE prep completely transformed in a single year.",
    name: 'Aarav Sharma',
    achievement: 'IIT Delhi · Rank 214',
  },
  {
    quote:
      'The live classes feel like one-on-one mentoring. Concepts that used to scare me now feel like second nature.',
    name: 'Ananya Verma',
    achievement: 'AIIMS Delhi',
  },
  {
    quote:
      'Clear explanations, structured material, and genuine care for every student. Easily the best physics coaching I have found.',
    name: 'Rohan Mehta',
    achievement: 'NIT Trichy · Rank 87',
  },
];

export default function Testimonials() {
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-100">What Our Students Say</h2>
          <p className="mt-4 text-lg text-slate-400">Real results from real students</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <figure
              key={testimonial.name}
              className="bg-slate-900 rounded-xl p-6 relative overflow-hidden border-l-4 border-yellow-500"
            >
              <Quote className="w-8 h-8 text-slate-800 absolute top-6 right-6" />
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                ))}
              </div>
              <blockquote className="text-sm text-slate-300 leading-relaxed">{testimonial.quote}</blockquote>
              <figcaption className="mt-6">
                <p className="font-semibold text-slate-100">{testimonial.name}</p>
                <p className="text-sm text-yellow-400 mt-0.5">{testimonial.achievement}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
