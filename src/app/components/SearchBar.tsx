"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

interface Suggestion {
  id: string;
  name: string;
}

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSearch = useCallback(
    (searchQuery: string) => {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      router.push(`/discover?${params.toString()}`);
      setShowSuggestions(false);
    },
    [router]
  );

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/agents/search?q=${encodeURIComponent(query)}&limit=5`,
          { signal: controller.signal }
        );
        if (!response.ok) return;
        const data = await response.json();
        setSuggestions(
          (data.agents ?? []).map((a: { id: string; name: string }) => ({ id: a.id, name: a.name }))
        );
        setShowSuggestions(true);
      } catch {
        // aborted or offline — leave the previous suggestions alone
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#808080] pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch(query);
            if (e.key === "Escape") setShowSuggestions(false);
          }}
          placeholder="Name, task, protocol, capability…"
          aria-label="Search agents"
          className="w-full pl-9 pr-3 py-2.5 bg-white border border-black/15 text-xs text-[#111111] placeholder:text-[#808080] focus:outline-none focus:border-[#FF7A00] transition-colors"
        />
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-black/15 z-50">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              onClick={() => {
                setQuery(suggestion.name);
                handleSearch(suggestion.name);
              }}
              className="w-full px-3 py-2 text-left text-xs text-[#111111] hover:bg-[#FF7A00]/10 transition-colors"
            >
              {suggestion.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
