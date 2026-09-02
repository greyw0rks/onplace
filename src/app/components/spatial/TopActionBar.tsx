"use client";

import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

interface TopActionBarProps {
  onRefresh?: () => void;
  refreshing?: boolean;
  lastUpdated?: Date | null;
  /** Short label for the current view, shown next to the live dot */
  status?: string;
}

export function TopActionBar({ onRefresh, refreshing, lastUpdated, status }: TopActionBarProps) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <>
      {/* Back (hidden on the dashboard root) */}
      {pathname !== '/' && (
        <div className="absolute top-6 left-6 z-20">
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            className="w-10 h-10 floating-card flex items-center justify-center text-white hover:bg-white/10 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Status + actions */}
      <div className="absolute top-6 right-6 flex items-center gap-2 z-20">
        <div className="floating-card h-10 px-3 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF7A00] shadow-[0_0_6px_#FF7A00]" />
          <span className="text-[10px] uppercase tracking-wider text-[#A3A3A3]">
            {status ?? 'Live on BSC'}
          </span>
          {lastUpdated && (
            <span className="text-[10px] text-white/40 border-l border-white/10 pl-2">
              {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={refreshing}
            aria-label="Refresh data"
            className="w-10 h-10 floating-card flex items-center justify-center text-white hover:bg-white/10 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>
    </>
  );
}
