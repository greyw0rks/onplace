"use client";

import { useCallback, useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { SpatialLayout } from './components/spatial/SpatialLayout';
import { LeftPanel } from './components/spatial/LeftPanel';
import { AgentNetworkCanvas } from './components/spatial/AgentNetworkCanvas';
import { TopActionBar } from './components/spatial/TopActionBar';
import { BottomContextCards } from './components/spatial/BottomContextCards';
import { MarketplaceStatsPanel } from './components/spatial/MarketplaceStatsPanel';
import { NetworkNode, NetworkData, MarketplaceStats } from './components/spatial/types';
import { ActivityFeed } from './components/ActivityFeed';
import { SearchBar } from './components/SearchBar';

const ZOOM_STEP = 1.3;
const ZOOM_MIN = 1;
const ZOOM_MAX = 4;

export default function SpatialHomePage() {
  const [networkData, setNetworkData] = useState<NetworkData>({ nodes: [], edges: [] });
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchNetwork = useCallback(async () => {
    try {
      const response = await fetch('/api/agents/network');
      if (!response.ok) throw new Error(`network request failed: ${response.status}`);
      setNetworkData(await response.json());
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch network:', error);
    }
  }, []);

  useEffect(() => {
    fetchNetwork().finally(() => setLoading(false));
  }, [fetchNetwork]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNetwork();
    setRefreshing(false);
  }, [fetchNetwork]);

  const activeRatio =
    stats && stats.registeredAgents > 0 ? stats.activeAgents / stats.registeredAgents : 0;

  return (
    <SpatialLayout
      leftContent={
        <LeftPanel>
          {/* First thing in the panel: a way in. The network canvas is the
              showpiece but it answers "what is here", not "find me an agent". */}
          <div className="mb-8">
            <h2 className="text-[10px] uppercase tracking-wider text-[#808080] font-semibold mb-2">
              Find an agent
            </h2>
            <Suspense fallback={null}>
              <SearchBar />
            </Suspense>
            <p className="text-[10px] text-[#808080] mt-2 leading-relaxed">
              Search by name, task, protocol or capability — or{' '}
              <Link href="/discover" className="text-[#FF7A00] hover:underline">
                browse by filter
              </Link>
              .
            </p>
          </div>

          <MarketplaceStatsPanel onDataLoaded={setStats} />

          <div className="mt-8 pt-8 border-t border-black/10">
            <ActivityFeed limit={6} variant="light" />
          </div>
        </LeftPanel>
      }
      rightContent={
        <>
          <TopActionBar
            onRefresh={handleRefresh}
            refreshing={refreshing}
            lastUpdated={lastUpdated}
            status={`${networkData.nodes.length} agents mapped`}
          />

          {loading ? (
            <div className="flex items-center justify-center h-full text-sm text-[#A3A3A3]">
              Loading agent network...
            </div>
          ) : (
            <AgentNetworkCanvas
              nodes={networkData.nodes}
              edges={networkData.edges}
              selectedId={selectedNode?.id ?? null}
              zoom={zoom}
              onNodeClick={setSelectedNode}
            />
          )}

          <BottomContextCards
            hourlyActivity={stats?.hourlyActivity}
            ratio={activeRatio}
            ratioLabel={stats ? `${stats.activeAgents}/${stats.registeredAgents} active` : undefined}
            onZoomIn={() => setZoom((z) => Math.min(ZOOM_MAX, z * ZOOM_STEP))}
            onZoomOut={() => setZoom((z) => Math.max(ZOOM_MIN, z / ZOOM_STEP))}
            onReset={() => setZoom(1)}
          />
        </>
      }
      floatingCards={
        selectedNode && (
          <div className="absolute right-6 top-24 w-72 floating-card p-5 z-20">
            <button
              onClick={() => setSelectedNode(null)}
              aria-label="Close agent details"
              className="absolute top-3 right-3 text-[#A3A3A3] hover:text-white transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            <h3 className="text-white text-sm font-semibold mb-1 pr-6">{selectedNode.name}</h3>
            <p className="text-[#A3A3A3] text-[10px] mb-4">by {selectedNode.developer}</p>

            <dl className="flex flex-col gap-2 text-[11px] mb-5">
              <div className="flex items-center justify-between">
                <dt className="text-[#A3A3A3]">Trust score</dt>
                <dd className="text-[#FF7A00] font-bold">{selectedNode.trustScore}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[#A3A3A3]">Category</dt>
                <dd className="text-white">{selectedNode.category.replace(/_/g, ' ')}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[#A3A3A3]">Status</dt>
                <dd className={selectedNode.active ? 'text-[#42f099]' : 'text-[#A3A3A3]'}>
                  {selectedNode.active ? 'Checked in last hour' : 'Idle'}
                </dd>
              </div>
            </dl>

            <Link
              href={`/agents/${selectedNode.id}`}
              className="block w-full text-center text-[11px] uppercase tracking-wider py-2.5 bg-[#FF7A00] text-black font-semibold hover:bg-[#FFA500] transition"
            >
              View agent
            </Link>
          </div>
        )
      }
    />
  );
}
