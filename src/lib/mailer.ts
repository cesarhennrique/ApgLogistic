import { Resend } from "resend";

type Mail = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  attachments?: { filename: string; content: Buffer }[];
};

const env = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
};

// Sends through Resend (RESEND_API_KEY), from MAIL_FROM. Throws on a missing variable or a refused send.
export async function sendMail({ to, subject, html, replyTo, attachments }: Mail): Promise<void> {
  const resend = new Resend(env("RESEND_API_KEY"));
  const from = env("MAIL_FROM");
  const { error } = await resend.emails.send({ from, to, subject, html, replyTo, attachments });
  if (error) throw new Error(`Resend: ${error.message}`);
}

export const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

// A plain mail: its title and a table of label/value rows, every one escaped (they come from a form); line breaks
// kept.
export function mailHtml(title: string, rows: [label: string, value: string][]): string {
  const cell = (v: string) => escapeHtml(v).replace(/\r?\n/g, "<br>");
  return `<h1 style="font:600 18px sans-serif">${cell(title)}</h1><table style="font:14px sans-serif;border-collapse:collapse">${rows
    .map(([label, value]) => `<tr><th align="left" valign="top" style="padding:4px 12px 4px 0">${cell(label)}</th><td style="padding:4px 0">${cell(value)}</td></tr>`)
    .join("")}</table>`;
}
