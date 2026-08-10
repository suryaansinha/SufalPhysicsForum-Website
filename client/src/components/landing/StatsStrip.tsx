interface Stat {
  value: string;
  label: string;
}

const stats: Stat[] = [
  { value: '10+', label: 'Years Experience' },
  { value: '500+', label: 'Students Mentored' },
  { value: '50+', label: 'JEE/NEET Selections' },
];

export default function StatsStrip() {
  return (
    <section className="bg-slate-900 border-y border-slate-800 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-10 sm:flex-row sm:justify-between">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center sm:text-left">
              <p className="text-4xl font-bold text-yellow-500">{stat.value}</p>
              <p className="mt-2 text-sm text-slate-400 uppercase tracking-widest">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
