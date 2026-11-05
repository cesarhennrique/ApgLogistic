import { expect, type Page, test } from "@playwright/test";

// The quote and résumé forms (spec §6, "Formulários"), with the API intercepted (page.route): the errors shown by
// field, a success (its stamp), and a failed send (502) offering the other ways to reach APG with what was typed
// kept. Each state saved, empty, with errors and sent, in e2e/__screenshots__/pages/.

test.use({ reducedMotion: "reduce" });

const shot = (page: Page, name: string) =>
  page.screenshot({ path: `e2e/__screenshots__/pages/${test.info().project.name}-${name}.png`, fullPage: true });

// The map's embed stays out of the tests (a third party, over the network).
test.beforeEach(async ({ page }) => {
  await page.route(/google\.com\/maps/, (route) => route.fulfill({ status: 200, contentType: "text/html", body: "<html></html>" }));
});

async function fillQuote(page: Page) {
  await page.getByLabel("Nome").fill("Aleksandra Wiśniewska");
  await page.getByLabel("E-mail").fill("compras@northwind.example.com");
  await page.getByLabel("Telefone").pressSequentially("81932021800");
  await page.getByLabel("Origem").fill("Porto de Suape");
  await page.getByLabel("Destino").fill("Petrolina – PE");
  await page.getByLabel("Tipo de carga").selectOption("container-40");
  await page.getByRole("checkbox").check();
}

async function openQuote(page: Page) {
  await page.goto("/contato");
  await page.waitForLoadState("load");
  await expect(page.getByRole("button", { name: "Enviar cotação" })).toBeEnabled();
}

test.describe("quote (/contato)", () => {
  test("empty, then the errors by field, nothing sent", async ({ page }) => {
    let posts = 0;
    await page.route("**/api/cotacao", (route) => (posts++, route.fulfill({ json: { ok: true } })));
    await openQuote(page);
    await shot(page, "contato-vazio");
    await page.getByLabel("E-mail").fill("compras@northwind");
    await page.getByRole("button", { name: "Enviar cotação" }).click();
    const email = page.getByLabel("E-mail");
    await expect(email).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#email-error")).toHaveText(/e-mail válido/);
    await expect(email).toHaveAttribute("aria-describedby", "email-error");
    for (const field of ["name", "phone", "origin", "destination", "cargoType", "consent"]) await expect(page.locator(`#${field}-error`)).toBeVisible();
    // the first field with an error has the focus
    await expect(page.getByLabel("Nome")).toBeFocused();
    expect(posts).toBe(0);
    await shot(page, "contato-erro");
  });

  test("the phone is masked as it is typed", async ({ page }) => {
    await openQuote(page);
    await page.getByLabel("Telefone").pressSequentially("81932021800");
    await expect(page.getByLabel("Telefone")).toHaveValue("(81) 93202-1800");
  });

  test("sent: the sheet stamped, the confirmation shown", async ({ page }) => {
    let body: Record<string, unknown> = {};
    await page.route("**/api/cotacao", async (route) => {
      body = route.request().postDataJSON();
      await new Promise((r) => setTimeout(r, 400));
      await route.fulfill({ json: { ok: true } });
    });
    await openQuote(page);
    await fillQuote(page);
    await page.getByRole("button", { name: "Enviar cotação" }).click();
    // sending: the button says so, and is off
    await expect(page.getByRole("button", { name: "Enviando…" })).toBeDisabled();
    await expect(page.getByRole("status")).toContainText("Cotação recebida");
    await expect(page.locator("[data-stamp]")).toHaveText("Recebido · APGU 1996-11");
    await page.locator("[data-stamp]").evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
    expect(body).toMatchObject({ name: "Aleksandra Wiśniewska", phone: "(81) 93202-1800", cargoType: "container-40", consent: true, website: "" });
    await shot(page, "contato-sucesso");
  });

  test("a failed send (502): the other ways to reach APG, what was typed kept", async ({ page }) => {
    await page.route("**/api/cotacao", (route) => route.fulfill({ status: 502, json: { error: "send_failed" } }));
    await openQuote(page);
    await fillQuote(page);
    await page.getByRole("button", { name: "Enviar cotação" }).click();
    const alert = page.getByRole("alert").filter({ hasText: "Não foi possível enviar agora" });
    await expect(alert).toBeVisible();
    // WhatsApp when its number is set (NEXT_PUBLIC_WHATSAPP_NUMBER), the 24 h phone always
    await expect(alert.getByRole("link", { name: /WhatsApp|3202-1800/ }).first()).toBeVisible();
    await expect(page.getByLabel("Nome")).toHaveValue("Aleksandra Wiśniewska");
    await expect(page.getByLabel("Telefone")).toHaveValue("(81) 93202-1800");
    await expect(page.getByRole("button", { name: "Enviar cotação" })).toBeEnabled();
  });

  test("the server's field errors (400) are shown like the browser's", async ({ page }) => {
    await page.route("**/api/cotacao", (route) => route.fulfill({ status: 400, json: { errors: { email: "Este e-mail não recebe mensagens." } } }));
    await openQuote(page);
    await fillQuote(page);
    await page.getByRole("button", { name: "Enviar cotação" }).click();
    await expect(page.locator("#email-error")).toHaveText("Este e-mail não recebe mensagens.");
  });
});

