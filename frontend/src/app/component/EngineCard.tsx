"use client";

export default function EngineCard() {
  return (
    <div className="max-w-6xl mx-auto px-4 pb-10 text-slate-100">
      <h2 className="text-lg font-semibold mb-2">Engine Status</h2>
      <div className="rounded-xl border border-white/5 bg-black/30 px-4 py-3 text-sm">
        <p>Bot Status: <span className="font-semibold">IDLE / DEV</span></p>
        <p>Phase 1 – <span className="font-semibold">Live Watchlist</span></p>
        <p className="mt-2">Next steps:</p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>Wire signed orders (server / env key)</li>
          <li>GCP deploy for job demo</li>
        </ul>
      </div>
    </div>
  );
}