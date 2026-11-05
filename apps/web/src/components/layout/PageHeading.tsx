import type { ReactNode } from "react";

const formatter = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
});

interface PageHeadingProps {
  title: string;
  subtitle: string;
  actions?: ReactNode;
}

export function PageHeading({ title, subtitle, actions }: PageHeadingProps) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">
          <span className="live-dot" /> {formatter.format(new Date()).toUpperCase()}
        </div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {actions && <div className="heading-actions">{actions}</div>}
    </div>
  );
}
