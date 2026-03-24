/**
 * SuggestInput / SuggestTextarea
 *
 * Drop-in replacements for <Input> and <Textarea> that show a ghost
 * suggestion overlay when the field is empty and focused. Pressing Tab
 * or Enter (when the field is empty) accepts the suggestion.
 *
 * Usage:
 *   <SuggestInput
 *     placeholder="e.g. John Smith"
 *     value={value}
 *     onChange={e => setValue(e.target.value)}
 *   />
 *
 * The ghost hint "Press Tab to fill" appears below the field when focused
 * and empty. Tab / Enter fills the placeholder text as the value.
 */

import * as React from "react";
import { cn } from "@/lib/utils";

// ─── Shared hook ──────────────────────────────────────────────────────────────

function useSuggest(
  value: string | undefined,
  placeholder: string | undefined,
  onChange: ((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void) | undefined,
  onKeyDown: ((e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void) | undefined,
) {
  const [focused, setFocused] = React.useState(false);
  const isEmpty = !value || value === "";
  const hasSuggestion = !!placeholder && isEmpty;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // Accept suggestion on Tab or Enter when field is empty
    if (hasSuggestion && (e.key === "Tab" || e.key === "Enter")) {
      e.preventDefault();
      // Synthesise a change event with the placeholder as value
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        e.currentTarget.tagName === "TEXTAREA"
          ? window.HTMLTextAreaElement.prototype
          : window.HTMLInputElement.prototype,
        "value",
      )?.set;
      if (nativeInputValueSetter && onChange) {
        nativeInputValueSetter.call(e.currentTarget, placeholder);
        const syntheticEvent = new Event("input", { bubbles: true });
        e.currentTarget.dispatchEvent(syntheticEvent);
        // Also call onChange directly with a synthetic React event
        const reactEvent = {
          ...e,
          target: { ...e.currentTarget, value: placeholder } as EventTarget & (HTMLInputElement | HTMLTextAreaElement),
          currentTarget: { ...e.currentTarget, value: placeholder } as EventTarget & (HTMLInputElement | HTMLTextAreaElement),
        } as React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>;
        onChange(reactEvent as any);
      }
      return;
    }
    onKeyDown?.(e as any);
  };

  return { focused, setFocused, isEmpty, hasSuggestion, handleKeyDown };
}

// ─── SuggestInput ─────────────────────────────────────────────────────────────

export interface SuggestInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Forwarded ref */
  ref?: React.Ref<HTMLInputElement>;
}

export const SuggestInput = React.forwardRef<HTMLInputElement, SuggestInputProps>(
  ({ className, placeholder, value, onChange, onKeyDown, onFocus, onBlur, ...props }, ref) => {
    const { focused, setFocused, hasSuggestion, handleKeyDown } = useSuggest(
      value as string | undefined,
      placeholder,
      onChange as any,
      onKeyDown as any,
    );

    return (
      <div className="relative w-full">
        <input
          ref={ref}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown as any}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
          className={cn(
            "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium",
            "placeholder:text-muted-foreground/50",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          {...props}
        />
        {focused && hasSuggestion && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground/60 pointer-events-none select-none bg-background px-1 rounded">
            Tab to fill
          </span>
        )}
      </div>
    );
  },
);
SuggestInput.displayName = "SuggestInput";

// ─── SuggestTextarea ──────────────────────────────────────────────────────────

export interface SuggestTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  ref?: React.Ref<HTMLTextAreaElement>;
}

export const SuggestTextarea = React.forwardRef<HTMLTextAreaElement, SuggestTextareaProps>(
  ({ className, placeholder, value, onChange, onKeyDown, onFocus, onBlur, ...props }, ref) => {
    const { focused, setFocused, hasSuggestion, handleKeyDown } = useSuggest(
      value as string | undefined,
      placeholder,
      onChange as any,
      onKeyDown as any,
    );

    return (
      <div className="relative w-full">
        <textarea
          ref={ref}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown as any}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
          className={cn(
            "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm",
            "placeholder:text-muted-foreground/50",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50 resize-none",
            className,
          )}
          {...props}
        />
        {focused && hasSuggestion && (
          <span className="absolute right-2 top-2 text-[10px] text-muted-foreground/60 pointer-events-none select-none bg-background px-1 rounded">
            Tab to fill
          </span>
        )}
      </div>
    );
  },
);
SuggestTextarea.displayName = "SuggestTextarea";
