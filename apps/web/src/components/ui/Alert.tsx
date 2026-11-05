import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import type { ReactNode } from "react";

type AlertVariant = "error" | "warning" | "info" | "success";

const ICONS = { error: XCircle, warning: AlertTriangle, info: Info, success: CheckCircle2 };

interface AlertProps {
  variant?: AlertVariant;
  children: ReactNode;
}

export function Alert({ variant = "error", children }: AlertProps) {
  const Icon = ICONS[variant];
  return (
    <div className={"alert-banner " + variant}>
      <Icon size={16} />
      <span>{children}</span>
    </div>
  );
}
