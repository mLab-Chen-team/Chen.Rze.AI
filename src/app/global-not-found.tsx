import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nie znaleziono strony | Księga i Miecz",
};

/* Ta strona omija layouty (aplikacja ma dwa root layouty), więc sama
   dostarcza <html> i style. */
export default function GlobalNotFound() {
  return (
    <html lang="pl">
      <body className="flex min-h-screen flex-col items-center justify-center gap-6 bg-paper px-4 text-center text-ink-soft">
        <p className="text-sm tracking-[0.22em] text-ink-muted uppercase">
          Błąd 404
        </p>
        <h1 className="text-3xl text-ink">Nie znaleziono strony</h1>
        <p className="max-w-md text-base">
          Adres, który wpisałeś, nie istnieje albo strona została przeniesiona.
        </p>
        <Link
          href="/"
          className="border border-seal px-6 py-3 text-xs font-bold tracking-[0.22em] text-seal uppercase"
        >
          Wróć na stronę festiwalu
        </Link>
      </body>
    </html>
  );
}
