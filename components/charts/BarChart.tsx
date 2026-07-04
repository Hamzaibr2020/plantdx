"use client";

import { useEffect, useRef, useState } from "react";

export interface BarDatum {
  label: string;
  value: number;
  color?: string;
}

export default function BarChart({
  data,
  height = 180,
  formatValue,
}: {
  data: BarDatum[];
  height?: number;
  formatValue?: (v: number) => string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);
  const [width, setWidth] = useState(320);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => setWidth(entries[0].contentRect.width));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    if (data.length === 0) return;

    const max = Math.max(...data.map((d) => d.value), 1);
    const padding = { top: 10, bottom: 24, left: 8, right: 8 };
    const chartHeight = height - padding.top - padding.bottom;
    const barGap = 10;
    const barWidth = (width - padding.left - padding.right - barGap * (data.length - 1)) / data.length;

    data.forEach((d, i) => {
      const barHeight = (d.value / max) * chartHeight;
      const x = padding.left + i * (barWidth + barGap);
      const y = padding.top + chartHeight - barHeight;

      const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
      const baseColor = d.color ?? "#22c55e";
      gradient.addColorStop(0, baseColor);
      gradient.addColorStop(1, baseColor + "88");

      ctx.fillStyle = gradient;
      const r = Math.min(6, barWidth / 2);
      roundRect(ctx, x, y, barWidth, Math.max(barHeight, 2), r);
      ctx.fill();

      ctx.fillStyle = "#8a9a91";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(d.label, x + barWidth / 2, height - 8, barWidth + 8);
    });
  }, [data, width, height]);

  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function handleMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const padding = { left: 8, right: 8 };
    const barGap = 10;
    const barWidth = (width - padding.left - padding.right - barGap * (data.length - 1)) / data.length;
    const idx = Math.floor((x - padding.left) / (barWidth + barGap));
    if (idx >= 0 && idx < data.length) {
      const d = data[idx];
      setTooltip({ x, y: e.clientY - rect.top, text: `${d.label}: ${formatValue ? formatValue(d.value) : d.value}` });
    } else {
      setTooltip(null);
    }
  }

  if (data.length === 0) {
    return <div className="text-sm text-foreground/40 text-center py-8">Henüz veri yok</div>;
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <canvas
        ref={canvasRef}
        onMouseMove={handleMove}
        onMouseLeave={() => setTooltip(null)}
        className="w-full"
      />
      {tooltip && (
        <div
          className="absolute pointer-events-none text-[11px] bg-black text-white px-2 py-1 rounded-md -translate-x-1/2 -translate-y-full"
          style={{ left: tooltip.x, top: tooltip.y - 6 }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
