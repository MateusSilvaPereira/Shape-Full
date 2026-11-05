import { useRef, useState } from "react";
import type { KeyboardEvent, MouseEvent } from "react";
import { Bell, ChevronDown, Menu, Moon, Search, Sun, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useToast } from "@/components/ui/toast/ToastContext";
import { useAuth } from "@/features/auth/AuthContext";
import { useTheme } from "@/features/theme/ThemeContext";
import { NAV_ITEMS, visibleNavItems } from "./nav";
import { useOverlayNavigate } from "./useOverlayNavigate";

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super admin",
  ACADEMY_ADMIN: "Administrador",
  TRAINER: "Treinador",
  NUTRITIONIST: "Nutricionista",
  RECEPTIONIST: "Recepção",
  STUDENT: "Aluno",
};

interface TopbarProps {
  academyName: string;
  onOpenMenu: () => void;
}

export function Topbar({ academyName, onOpenMenu }: TopbarProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const goTo = useOverlayNavigate();
  const [query, setQuery] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const navItems = visibleNavItems(user?.role);
  const searchInputRef = useRef<HTMLInputElement>(null);

  function openMobileSearch() {
    setMobileSearchOpen(true);
    requestAnimationFrame(() => searchInputRef.current?.focus());
  }

  const current =
    location.pathname === "/perfil"
      ? { label: "Meu perfil" }
      : NAV_ITEMS.find((item) =>
          item.path === "/"
            ? location.pathname === "/"
            : location.pathname.startsWith(item.path),
        );

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setMobileSearchOpen(false);
      return;
    }
    if (event.key !== "Enter" || !query.trim()) return;
    const match = navItems.find((item) =>
      item.label.toLowerCase().includes(query.trim().toLowerCase()),
    );
    if (match) {
      goTo(match.path, match.label);
      setQuery("");
      setMobileSearchOpen(false);
    }
  }

  function handleProfileClick(event: MouseEvent) {
    event.preventDefault();
    goTo("/perfil", "Meu perfil");
  }

  return (
    <header className="topbar">
      <div className="top-left">
        <button className="hamburger" onClick={onOpenMenu}>
          <Menu />
        </button>
        <div className="crumb">
          {academyName} <span>/</span> <b>{current?.label ?? ""}</b>
        </div>
      </div>
      <div className="top-actions">
        <div
          className={"searchbox" + (mobileSearchOpen ? " mobile-open" : "")}
          onClick={() => !mobileSearchOpen && openMobileSearch()}
        >
          <Search size={16} />
          <input
            ref={searchInputRef}
            placeholder="Ir para um módulo..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
          <kbd>↵</kbd>
          <button
            type="button"
            className="searchbox-close"
            onClick={(e) => {
              e.stopPropagation();
              setMobileSearchOpen(false);
              setQuery("");
            }}
            aria-label="Fechar busca"
          >
            <X size={15} />
          </button>
        </div>
        <button
          type="button"
          className="icon-btn"
          onClick={toggleTheme}
          title={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
          aria-label="Alternar tema"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={() => toast.info("Você não tem novas notificações.")}
          aria-label="Notificações"
        >
          <Bell size={19} />
        </button>
        {user && (
          <a href="/perfil" className="top-profile" onClick={handleProfileClick}>
            <UserAvatar name={user.name} avatarUrl={user.avatarUrl} size={33} />
            <div>
              <b>{user.name}</b>
              <small>{ROLE_LABELS[user.role] ?? user.role}</small>
            </div>
            <ChevronDown size={15} />
          </a>
        )}
      </div>
    </header>
  );
}
