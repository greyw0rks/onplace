"use client";

import { useEffect, useState } from 'react';
import { AlertTriangle, ShieldCheck, Users } from 'lucide-react';
import { MarketplaceStats as Stats } from './types';

interface MarketplaceStatsProps {
  onDataLoaded?: (stats: Stats) => void;
}

export function MarketplaceStatsPanel({ onDataLoaded }: MarketplaceStatsProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/stats/marketplace");
        const data = await response.json();
        setStats(data.stats);
        if (onDataLoaded) onDataLoaded(data.stats);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [onDataLoaded]);

  if (loading || !stats) {
    return (
      <div className="animate-pulse">
        <div className="h-32 bg-gray-200 rounded mb-4"></div>
      </div>
    );
  }

  const totalChecks = stats.successfulChecks + stats.failedChecks;
  const successRate = totalChecks > 0 ? Math.round((stats.successfulChecks / totalChecks) * 100) : null;
  const windowChecks = stats.hourlyActivity.reduce((sum, a) => sum + a.checks, 0);
  const peakChecks = Math.max(...stats.hourlyActivity.map((a) => a.checks), 0);
  const peakIndex = stats.hourlyActivity.findIndex((a) => a.checks === peakChecks);

  return (
    <>
      {/* Breadcrumb */}
      <div className="text-[10px] uppercase tracking-wider text-[#808080] mb-2 font-semibold">
        Marketplace / Onplaced on BNB Chain
      </div>

      {/* Title */}
      <h1 className="text-[26px] font-medium text-[#111111] mb-6 leading-tight">
        Verified<br />Agent Discovery
      </h1>

      {/* Metadata Row */}
      <div className="grid grid-cols-3 gap-4 mb-3">
        <Metric icon={<Users className="w-3.5 h-3.5 text-[#808080]" />} label="Registered" value={stats.registeredAgents} />
        <Metric icon={<ShieldCheck className="w-3.5 h-3.5 text-[#FF7A00]" />} label="Verified" value={stats.totalAgents} />
        <Metric
          icon={<AlertTriangle className={`w-3.5 h-3.5 ${stats.warnings > 0 ? 'text-[#FF3B30]' : 'text-[#808080]'}`} />}
          label="Open alerts"
          value={stats.warnings}
        />
      </div>

      <p className="text-[10px] text-[#808080] leading-relaxed mb-8 pb-6 border-b border-black/10">
        Verified = ERC-8004 on-chain identity + a passing check on the last sweep + 80% uptime.
        Revoked automatically when an endpoint goes dark.
      </p>

      {/* Activity Chart */}
      <div className="mb-8">
        <div className="flex items-baseline justify-between mb-4">
          <span className="text-[10px] uppercase tracking-wider text-[#808080] font-semibold">
            Health checks / {stats.activityWindowHours}h
          </span>
          <span className="text-[10px] text-[#808080]">{windowChecks} total</span>
        </div>

        <div className="flex items-end gap-[3px] h-28 w-full relative border-b border-black/10">
          {stats.hourlyActivity.map((activity, i) => (
            <div
              key={activity.hour}
              className={`flex-1 min-h-[2px] transition-all ${
                activity.checks === 0
                  ? 'bg-black/[0.06]'
                  : i === peakIndex
                    ? 'bg-[#FF7A00]'
                    : 'bg-[#FF7A00]/35'
              }`}
              style={{ height: peakChecks > 0 ? `${Math.max(2, (activity.checks / peakChecks) * 100)}%` : '2px' }}
              title={`${new Date(activity.hour).getHours()}:00 — ${activity.checks} checks`}
            />
          ))}

          {windowChecks === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] text-[#808080] bg-[#F8F9FB] px-2">
                No checks in the last {stats.activityWindowHours}h
              </span>
            </div>
          )}
        </div>

        <div className="flex items-baseline gap-2 mt-5">
          <span className="text-[38px] font-bold text-[#111111] tracking-tight leading-none">
            {successRate === null ? '—' : `${successRate}%`}
          </span>
          <span className="text-[10px] text-[#808080] leading-tight">
            check success rate<br />
            <span className="text-[#111111]">{stats.successfulChecks}</span> of {totalChecks} all-time
          </span>
        </div>
      </div>

      {/* Breakdown */}
      <div className="mt-auto pt-2">
        <div className="text-[10px] uppercase tracking-wider text-[#808080] mb-4 font-semibold">Breakdown</div>
        <div className="grid grid-cols-3 gap-4 text-xs">
          <Breakdown label="On-chain proofs" value={stats.onchainProofs} bar="bg-[#FF7A00]" />
          <Breakdown label="Hires / 7d" value={stats.recentHires} bar="bg-[#111111]" />
          <Breakdown label="Active / 24h" value={stats.activeAgents} bar="bg-black/20" />
        </div>
        <div className="text-[10px] text-[#808080] mt-4">
          Last check {relativeTime(stats.lastCheckAt)}
        </div>
      </div>
    </>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] text-[#808080]">{label}</span>
      <span className="flex items-center gap-1.5 text-sm font-semibold text-[#111111]">
        {icon}
        {value}
      </span>
    </div>
  );
}

function Breakdown({ label, value, bar }: { label: string; value: number; bar: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[#808080] text-[10px]">{label}</span>
      <span className="font-semibold text-[#111111]">{value}</span>
      <div className={`w-full h-0.5 mt-1 ${bar}`} />
    </div>
  );
}

function relativeTime(iso: string | null): string {
  if (!iso) return 'never';
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}
