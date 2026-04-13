export function startKeepAlive() {
  if (typeof window === "undefined") return;
  
  const ping = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/health`, {
        method: "GET",
        cache: "no-store",
      });
    } catch (_) {}
  };

  // Ping every 10 minutes to prevent cold start
  ping();
  setInterval(ping, 10 * 60 * 1000);
}
