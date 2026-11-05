import { Dumbbell } from "lucide-react";

interface AppFooterProps {
  academyName: string;
}

export function AppFooter({ academyName }: AppFooterProps) {
  return (
    <footer className="app-footer">
      <div className="app-footer-brand">
        <span className="app-footer-mark">
          <Dumbbell size={12} />
        </span>
        <span>
          <b>Shape Full</b> · {academyName}
        </span>
        <span className="app-footer-sep">•</span>
        <span>© {new Date().getFullYear()}</span>
      </div>
      <div className="status-pill">
        <span className="status-pill-dot" />
        Todos os sistemas operacionais
      </div>
    </footer>
  );
}
