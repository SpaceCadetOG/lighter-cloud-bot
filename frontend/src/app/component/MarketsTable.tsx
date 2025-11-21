"use client";

import { useMemo, useState } from "react";

export type MarketRow = {
  symbol: string;
  market_id: number;
  status: string;
  taker_fee: string;
  maker_fee: string;
  open_interest: number;
  index_price: number;
  mark_price: number;
  change_24h_pct: number;
  open_interest_usd: number;
  volume_24h_usd: number;
  funding_rate_8h: number;
};

type Filter = "all" | "gainers" | "losers";

type Props = {
  markets: MarketRow[];
};

export default function MarketsTable({ markets }: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    let rows = markets;

    if (search.trim()) {
      const q = search.trim().toUpperCase();
      rows = rows.filter((m) => m.symbol.toUpperCase().includes(q));
    }

    if (filter === "gainers") {
      rows = rows.filter((m) => m.change_24h_pct > 0);
    } else if (filter === "losers") {
      rows = rows.filter((m) => m.change_24h_pct < 0);
    }

    // Simple sort: by 24h volume desc
    return [...rows].sort((a, b) => b.volume_24h_usd - a.volume_24h_usd);
  }, [markets, search, filter]);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 text-slate-100">
      <h1 className="text-2xl font-semibold tracking-wide mb-4">Watchlist</h1>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <input
          type="text"
          placeholder="Search markets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-64 rounded-md bg-black/40 border border-white/10 px-3 py-2 text-sm outline-none focus:border-purple-400"
        />

        <div className="inline-flex rounded-md border border-white/10 bg-black/30 overflow-hidden text-sm">
          <FilterButton
            label="All"
            active={filter === "all"}
            onClick={() => setFilter("all")}
          />
          <FilterButton
            label="Gainers"
            active={filter === "gainers"}
            onClick={() => setFilter("gainers")}
          />
          <FilterButton
            label="Losers"
            active={filter === "losers"}
            onClick={() => setFilter("losers")}
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg bg-black/30 border border-white/5">
        <table className="min-w-full text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wide">
            <tr>
              <th className="px-3 py-2 text-left">Symbol</th>
              <th className="px-3 py-2 text-right">Price</th>
              <th className="px-3 py-2 text-right">24h %</th>
              <th className="px-3 py-2 text-right">Open Interest</th>
              <th className="px-3 py-2 text-right">Open Interest (USD)</th>
              <th className="px-3 py-2 text-right">Volume 24h (USD)</th>
              <th className="px-3 py-2 text-right">Funding 8h</th>
              <th className="px-3 py-2 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => {
              const pctClass =
                m.change_24h_pct > 0
                  ? "text-emerald-400"
                  : m.change_24h_pct < 0
                  ? "text-red-400"
                  : "text-slate-100";
              const fundingClass =
                m.funding_rate_8h > 0.0002
                  ? "text-emerald-300"
                  : m.funding_rate_8h < -0.0002
                  ? "text-red-300"
                  : "text-slate-200";

              return (
                <tr
                  key={m.symbol}
                  className="border-t border-white/5 hover:bg-white/5"
                >
                  <td className="px-3 py-2 font-mono text-xs">{m.symbol}</td>
                  <td className="px-3 py-2 text-right">
                    {m.mark_price.toFixed(5)}
                  </td>
                  <td className={`px-3 py-2 text-right ${pctClass}`}>
                    {m.change_24h_pct.toFixed(2)}%
                  </td>
                  <td className="px-3 py-2 text-right">
                    {m.open_interest.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {m.open_interest_usd.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {m.volume_24h_usd.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
                  </td>
                  <td className={`px-3 py-2 text-right ${fundingClass}`}>
                    {m.funding_rate_8h.toFixed(5)}
                  </td>
                  <td className="px-3 py-2 text-right capitalize">
                    {m.status}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="px-4 py-3 text-sm text-slate-300">
            No markets match your filters.
          </div>
        )}
      </div>
    </div>
  );
}

function FilterButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 ${
        active ? "bg-purple-600 text-white" : "bg-transparent text-slate-200"
      }`}
    >
      {label}
    </button>
  );
}