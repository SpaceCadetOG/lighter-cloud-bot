"use client";

import React from "react";
import AccountSummaryView from "../../component/AccountSummary";
import { useAccountData } from "../../component/hooks/useAccountData";

export default function AccountPage() {
  const { summary, positions, orders, loading, error, refresh } =
    useAccountData();

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#24004b] via-[#0a0017] to-black text-white">
      <AccountSummaryView
        summary={summary}
        positions={positions || []}
        orders={orders || []}
        loading={loading}
        error={error}
        onRefresh={refresh}
      />
    </main>
  );
}