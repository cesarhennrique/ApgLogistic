"use client";

import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { TransitionLink } from "@/components/layout/TransitionLink";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { site } from "@/content/site";
import { maskPhone } from "@/lib/phone";

// The technical sheet's fields (spec §6, revisão 2026-11-05): a small mono label in caps, the value on a navy base
// line, a red underline drawing in from the left on focus; the field's error under it (aria-describedby).

const { forms } = site;

type Common = { name: string; label: string; error?: string; optional?: boolean; className?: string };

const errorId = (name: string) => `${name}-error`;
const describe = (name: string, error?: string, hint?: string) =>
  [hint && `${name}-hint`, error && errorId(name)].filter(Boolean).join(" ") || undefined;

function Frame({ name, label, error, optional, hint, className = "", children }: Common & { hint?: string; children: ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={name} className="block font-mono text-[11px] tracking-[0.16em] text-navy-900/75 uppercase">
        {label}
        {optional && <span className="tracking-normal normal-case"> ({forms.optional})</span>}
      </label>
      {/* the base line, and the focus line over it */}
      <div className="relative mt-1.5">
        {children}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-red-500 transition-transform duration-200 ease-out peer-focus:scale-x-100 motion-reduce:transition-none"
        />
      </div>
      {hint && (
        <p id={`${name}-hint`} className="mt-1.5 font-mono text-[11px] text-navy-900/70">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId(name)} className="mt-2 flex items-baseline gap-2 text-sm text-navy-900">
          <span aria-hidden="true" className="size-1.5 shrink-0 translate-y-[-0.1em] bg-red-500" />
          {error}
        </p>
      )}
    </div>
  );
}

const control =
  "peer block w-full rounded-none border-0 border-b border-navy-900 bg-transparent px-0 py-2 text-base text-navy-900 placeholder:text-navy-900/40 focus:outline-none aria-invalid:border-red-500 disabled:opacity-60";

export function TextField({ hint, ...props }: Common & { hint?: string } & Omit<InputHTMLAttributes<HTMLInputElement>, "name">) {
  const { name, label, error, optional, className, ...input } = props;
  return (
    <Frame {...{ name, label, error, optional, hint, className }}>
      <input
        id={name}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describe(name, error, hint)}
        className={`${control} file:mr-4 file:border-0 file:bg-navy-900 file:px-3 file:py-1.5 file:font-mono file:text-xs file:tracking-[0.12em] file:text-sand-50 file:uppercase`}
        {...input}
      />
    </Frame>
  );
}

// The phone, masked as it is typed ("(81) 93202-1800").
export function PhoneField(props: Common) {
  return (
    <TextField
      {...props}
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      maxLength={15}
      onChange={(e) => {
        e.currentTarget.value = maskPhone(e.currentTarget.value);
      }}
    />
  );
}

export function SelectField({
  options,
  placeholder,
  ...props
}: Common & { options: readonly { value: string; label: string }[]; placeholder: string } & Omit<SelectHTMLAttributes<HTMLSelectElement>, "name">) {
  const { name, label, error, optional, className, ...select } = props;
  return (
    <Frame {...{ name, label, error, optional, className }}>
      <select
        id={name}
        name={name}
        defaultValue=""
        aria-invalid={error ? true : undefined}
        aria-describedby={describe(name, error)}
        className={`${control} appearance-none pr-8`}
        {...select}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <span aria-hidden="true" className="pointer-events-none absolute top-1/2 right-1 -translate-y-1/2 text-sm text-navy-900">
        ▾
      </span>
    </Frame>
  );
}

export function TextArea(props: Common & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "name">) {
  const { name, label, error, optional, className, ...area } = props;
  return (
    <Frame {...{ name, label, error, optional, className }}>
      <textarea
        id={name}
        name={name}
        rows={4}
        aria-invalid={error ? true : undefined}
        aria-describedby={describe(name, error)}
        className={`${control} resize-y`}
        {...area}
      />
    </Frame>
  );
}

// LGPD: the consent, with the privacy page a link away.
export function Consent({ error }: { error?: string }) {
  return (
    <div>
      <div className="flex items-start gap-3">
        <input
          id="consent"
          name="consent"
          type="checkbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId("consent") : undefined}
          className="mt-0.5 size-5 shrink-0 accent-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-900"
        />
        <label htmlFor="consent" className="text-sm leading-snug text-navy-900/85">
          {forms.consent[0]}{" "}
          <TransitionLink
            href={site.legal.privacy.href}
            className="font-semibold text-navy-900 underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-900"
          >
            {site.legal.privacy.label}
          </TransitionLink>{" "}
          {forms.consent[1]}
        </label>
      </div>
      {error && (
        <p id={errorId("consent")} className="mt-2 flex items-baseline gap-2 text-sm text-navy-900">
          <span aria-hidden="true" className="size-1.5 shrink-0 bg-red-500" />
          {error}
        </p>
      )}
    </div>
  );
}

// The honeypot: off screen, out of the tab order and of the accessibility tree; bots fill it, people never see it.
export function Honeypot() {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label htmlFor="website">{forms.honeypot}</label>
      <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
    </div>
  );
}

// A send that failed (or was refused for too many sends): what happened, and the other ways to reach APG.
export function FailNotice({ rateLimited }: { rateLimited: boolean }) {
  const phone = site.phones[0];
  return (
    <div role="alert" className="border-l-2 border-red-500 bg-[#fefefe] p-4">
      <p className="font-semibold text-navy-900">{forms.failTitle}</p>
      <p className="mt-1 text-sm text-navy-900/80">{rateLimited ? forms.rateLimited : forms.failText}</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-navy-900">
        <WhatsAppButton variant="inline" />
        <a
          href={phone.href}
          className="font-mono-tabular text-base underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-900"
        >
          {phone.display}
        </a>
      </div>
    </div>
  );
}

export function SubmitButton({ sending, label }: { sending: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={sending}
      aria-disabled={sending}
      className="group inline-flex min-h-11 items-center gap-3 bg-red-500 px-6 py-3 text-sm font-semibold tracking-wide text-white uppercase transition-transform duration-150 ease-out active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-navy-900 disabled:cursor-wait disabled:opacity-70 motion-reduce:transition-none md:text-base"
    >
      {sending ? forms.sending : label}
      <span aria-hidden="true" className="mask-arrow h-[0.72em] w-[1.6em] shrink-0 bg-current transition-transform duration-150 ease-out group-hover:translate-x-1 group-disabled:translate-x-0 motion-reduce:transition-none" />
    </button>
  );
}
