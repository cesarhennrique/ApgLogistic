import { z } from "zod";
import { site } from "@/content/site";

// The forms' rules (spec §6, "Formulários"): checked in the browser on submit and again, for real, in the route.
const { errors } = site.forms;

const text = (error: string, min: number, max: number) => z.string({ error }).trim().min(min, { error }).max(max, { error });
const optionalText = (error: string, max: number) => z.string({ error }).trim().max(max, { error }).optional();
const email = z.string({ error: errors.email }).trim().pipe(z.email({ error: errors.email }));
// Typed with its mask, "(81) 93202-1800": 10 or 11 digits once it is off (landline or mobile, with the area code).
const phone = z
  .string({ error: errors.phone })
  .transform((v) => v.replace(/\D/g, ""))
  .pipe(z.string().regex(/^\d{10,11}$/, { error: errors.phone }));
const consent = z.literal(true, { error: errors.consent });
// The honeypot: hidden from people, filled in by bots.
const website = z.string().max(0, { error: errors.website }).optional();

export const CARGO_TYPES = ["container-20", "container-40", "fracionada", "armazenagem", "outro"] as const;
export const AREAS = ["operacao", "motorista", "administrativo", "comercial", "outro"] as const;

export const quoteSchema = z.object({
  name: text(errors.name, 2, 100),
  company: optionalText(errors.company, 120),
  email,
  phone,
  origin: text(errors.origin, 2, 120),
  destination: text(errors.destination, 2, 120),
  cargoType: z.enum(CARGO_TYPES, { error: errors.cargoType }),
  volume: optionalText(errors.volume, 100),
  message: optionalText(errors.message, 2000),
  consent,
  website,
});

export const resumeSchema = z.object({
  name: text(errors.name, 2, 100),
  email,
  phone,
  area: z.enum(AREAS, { error: errors.area }),
  consent,
  website,
});

export type Quote = z.infer<typeof quoteSchema>;
export type Resume = z.infer<typeof resumeSchema>;

export const MAX_RESUME_BYTES = 5 * 1024 * 1024;

// The résumé's file, on its own (it comes as a File, not JSON): a PDF of up to 5 MB, by its type and by its first
// bytes ("%PDF"; the type alone is whatever the browser says). The error message, or null.
export async function validateResumeFile(file: unknown): Promise<string | null> {
  if (!(file instanceof File) || file.size === 0 || file.size > MAX_RESUME_BYTES || file.type !== "application/pdf")
    return errors.file;
  const head = new TextDecoder().decode(await file.slice(0, 4).arrayBuffer());
  return head === "%PDF" ? null : errors.file;
}

// One message per field: the first of its issues.
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) out[String(issue.path[0])] ??= issue.message;
  return out;
}
