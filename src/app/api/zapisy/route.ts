import { FIELD_NAMES, validateField, type FieldName } from "@/lib/registration";
import { getContent } from "@/lib/content";
import { appendRow } from "@/lib/sheets";
import { isRateLimited } from "@/lib/rate-limit";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 10_000;
/* Dość luźny limit: na wydarzeniu wiele osób może zapisywać się z jednej sieci Wi-Fi. */
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 10 * 60 * 1000;

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

/* Przeglądarka dla POST zawsze wysyła Origin. Jeśli jest i nie pasuje do
   hosta strony, żądanie przyszło z cudzej witryny. */
function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return Response.json({ ok: false }, { status: 403 });
  }

  if (!request.headers.get("content-type")?.includes("application/json")) {
    return Response.json({ ok: false }, { status: 415 });
  }

  if (isRateLimited(clientIp(request), RATE_LIMIT, RATE_WINDOW_MS)) {
    return Response.json(
      {
        ok: false,
        message: "Zbyt wiele prób. Spróbuj ponownie za kilka minut.",
      },
      { status: 429, headers: { "Retry-After": "600" } },
    );
  }

  let body: unknown;

  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return Response.json({ ok: false }, { status: 413 });
    }
    body = JSON.parse(raw);
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return Response.json({ ok: false }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  const readField = (name: string) => String(payload[name] ?? "").trim();

  if (readField("website")) {
    return Response.json({ ok: true });
  }

  const content = await getContent();
  const allowedWorkshops = content.workshops.map((workshop) => workshop.title);

  const errors: Partial<Record<FieldName, string>> = {};

  for (const name of FIELD_NAMES) {
    const message = validateField(name, readField(name));
    if (message) errors[name] = message;
  }

  const workshop = readField("workshop");
  if (!errors.workshop && !allowedWorkshops.includes(workshop)) {
    errors.workshop =
      "Ten warsztat nie jest już dostępny. Odśwież stronę i wybierz z aktualnej listy.";
  }

  if (Object.keys(errors).length > 0) {
    return Response.json({ ok: false, errors }, { status: 400 });
  }

  const submittedAt = new Intl.DateTimeFormat("pl-PL", {
    timeZone: "Europe/Warsaw",
    dateStyle: "short",
    timeStyle: "medium",
  }).format();

  try {
    await appendRow([
      readField("firstName"),
      readField("lastName"),
      readField("email"),
      readField("phone"),
      workshop,
      submittedAt,
    ]);
  } catch (err) {
    console.error("[zapisy] Nie udało się dopisać wiersza do arkusza.", err);
    return Response.json(
      {
        ok: false,
        message:
          "Nie udało się zapisać zgłoszenia. Spróbuj ponownie za chwilę.",
      },
      { status: 502 },
    );
  }

  return Response.json({ ok: true });
}
