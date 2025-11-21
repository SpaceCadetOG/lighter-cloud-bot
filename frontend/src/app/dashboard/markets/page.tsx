// frontend/src/app/dashboard/markets/page.tsx
"use client";

import React, { useEffect, useState } from "react";

type MarketRow = {
  symbol: string;
  index_price: number;
  mark_price: number;
  change_24h_pct: number;
  open_interest: number;
  open_interest_usd: number;
  volume_24h_usd: number;
  funding_rate_8h: number;
  status: string;
};

type FilterMode = "all" | "gainers" | "losers";
type SortKey =
  | "symbol"
  | "index_price"
  | "change_24h_pct"
  | "open_interest"
  | "open_interest_usd"
  | "volume_24h_usd"
  | "funding_rate_8h"
  | "status";

type SortDirection = "asc" | "desc";

export default function MarketsPage() {
  const [markets, setMarkets] = useState<MarketRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");

  const [sortKey, setSortKey] = useState<SortKey>("symbol");
  const [sortDir, setSortDir] = useState<SortDirection>("asc");

  async function load() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("http://localhost:8080/api/markets");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = (await res.json()) as MarketRow[];
      setMarkets(data || []);
    } catch (err: any) {
      console.error("load markets error:", err);
      setError("Failed to fetch markets");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function formatPct(v: number): string {
    if (v === 0 || Number.isNaN(v)) return "0.00%";
    return `${v.toFixed(2)}%`;
  }

  function formatUsd(v: number): string {
    if (!Number.isFinite(v)) return "$0.00";
    if (Math.abs(v) >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(2)}B`;
    if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
    if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(2)}K`;
    return `$${v.toFixed(2)}`;
  }

  function handleSort(nextKey: SortKey) {
    if (sortKey === nextKey) {
      // toggle direction
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(nextKey);
      setSortDir("asc");
    }
  }

  function getSortValue(row: MarketRow, key: SortKey): string | number {
    switch (key) {
      case "symbol":
        return row.symbol;
      case "status":
        return row.status;
      case "index_price":
        return row.index_price;
      case "change_24h_pct":
        return row.change_24h_pct;
      case "open_interest":
        return row.open_interest;
      case "open_interest_usd":
        return row.open_interest_usd;
      case "volume_24h_usd":
        return row.volume_24h_usd;
      case "funding_rate_8h":
        return row.funding_rate_8h;
      default:
        return 0;
    }
  }

  const visibleRows = markets
    // filter
    .filter((m) => {
      const term = search.trim().toUpperCase();
      if (term && !m.symbol.toUpperCase().includes(term)) return false;

      if (filterMode === "gainers") return m.change_24h_pct > 0;
      if (filterMode === "losers") return m.change_24h_pct < 0;
      return true;
    })
    // sort
    .sort((a, b) => {
      const av = getSortValue(a, sortKey);
      const bv = getSortValue(b, sortKey);

      let cmp: number;
      if (typeof av === "string" && typeof bv === "string") {
        cmp = av.localeCompare(bv);
      } else {
        const na = Number(av);
        const nb = Number(bv);
        if (Number.isNaN(na) || Number.isNaN(nb)) cmp = 0;
        else cmp = na - nb;
      }

      return sortDir === "asc" ? cmp : -cmp;
    });

  function sortLabel(key: SortKey, label: string) {
    if (sortKey !== key) return label;
    return sortDir === "asc" ? `${label} ▲` : `${label} ▼`;
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#140025] via-[#090012] to-black text-white px-4 py-8">
      {/* Header */}
      <header className="mb-6 flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-wide">Watchlist</h1>
        <p className="text-sm text-purple-200/80">
          Sortable markets view powered by{" "}
          <span className="font-mono">/api/markets</span>.
        </p>
      </header>

      {/* Filters + search */}
      <section className="mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search markets..."
            className="px-3 py-1 rounded bg-black/40 border border-purple-700 text-sm outline-none focus:ring-2 focus:ring-purple-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="inline-flex rounded overflow-hidden border border-purple-700 text-sm">
            <button
              className={`px-3 py-1 ${
                filterMode === "all" ? "bg-purple-700" : "bg-black/40"
              }`}
              onClick={() => setFilterMode("all")}
            >
              All
            </button>
            <button
              className={`px-3 py-1 ${
                filterMode === "gainers" ? "bg-purple-700" : "bg-black/40"
              }`}
              onClick={() => setFilterMode("gainers")}
            >
              Gainers
            </button>
            <button
              className={`px-3 py-1 ${
                filterMode === "losers" ? "bg-purple-700" : "bg-black/40"
              }`}
              onClick={() => setFilterMode("losers")}
            >
              Losers
            </button>
          </div>

          <button
            onClick={load}
            disabled={loading}
            className="px-3 py-1 text-sm rounded bg-purple-700 hover:bg-purple-600 disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          {error && (
            <span className="text-sm text-red-400 ml-2">
              Error: {error}
            </span>
          )}
        </div>
      </section>

      {/* Table */}
      <section className="overflow-x-auto rounded-lg border border-purple-900 bg-black/40">
        <table className="min-w-full text-sm">
          <thead className="border-b border-purple-800 bg-purple-950/70 text-xs uppercase text-purple-200">
            <tr>
              <th
                className="text-left py-2 pl-4 pr-4 cursor-pointer select-none"
                onClick={() => handleSort("symbol")}
              >
                {sortLabel("symbol", "Symbol")}
              </th>
              <th
                className="text-right py-2 pr-4 cursor-pointer select-none"
                onClick={() => handleSort("index_price")}
              >
                {sortLabel("index_price", "Price")}
              </th>
              <th
                className="text-right py-2 pr-4 cursor-pointer select-none"
                onClick={() => handleSort("change_24h_pct")}
              >
                {sortLabel("change_24h_pct", "24h %")}
              </th>
              <th
                className="text-right py-2 pr-4 cursor-pointer select-none"
                onClick={() => handleSort("open_interest")}
              >
                {sortLabel("open_interest", "Open Interest")}
              </th>
              <th
                className="text-right py-2 pr-4 cursor-pointer select-none"
                onClick={() => handleSort("open_interest_usd")}
              >
                {sortLabel("open_interest_usd", "Open Interest (USD)")}
              </th>
              <th
                className="text-right py-2 pr-4 cursor-pointer select-none"
                onClick={() => handleSort("volume_24h_usd")}
              >
                {sortLabel("volume_24h_usd", "Volume 24h (USD)")}
              </th>
              <th
                className="text-right py-2 pr-4 cursor-pointer select-none"
                onClick={() => handleSort("funding_rate_8h")}
              >
                {sortLabel("funding_rate_8h", "Funding 8h")}
              </th>
              <th
                className="text-left py-2 pr-4 cursor-pointer select-none"
                onClick={() => handleSort("status")}
              >
                {sortLabel("status", "Status")}
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((m) => {
              const isUp = m.change_24h_pct > 0;
              const isDown = m.change_24h_pct < 0;

              return (
                <tr
                  key={m.symbol}
                  className="border-b border-purple-900/40 hover:bg-purple-900/30"
                >
                  <td className="py-2 pl-4 pr-4 font-medium">{m.symbol}</td>
                  <td className="py-2 pr-4 text-right">
                    {m.index_price.toFixed(4)}
                  </td>
                  <td
                    className={`py-2 pr-4 text-right ${
                      isUp
                        ? "text-emerald-400"
                        : isDown
                        ? "text-red-400"
                        : "text-gray-200"
                    }`}
                  >
                    {formatPct(m.change_24h_pct)}
                  </td>
                  <td className="py-2 pr-4 text-right">
                    {m.open_interest.toLocaleString()}
                  </td>
                  <td className="py-2 pr-4 text-right">
                    {formatUsd(m.open_interest_usd)}
                  </td>
                  <td className="py-2 pr-4 text-right">
                    {formatUsd(m.volume_24h_usd)}
                  </td>
                  <td
                    className={`py-2 pr-4 text-right ${
                      m.funding_rate_8h > 0
                        ? "text-emerald-400"
                        : m.funding_rate_8h < 0
                        ? "text-red-400"
                        : "text-gray-200"
                    }`}
                  >
                    {m.funding_rate_8h.toFixed(6)}
                  </td>
                  <td className="py-2 pr-4 text-left">
                    {m.status === "active" ? "active" : m.status}
                  </td>
                </tr>
              );
            })}

            {!loading && visibleRows.length === 0 && (
              <tr>
                <td className="py-4 text-center text-gray-300" colSpan={8}>
                  No markets match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}