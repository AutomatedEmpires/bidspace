import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "./cn";
import { Icon } from "./icon";

const CONTROL =
  "w-full rounded-[3px] border border-strong bg-surface px-3 text-sm text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-signal dark:bg-surface-dark dark:text-canvas dark:placeholder:text-canvas-faint dark:focus:border-canvas";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: ReactNode;
  error?: string | null;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-[13px] font-semibold text-ink dark:text-canvas">
        {label}
        {required ? <span className="ml-0.5 text-signal">*</span> : null}
      </label>
      {children}
      {hint && !error ? <p className="text-xs text-ink-muted dark:text-canvas-muted">{hint}</p> : null}
      {error ? (
        <p role="alert" className="text-xs font-medium text-alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(CONTROL, "h-10", className)} {...rest} />;
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={cn(CONTROL, "h-10 appearance-none pr-9", className)} {...rest}>
        {children}
      </select>
      <Icon
        name="caretDown"
        size={16}
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted dark:text-canvas-muted"
      />
    </div>
  );
}

export function Textarea({ className, rows = 4, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={rows} className={cn(CONTROL, "py-2.5", className)} {...rest} />;
}

export function CheckboxField({
  label,
  hint,
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode; hint?: ReactNode }) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-2.5 text-sm", className)}>
      <input
        type="checkbox"
        className="mt-0.5 size-4 shrink-0 accent-signal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
        {...rest}
      />
      <span>
        <span className="font-medium text-ink dark:text-canvas">{label}</span>
        {hint ? <span className="block text-xs text-ink-muted dark:text-canvas-muted">{hint}</span> : null}
      </span>
    </label>
  );
}
