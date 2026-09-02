"use client";

import { useEffect, useState } from "react";

interface MarketplaceStats {
  totalAgents: number;
  totalTxs: number;
  totalCategories: number;
  recentHires: number;
}

export function LiveStats() {
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/stats/marketplace");
        const data = await response.json();
        setStats(data.stats);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30s

    return () => clearInterval(interval);
  }, []);

  if (loading || !stats) {
    return (
      <div className="grid grid-cols-4 gap-6 max-w-2xl mx-auto">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="text-center animate-pulse">
            <div className="h-8 bg-surface rounded mb-2"></div>
            <div className="h-3 bg-surface rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-6 max-w-2xl mx-auto">
      <StatCard label="Live Agents" value={stats.totalAgents.toString()} accent="cyan" />
      <StatCard label="On-Chain Txs" value={formatNumber(stats.totalTxs)} accent="magenta" />
      <StatCard label="Categories" value={stats.totalCategories.toString()} accent="lime" />
      <StatCard label="Recent Hires" value={stats.recentHires.toString()} accent="green" />
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="text-center">
      <div className={`text-2xl font-heading font-bold mb-1 text-${accent}`}>{value}</div>
      <div className="text-[10px] text-text-2 uppercase tracking-wider">{label}</div>
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}
