import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { useState } from "react";
import { formatDate } from "@attendance/lib/format";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-extrabold text-slate-700 dark:text-slate-200">{label}</span>
      {children}
      {hint ? <span className="mt-1.5 block text-[11px] leading-5 text-slate-400">{hint}</span> : null}
    </label>
  );
}

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`input ${className}`} {...props} />;
}

export function Select({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`input ${className}`} {...props} />;
}

export function Textarea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`input min-h-28 resize-y py-3 ${className}`} {...props} />;
}

export function DateField({
  label,
  hint,
  defaultValue,
  value,
  onChange,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label: string; hint?: string }) {
  const [localValue, setLocalValue] = useState(() => String(defaultValue ?? ""));
  const displayedValue = value === undefined ? localValue : String(value);
  const calendarHint = displayedValue
    ? formatDate(`${displayedValue}T00:00:00.000Z`, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      })
    : hint;

  return (
    <Field label={label} hint={hint && calendarHint ? `${calendarHint} · ${hint}` : calendarHint}>
      <Input
        {...props}
        defaultValue={value === undefined ? defaultValue : undefined}
        value={value}
        type="date"
        onChange={(event) => {
          setLocalValue(event.target.value);
          onChange?.(event);
        }}
      />
    </Field>
  );
}
