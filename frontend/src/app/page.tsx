// frontend/src/app/page.tsx
"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-black/50 border border-purple-800 rounded-2xl p-6 text-center shadow-xl">
        <h1 className="text-xl font-semibold text-purple-50 mb-2">
          Lighter Cloud Bot – Dashboard
        </h1>
        <p className="text-sm text-purple-200/80 mb-4">
          Choose a view to start monitoring markets and your account.
        </p>
        <div className="flex flex-col gap-2 text-sm">
          <Link
            href="/dashboard/markets"
            className="block w-full rounded-xl border border-purple-600 bg-purple-700/70 py-2 hover:bg-purple-600 text-purple-50"
          >
            Markets
          </Link>
          <Link
            href="/dashboard/trades"
            className="block w-full rounded-xl border border-purple-700 bg-black/40 py-2 hover:bg-purple-900/60 text-purple-100"
          >
            Trades
          </Link>
          <Link
            href="/dashboard/account"
            className="block w-full rounded-xl border border-purple-700 bg-black/40 py-2 hover:bg-purple-900/60 text-purple-100"
          >
            Account
          </Link>
        </div>
      </div>
    </main>
  );
}