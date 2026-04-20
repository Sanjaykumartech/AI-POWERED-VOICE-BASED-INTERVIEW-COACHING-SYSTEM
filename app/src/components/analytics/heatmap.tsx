import type { ActivityCell } from "@ai-interview/shared";

import { useEffect, useRef } from "react";

const CELL_SIZE = 8.86;
const CELL_GAP = 2.66;
const WEEK_WIDTH = CELL_SIZE + CELL_GAP;
const MONTH_GAP = 14;
const LABEL_HEIGHT = 22;

const intensityMap = ["#dbeafe", "#93c5fd", "#60a5fa", "#2563eb"];

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const parseLocalDateString = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
};

export function ActivityHeatmap({ cells }: { cells: ActivityCell[] }) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const sortedCells = [...cells].sort((left, right) => left.date.localeCompare(right.date));
  const months = buildMonthBlocks(sortedCells);
  const today = formatLocalDate(new Date());

  let cursorX = 0;
  const monthLayouts = months.map((month, index) => {
    const x = cursorX;
    const width = month.weeks.length * WEEK_WIDTH;
    cursorX += width + (index < months.length - 1 ? MONTH_GAP : 0);
    return { ...month, x, width };
  });

  const svgWidth = Math.max(cursorX, 760);
  const svgHeight = CELL_SIZE * 7 + CELL_GAP * 6 + LABEL_HEIGHT;

  useEffect(() => {
    const node = scrollContainerRef.current;

    if (!node) {
      return;
    }

    node.scrollTo({ left: node.scrollWidth, behavior: "smooth" });
  }, []);

  return (
    <div className="glass-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Daily Activity Heatmap</h3>
          <p className="text-sm text-slate-400">A rolling 12-month practice calendar with exact month-day boundaries.</p>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-950/20 p-4">
        <div ref={scrollContainerRef} className="overflow-x-auto pb-2">
          <div className="inline-block min-w-max">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              width={svgWidth}
              height={svgHeight}
              className="overflow-visible"
            >
              {monthLayouts.map((month) => (
                <g key={month.key} transform={`translate(${month.x}, 0)`}>
                  {month.weeks.map((week, weekIndex) =>
                    week.map((cell, dayIndex) => {
                      const x = weekIndex * WEEK_WIDTH;
                      const y = dayIndex * (CELL_SIZE + CELL_GAP);

                      if (!cell) {
                        return null;
                      }

                      const tone =
                        cell.intensity <= 0
                          ? "var(--heatmap-empty-fill)"
                          : intensityMap[cell.intensity - 1] ?? intensityMap[intensityMap.length - 1];
                      const tooltip = [
                        cell.date,
                        `${cell.sessionsCount} sessions`,
                        `${cell.activeHours} active hours`,
                        `Topics: ${cell.topicsStudied.join(", ") || "No activity"}`
                      ].join(" | ");

                      return (
                        <rect
                          key={cell.date}
                          x={x}
                          y={y}
                          width={CELL_SIZE}
                          height={CELL_SIZE}
                          rx="2"
                          ry="2"
                          fill={tone}
                          stroke={cell.date === today ? "var(--heatmap-today-border)" : "var(--heatmap-cell-border)"}
                          strokeWidth={cell.date === today ? "1.3" : "0.8"}
                        >
                          <title>{tooltip}</title>
                        </rect>
                      );
                    }),
                  )}

                  <text
                    x={2}
                    y={svgHeight - 2}
                    fontSize="12"
                    fill="#94a3b8"
                  >
                    {month.label}
                  </text>
                </g>
              ))}
            </svg>

            <div className="mt-3 flex items-center gap-3 text-[11px] uppercase tracking-[0.26em] text-slate-500">
              <span>Less</span>
              <div className="flex gap-2">
                {intensityMap.map((tone, index) => (
                  <span
                    key={`${tone}-${index}`}
                    className="h-3 w-3 rounded-[4px] border"
                    style={{ backgroundColor: tone, borderColor: "var(--heatmap-cell-border)" }}
                  />
                ))}
              </div>
              <span>More</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function buildMonthBlocks(cells: ActivityCell[]) {
  const grouped = new Map<string, ActivityCell[]>();

  cells.forEach((cell) => {
    const key = cell.date.slice(0, 7);
    const existing = grouped.get(key);

    if (existing) {
      existing.push(cell);
    } else {
      grouped.set(key, [cell]);
    }
  });

  return Array.from(grouped.entries()).map(([key, monthCells]) => ({
    key,
    label: parseLocalDateString(`${key}-01`).toLocaleString("en-US", { month: "short" }),
    weeks: chunkMonthIntoWeeks(monthCells)
  }));
}

function chunkMonthIntoWeeks(cells: ActivityCell[]) {
  const sorted = [...cells].sort((left, right) => left.date.localeCompare(right.date));
  const weeks: Array<Array<ActivityCell | null>> = [];
  let currentWeek: Array<ActivityCell | null> = new Array(7).fill(null);
  let previousDay: number | null = null;

  sorted.forEach((cell) => {
    const date = parseLocalDateString(cell.date);
    const dayOfWeek = date.getDay();

    if (previousDay === null) {
      currentWeek = new Array(7).fill(null);
    } else if (dayOfWeek <= previousDay) {
      weeks.push(currentWeek);
      currentWeek = new Array(7).fill(null);
    }

    currentWeek[dayOfWeek] = cell;
    previousDay = dayOfWeek;
  });

  if (currentWeek.some((cell) => cell !== null)) {
    weeks.push(currentWeek);
  }

  return weeks;
}
