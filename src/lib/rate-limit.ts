/* Prosty limit żądań w pamięci procesu: okno przesuwne na klucz (IP).
   Działa per instancja serwera — na hostingu serverless (wiele instancji)
   jest tylko pierwszą barierą, więc warto dołożyć limit po stronie hostingu
   (np. Vercel Firewall) albo współdzielony magazyn. */
const hits = new Map<string, number[]>();
const MAX_KEYS = 5000;

export function isRateLimited(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);

  if (recent.length >= limit) {
    hits.set(key, recent);
    return true;
  }

  recent.push(now);
  hits.set(key, recent);

  if (hits.size > MAX_KEYS) {
    for (const [k, times] of hits) {
      if (times.every((t) => now - t >= windowMs)) hits.delete(k);
    }
  }

  return false;
}
