import { site } from "@/content/site";
import { mailHtml, sendMail } from "@/lib/mailer";
import { clientIp, createRateLimiter } from "@/lib/rate-limit";
import { fieldErrors, quoteSchema } from "@/lib/schemas";

const allow = createRateLimiter({ limit: 5, windowMs: 10 * 60_000 });
const { quote: copy } = site.forms;

// The quote form (spec §6, "Formulários"): JSON in, a mail to QUOTE_TO_EMAIL out, replying to the sender.
export async function POST(req: Request) {
  if (!allow(clientIp(req))) return Response.json({ error: "rate_limited" }, { status: 429 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ errors: {} }, { status: 400 });
  }
  // A bot filled the honeypot: as if sent, and nothing sent.
  if (typeof body === "object" && body && "website" in body && body.website) return Response.json({ ok: true });

  const parsed = quoteSchema.safeParse(body);
  if (!parsed.success) return Response.json({ errors: fieldErrors(parsed.error) }, { status: 400 });
  const q = parsed.data;
  const { fields } = copy;

  try {
    const to = process.env.QUOTE_TO_EMAIL;
    if (!to) throw new Error("QUOTE_TO_EMAIL is not set");
    await sendMail({
      to,
      replyTo: q.email,
      subject: `${copy.mailSubject}: ${q.name}`,
      html: mailHtml(copy.mailSubject, [
        [fields.name, q.name],
        [fields.company, q.company ?? ""],
        [fields.email, q.email],
        [fields.phone, q.phone],
        [fields.origin, q.origin],
        [fields.destination, q.destination],
        [fields.cargoType, copy.cargoTypes.find((c) => c.value === q.cargoType)!.label],
        [fields.volume, q.volume ?? ""],
        [fields.message, q.message ?? ""],
      ]),
    });
  } catch (error) {
    console.error("cotacao: send failed", error);
    return Response.json({ error: "send_failed" }, { status: 502 });
  }
  return Response.json({ ok: true });
}
