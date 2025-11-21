"use client";

import React from "react";
import { useAccountData } from "../../component/hooks/useAccountData";
import type { PositionRow, OrderRow } from "../../component/hooks/useAccountData";

function formatUsd(n: number | undefined | null): string {
  if (n == null || Number.isNaN(n)) return "$0.00";
  return `$${n.toFixed(2)}`;
}

export default function TradesPage() {
  const { summary, positions, orders, loading, error, refresh } =
    useAccountData();

  const safePositions: PositionRow[] = positions || [];
  const safeOrders: OrderRow[] = orders || [];

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#24004b] via-[#0a0017] to-black text-white px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Trades</h1>
          <button
            onClick={refresh}
            disabled={loading}
            className="px-4 py-2 rounded-md border border-purple-400/60 bg-purple-700/70 hover:bg-purple-600/80 disabled:opacity-50 text-sm font-medium shadow-md shadow-purple-900/40"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-300 border border-red-500/40 bg-red-900/40 rounded-lg px-4 py-2">
            <div className="font-semibold">
              Error: Failed to fetch one or more account endpoints
            </div>
            <div className="text-xs opacity-80 mt-1">{error}</div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
          {/* Left: positions + orders */}
          <div className="space-y-6">
            <section className="rounded-xl border border-purple-500/40 bg-black/60 shadow-md shadow-purple-900/40">
              <header className="border-b border-purple-800/60 px-4 py-3">
                <h2 className="text-sm font-semibold tracking-wide uppercase text-purple-100">
                  Open Positions
                </h2>
              </header>

              {safePositions.length === 0 ? (
                <div className="px-4 py-4 text-sm text-slate-300/80">
                  No open positions.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead className="bg-purple-900/70 text-[11px] uppercase tracking-wide text-purple-100">
                      <tr>
                        <th className="px-3 py-2 text-left">Symbol</th>
                        <th className="px-3 py-2 text-left">Side</th>
                        <th className="px-3 py-2 text-right">Size (USD)</th>
                        <th className="px-3 py-2 text-right">Entry</th>
                        <th className="px-3 py-2 text-right">Mark</th>
                        <th className="px-3 py-2 text-right">Unreal PnL</th>
                        <th className="px-3 py-2 text-right">Lev</th>
                      </tr>
                    </thead>
                    <tbody>
                      {safePositions.map((p) => {
                        const pnlClass =
                          p.unrealized_pnl_usd > 0
                            ? "text-emerald-400"
                            : p.unrealized_pnl_usd < 0
                            ? "text-red-400"
                            : "text-slate-100";
                        return (
                          <tr
                            key={`${p.symbol}-${p.side}`}
                            className="border-t border-purple-800/60 hover:bg-purple-900/40"
                          >
                            <td className="px-3 py-2 font-mono text-[11px]">
                              {p.symbol}
                            </td>
                            <td className="px-3 py-2 capitalize">{p.side}</td>
                            <td className="px-3 py-2 text-right">
                              {p.size_usd.toFixed(2)}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {p.entry_price.toFixed(4)}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {p.mark_price.toFixed(4)}
                            </td>
                            <td className={`px-3 py-2 text-right ${pnlClass}`}>
                              {p.unrealized_pnl_usd.toFixed(2)}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {p.leverage.toFixed(2)}x
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="rounded-xl border border-purple-500/40 bg-black/60 shadow-md shadow-purple-900/40">
              <header className="border-b border-purple-800/60 px-4 py-3">
                <h2 className="text-sm font-semibold tracking-wide uppercase text-purple-100">
                  Working &amp; Recent Orders
                </h2>
              </header>

              {safeOrders.length === 0 ? (
                <div className="px-4 py-4 text-sm text-slate-300/80">
                  No working orders.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead className="bg-purple-900/70 text-[11px] uppercase tracking-wide text-purple-100">
                      <tr>
                        <th className="px-3 py-2 text-left">Symbol</th>
                        <th className="px-3 py-2 text-left">Side</th>
                        <th className="px-3 py-2 text-left">Type</th>
                        <th className="px-3 py-2 text-left">Status</th>
                        <th className="px-3 py-2 text-right">Price</th>
                        <th className="px-3 py-2 text-right">Size (USD)</th>
                        <th className="px-3 py-2 text-right">Lev</th>
                        <th className="px-3 py-2 text-right">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {safeOrders.map((o) => (
                        <tr
                          key={o.order_id}
                          className="border-t border-purple-800/60 hover:bg-purple-900/40"
                        >
                          <td className="px-3 py-2 font-mono text-[11px]">
                            {o.symbol}
                          </td>
                          <td className="px-3 py-2 capitalize">{o.side}</td>
                          <td className="px-3 py-2 capitalize">{o.type}</td>
                          <td className="px-3 py-2 capitalize">{o.status}</td>
                          <td className="px-3 py-2 text-right">
                            {o.price ? o.price.toFixed(4) : "-"}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {o.size_usd ? o.size_usd.toFixed(2) : "-"}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {o.leverage.toFixed(2)}x
                          </td>
                          <td className="px-3 py-2 text-right text-[11px]">
                            {new Date(
                              o.created_at_epoch * 1000,
                            ).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          {/* Right: account overview tiles */}
          <aside className="space-y-4">
            <h2 className="text-lg font-semibold mb-1">Account Overview</h2>
            <div className="grid grid-cols-2 gap-3">
              <MiniMetric
                label="Equity"
                value={formatUsd(summary?.equity_usd)}
              />
              <MiniMetric
                label="Balance"
                value={formatUsd(summary?.balance_usd)}
              />
              <MiniMetric
                label="Unrealized PnL"
                value={formatUsd(summary?.unrealized_pnl_usd)}
              />
              <MiniMetric
                label="Realized PnL"
                value={formatUsd(summary?.realized_pnl_usd)}
              />
              <MiniMetric
                label="Margin Used"
                value={formatUsd(summary?.margin_used_usd)}
              />
              <MiniMetric
                label="Margin Avail."
                value={formatUsd(summary?.margin_available_usd)}
              />
              <MiniMetric
                label="Lev"
                value={`${(summary?.effective_leverage ?? 0).toFixed(2)}x`}
              />
              <MiniMetric
                label="Sharpe (30d)"
                value={`${(summary?.sharpe_30d ?? 0).toFixed(2)}%`}
              />
            </div>

            <div className="rounded-xl border border-purple-500/40 bg-black/60 px-4 py-3 text-xs text-slate-200/90 shadow-md shadow-purple-900/40">
              <div className="font-semibold text-purple-100 mb-1">
                Open Positions
              </div>
              {safePositions.length === 0 ? (
                <div className="text-slate-300/80">No open positions.</div>
              ) : (
                <ul className="space-y-1">
                  {safePositions.map((p) => (
                    <li
                      key={`${p.symbol}-${p.side}-mini`}
                      className="flex items-center justify-between"
                    >
                      <span className="font-mono text-[11px]">
                        {p.symbol} ({p.side})
                      </span>
                      <span className="text-slate-100">
                        {p.size_usd.toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-xl border border-purple-500/40 bg-black/60 px-4 py-3 text-xs text-slate-200/90 shadow-md shadow-purple-900/40">
              <div className="font-semibold text-purple-100 mb-1">
                Working &amp; Recent Orders
              </div>
              {safeOrders.length === 0 ? (
                <div className="text-slate-300/80">
                  No working or recent orders.
                </div>
              ) : (
                <ul className="space-y-1">
                  {safeOrders.slice(0, 5).map((o) => (
                    <li
                      key={`${o.order_id}-mini`}
                      className="flex items-center justify-between"
                    >
                      <span className="font-mono text-[11px]">
                        {o.symbol} ({o.side})
                      </span>
                      <span className="text-slate-100">
                        {o.size_usd ? o.size_usd.toFixed(2) : "-"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-purple-500/40 bg-black/60 px-3 py-2 text-xs shadow-sm shadow-purple-900/40">
      <div className="text-[10px] uppercase tracking-wide text-purple-200/80">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}