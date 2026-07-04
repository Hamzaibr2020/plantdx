"use client";

import { useEffect, useRef, useState } from "react";

export interface LinePoint {
  label: string;
  value: number;
}

export default function LineChart({
  data,
  height = 160,
  color = "#22c55e",
  formatValue,
}: {
  data: LinePoint[];
  height?: number;
  color?: string;
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
    const values = data.map((d) => d.value);
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const points = data.map((d, i) => ({
      x: padding.left + (i / Math.max(1, data.length - 1)) * chartW,
      y: padding.top + chartH - ((d.value - min) / range) * chartH,
    }));

    // Alan gradyanı
    const grad = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    grad.addColorStop(0, color + "40");
    grad.addColorStop(1, color + "05");
    ctx.beginPath();
    ctx.moveTo(points[0].x, height - padding.bottom);
    points.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, height - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Çizgi
    ctx.beginPath();
    points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    ctx.stroke();

    // Noktalar
    points.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    });

    // X ekseni etiketleri (seyrek)
    ctx.fillStyle = "#8a9a91";
    ctx.font = "9px sans-serif";
    ctx.textAlign = "center";
    const step = Math.ceil(data.length / 6);
    data.forEach((d, i) => {
      if (i % step === 0) ctx.fillText(d.label, points[i].x, height - 6);
    });
  }, [data, width, height, color]);

  function handleMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (data.length === 0) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const padding = { left: 10, right: 10 };
    const chartW = width - padding.left - padding.right;
    const idx = Math.round(((x - padding.left) / chartW) * (data.length - 1));
    if (idx >= 0 && idx < data.length) {
      const d = data[idx];
      setTooltip({ x, y: e.clientY - rect.top, text: `${d.label}: ${formatValue ? formatValue(d.value) : d.value}` });
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
          className="absolute pointer-events-none text-[11px] bg-black text-white px-2 py-1 rounded-md -translate-x-1/2 -translate-y-full"
          style={{ left: tooltip.x, top: tooltip.y - 6 }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
