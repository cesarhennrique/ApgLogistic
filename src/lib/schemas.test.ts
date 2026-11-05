import { describe, expect, it } from "vitest";
import { quoteSchema, resumeSchema, validateResumeFile } from "./schemas";

const quote = {
  name: "Aleksandra Wiśniewska",
  company: "",
  email: "compras@northwind.example.com",
  phone: "(81) 93202-1800",
  origin: "Porto de Suape",
  destination: "Petrolina – PE",
  cargoType: "container-40",
  volume: "2 containers por semana",
  message: "",
  consent: true,
  website: "",
};

// The fields a parse fails on.
const failing = (result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) =>
  result.success ? [] : [...new Set(result.error!.issues.map((i) => String(i.path[0])))];

describe("quoteSchema", () => {
  it("accepts a filled quote, the phone as its digits", () => {
    const r = quoteSchema.safeParse(quote);
    expect(r.success).toBe(true);
    expect(r.data!.phone).toBe("81932021800");
  });

  it("name: 2 to 100 characters, trimmed", () => {
    expect(failing(quoteSchema.safeParse({ ...quote, name: " J " }))).toEqual(["name"]);
    expect(failing(quoteSchema.safeParse({ ...quote, name: "Jo" }))).toEqual([]);
    expect(failing(quoteSchema.safeParse({ ...quote, name: "a".repeat(100) }))).toEqual([]);
    expect(failing(quoteSchema.safeParse({ ...quote, name: "a".repeat(101) }))).toEqual(["name"]);
  });

  it("company: optional, up to 120", () => {
    const without: Partial<typeof quote> = { ...quote };
    delete without.company;
    expect(failing(quoteSchema.safeParse(without))).toEqual([]);
    expect(failing(quoteSchema.safeParse({ ...quote, company: "a".repeat(120) }))).toEqual([]);
    expect(failing(quoteSchema.safeParse({ ...quote, company: "a".repeat(121) }))).toEqual(["company"]);
  });

  it("email: a valid address", () => {
    expect(failing(quoteSchema.safeParse({ ...quote, email: "compras@northwind" }))).toEqual(["email"]);
    expect(failing(quoteSchema.safeParse({ ...quote, email: "" }))).toEqual(["email"]);
  });

  it("phone: 10 or 11 digits once the mask is off", () => {
    expect(failing(quoteSchema.safeParse({ ...quote, phone: "(81) 3202-1800" }))).toEqual([]);
    expect(failing(quoteSchema.safeParse({ ...quote, phone: "(81) 3202-180" }))).toEqual(["phone"]);
    expect(failing(quoteSchema.safeParse({ ...quote, phone: "(81) 93202-18000" }))).toEqual(["phone"]);
    expect(failing(quoteSchema.safeParse({ ...quote, phone: "" }))).toEqual(["phone"]);
  });

  it("origin and destination: required", () => {
    expect(failing(quoteSchema.safeParse({ ...quote, origin: "", destination: " " }))).toEqual(["origin", "destination"]);
  });

  it("cargoType: one of the five", () => {
    for (const cargoType of ["container-20", "container-40", "fracionada", "armazenagem", "outro"])
      expect(failing(quoteSchema.safeParse({ ...quote, cargoType }))).toEqual([]);
    expect(failing(quoteSchema.safeParse({ ...quote, cargoType: "granel" }))).toEqual(["cargoType"]);
    expect(failing(quoteSchema.safeParse({ ...quote, cargoType: "" }))).toEqual(["cargoType"]);
  });

  it("volume up to 100, message up to 2000, both optional", () => {
    expect(failing(quoteSchema.safeParse({ ...quote, volume: "", message: "" }))).toEqual([]);
    expect(failing(quoteSchema.safeParse({ ...quote, volume: "a".repeat(101) }))).toEqual(["volume"]);
    expect(failing(quoteSchema.safeParse({ ...quote, message: "a".repeat(2000) }))).toEqual([]);
    expect(failing(quoteSchema.safeParse({ ...quote, message: "a".repeat(2001) }))).toEqual(["message"]);
  });

  it("consent: only true", () => {
    expect(failing(quoteSchema.safeParse({ ...quote, consent: false }))).toEqual(["consent"]);
    expect(failing(quoteSchema.safeParse({ ...quote, consent: "true" }))).toEqual(["consent"]);
  });

  it("website (honeypot): must stay empty", () => {
    expect(failing(quoteSchema.safeParse({ ...quote, website: "https://spam.example" }))).toEqual(["website"]);
  });
});

const resume = {
  name: "Jo Silva",
  email: "jo@example.com",
  phone: "81932021800",
  area: "motorista",
  consent: true,
  website: "",
};

describe("resumeSchema", () => {
  it("accepts a filled form", () => {
    expect(failing(resumeSchema.safeParse(resume))).toEqual([]);
  });

  it("checks name, email, phone, consent like the quote", () => {
    expect(failing(resumeSchema.safeParse({ ...resume, name: "J", email: "jo@", phone: "123", consent: false }))).toEqual([
      "name",
      "email",
      "phone",
      "consent",
    ]);
  });

  it("area: one of the five", () => {
    for (const area of ["operacao", "motorista", "administrativo", "comercial", "outro"])
      expect(failing(resumeSchema.safeParse({ ...resume, area }))).toEqual([]);
    expect(failing(resumeSchema.safeParse({ ...resume, area: "ti" }))).toEqual(["area"]);
  });

  it("website (honeypot): must stay empty", () => {
    expect(failing(resumeSchema.safeParse({ ...resume, website: "x" }))).toEqual(["website"]);
  });
});

const pdf = (bytes: string, size = bytes.length, type = "application/pdf") => {
  const body = new Uint8Array(size);
  body.set(new TextEncoder().encode(bytes).subarray(0, size));
  return new File([body], "cv.pdf", { type });
};

describe("validateResumeFile", () => {
  it("accepts a PDF up to 5 MB", async () => {
    expect(await validateResumeFile(pdf("%PDF-1.7"))).toBeNull();
    expect(await validateResumeFile(pdf("%PDF-1.7", 5 * 1024 * 1024))).toBeNull();
  });

  it("refuses no file, another type, more than 5 MB, or bytes that are not a PDF", async () => {
    expect(await validateResumeFile(null)).not.toBeNull();
    expect(await validateResumeFile(pdf("%PDF-1.7", 0))).not.toBeNull();
    expect(await validateResumeFile(pdf("%PDF-1.7", 10, "image/png"))).not.toBeNull();
    expect(await validateResumeFile(pdf("%PDF-1.7", 5 * 1024 * 1024 + 1))).not.toBeNull();
    expect(await validateResumeFile(pdf("MZ\x90\x00 not a pdf"))).not.toBeNull();
  });
});
