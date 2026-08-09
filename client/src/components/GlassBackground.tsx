export default function GlassBackground() {
  return (
    <div aria-hidden="true" className="fixed inset-0 -z-10 overflow-hidden bg-slate-950">
      <div className="absolute -top-24 -left-24 h-[28rem] w-[28rem] rounded-full bg-blue-600/30 blur-[100px] animate-blob" />
      <div className="absolute top-1/3 -right-24 h-[24rem] w-[24rem] rounded-full bg-yellow-500/20 blur-[100px] animate-blob" style={{ animationDelay: '-2.5s' }} />
      <div className="absolute bottom-0 left-1/3 h-[20rem] w-[20rem] rounded-full bg-blue-500/20 blur-[100px] animate-blob" style={{ animationDelay: '-5s' }} />
    </div>
  );
}
