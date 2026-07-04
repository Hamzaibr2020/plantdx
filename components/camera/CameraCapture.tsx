"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Zap, ZapOff, Grid3x3, ImageIcon, RotateCw, ZoomIn } from "lucide-react";

interface Props {
  onCapture: (dataUrl: string, imageEl: HTMLImageElement) => void;
}

export default function CameraCapture({ onCapture }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [zoomRange, setZoomRange] = useState<{ min: number; max: number } | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(null);

  const startCamera = useCallback(async () => {
    setError(null);
    setReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      const track = stream.getVideoTracks()[0];
      trackRef.current = track;

      const capabilities = track.getCapabilities?.() as any;
      if (capabilities?.torch) setTorchSupported(true);
      if (capabilities?.zoom) {
        setZoomRange({ min: capabilities.zoom.min, max: capabilities.zoom.max });
        setZoom(capabilities.zoom.min);
      }
      setReady(true);
    } catch (err) {
      setError(
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Kamera izni reddedildi. Tarayıcı ayarlarından PlantDX'e kamera erişimi ver."
          : "Kamera açılamadı: " + (err instanceof Error ? err.message : String(err))
      );
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    return () => {
      trackRef.current?.stop();
    };
  }, [startCamera]);

  async function toggleTorch() {
    if (!trackRef.current || !torchSupported) return;
    try {
      await trackRef.current.applyConstraints({ advanced: [{ torch: !torchOn } as any] });
      setTorchOn(!torchOn);
    } catch {
      setError("Flaş kontrolü bu cihazda desteklenmiyor.");
    }
  }

  async function handleZoomChange(value: number) {
    setZoom(value);
    if (!trackRef.current) return;
    try {
      await trackRef.current.applyConstraints({ advanced: [{ zoom: value } as any] });
    } catch {
      // sessiz geç - bazı tarayıcılar zoom constraint'i reddeder
    }
  }

  function handleTapToFocus(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setFocusPoint({ x, y });
    setTimeout(() => setFocusPoint(null), 800);

    if (trackRef.current) {
      const capabilities = trackRef.current.getCapabilities?.() as any;
      if (capabilities?.focusMode?.includes("single-shot")) {
        trackRef.current
          .applyConstraints({
            advanced: [{ focusMode: "single-shot", pointsOfInterest: [{ x: x / rect.width, y: y / rect.height }] } as any],
          })
          .catch(() => {});
      }
    }
  }

  function capture() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    const img = new Image();
    img.onload = () => onCapture(dataUrl, img);
    img.src = dataUrl;
  }

  function handleGallerySelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => onCapture(dataUrl, img);
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }

  if (error) {
    return (
      <div className="aspect-[3/4] rounded-2xl bg-black/5 dark:bg-white/5 flex flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm text-danger-500">{error}</p>
        <button onClick={startCamera} className="text-xs px-3 py-1.5 rounded-full bg-brand-green-600 text-white">
          Tekrar dene
        </button>
        <label className="text-xs px-3 py-1.5 rounded-full border border-black/10 dark:border-white/20 cursor-pointer">
          Galeriden seç
          <input type="file" accept="image/*" className="hidden" onChange={handleGallerySelect} />
        </label>
      </div>
    );
  }

  return (
    <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-black" onClick={handleTapToFocus}>
      <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />

      {!ready && <div className="absolute inset-0 shimmer" />}

      {/* Yaprak odaklama çerçevesi + tarama animasyonu */}
      {ready && (
        <div className="absolute inset-8 border-2 border-brand-green-400/70 rounded-2xl pointer-events-none overflow-hidden">
          <div className="absolute inset-x-0 h-1 bg-brand-green-400/80 scan-animation" />
        </div>
      )}

      {/* 3x3 ızgara */}
      {showGrid && ready && (
        <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="border border-white/20" />
          ))}
        </div>
      )}

      {focusPoint && (
        <div
          className="absolute w-16 h-16 border-2 border-brand-amber-400 rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2 animate-ping"
          style={{ left: focusPoint.x, top: focusPoint.y }}
        />
      )}

      {/* Üst kontroller */}
      <div className="absolute top-3 inset-x-3 flex items-center justify-between">
        <button
          onClick={(e) => { e.stopPropagation(); toggleTorch(); }}
          disabled={!torchSupported}
          className="w-9 h-9 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white disabled:opacity-30"
        >
          {torchOn ? <Zap size={16} /> : <ZapOff size={16} />}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setShowGrid(!showGrid); }}
          className={`w-9 h-9 rounded-full backdrop-blur flex items-center justify-center text-white ${showGrid ? "bg-brand-green-600" : "bg-black/40"}`}
        >
          <Grid3x3 size={16} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setFacingMode(facingMode === "environment" ? "user" : "environment"); }}
          className="w-9 h-9 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white"
        >
          <RotateCw size={16} />
        </button>
      </div>

      {/* Zoom kontrolü */}
      {zoomRange && (
        <div className="absolute bottom-24 inset-x-8 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <ZoomIn size={14} className="text-white" />
          <input
            type="range"
            min={zoomRange.min}
            max={zoomRange.max}
            step={0.1}
            value={zoom}
            onChange={(e) => handleZoomChange(Number(e.target.value))}
            className="flex-1 accent-brand-green-500"
          />
        </div>
      )}

      {/* Alt kontroller */}
      <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-8" onClick={(e) => e.stopPropagation()}>
        <label className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-white cursor-pointer">
          <ImageIcon size={18} />
          <input type="file" accept="image/*" className="hidden" onChange={handleGallerySelect} />
        </label>
        <button
          onClick={capture}
          disabled={!ready}
          className="w-16 h-16 rounded-full bg-white border-4 border-white/40 active:scale-90 transition disabled:opacity-40"
        />
        <div className="w-10 h-10" />
      </div>
    </div>
  );
}
