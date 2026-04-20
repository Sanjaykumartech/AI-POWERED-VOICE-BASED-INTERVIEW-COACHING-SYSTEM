export function LineTrend({
  points
}: {
  points: Array<{ date: string; score: number }>;
}) {
  const max = Math.max(...points.map((point) => point.score), 10);

  return (
    <div className="glass-card p-5">
      <h3 className="text-lg font-semibold text-white">Performance Over Time</h3>
      <div className="mt-6 flex h-56 items-end gap-3">
        {points.map((point) => (
          <div key={point.date} className="flex flex-1 flex-col items-center gap-2">
            <div className="relative flex h-44 w-full items-end">
              <div
                className="w-full rounded-t-2xl bg-gradient-to-t from-cyan-400 to-violet-500"
                style={{ height: `${(point.score / max) * 100}%` }}
              />
            </div>
            <p className="text-center text-xs text-slate-400">{point.date.slice(5)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TopicBars({
  items
}: {
  items: Array<{ topic: string; proficiency: number }>;
}) {
  return (
    <div className="glass-card p-5">
      <h3 className="text-lg font-semibold text-white">Topic-Wise Scores</h3>
      <div className="mt-5 space-y-4">
        {items.map((item) => (
          <div key={item.topic}>
            <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
              <span>{item.topic}</span>
              <span>{item.proficiency.toFixed(1)}</span>
            </div>
            <div className="h-3 rounded-full bg-white/5">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-cyan-400 to-violet-500"
                style={{ width: `${Math.min(100, item.proficiency * 10)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

