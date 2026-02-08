import { cn } from "../../lib/utils/tw";
import type { InputHTMLAttributes, KeyboardEvent } from "react";

function handleEnterAdvance(event: KeyboardEvent<HTMLInputElement>) {
  if (event.key !== "Enter") return;
  const input = event.currentTarget;
  const form = input.form ?? input.closest("form");
  if (!form) return;

  const focusables = Array.from(
    form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
      "input, select, textarea"
    )
  ).filter((el) => {
    if (el instanceof HTMLInputElement && ["hidden", "submit", "button"].includes(el.type)) {
      return false;
    }
    return !el.disabled;
  });

  if (focusables.length <= 1) {
    if (typeof form.requestSubmit === "function") {
      form.requestSubmit();
    } else {
      form.submit();
    }
    return;
  }

  const index = focusables.indexOf(input);
  if (index === -1) return;

  if (index < focusables.length - 1) {
    event.preventDefault();
    const next = focusables[index + 1];
    next.focus();
    if ("select" in next && typeof next.select === "function") {
      next.select();
    }
  } else {
    if (typeof form.requestSubmit === "function") {
      form.requestSubmit();
    } else {
      form.submit();
    }
  }
}

export function Input({
  className,
  onKeyDown,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn("input", className)}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (!event.defaultPrevented) {
          handleEnterAdvance(event);
        }
      }}
      {...props}
    />
  );
}