test("the CTAs lead to the quote's sheet", async ({ page, isMobile }) => {
  test.skip(isMobile, "the header's CTA is in the menu on phones");
  await page.goto("/sobre");
  await page.waitForLoadState("load");
  await page.locator("header").getByRole("link", { name: "Solicitar cotação" }).click();
  await expect(page).toHaveURL(/\/contato#cotacao$/);
  await expect(page.locator("#cotacao")).toBeInViewport();
});

async function openResume(page: Page) {
  await page.goto("/trabalhe-conosco");
  await page.waitForLoadState("load");
  await expect(page.getByRole("button", { name: "Enviar currículo" })).toBeEnabled();
}

async function fillResume(page: Page, file = "%PDF-1.4 curriculo") {
  await page.getByLabel("Nome").fill("Jo Silva");
  await page.getByLabel("E-mail").fill("jo@example.com");
  await page.getByLabel("Telefone").pressSequentially("8132021800");
  await page.getByLabel("Área de interesse").selectOption("motorista");
  await page.getByLabel("Currículo em PDF").setInputFiles({ name: "cv.pdf", mimeType: "application/pdf", buffer: Buffer.from(file) });
  await page.getByRole("checkbox").check();
}

test.describe("résumé (/trabalhe-conosco)", () => {
  test("empty, then the errors by field (a file that is not a PDF among them)", async ({ page }) => {
    await openResume(page);
    await shot(page, "trabalhe-conosco-vazio");
    await page.getByLabel("Currículo em PDF").setInputFiles({ name: "cv.pdf", mimeType: "application/pdf", buffer: Buffer.from("not a pdf") });
    await page.getByRole("button", { name: "Enviar currículo" }).click();
    for (const field of ["name", "email", "phone", "area", "file", "consent"]) await expect(page.locator(`#${field}-error`)).toBeVisible();
    await expect(page.locator("#file-error")).toHaveText(/PDF, de até 5 MB/);
    await shot(page, "trabalhe-conosco-erro");
  });

  test("sent: multipart with the PDF, the sheet stamped", async ({ page, browserName }) => {
    let type = "";
    let raw = "";
    await page.route("**/api/curriculo", async (route) => {
      type = (await route.request().headerValue("content-type")) ?? "";
      raw = route.request().postDataBuffer()?.toString() ?? "";
      await route.fulfill({ json: { ok: true } });
    });
    await openResume(page);
    await fillResume(page);
    await page.getByRole("button", { name: "Enviar currículo" }).click();
    await expect(page.getByRole("status")).toContainText("Currículo recebido");
    await expect(page.locator("[data-stamp]")).toHaveText("Recebido · APGU 1996-12");
    await page.locator("[data-stamp]").evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
    expect(type).toMatch(/^multipart\/form-data/);
    expect(raw).toContain('name="file"; filename="cv.pdf"');
    // (WebKit leaves a file's bytes out of an intercepted request's body)
    if (browserName === "chromium") expect(raw).toContain("%PDF-1.4 curriculo");
    expect(raw).toContain('name="area"');
    await shot(page, "trabalhe-conosco-sucesso");
  });

  test("a failed send (502): the other ways to reach APG, what was typed kept", async ({ page }) => {
    await page.route("**/api/curriculo", (route) => route.fulfill({ status: 502, json: { error: "send_failed" } }));
    await openResume(page);
    await fillResume(page);
    await page.getByRole("button", { name: "Enviar currículo" }).click();
    const alert = page.getByRole("alert").filter({ hasText: "Não foi possível enviar agora" });
    await expect(alert.getByRole("link", { name: /WhatsApp|3202-1800/ }).first()).toBeVisible();
    await expect(page.getByLabel("Nome")).toHaveValue("Jo Silva");
  });
});
