"use client";

import { track } from "@vercel/analytics";
import { useRef, useState } from "react";

export type SendState = "idle" | "sending" | "sent" | "failed" | "limited";

// A form's send (spec §6): the browser's check first (its errors by field), then the route; a 400's field errors
// shown the same way; any other failure kept apart (the typed values stay: the fields are never cleared on error).
// The conversion event on success (spec §6, "LGPD e analytics").
export function useSend(event: "cotacao_enviada" | "curriculo_enviado") {
  const [state, setState] = useState<SendState>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const form = useRef<HTMLFormElement>(null);

  const focusFirst = (fields: Record<string, string>) => {
    const first = Object.keys(fields)[0];
    if (first) form.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  };

  async function send(check: () => Promise<Record<string, string>> | Record<string, string>, request: () => Promise<Response>) {
    const invalid = await check();
    setErrors(invalid);
    if (Object.keys(invalid).length) {
      setState("idle");
      focusFirst(invalid);
      return;
    }
    setState("sending");
    try {
      const res = await request();
      if (res.ok) {
        track(event);
        setState("sent");
        return;
      }
      if (res.status === 400) {
        const fields = ((await res.json().catch(() => ({}))) as { errors?: Record<string, string> }).errors ?? {};
        setErrors(fields);
        setState(Object.keys(fields).length ? "idle" : "failed");
        focusFirst(fields);
        return;
      }
      setState(res.status === 429 ? "limited" : "failed");
    } catch {
      setState("failed");
    }
  }

  const reset = () => {
    form.current?.reset();
    setErrors({});
    setState("idle");
  };

  return { state, errors, form, send, reset };
}
