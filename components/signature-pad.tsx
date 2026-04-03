"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { RotateCcw } from "lucide-react";

interface SignaturePadProps {
  onSignatureChange: (dataUrl: string | null) => void;
  width?: number;
  height?: number;
}

export default function SignaturePad({ onSignatureChange, width = 400, height = 160 }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [canvasWidth, setCanvasWidth] = useState(width);

  // Responsive: fit canvas to container width
  useEffect(() => {
    function resize() {
      if (containerRef.current) {
        const w = containerRef.current.offsetWidth;
        setCanvasWidth(Math.min(w, width));
      }
    }
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [width]);

  // Re-init canvas context when size changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [canvasWidth]);

  function getPos(e: React.TouchEvent | React.MouseEvent): { x: number; y: number } {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function startDraw(e: React.TouchEvent | React.MouseEvent) {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
  }

  function draw(e: React.TouchEvent | React.MouseEvent) {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  const endDraw = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setHasSignature(true);
    const canvas = canvasRef.current;
    if (canvas) {
      onSignatureChange(canvas.toDataURL("image/png"));
    }
  }, [isDrawing, onSignatureChange]);

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onSignatureChange(null);
  }

  return (
    <div ref={containerRef} className="w-full">
      <div className="relative rounded-xl border-2 border-dashed border-slate-300 bg-white overflow-hidden">
        <canvas
          ref={canvasRef}
          width={canvasWidth * 2}
          height={height * 2}
          style={{ width: canvasWidth, height, touchAction: "none" }}
          className="cursor-crosshair"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />

        {/* Signature line */}
        <div className="absolute bottom-8 left-6 right-6 border-b border-slate-200" />
        <p className="absolute bottom-2 left-6 text-[10px] text-slate-300">Sign above</p>

        {/* Clear button */}
        {hasSignature && (
          <button
            onClick={clear}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
            title="Clear signature"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          </button>
        )}
      </div>
    </div>
  );
}
