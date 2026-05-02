import type { ReactNode } from "react";

type DivProps = {
  children: ReactNode;
  className?: string;
  id?: string;
};

export function Section({
  variant,
  tight,
  children,
  className,
  id,
}: DivProps & { variant?: "sand" | "deep" | "dark"; tight?: boolean }) {
  const classes = [
    "rv3-section",
    variant ?? "",
    tight ? "tight" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <section id={id} className={classes}>
      {children}
    </section>
  );
}

export function Wrap({ children, className, id }: DivProps) {
  return (
    <div id={id} className={["rv3-wrap", className ?? ""].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}

export function Eyebrow({ children, className }: DivProps) {
  return (
    <div className={["rv3-eyebrow", className ?? ""].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}

export function Display({ children, className }: DivProps) {
  return (
    <h2 className={["rv3-display", className ?? ""].filter(Boolean).join(" ")}>
      {children}
    </h2>
  );
}

export function Lede({ children, className }: DivProps) {
  return (
    <p className={["rv3-lede", className ?? ""].filter(Boolean).join(" ")}>
      {children}
    </p>
  );
}
