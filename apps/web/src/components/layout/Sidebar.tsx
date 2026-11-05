import {
  ChevronDown,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useLoadingOverlay } from "@/components/ui/loading/LoadingOverlayContext";
import { useAuth } from "@/features/auth/AuthContext";
import { resolveAssetUrl } from "@/lib/apiClient";
import { GROUP_ACCENTS, NAV_GROUPS, visibleNavItems } from "./nav";
import { useOverlayNavigate } from "./useOverlayNavigate";

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super admin",
  ACADEMY_ADMIN: "Administrador",
  TRAINER: "Treinador",
  NUTRITIONIST: "Nutricionista",
  RECEPTIONIST: "Recepção",
  STUDENT: "Aluno",
};

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export function Sidebar({
  mobileOpen,
  onClose,
  collapsed,
  onToggleCollapsed,
}: SidebarProps) {
  const { user, academy, logout } = useAuth();
  const { run } = useLoadingOverlay();
  const goTo = useOverlayNavigate();
  const location = useLocation();
  const navItems = visibleNavItems(user?.role);

  function handleNavClick(event: React.MouseEvent, path: string, label: string) {
    event.preventDefault();
    onClose();
    goTo(path, label);
  }

  async function handleLogout(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    await run("Saindo...", () => Promise.resolve());
    logout();
  }

  return (
    <aside
      className={
        "sidebar " + (mobileOpen ? "open " : "") + (collapsed ? "collapsed" : "")
      }
    >
      <button
        type="button"
        className="sidebar-toggle"
        onClick={onToggleCollapsed}
        title={collapsed ? "Expandir menu" : "Recolher menu"}
      >
        {collapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
      </button>
      <div className="brand">
        <div className="brand-mark">
          <img src="/logo-shapefull.jpg" alt="Shape Full" />
        </div>
        <div className="brand-text">
          <b>
            SHAPE<span>FULL</span>
          </b>
          <small>GESTÃO INTELIGENTE</small>
        </div>
        <button className="mobile-close" onClick={onClose}>
          ×
        </button>
      </div>
      <div className="academy-switch">
        <div className="academy-avatar">
          <img
            src={resolveAssetUrl(academy?.logoUrl) ?? "/logo-shapefull.jpg"}
            alt={academy?.name ?? "Academia"}
          />
        </div>
        <div className="academy-text">
          <b>{academy?.name ?? "Shape Full Academia"}</b>
          <small>Plano Enterprise</small>
        </div>
        <ChevronDown size={15} />
      </div>
      <nav>
        {NAV_GROUPS.map((group) => {
          const groupItems = navItems.filter((item) => item.group === group);
          if (groupItems.length === 0) return null;
          return (
          <div
            className="nav-group"
            key={group}
            style={{ "--group-accent": GROUP_ACCENTS[group] } as React.CSSProperties}
          >
            <label>{group}</label>
            {groupItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(item.path);
              return (
                <a
                  key={item.path}
                  href={item.path}
                  onClick={(e) => handleNavClick(e, item.path, item.label)}
                  className={"nav-item " + (isActive ? "active" : "")}
                  style={
                    { "--accent-color": GROUP_ACCENTS[item.group] } as React.CSSProperties
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </div>
          );
        })}
      </nav>
      <div className="sidebar-bottom">
        <div className="help-card">
          <div className="help-icon">
            <ShieldCheck size={18} />
          </div>
          <b>Precisa de ajuda?</b>
          <p>Fale com a administração da sua academia.</p>
          <a
            href={`mailto:?subject=${encodeURIComponent("Suporte - " + (academy?.name ?? "Shape Full"))}`}
          >
            Acessar suporte <span>↗</span>
          </a>
        </div>
        {user && (
          <a
            href="/perfil"
            className="profile-mini"
            onClick={(e) => handleNavClick(e, "/perfil", "Meu perfil")}
            title={collapsed ? "Meu perfil" : undefined}
          >
            <UserAvatar name={user.name} avatarUrl={user.avatarUrl} size={33} />
            <div className="profile-text">
              <b>{user.name}</b>
              <small>{ROLE_LABELS[user.role] ?? user.role}</small>
            </div>
            <button
              type="button"
              className="icon-btn icon-btn-danger"
              title="Sair"
              onClick={handleLogout}
            >
              <LogOut size={15} />
            </button>
          </a>
        )}
      </div>
    </aside>
  );
}
