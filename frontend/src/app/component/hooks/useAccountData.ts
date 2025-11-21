"use client";

import { useCallback, useEffect, useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") ||
  "http://localhost:8080";

export type AccountSummary = {
  account_id: string;
  balance_usd: number;
  equity_usd: number;
  unrealized_pnl_usd: number;
  realized_pnl_usd: number;
  margin_used_usd: number;
  margin_available_usd: number;
  effective_leverage: number;
  sharpe_30d: number;
};

export type PositionRow = {
  symbol: string;
  side: "long" | "short" | string;
  size_usd: number;
  size_contracts: number;
  entry_price: number;
  mark_price: number;
  leverage: number;
  unrealized_pnl_usd: number;
  realized_pnl_usd: number;
  margin_used_usd: number;
};

export type OrderRow = {
  order_id: string;
  symbol: string;
  side: "buy" | "sell" | string;
  type: string;
  status: string;
  price: number | null;
  size_usd: number | null;
  leverage: number;
  created_at_epoch: number; // seconds
};

type AccountHook = {
  summary: AccountSummary | null;
  positions: PositionRow[];
  orders: OrderRow[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useAccountData(): AccountHook {
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [positions, setPositions] = useState<PositionRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOnce = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [summaryRes, posRes, ordRes] = await Promise.all([
        fetch(`${API_BASE}/api/account/summary`),
        fetch(`${API_BASE}/api/account/positions`),
        fetch(`${API_BASE}/api/account/orders`),
      ]);

      if (!summaryRes.ok) {
        throw new Error(`summary: ${summaryRes.status}`);
      }
      if (!posRes.ok) {
        throw new Error(`positions: ${posRes.status}`);
      }
      if (!ordRes.ok) {
        throw new Error(`orders: ${ordRes.status}`);
      }

      const summaryJson = (await summaryRes.json()) as AccountSummary;
      const posJson = (await posRes.json()) as {
        positions?: PositionRow[];
      };
      const ordJson = (await ordRes.json()) as {
        orders?: OrderRow[];
      };

      setSummary(summaryJson);
      setPositions(posJson.positions || []);
      setOrders(ordJson.orders || []);
    } catch (err: any) {
      console.error("useAccountData error:", err);
      setError(err?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOnce();
  }, [fetchOnce]);

  return { summary, positions, orders, loading, error, refresh: fetchOnce };
}