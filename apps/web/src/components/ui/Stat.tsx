import type { ReactNode } from "react";

interface StatProps {
  title: string;
  value: string;
  icon: ReactNode;
  tone: "purple" | "green" | "blue" | "orange";
  sub: string;
}

export function Stat({ title, value, icon, tone, sub }: StatProps) {
  return (
    <div className={`stat-card ${tone}-tone`}>
      <div className="stat-top">
        <span>{title}</span>
        <div className={"stat-icon " + tone}>{icon}</div>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-bottom">
        <small>{sub}</small>
      </div>
    </div>
  );
}
