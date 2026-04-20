const categories = [
  {
    name: "Technical",
    topics: [
      { topic: "DSA", proficiency: 8.2, lastPracticed: "2026-04-04" },
      { topic: "DBMS", proficiency: 7.4, lastPracticed: "2026-04-03" },
      { topic: "OS", proficiency: 6.8, lastPracticed: "2026-04-02" },
      { topic: "CN", proficiency: 6.1, lastPracticed: "2026-04-01" }
    ]
  },
  {
    name: "Management",
    topics: [
      { topic: "Leadership", proficiency: 7.9, lastPracticed: "2026-03-30" },
      { topic: "Conflict Resolution", proficiency: 7.1, lastPracticed: "2026-03-29" }
    ]
  },
  {
    name: "General",
    topics: [
      { topic: "HR", proficiency: 8.5, lastPracticed: "2026-04-04" },
      { topic: "Aptitude", proficiency: 6.9, lastPracticed: "2026-04-03" }
    ]
  }
];

export default function CategoriesPage() {
  return (
    <div className="space-y-6">
      <section className="glass-card p-6">
        <h2 className="text-3xl font-semibold text-white">Category-Based Learning</h2>
        <p className="mt-3 text-slate-300">
          Jump into technical, management, or general interview tracks and continue from your last proficiency state.
        </p>
      </section>

      {categories.map((category) => (
        <section key={category.name} className="glass-card p-6">
          <h3 className="text-2xl font-semibold text-white">{category.name}</h3>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {category.topics.map((topic) => (
              <div key={topic.topic} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-lg font-medium text-white">{topic.topic}</p>
                <p className="mt-3 text-sm text-slate-400">Proficiency</p>
                <p className="mt-1 text-2xl font-semibold text-cyan-200">{topic.proficiency.toFixed(1)}/10</p>
                <p className="mt-3 text-sm text-slate-400">Last practiced: {topic.lastPracticed}</p>
                <button className="mt-5 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100">
                  Start practice
                </button>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

