"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const CATEGORIES = [
  { value: "rebalancing", label: "Rebalancing" },
  { value: "grid_trading", label: "Grid Trading" },
  { value: "yield_optimisation", label: "Yield Optimisation" },
  { value: "health_factor_monitoring", label: "Health Monitoring" },
];

const CHAINS = [
  { value: "bsc", label: "BNB Chain" },
  { value: "ethereum", label: "Ethereum" },
  { value: "polygon", label: "Polygon" },
  { value: "arbitrum", label: "Arbitrum" },
];

const RISK_LEVELS = [
  { value: "LOW", label: "Low Risk" },
  { value: "MEDIUM", label: "Medium Risk" },
  { value: "HIGH", label: "High Risk" },
  { value: "CRITICAL", label: "Critical Risk" },
];

const CAPABILITIES = [
  { value: "READ_WALLET", label: "Read Wallet" },
  { value: "ANALYZE_POSITION", label: "Analyze Position" },
  { value: "EXECUTE_SWAP", label: "Execute Swap" },
  { value: "TRANSFER_FUNDS", label: "Transfer Funds" },
];

const FIELD =
  "w-full px-3 py-2 bg-white border border-black/15 text-xs text-[#111111] focus:outline-none focus:border-[#FF7A00] transition-colors";

export function FilterPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [chain, setChain] = useState(searchParams.get("chain") || "");
  const [riskLevel, setRiskLevel] = useState(searchParams.get("riskLevel") || "");
  const [capability, setCapability] = useState(searchParams.get("capability") || "");
  const [minTrust, setMinTrust] = useState(searchParams.get("minTrust") || "");
  const [verified, setVerified] = useState(searchParams.get("verified") === "true");

  const applyFilters = () => {
    const params = new URLSearchParams();
    const q = searchParams.get("q");

    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (chain) params.set("chain", chain);
    if (riskLevel) params.set("riskLevel", riskLevel);
    if (capability) params.set("capability", capability);
    if (minTrust) params.set("minTrust", minTrust);
    if (verified) params.set("verified", "true");

    router.push(`/discover?${params.toString()}`);
  };

  const clearFilters = () => {
    setCategory("");
    setChain("");
    setRiskLevel("");
    setCapability("");
    setMinTrust("");
    setVerified(false);
    router.push("/discover");
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-[#808080] font-semibold">
          Filters
        </span>
        <button
          onClick={clearFilters}
          className="text-[10px] text-[#808080] hover:text-[#FF7A00] transition-colors"
        >
          Clear all
        </button>
      </div>

      <FilterSelect label="Category" value={category} onChange={setCategory} options={CATEGORIES} />
      <FilterSelect label="Chain" value={chain} onChange={setChain} options={CHAINS} />
      <FilterSelect label="Risk level" value={riskLevel} onChange={setRiskLevel} options={RISK_LEVELS} />
      <FilterSelect label="Capability" value={capability} onChange={setCapability} options={CAPABILITIES} />

      <div>
        <label htmlFor="minTrust" className="block text-[10px] text-[#808080] mb-1.5">
          Min trust score
        </label>
        <input
          id="minTrust"
          type="number"
          min="0"
          max="100"
          value={minTrust}
          onChange={(e) => setMinTrust(e.target.value)}
          placeholder="0-100"
          className={FIELD}
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer py-1">
        <input
          type="checkbox"
          checked={verified}
          onChange={(e) => setVerified(e.target.checked)}
          className="w-3.5 h-3.5 accent-[#FF7A00]"
        />
        <span className="text-xs text-[#111111]">Verified agents only</span>
      </label>

      <button
        onClick={applyFilters}
        className="w-full text-[11px] uppercase tracking-wider py-2.5 bg-[#111111] text-white hover:bg-[#FF7A00] hover:text-black transition mt-1"
      >
        Apply filters
      </button>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  const id = `filter-${label.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div>
      <label htmlFor={id} className="block text-[10px] text-[#808080] mb-1.5">
        {label}
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={FIELD}>
        <option value="">Any</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
