"use client";

import { useEffect, useRef } from "react";
import { site } from "@/content/site";
import { fieldErrors, resumeSchema, validateResumeFile } from "@/lib/schemas";
import { Consent, FailNotice, Honeypot, PhoneField, SelectField, SubmitButton, TextField } from "./fields";
import { Sheet, Stamp } from "./Sheet";
import { useSend } from "./useSend";

const { resume: copy } = site.forms;

// The résumé form (spec §6, "Formulários"), on /trabalhe-conosco: POST multipart (the fields and the PDF) to
// /api/curriculo.
export function ResumeForm() {
  const { state, errors, form, send, reset } = useSend("curriculo_enviado");
  const done = useRef<HTMLDivElement>(null);
  const sending = state === "sending";
  const sent = state === "sent";
  const f = copy.fields;

  useEffect(() => {
    if (sent) done.current?.focus();
  }, [sent]);

  return (
    <Sheet id="curriculo" code={copy.code} label={copy.label}>
      <form
        ref={form}
        noValidate
        encType="multipart/form-data"
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(form.current!);
          const text = (k: string) => String(data.get(k) ?? "");
          void send(
            async () => {
              const r = resumeSchema.safeParse({
                name: text("name"),
                email: text("email"),
                phone: text("phone"),
                area: text("area"),
                consent: data.get("consent") === "on",
                website: text("website"),
              });
              const out = r.success ? {} : fieldErrors(r.error);
              const file = await validateResumeFile(data.get("file"));
              return file ? { ...out, file } : out;
            },
            () => fetch("/api/curriculo", { method: "POST", body: data }),
          );
        }}
        className="relative mt-8"
      >
        <fieldset disabled={sending || sent} className="grid gap-x-8 gap-y-7 md:grid-cols-2">
          <TextField name="name" label={f.name} autoComplete="name" error={errors.name} />
          <TextField name="email" label={f.email} type="email" autoComplete="email" error={errors.email} />
          <PhoneField name="phone" label={f.phone} error={errors.phone} />
          <SelectField name="area" label={f.area} options={copy.areas} placeholder={copy.choose} error={errors.area} />
          <TextField
            name="file"
            label={f.file}
            type="file"
            accept="application/pdf,.pdf"
            hint={copy.fileHint}
            error={errors.file}
            className="md:col-span-2"
          />
          <div className="md:col-span-2">
            <Consent error={errors.consent} />
          </div>
          <Honeypot />
        </fieldset>
        <div className="mt-8 grid gap-6">
          {(state === "failed" || state === "limited") && <FailNotice rateLimited={state === "limited"} />}
          {Object.keys(errors).length > 0 && (
            <p role="alert" className="text-sm font-semibold text-navy-900">
              {site.forms.invalid}
            </p>
          )}
          {sent ? (
            <div ref={done} tabIndex={-1} role="status" className="flex flex-wrap items-start justify-between gap-x-8 gap-y-6 outline-none">
              <div>
                <p className="font-condensed text-3xl leading-none font-bold uppercase">{copy.successTitle}</p>
                <p className="mt-2 max-w-[46ch] text-navy-900/80">{copy.successText}</p>
                <button
                  type="button"
                  onClick={reset}
                  className="mt-4 font-mono text-xs tracking-[0.12em] uppercase underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-900"
                >
                  {copy.again}
                </button>
              </div>
              <Stamp code={copy.code} />
            </div>
          ) : (
            <div>
              <SubmitButton sending={sending} label={copy.submit} />
            </div>
          )}
        </div>
      </form>
    </Sheet>
  );
}
