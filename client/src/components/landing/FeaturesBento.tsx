import { Video, BookOpen, MessageSquare, BarChart3, UserRound } from 'lucide-react';

interface FeatureCard {
  title: string;
  description: string;
  icon: typeof Video;
  iconClass: string;
  span?: string;
}

const features: FeatureCard[] = [
  {
    title: 'Interactive Live Classes',
    description:
      'Two-way live sessions with real-time whiteboards, polls, and instant doubt solving. Every class is recorded for easy revision.',
    icon: Video,
    iconClass: 'bg-blue-500/10 text-blue-500',
    span: 'md:col-span-2',
  },
  {
    title: 'Structured Study Material',
    description: 'Curated notes, solved examples, and practice sets organized by topic and exam.',
    icon: BookOpen,
    iconClass: 'bg-yellow-500/10 text-yellow-500',
  },
  {
    title: 'Real-time Doubt Resolution',
    description: 'Post a doubt from any chapter and get a detailed, step-by-step answer from your mentors.',
    icon: MessageSquare,
    iconClass: 'bg-blue-500/10 text-blue-500',
  },
  {
    title: 'Performance Analytics',
    description: 'Track attendance, test scores, and topic-wise mastery as you progress through the syllabus.',
    icon: BarChart3,
    iconClass: 'bg-yellow-500/10 text-yellow-500',
  },
  {
    title: 'Personalized Mentorship',
    description: 'Small batches and individual attention from experienced faculty who know your strengths.',
    icon: UserRound,
    iconClass: 'bg-blue-500/10 text-blue-500',
  },
];

export default function FeaturesBento() {
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-100">Everything You Need to Succeed</h2>
          <p className="mt-4 text-lg text-slate-400">One platform for live learning, resources, and support</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className={`bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 hover:-translate-y-1 hover:border-slate-700 transition-all ${feature.span ?? ''}`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${feature.iconClass}`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
