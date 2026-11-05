// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sendMail = vi.fn();
vi.mock("@/lib/mailer", async (actual) => ({ ...(await actual<typeof import("@/lib/mailer")>()), sendMail }));

const { POST } = await import("./route");

const quote = {
  name: "Aleksandra Wiśniewska",
  company: "Northwind <Holdings>",
  email: "compras@northwind.example.com",
  phone: "(81) 93202-1800",
  origin: "Porto de Suape",
  destination: "Petrolina – PE",
  cargoType: "container-40",
  volume: "2 por semana",
  message: "Linha 1\nLinha 2",
  consent: true,
  website: "",
};

// Each test from its own IP, so the rate limit (5 per 10 min per IP, module state) never carries over.
let ip = 0;
const post = (body: unknown, from = `10.0.0.${++ip}`) =>
  POST(
    new Request("http://localhost/api/cotacao", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": `${from}, 172.16.0.1` },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );

describe("POST /api/cotacao", () => {
  beforeEach(() => {
    vi.stubEnv("QUOTE_TO_EMAIL", "comercial@apg.example");
    sendMail.mockReset().mockResolvedValue(undefined);
  });
  afterEach(() => vi.unstubAllEnvs());

  it("200: sends the quote to QUOTE_TO_EMAIL, replying to the user, every value escaped", async () => {
    const res = await post(quote);
    expect(res.status).toBe(200);
    expect(sendMail).toHaveBeenCalledTimes(1);
    const mail = sendMail.mock.calls[0][0];
    expect(mail.to).toBe("comercial@apg.example");
    expect(mail.replyTo).toBe("compras@northwind.example.com");
    expect(mail.html).toContain("Northwind &lt;Holdings&gt;");
    expect(mail.html).not.toContain("<Holdings>");
    expect(mail.html).toContain("Linha 1<br>Linha 2");
  });

  it("400: the errors by field, nothing sent", async () => {
    const res = await post({ ...quote, email: "x@", phone: "123", consent: false });
    expect(res.status).toBe(400);
    const { errors } = await res.json();
    expect(Object.keys(errors).sort()).toEqual(["consent", "email", "phone"]);
    expect(typeof errors.email).toBe("string");
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("400 on a body that is not JSON", async () => {
    expect((await post("{nope")).status).toBe(400);
  });

  it("honeypot filled: 200, nothing sent", async () => {
    const res = await post({ ...quote, website: "https://spam.example" });
    expect(res.status).toBe(200);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("429 past 5 posts in 10 minutes from one IP", async () => {
    for (let i = 0; i < 5; i++) expect((await post(quote, "10.9.9.9")).status).toBe(200);
    expect((await post(quote, "10.9.9.9")).status).toBe(429);
    expect(sendMail).toHaveBeenCalledTimes(5);
    expect((await post(quote, "10.9.9.10")).status).toBe(200);
  });

  it("502 when Resend fails", async () => {
    sendMail.mockRejectedValue(new Error("resend down"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await post(quote)).status).toBe(502);
  });
});
