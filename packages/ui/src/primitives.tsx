import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  PropsWithChildren,
  ReactNode,
  SelectHTMLAttributes,
} from "react";

const border = "1px solid var(--bs-color-border, #d0d5dd)";

export function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { style, type, ...rest } = props;

  return (
    <button
      {...rest}
      type={type ?? "button"}
      style={{
        border,
        borderRadius: "var(--bs-radius-pill, 999px)",
        background: "var(--bs-color-text-primary, #101828)",
        color: "var(--bs-color-surface, #ffffff)",
        padding: "var(--bs-space-xs, 0.5rem) var(--bs-space-md, 1rem)",
        fontSize: "var(--bs-font-size-sm, 0.875rem)",
        cursor: "pointer",
        transition:
          "background var(--bs-motion-fast, 120ms) var(--bs-motion-easing-standard, ease)",
        ...style,
      }}
    />
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { style, ...rest } = props;

  return (
    <input
      {...rest}
      style={{
        width: "100%",
        border,
        borderRadius: "var(--bs-radius-md, 0.5rem)",
        padding: "var(--bs-space-xs, 0.5rem) var(--bs-space-sm, 0.75rem)",
        fontSize: "var(--bs-font-size-sm, 0.875rem)",
        background: "var(--bs-color-surface, #ffffff)",
        color: "var(--bs-color-text-primary, #101828)",
        ...style,
      }}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { style, children, ...rest } = props;

  return (
    <select
      {...rest}
      style={{
        width: "100%",
        border,
        borderRadius: "var(--bs-radius-md, 0.5rem)",
        padding: "var(--bs-space-xs, 0.5rem) var(--bs-space-sm, 0.75rem)",
        fontSize: "var(--bs-font-size-sm, 0.875rem)",
        background: "var(--bs-color-surface, #ffffff)",
        color: "var(--bs-color-text-primary, #101828)",
        ...style,
      }}
    >
      {children}
    </select>
  );
}

export function Card(props: PropsWithChildren<HTMLAttributes<HTMLElement>>) {
  const { style, children, ...rest } = props;

  return (
    <section
      {...rest}
      style={{
        background: "var(--bs-color-surface, #ffffff)",
        border,
        borderRadius: "var(--bs-radius-lg, 0.75rem)",
        boxShadow: "var(--bs-shadow-sm, 0 1px 2px rgba(16, 24, 40, 0.06))",
        padding: "var(--bs-space-md, 1rem)",
        ...style,
      }}
    >
      {children}
    </section>
  );
}

export interface AppShellProps extends PropsWithChildren {
  header?: ReactNode;
  footer?: ReactNode;
  aside?: ReactNode;
}

export function AppShell({ header, footer, aside, children }: AppShellProps) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bs-color-background, #f8f9fb)",
        color: "var(--bs-color-text-primary, #101828)",
        fontFamily: "var(--bs-font-family)",
      }}
    >
      {header}
      <main style={{ display: "grid", gridTemplateColumns: aside ? "1fr" : undefined, gap: "var(--bs-space-md)" }}>
        <div style={{ padding: "var(--bs-space-md, 1rem)" }}>{children}</div>
        {aside ? <aside style={{ padding: "var(--bs-space-md, 1rem)" }}>{aside}</aside> : null}
      </main>
      {footer}
    </div>
  );
}

interface StateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

function StateBlock({ title, description, action }: StateProps) {
  return (
    <Card>
      <h3 style={{ margin: 0, fontSize: "var(--bs-font-size-lg, 1.125rem)" }}>{title}</h3>
      {description ? (
        <p style={{ margin: "var(--bs-space-xs, 0.5rem) 0 0", color: "var(--bs-color-text-secondary, #475467)" }}>
          {description}
        </p>
      ) : null}
      {action ? <div style={{ marginTop: "var(--bs-space-sm, 0.75rem)" }}>{action}</div> : null}
    </Card>
  );
}

export function EmptyState(props: StateProps) {
  return <StateBlock {...props} />;
}

export function LoadingState(props: Omit<StateProps, "title"> & { title?: string }) {
  return <StateBlock title={props.title ?? "Loading"} description={props.description} action={props.action} />;
}

export function ErrorState(props: Omit<StateProps, "title"> & { title?: string }) {
  return <StateBlock title={props.title ?? "Something went wrong"} description={props.description} action={props.action} />;
}
