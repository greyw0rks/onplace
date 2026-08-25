"use client";

import { useEffect, useRef } from "react";

const COLORS: Record<string, string> = {
  cyan: "#3ef2ff",
  green: "#42f099",
  magenta: "#ff3ea5",
  red: "#ff4d4d",
  gray: "#4d4e58",
};

export function AgentScopeCanvas({
  agentId,
  healthy,
  sourceType,
}: {
  agentId: string;
  healthy: boolean;
  sourceType: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    // Determine wave characteristics based on agent state
    const isLive = sourceType === "self_built";
    const color = !healthy ? COLORS.red : isLive ? COLORS.cyan : COLORS.green;
    const amplitude = healthy ? 20 : 10;
    const frequency = isLive ? 0.03 : 0.02;
    const speed = isLive ? 2 : 1;
    const opacity = healthy ? 0.9 : 0.5;

    let t = Math.random() * 1000;
    let animationId: number;

    function draw() {
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, w, h);

      // Draw waveform
      ctx.beginPath();
      for (let x = 0; x <= w; x += 3) {
        const noise = !healthy ? (Math.random() - 0.5) * h * 0.15 : 0;
        const y =
          h / 2 +
          Math.sin(x * frequency + t * 0.06 * speed) *
            amplitude *
            (0.6 + 0.4 * Math.sin(t * 0.01 + x * 0.01)) +
          noise;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.shadowColor = color;
      ctx.shadowBlur = 6;
      ctx.globalAlpha = opacity;
      ctx.stroke();

      t += 1;
      animationId = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [agentId, healthy, sourceType]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}
