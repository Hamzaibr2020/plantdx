"use client";

import { useEffect, useRef, useState } from "react";

export interface MultiSeriesPoint {
  label: string;
  values: (number | null)[]; // her seri için bir değer
}

export interface SeriesMeta {
  name: string;
  color: string;
}

export default function MultiLineChart({
  data,
  series,
  height = 180,
  formatValue,
}: {
  data: MultiSeriesPoint[];
  series: SeriesMeta[];
  height?: number;
  formatValue?: (v: number) => string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(320);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => setWidth(entries[0].contentRect.width));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const padding = { top: 14, bottom: 22, left: 10, right: 10 };
    const allValues = data.flatMap((d) => d.values.filter((v): v is number => v !== null));
    const max = Math.max(...allValues, 1);
    const min = Math.min(...allValues, 0);
    const range = max - min || 1;
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    series.forEach((s, seriesIndex) => {
      const points = data
        .map((d, i) => ({ x: padding.left + (i / Math.max(1, data.length - 1)) * chartW, v: d.values[seriesIndex] }))
        .filter((p): p is { x: number; v: number } => p.v !== null)
        .map((p) => ({ x: p.x, y: padding.top + chartH - ((p.v - min) / range) * chartH }));

      if (points.length === 0) return;

      ctx.beginPath();
      points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = "round";
      ctx.stroke();
    });

    ctx.fillStyle = "#8a9a91";
    ctx.font = "9px sans-serif";
    ctx.textAlign = "center";
    const step = Math.ceil(data.length / 6);
    data.forEach((d, i) => {
      if (i % step === 0) {
        const x = padding.left + (i / Math.max(1, data.length - 1)) * chartW;
        ctx.fillText(d.label, x, height - 6);
      }
    });
  }, [data, series, width, height]);

  function handleMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (data.length === 0) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const padding = { left: 10, right: 10 };
    const chartW = width - padding.left - padding.right;
    const idx = Math.round(((x - padding.left) / chartW) * (data.length - 1));
    if (idx >= 0 && idx < data.length) {
      const d = data[idx];
      const text = series
        .map((s, i) => (d.values[i] !== null ? `${s.name}: ${formatValue ? formatValue(d.values[i]!) : d.values[i]}` : null))
        .filter(Boolean)
        .join(" · ");
      setTooltip({ x, y: e.clientY - rect.top, text });
    }
  }

  if (data.length === 0) {
    return <div className="text-sm text-foreground/40 text-center py-8">Henüz veri yok</div>;
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <canvas ref={canvasRef} onMouseMove={handleMove} onMouseLeave={() => setTooltip(null)} className="w-full" />
      {tooltip && (
        <div
          className="absolute pointer-events-none text-[11px] bg-black text-white px-2 py-1 rounded-md -translate-x-1/2 -translate-y-full whitespace-nowrap"
          style={{ left: tooltip.x, top: tooltip.y - 6 }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
