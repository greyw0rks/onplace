"use client";

import { useEffect, useState } from "react";

interface Activity {
  id: string;
  type: string;
  title: string;
  description?: string;
  createdAt: string;
  agent?: {
    id: string;
    name: string;
    developer: string;
  };
}

type Variant = "dark" | "light";

const THEME: Record<Variant, { border: string; heading: string; title: string; muted: string; hover: string }> = {
  dark: {
    border: "border-white/10",
    heading: "text-white",
    title: "text-white",
    muted: "text-[#A3A3A3]",
    hover: "hover:bg-white/5",
  },
  light: {
    border: "border-black/10",
    heading: "text-[#111111]",
    title: "text-[#111111]",
    muted: "text-[#808080]",
    hover: "hover:bg-black/[0.03]",
  },
};

export function ActivityFeed({ limit = 10, variant = "dark" }: { limit?: number; variant?: Variant }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const t = THEME[variant];

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch("/api/activity/feed");
        const data = await response.json();
        setActivities((data.activities ?? []).slice(0, limit));
      } catch (error) {
        console.error("Failed to fetch activities:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
    const interval = setInterval(fetchActivities, 10000); // Refresh every 10s

    return () => clearInterval(interval);
  }, [limit]);

  if (loading) {
    return <div className={`text-xs ${t.muted}`}>Loading activity...</div>;
  }

  return (
    <div className={`border ${t.border}`}>
      <div className={`border-b ${t.border} px-4 py-3`}>
        <h3 className={`text-xs font-semibold flex items-center gap-2 ${t.heading}`}>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FF7A00] animate-pulse" />
          Live Activity
        </h3>
      </div>

      <div className={`divide-y ${variant === "dark" ? "divide-white/10" : "divide-black/10"}`}>
        {activities.length > 0 ? (
          activities.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} theme={t} />
          ))
        ) : (
          <div className={`px-4 py-6 text-center text-xs ${t.muted}`}>No recent activity</div>
        )}
      </div>
    </div>
  );
}

function ActivityItem({ activity, theme }: { activity: Activity; theme: (typeof THEME)[Variant] }) {
  const icon = getActivityIcon(activity.type);
  const timeAgo = getTimeAgo(new Date(activity.createdAt));

  return (
    <div className={`px-4 py-3 transition-colors ${theme.hover}`}>
      <div className="flex items-start gap-3">
        <span className="text-sm mt-0.5 leading-none" style={{ color: getActivityColor(activity.type) }}>
          {icon}
        </span>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-medium mb-0.5 ${theme.title}`}>{activity.title}</p>
          {activity.description && (
            <p className={`text-[10px] mb-1 ${theme.muted}`}>{activity.description}</p>
          )}
          {activity.agent && (
            <p className={`text-[10px] ${theme.muted}`}>
              <span className={theme.title}>{activity.agent.name}</span> by {activity.agent.developer}
            </p>
          )}
        </div>
        <span className={`text-[9px] whitespace-nowrap ${theme.muted}`}>{timeAgo}</span>
      </div>
    </div>
  );
}

function getActivityIcon(type: string): string {
  const icons: Record<string, string> = {
    AGENT_REGISTERED: "🚀",
    AGENT_VERIFIED: "✓",
    AGENT_UNVERIFIED: "○",
    AGENT_DEGRADED: "▼",
    AGENT_RECOVERED: "▲",
    AGENT_HIRED: "💼",
    VERSION_RELEASED: "📦",
    PERFORMANCE_MILESTONE: "🏆",
    SECURITY_INCIDENT: "⚠️",
    TEST_PASSED: "✅",
    BATTLE_COMPLETED: "⚔️",
  };
  return icons[type] || "◉";
}

function getActivityColor(type: string): string {
  const colors: Record<string, string> = {
    AGENT_REGISTERED: "#3ef2ff",
    AGENT_VERIFIED: "#42f099",
    AGENT_UNVERIFIED: "#808080",
    AGENT_DEGRADED: "#ffb13e",
    AGENT_RECOVERED: "#42f099",
    AGENT_HIRED: "#ff3ea5",
    VERSION_RELEASED: "#c6ff3e",
    PERFORMANCE_MILESTONE: "#FF7A00",
    SECURITY_INCIDENT: "#FF3B30",
    TEST_PASSED: "#42f099",
    BATTLE_COMPLETED: "#3ef2ff",
  };
  return colors[type] || "#808080";
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
