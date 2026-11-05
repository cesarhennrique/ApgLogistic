import { site } from "@/content/site";
import { mailHtml, sendMail } from "@/lib/mailer";
import { clientIp, createRateLimiter } from "@/lib/rate-limit";
import { fieldErrors, resumeSchema, validateResumeFile } from "@/lib/schemas";

const allow = createRateLimiter({ limit: 5, windowMs: 10 * 60_000 });
const { resume: copy } = site.forms;

// The résumé form (spec §6, "Formulários"): multipart in (the fields and the PDF), a mail to RESUME_TO_EMAIL out
// with the PDF attached, replying to the sender.
export async function POST(req: Request) {
  if (!allow(clientIp(req))) return Response.json({ error: "rate_limited" }, { status: 429 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ errors: {} }, { status: 400 });
  }
  const value = (name: string) => {
    const v = form.get(name);
    return typeof v === "string" ? v : undefined;
  };
  // A bot filled the honeypot: as if sent, and nothing sent.
  if (value("website")) return Response.json({ ok: true });

  const parsed = resumeSchema.safeParse({
    name: value("name"),
    email: value("email"),
    phone: value("phone"),
    area: value("area"),
    // a checkbox: "on" when ticked (or "true", from a script), absent otherwise
    consent: ["on", "true"].includes(value("consent") ?? "") || undefined,
    website: value("website"),
  });
  const file = form.get("file");
  const fileError = await validateResumeFile(file);
  if (!parsed.success || fileError) {
    const errors = parsed.success ? {} : fieldErrors(parsed.error);
    return Response.json({ errors: fileError ? { ...errors, file: fileError } : errors }, { status: 400 });
  }
  const r = parsed.data;
  const pdf = file as File;
  const { fields } = copy;

  try {
    const to = process.env.RESUME_TO_EMAIL;
    if (!to) throw new Error("RESUME_TO_EMAIL is not set");
    await sendMail({
      to,
      replyTo: r.email,
      subject: `${copy.mailSubject}: ${r.name}`,
      html: mailHtml(copy.mailSubject, [
        [fields.name, r.name],
        [fields.email, r.email],
        [fields.phone, r.phone],
        [fields.area, copy.areas.find((a) => a.value === r.area)!.label],
      ]),
      attachments: [{ filename: pdf.name || "curriculo.pdf", content: Buffer.from(await pdf.arrayBuffer()) }],
    });
  } catch (error) {
    console.error("curriculo: send failed", error);
    return Response.json({ error: "send_failed" }, { status: 502 });
  }
  return Response.json({ ok: true });
}
