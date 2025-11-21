"use client";

import React from "react";
import { useAccountData } from "./hooks/useAccountData";

export default function TradesTable() {
  const { positions, orders, loading, error, refresh } = useAccountData();

  return (
    <div className="space-y-6">
      {/* Open Positions */}
      <section className="rounded-xl border border-purple-700/60 bg-black/40 shadow-lg">
        <header className="px-4 py-3 border-b border-purple-800/80 bg-purple-900/70">
          <h2 className="text-sm font-semibold tracking-wide text-purple-100">
            OPEN POSITIONS
          </h2>
        </header>

        {error && (
          <div className="px-4 py-2 text-xs text-red-400">
            Error: {error}
          </div>
        )}

        <div className="overflow-x-auto">
          {positions.length === 0 ? (
            <div className="px-4 py-4 text-sm text-slate-300">
              No open positions.
            </div>
          ) : (
            <table className="min-w-full text-xs text-slate-100">
              <thead className="bg-purple-900/70 text-[11px] uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-2 text-left">Symbol</th>
                  <th className="px-4 py-2 text-left">Side</th>
                  <th className="px-4 py-2 text-right">Size (USD)</th>
                  <th className="px-4 py-2 text-right">Entry</th>
                  <th className="px-4 py-2 text-right">Mark</th>
                  <th className="px-4 py-2 text-right">Unreal PnL</th>
                  <th className="px-4 py-2 text-right">Lev</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((p) => {
                  const sideLower = p.side.toLowerCase();
                  const sideClass =
                    sideLower === "long" || sideLower === "buy"
                      ? "text-emerald-400"
                      : sideLower === "short" || sideLower === "sell"
                      ? "text-red-400"
                      : "";

                  const pnlClass =
                    p.unrealized_pnl_usd > 0
                      ? "text-emerald-400"
                      : p.unrealized_pnl_usd < 0
                      ? "text-red-400"
                      : "text-slate-100";

                  return (
                    <tr
                      key={`${p.symbol}-${p.side}-main`}
                      className="border-b border-purple-900/40 hover:bg-purple-900/30"
                    >
                      <td className="px-4 py-2 font-mono text-xs">
                        {p.symbol}
                      </td>
                      <td
                        className={`px-4 py-2 text-xs capitalize ${sideClass}`}
                      >
                        {p.side}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {p.size_usd.toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {p.entry_price.toFixed(4)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {p.mark_price.toFixed(4)}
                      </td>
                      <td className={`px-4 py-2 text-right ${pnlClass}`}>
                        {p.unrealized_pnl_usd.toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {p.leverage.toFixed(2)}x
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Working & Recent Orders */}
      <section className="rounded-xl border border-purple-700/60 bg-black/40 shadow-lg">
        <header className="px-4 py-3 border-b border-purple-800/80 bg-purple-900/70">
          <h2 className="text-sm font-semibold tracking-wide text-purple-100">
            WORKING &amp; RECENT ORDERS
          </h2>
        </header>

        <div className="overflow-x-auto">
          {orders.length === 0 ? (
            <div className="px-4 py-4 text-sm text-slate-300">
              No working orders.
            </div>
          ) : (
            <table className="min-w-full text-xs text-slate-100">
              <thead className="bg-purple-900/70 text-[11px] uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-2 text-left">Symbol</th>
                  <th className="px-4 py-2 text-left">Side</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-right">Price</th>
                  <th className="px-4 py-2 text-right">Size (USD)</th>
                  <th className="px-4 py-2 text-right">Lev</th>
                  <th className="px-4 py-2 text-right">Time</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const sideLower = o.side.toLowerCase();
                  const sideClass =
                    sideLower === "long" || sideLower === "buy"
                      ? "text-emerald-400"
                      : sideLower === "short" || sideLower === "sell"
                      ? "text-red-400"
                      : "";

                  return (
                    <tr
                      key={o.order_id}
                      className="border-b border-purple-900/40 hover:bg-purple-900/30"
                    >
                      <td className="px-4 py-2 font-mono text-xs">
                        {o.symbol}
                      </td>
                      <td
                        className={`px-4 py-2 text-xs capitalize ${sideClass}`}
                      >
                        {o.side}
                      </td>
                      <td className="px-4 py-2 text-xs capitalize">
                        {o.type}
                      </td>
                      <td className="px-4 py-2 text-xs capitalize">
                        {o.status}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {o.price ? o.price.toFixed(4) : "-"}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {o.size_usd ? o.size_usd.toFixed(2) : "-"}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {o.leverage.toFixed(2)}x
                      </td>
                      <td className="px-4 py-2 text-right text-[11px]">
                        {new Date(o.created_at_epoch * 1000).toLocaleTimeString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}