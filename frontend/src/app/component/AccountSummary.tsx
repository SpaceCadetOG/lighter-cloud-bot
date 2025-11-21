"use client";

import type {
  AccountSummary,
  PositionRow,
  OrderRow,
} from "./hooks/useAccountData";

type Props = {
  summary: AccountSummary | null;
  positions: PositionRow[];
  orders: OrderRow[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
};

function formatUsd(n: number | undefined | null): string {
  if (n == null || Number.isNaN(n)) return "$0.00";
  return `$${n.toFixed(2)}`;
}

function formatPct(n: number | undefined | null): string {
  if (n == null || Number.isNaN(n)) return "0.00%";
  return `${n.toFixed(2)}%`;
}

export default function AccountSummaryView({
  summary,
  positions,
  orders,
  loading,
  error,
  onRefresh,
}: Props) {
  // safety in case something passes undefined
  const safePositions = positions ?? [];

  const totalUnrealized =
    safePositions.reduce((acc, p) => acc + (p.unrealized_pnl_usd || 0), 0) || 0;

  const totalMarginUsed =
    safePositions.reduce((acc, p) => acc + (p.margin_used_usd || 0), 0) || 0;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 text-slate-100">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-wide">
            Account Overview
          </h1>
          <p className="text-xs text-slate-300/70 mt-1">
            Balances, margin and PnL overview, backed by <code>/api/account/*</code>.
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="px-3 py-1 rounded-md border border-purple-400/60 bg-purple-700/40 hover:bg-purple-600/60 disabled:opacity-50 text-sm"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-400">
          Error: Failed to fetch one or more account endpoints
          <div className="text-xs opacity-80 mt-1">({error})</div>
        </div>
      )}

      {/* Top metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <MetricBox label="Equity" value={formatUsd(summary?.equity_usd)} />
        <MetricBox label="Balance" value={formatUsd(summary?.balance_usd)} />
        <MetricBox
          label="Unrealized PnL"
          value={formatUsd(totalUnrealized)}
          valueClass={
            totalUnrealized > 0
              ? "text-emerald-400"
              : totalUnrealized < 0
              ? "text-red-400"
              : ""
          }
        />
        <MetricBox
          label="Realized PnL"
          value={formatUsd(summary?.realized_pnl_usd)}
          valueClass={
            (summary?.realized_pnl_usd ?? 0) > 0
              ? "text-emerald-400"
              : (summary?.realized_pnl_usd ?? 0) < 0
              ? "text-red-400"
              : ""
          }
        />
        <MetricBox label="Margin Used" value={formatUsd(totalMarginUsed)} />
        <MetricBox
          label="Margin Available"
          value={formatUsd(summary?.margin_available_usd)}
        />
        <MetricBox
          label="Effective Leverage"
          value={`${(summary?.effective_leverage ?? 0).toFixed(2)}x`}
        />
        <MetricBox
          label="Sharpe (30d)"
          value={formatPct(summary?.sharpe_30d)}
        />
      </div>

      {/* Positions table */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Open Positions</h2>
        {safePositions.length === 0 ? (
          <div className="text-sm text-slate-300/80">
            No open positions. 🚫
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg bg-black/30 border border-white/5">
            <table className="min-w-full text-sm">
              <thead className="bg-white/5 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-3 py-2 text-left">Symbol</th>
                  <th className="px-3 py-2 text-left">Side</th>
                  <th className="px-3 py-2 text-right">Size (USD)</th>
                  <th className="px-3 py-2 text-right">Entry</th>
                  <th className="px-3 py-2 text-right">Mark</th>
                  <th className="px-3 py-2 text-right">Lev</th>
                  <th className="px-3 py-2 text-right">uPnL</th>
                  <th className="px-3 py-2 text-right">% uPnL</th>
                </tr>
              </thead>
              <tbody>
                {safePositions.map((p) => {
                  const pct =
                    p.size_usd > 0
                      ? (p.unrealized_pnl_usd / p.size_usd) * 100
                      : 0;

                  const pnlClass =
                    p.unrealized_pnl_usd > 0
                      ? "text-emerald-400"
                      : p.unrealized_pnl_usd < 0
                      ? "text-red-400"
                      : "text-slate-100";

                  const sideLower = p.side.toLowerCase();
                  const sideClass =
                    sideLower === "long" || sideLower === "buy"
                      ? "text-emerald-400"
                      : sideLower === "short" || sideLower === "sell"
                      ? "text-red-400"
                      : "";

                  return (
                    <tr
                      key={`${p.symbol}-${p.side}`}
                      className="border-t border-white/5 hover:bg-white/5"
                    >
                      <td className="px-3 py-2 font-mono text-xs">
                        {p.symbol}
                      </td>
                      <td className={`px-3 py-2 capitalize ${sideClass}`}>
                        {p.side}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {p.size_usd.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {p.entry_price.toFixed(4)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {p.mark_price.toFixed(4)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {p.leverage.toFixed(2)}x
                      </td>
                      <td className={`px-3 py-2 text-right ${pnlClass}`}>
                        {p.unrealized_pnl_usd.toFixed(2)}
                      </td>
                      <td className={`px-3 py-2 text-right ${pnlClass}`}>
                        {pct.toFixed(2)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Orders table */}
      <section>
        <h2 className="text-lg font-semibold mb-2">
          Working &amp; Recent Orders
        </h2>
        {orders.length === 0 ? (
          <div className="text-sm text-slate-300/80">
            No working or recent orders.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg bg-black/30 border border-white/5">
            <table className="min-w-full text-sm">
              <thead className="bg-white/5 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-3 py-2 text-left">Symbol</th>
                  <th className="px-3 py-2 text-left">Side</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-right">Px</th>
                  <th className="px-3 py-2 text-right">Size (USD)</th>
                  <th className="px-3 py-2 text-right">Lev</th>
                  <th className="px-3 py-2 text-right">Time</th>
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
                      className="border-t border-white/5 hover:bg-white/5"
                    >
                      <td className="px-3 py-2 font-mono text-xs">
                        {o.symbol}
                      </td>
                      <td className={`px-3 py-2 capitalize ${sideClass}`}>
                        {o.side}
                      </td>
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
                      <td className="px-3 py-2 text-right text-xs">
                        {new Date(o.created_at_epoch * 1000).toLocaleTimeString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function MetricBox({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-black/30 px-4 py-3">
      <div className="text-xs uppercase tracking-wide text-slate-300/70">
        {label}
      </div>
      <div className={`mt-1 text-lg font-semibold ${valueClass ?? ""}`}>
        {value}
      </div>
    </div>
  );
}