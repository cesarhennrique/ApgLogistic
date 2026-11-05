// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sendMail = vi.fn();
vi.mock("@/lib/mailer", async (actual) => ({ ...(await actual<typeof import("@/lib/mailer")>()), sendMail }));

const { POST } = await import("./route");

const fields = {
  name: "Jo <b>Silva</b>",
  email: "jo@example.com",
  phone: "(81) 93202-1800",
  area: "motorista",
  consent: "on",
  website: "",
};
const pdf = (bytes = "%PDF-1.7 …", type = "application/pdf") => new File([bytes], "cv.pdf", { type });

let ip = 0;
const post = (values: Record<string, string> = fields, file: File | null = pdf(), from = `10.1.0.${++ip}`) => {
  const form = new FormData();
  for (const [k, v] of Object.entries(values)) form.set(k, v);
  if (file) form.set("file", file);
  return POST(new Request("http://localhost/api/curriculo", { method: "POST", headers: { "x-forwarded-for": from }, body: form }));
};

describe("POST /api/curriculo", () => {
  beforeEach(() => {
    vi.stubEnv("RESUME_TO_EMAIL", "rh@apg.example");
    sendMail.mockReset().mockResolvedValue(undefined);
  });
  afterEach(() => vi.unstubAllEnvs());

  it("200: sends the résumé to RESUME_TO_EMAIL with the PDF attached, replying to the user", async () => {
    const res = await post();
    expect(res.status).toBe(200);
    const mail = sendMail.mock.calls[0][0];
    expect(mail.to).toBe("rh@apg.example");
    expect(mail.replyTo).toBe("jo@example.com");
    expect(mail.html).toContain("Jo &lt;b&gt;Silva&lt;/b&gt;");
    expect(mail.attachments).toHaveLength(1);
    expect(mail.attachments[0].filename).toBe("cv.pdf");
    expect(Buffer.from(mail.attachments[0].content).subarray(0, 4).toString()).toBe("%PDF");
  });

  it("400: field errors, the file's among them", async () => {
    const res = await post({ ...fields, area: "ti", consent: "" }, pdf("not a pdf"));
    expect(res.status).toBe(400);
    const { errors } = await res.json();
    expect(Object.keys(errors).sort()).toEqual(["area", "consent", "file"]);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("400 without a file", async () => {
    const res = await post(fields, null);
    expect(res.status).toBe(400);
    expect(Object.keys((await res.json()).errors)).toEqual(["file"]);
  });

  it("honeypot filled: 200, nothing sent", async () => {
    expect((await post({ ...fields, website: "x" })).status).toBe(200);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("429 past 5 posts in 10 minutes from one IP", async () => {
    for (let i = 0; i < 5; i++) expect((await post(fields, pdf(), "10.8.8.8")).status).toBe(200);
    expect((await post(fields, pdf(), "10.8.8.8")).status).toBe(429);
  });

  it("502 when Resend fails", async () => {
    sendMail.mockRejectedValue(new Error("resend down"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await post()).status).toBe(502);
  });
});
