import { useEffect, useRef } from 'react';
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip } from 'chart.js';
import { fmt } from '../lib/convert';
Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip);
export default function BarChart({ labels, values, theme }: { labels: string[]; values: number[]; theme: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const css = getComputedStyle(document.documentElement), v = (n: string) => css.getPropertyValue(n).trim();
    const ch = new Chart(ref.current!, {
      type: 'bar',
      data: { labels, datasets: [{ data: values, backgroundColor: v('--gold'), hoverBackgroundColor: v('--saffron'), borderRadius: 4 }] },
      options: {
        responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => `${fmt(c.parsed.y ?? 0)} Naam` } } },
        scales: { x: { ticks: { color: v('--text'), autoSkip: true, maxRotation: 60 }, grid: { display: false } }, y: { beginAtZero: true, ticks: { color: v('--text'), precision: 0 }, grid: { color: v('--line') } } },
      },
    });
    return () => ch.destroy();
  }, [labels, values, theme]);
  return <div className="chart"><canvas ref={ref} role="img" aria-label="Bar chart of daily Naam totals" /></div>;
}
