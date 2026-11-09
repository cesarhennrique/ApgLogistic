"use client";

import { useSyncExternalStore } from "react";

// The journey's layout (spec §3, M3): a wide screen with a fine pointer gets the scrubbed, pinned journey; anything
// else (a phone, a tablet, a narrow window) the phone's: native scroll, short videos. The same split as globals.css'
// "desk" and "phone" variants. Decided once per page load (a rotated tablet keeps its layout). `?record` forces the
// desktop journey at any size: scripts/record-mobile-clips.mjs films it at a phone's.
export const DESKTOP_QUERY = "(min-width: 768px) and (pointer: fine)";
// (its negation spelt out: a "not" query can't be combined with another condition)
export const PHONE_QUERY = "(max-width: 767.98px), (pointer: coarse), (pointer: none)";
// A query, only without reduced motion (each of its branches).
export const motionSafe = (query: string) =>
  query
    .split(", ")
    .map((q) => `${q} and (prefers-reduced-motion: no-preference)`)
    .join(", ");

let phone: boolean | null = null;
export function isPhoneLayout() {
  phone ??= !window.matchMedia(DESKTOP_QUERY).matches && !new URLSearchParams(window.location.search).has("record");
  return phone;
}

const noop = () => () => {};

// null on the server and while hydrating: nothing is known of the device yet.
export function usePhoneLayout(): boolean | null {
  return useSyncExternalStore(noop, isPhoneLayout, () => null);
}

// Fired once the chosen journey has mounted (its sections are in the page): the hero and the header then look
// them up.
export const JOURNEY_MOUNTED = "journey:mounted";
