"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    fetch("http://localhost:8080/api/hello")
      .then((res) => res.text())
      .then(setMessage)
      .catch(() => setMessage("Error talking to Go Trading Engine"));
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-4">Lighter Cloud Bot</h1>
      <p className="text-lg">{message}</p>
    </main>
  );
}