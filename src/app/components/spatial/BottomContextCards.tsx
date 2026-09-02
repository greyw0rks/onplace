"use client";

import { Plus, Minus, Maximize2 } from 'lucide-react';
import { AgentActivity } from './types';

interface BottomContextCardsProps {
  hourlyActivity?: AgentActivity[];
  /** 0-1, drives the progress ring */
  ratio?: number;
  ratioLabel?: string;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onReset?: () => void;
}

const RING_CIRCUMFERENCE = 2 * Math.PI * 8;

export function BottomContextCards({
  hourlyActivity = [],
  ratio = 0,
  ratioLabel,
  onZoomIn,
  onZoomOut,
  onReset,
}: BottomContextCardsProps) {
  const peak = Math.max(...hourlyActivity.map((a) => a.checks), 0);
  const clamped = Math.min(1, Math.max(0, ratio));

  return (
    <div className="absolute bottom-6 left-6 flex items-end gap-4 z-20">
      {/* Network Context Card */}
      <div className="floating-card p-4 w-64 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-white">AgentProof Network</span>
          <div className="flex items-center gap-1.5">
            <svg viewBox="0 0 20 20" className="w-4 h-4 -rotate-90">
              <circle cx="10" cy="10" r="8" fill="none" stroke="#333333" strokeWidth="2" />
              <circle
                cx="10"
                cy="10"
                r="8"
                fill="none"
                stroke="#FF7A00"
                strokeWidth="2"
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={RING_CIRCUMFERENCE * (1 - clamped)}
              />
            </svg>
            <span className="text-[10px] text-[#A3A3A3]">
              {ratioLabel ?? `${Math.round(clamped * 100)}%`}
            </span>
          </div>
        </div>

        {hourlyActivity.length > 0 ? (
          <div className="flex items-end gap-[2px] h-8 w-full">
            {hourlyActivity.map((activity) => (
              <div
                key={activity.hour}
                className={`flex-1 min-h-[1px] transition-colors ${
                  activity.checks === 0 ? 'bg-white/10' : 'bg-[#FF7A00]/60 hover:bg-[#FF7A00]'
                }`}
                style={{ height: peak > 0 ? `${Math.max(4, (activity.checks / peak) * 100)}%` : '1px' }}
                title={`${new Date(activity.hour).getHours()}:00 — ${activity.checks} checks`}
              />
            ))}
          </div>
        ) : (
          <div className="h-8 flex items-center text-[10px] text-[#A3A3A3]">No recent check activity</div>
        )}
      </div>

      {/* Map Controls */}
      <div className="flex floating-card h-10">
        <button
          onClick={onZoomIn}
          aria-label="Zoom in"
          className="w-10 flex items-center justify-center text-[#A3A3A3] hover:text-white hover:bg-white/10 transition border-r border-white/10"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={onReset}
          aria-label="Reset view"
          className="w-10 flex items-center justify-center text-[#FF7A00] bg-white/5 border-r border-white/10 shadow-[inset_0_-2px_0_#FF7A00] hover:bg-white/10 transition"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          onClick={onZoomOut}
          aria-label="Zoom out"
          className="w-10 flex items-center justify-center text-[#A3A3A3] hover:text-white hover:bg-white/10 transition"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
