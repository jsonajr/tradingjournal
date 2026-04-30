"use client";
import { useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend);

export function EquityChart({ series }: { series: { x: string; y: number }[] }) {
  const ref = useRef<ChartJS<"line"> | null>(null);
  const last = series.length ? series[series.length - 1].y : 0;
  const color = last >= 0 ? "#22c55e" : "#ef4444";

  const data = {
    labels: series.map((p) => p.x),
    datasets: [
      {
        label: "Equity",
        data: series.map((p) => p.y),
        borderColor: color,
        backgroundColor: color + "22",
        borderWidth: 2,
        pointRadius: 2,
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: "#5a6480", font: { size: 10 } }, grid: { color: "rgba(255,255,255,0.04)" } },
      y: {
        ticks: {
          color: "#5a6480",
          font: { size: 10 },
          callback: (v: number | string) => "$" + Number(v).toFixed(0),
        },
        grid: { color: "rgba(255,255,255,0.04)" },
      },
    },
  };

  useEffect(() => () => { ref.current?.destroy(); }, []);

  return <Line ref={ref} data={data} options={options as never} />;
}