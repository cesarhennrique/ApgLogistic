"use client";

import { useEffect, useRef } from "react";
import { site } from "@/content/site";
import { fieldErrors, quoteSchema } from "@/lib/schemas";
import { Consent, FailNotice, Honeypot, PhoneField, SelectField, SubmitButton, TextArea, TextField } from "./fields";
import { Sheet, Stamp } from "./Sheet";
import { useSend } from "./useSend";

const { quote: copy } = site.forms;

// The quote form (spec §6, "Formulários"), on /contato: POST JSON to /api/cotacao.
export function QuoteForm() {
  const { state, errors, form, send, reset } = useSend("cotacao_enviada");
  const done = useRef<HTMLDivElement>(null);
  const sending = state === "sending";
  const sent = state === "sent";
  const f = copy.fields;

  useEffect(() => {
    if (sent) done.current?.focus();
  }, [sent]);

  const values = () => {
    const data = Object.fromEntries(new FormData(form.current!)) as Record<string, string>;
    return { ...data, consent: data.consent === "on" };
  };

  return (
    <Sheet id="cotacao" code={copy.code} label={copy.label}>
      <form
        ref={form}
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          const body = values();
          void send(
            () => {
              const r = quoteSchema.safeParse(body);
              return r.success ? {} : fieldErrors(r.error);
            },
            () => fetch("/api/cotacao", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }),
          );
        }}
        className="relative mt-8"
      >
        <fieldset disabled={sending || sent} className="grid gap-x-8 gap-y-7 md:grid-cols-2">
          <TextField name="name" label={f.name} autoComplete="name" error={errors.name} />
          <TextField name="company" label={f.company} autoComplete="organization" optional error={errors.company} />
          <TextField name="email" label={f.email} type="email" autoComplete="email" error={errors.email} />
          <PhoneField name="phone" label={f.phone} error={errors.phone} />
          <TextField name="origin" label={f.origin} placeholder={copy.placeholders.origin} error={errors.origin} />
          <TextField name="destination" label={f.destination} placeholder={copy.placeholders.destination} error={errors.destination} />
          <SelectField name="cargoType" label={f.cargoType} options={copy.cargoTypes} placeholder={copy.choose} error={errors.cargoType} />
          <TextField name="volume" label={f.volume} placeholder={copy.placeholders.volume} optional error={errors.volume} />
          <TextArea name="message" label={f.message} optional error={errors.message} className="md:col-span-2" />
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
