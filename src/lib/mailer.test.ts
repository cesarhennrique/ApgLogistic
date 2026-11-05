// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const send = vi.fn();
vi.mock("resend", () => ({
  Resend: class {
    emails = { send };
    constructor(public key: string) {}
  },
}));

const { escapeHtml, mailHtml, sendMail } = await import("./mailer");

describe("sendMail", () => {
  beforeEach(() => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("MAIL_FROM", "Site APG <site@apgtransportes.com.br>");
    send.mockReset();
  });
  afterEach(() => vi.unstubAllEnvs());

  it("sends through Resend, from MAIL_FROM, with the reply-to", async () => {
    send.mockResolvedValue({ data: { id: "1" }, error: null });
    await sendMail({ to: "comercial@apg.example", subject: "Cotação", html: "<p>x</p>", replyTo: "a@b.example" });
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Site APG <site@apgtransportes.com.br>",
        to: "comercial@apg.example",
        subject: "Cotação",
        html: "<p>x</p>",
        replyTo: "a@b.example",
      }),
    );
  });

  it("throws on a missing RESEND_API_KEY or MAIL_FROM, sending nothing", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    await expect(sendMail({ to: "x@y.example", subject: "s", html: "h" })).rejects.toThrow(/RESEND_API_KEY/);
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("MAIL_FROM", "");
    await expect(sendMail({ to: "x@y.example", subject: "s", html: "h" })).rejects.toThrow(/MAIL_FROM/);
    expect(send).not.toHaveBeenCalled();
  });

  it("throws when Resend answers with an error", async () => {
    send.mockResolvedValue({ data: null, error: { name: "validation_error", message: "bad from" } });
    await expect(sendMail({ to: "x@y.example", subject: "s", html: "h" })).rejects.toThrow(/bad from/);
  });
});

describe("mailHtml", () => {
  it("escapes every value (and label)", () => {
    expect(escapeHtml(`<script>"x" & 'y'</script>`)).toBe("&lt;script&gt;&quot;x&quot; &amp; &#39;y&#39;&lt;/script&gt;");
    const html = mailHtml("Cotação <nova>", [["Nome", "<img src=x onerror=alert(1)>"]]);
    expect(html).not.toContain("<img");
    expect(html).not.toContain("<nova>");
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
  });

  it("keeps a message's line breaks", () => {
    expect(mailHtml("t", [["Mensagem", "a\nb"]])).toContain("a<br>b");
  });
});
