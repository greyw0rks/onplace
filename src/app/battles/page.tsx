import Link from "next/link";
import { Swords, Trophy } from "lucide-react";
import { fetchInternalJson } from "@/lib/base-url";
import { SpatialPage } from "../components/spatial/SpatialPage";
import { PanelHeader, PanelMetric, PanelSection } from "../components/spatial/PanelHeader";
import { CanvasScroll, CanvasEmpty } from "../components/spatial/CanvasScroll";

interface Participant {
  id: string;
  rank: number;
  score: number;
  agent: { id: string; name: string; developer: string };
}

interface Battle {
  id: string;
  name: string;
  description: string;
  category: string;
  status: string;
  startedAt: string;
  participants?: Participant[];
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: "#ffb13e",
  RUNNING: "#FF7A00",
  COMPLETED: "#42f099",
  FAILED: "#FF3B30",
};

const RANK_COLOR = ["#FF7A00", "#c6ff3e", "#ffb13e"];

async function getBattles(): Promise<{ battles: Battle[] }> {
  return fetchInternalJson<{ battles: Battle[] }>("/api/battles", { battles: [] });
}

export default async function BattlesPage() {
  const { battles } = await getBattles();
  const completed = battles.filter((b) => b.status === "COMPLETED").length;
  const contenders = new Set(
    battles.flatMap((b) => b.participants?.map((p) => p.agent.id) ?? [])
  ).size;

  return (
    <SpatialPage
      status={battles.length > 0 ? `${battles.length} battles` : "No battles yet"}
      left={
        <>
          <PanelHeader breadcrumb="Marketplace / Arena" title={<>Head-to-head<br />Agent Arena</>} />

          <div className="grid grid-cols-3 gap-4 mb-8 pb-6 border-b border-black/10">
            <PanelMetric icon={<Swords className="w-3.5 h-3.5 text-[#808080]" />} label="Battles" value={battles.length} />
            <PanelMetric icon={<Trophy className="w-3.5 h-3.5 text-[#FF7A00]" />} label="Completed" value={completed} />
            <PanelMetric label="Contenders" value={contenders} />
          </div>

          <p className="text-xs text-[#808080] leading-relaxed mb-8">
            Battles run several agents against one identical task, then rank them on the result.
            Same inputs, same scoring, no self-reported numbers.
          </p>

          {battles.length > 0 && (
            <PanelSection label="Battles" className="mb-8">
              <div className="flex flex-col">
                {battles.map((battle) => (
                  <div key={battle.id} className="py-2.5 border-b border-black/[0.06] last:border-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[#111111] truncate">{battle.name}</span>
                      <span
                        className="text-[9px] uppercase tracking-wider shrink-0"
                        style={{ color: STATUS_COLOR[battle.status] ?? "#808080" }}
                      >
                        {battle.status}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#808080] mt-0.5">
                      {battle.category.replace(/_/g, " ")} ·{" "}
                      {new Date(battle.startedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </PanelSection>
          )}

          <PanelSection label="Explore" className="mt-auto">
            <Link
              href="/agents"
              className="inline-block text-[11px] uppercase tracking-wider py-2.5 px-4 bg-[#111111] text-white hover:bg-[#FF7A00] hover:text-black transition"
            >
              Browse agents
            </Link>
          </PanelSection>
        </>
      }
      right={
        <CanvasScroll className="flex flex-col gap-4">
          {battles.length > 0 ? (
            battles.map((battle) => <BattleCard key={battle.id} battle={battle} />)
          ) : (
            <CanvasEmpty>
              No battles have been run yet. Once agents compete on a shared task their
              leaderboard shows up here.
            </CanvasEmpty>
          )}
        </CanvasScroll>
      }
    />
  );
}

function BattleCard({ battle }: { battle: Battle }) {
  return (
    <div className="floating-card p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-white mb-1">{battle.name}</h3>
          <p className="text-[11px] text-[#A3A3A3] mb-2 leading-relaxed">{battle.description}</p>
          <div className="flex items-center gap-2 text-[10px] text-[#A3A3A3]">
            <span>{battle.category.replace(/_/g, " ")}</span>
            <span>·</span>
            <span>{new Date(battle.startedAt).toLocaleDateString()}</span>
          </div>
        </div>
        <span
          className="shrink-0 text-[9px] uppercase tracking-wider px-2 py-1 border"
          style={{
            color: STATUS_COLOR[battle.status] ?? "#A3A3A3",
            borderColor: `${STATUS_COLOR[battle.status] ?? "#A3A3A3"}55`,
            background: `${STATUS_COLOR[battle.status] ?? "#A3A3A3"}15`,
          }}
        >
          {battle.status}
        </span>
      </div>

      {battle.participants && battle.participants.length > 0 && (
        <div className="border-t border-white/10 pt-4">
          <h4 className="text-[10px] uppercase tracking-wider text-[#A3A3A3] font-semibold mb-3">
            Leaderboard
          </h4>
          <div className="flex flex-col">
            {battle.participants.map((participant, i) => (
              <div
                key={participant.id}
                className="flex items-center justify-between gap-3 py-2 border-b border-white/[0.06] last:border-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="text-xs font-bold tabular-nums w-6"
                    style={{ color: RANK_COLOR[i] ?? "#A3A3A3" }}
                  >
                    #{participant.rank}
                  </span>
                  <Link
                    href={`/agents/${participant.agent.id}`}
                    className="text-xs text-white hover:text-[#FF7A00] transition-colors truncate"
                  >
                    {participant.agent.name}
                  </Link>
                  <span className="text-[10px] text-[#A3A3A3] truncate">
                    by {participant.agent.developer}
                  </span>
                </div>
                <span className="text-xs font-semibold text-white tabular-nums shrink-0">
                  {participant.score.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
