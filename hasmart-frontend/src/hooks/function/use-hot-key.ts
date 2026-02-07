// useHotkey.ts
import { useEffect, useRef } from "react";

type HotkeyOptions = {
  enabled?: boolean; // default: true
  preventDefault?: boolean; // default: true
  stopPropagation?: boolean; // default: false
  allowRepeat?: boolean; // default: false (biar gak spam saat key ditahan)
  allowInInputs?: boolean; // default: true  (boleh jalan saat fokus di input/textarea)
  requireNoExtraModifiers?: boolean; // default: true  (blok Alt/Shift biar gak bentrok)
  capture?: boolean; // default: true  (lebih “prioritas”)
  ignoreComposing?: boolean; // default: true  (IME Jepang, dsb)
  target?: Document | Window | HTMLElement | null; // default: document
};

type HotkeyMatcher = (e: KeyboardEvent) => boolean;

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();

  if (target.isContentEditable) return true;
  if (tag === "input") {
    const type = (target as HTMLInputElement).type?.toLowerCase() ?? "text";
    // tipe input yang biasanya tidak “ngetik teks”
    const nonText = new Set([
      "button",
      "checkbox",
      "color",
      "file",
      "hidden",
      "image",
      "radio",
      "range",
      "reset",
      "submit",
    ]);
    return (
      !nonText.has(type) &&
      !(target as HTMLInputElement).readOnly &&
      !(target as HTMLInputElement).disabled
    );
  }
  if (tag === "textarea") {
    const el = target as HTMLTextAreaElement;
    return !el.readOnly && !el.disabled;
  }
  if (tag === "select") return true;

  return false;
}

export function useHotkey(
  matcher: HotkeyMatcher,
  handler: (e: KeyboardEvent) => void,
  opts: HotkeyOptions = {},
) {
  const {
    enabled = true,
    preventDefault = true,
    stopPropagation = false,
    allowRepeat = false,
    allowInInputs = true,
    requireNoExtraModifiers = true,
    capture = true,
    ignoreComposing = true,
    target = typeof document !== "undefined" ? document : null,
  } = opts;

  const matcherRef = useRef(matcher);
  const handlerRef = useRef(handler);

  // selalu pakai versi terbaru tanpa perlu re-subscribe listener
  useEffect(() => {
    matcherRef.current = matcher;
  }, [matcher]);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;
    if (!target) return;

    const onKeyDown = (e: KeyboardEvent) => {
      // IME (mis. input Jepang) sering men-trigger Enter saat composing
      if (ignoreComposing && (e.isComposing || e.keyCode === 229)) return;

      if (!allowRepeat && e.repeat) return;

      // kalau fokus sedang di input/textarea/contenteditable dan kita gak izinkan
      if (!allowInInputs && isEditableTarget(e.target)) return;

      if (requireNoExtraModifiers) {
        // untuk hotkey tertentu biasanya kita mau “exact”
        // (Shift/Alt bisa dipakai varian lain)
        if (e.altKey || e.shiftKey) return;
      }

      if (!matcherRef.current(e)) return;

      if (preventDefault) e.preventDefault();
      if (stopPropagation) e.stopPropagation();

      handlerRef.current(e);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    target.addEventListener("keydown", onKeyDown as any, { capture });
    return () =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      target.removeEventListener("keydown", onKeyDown as any, { capture });
  }, [
    enabled,
    preventDefault,
    stopPropagation,
    allowRepeat,
    allowInInputs,
    requireNoExtraModifiers,
    capture,
    ignoreComposing,
    target,
  ]);
}
