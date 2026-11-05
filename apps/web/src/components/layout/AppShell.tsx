import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AiChatWidget } from "@/components/ai/AiChatWidget";
import { AiChatProvider } from "@/features/ai/AiChatContext";
import { useAuth } from "@/features/auth/AuthContext";
import { AppFooter } from "./AppFooter";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

const SIDEBAR_COLLAPSED_KEY = "shapefull.sidebarCollapsed";

export function AppShell() {
  const { academy } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1",
  );
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  return (
    <AiChatProvider>
      <div className={"app-shell " + (collapsed ? "sidebar-collapsed" : "")}>
        <Sidebar
          mobileOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((c) => !c)}
        />
        <div className="main-area">
          <Topbar
            academyName={academy?.name ?? "Shape Full Academia"}
            onOpenMenu={() => setMobileOpen(true)}
          />
          <main className="content">
            <div key={location.pathname} className="page-fade">
              <Outlet />
            </div>
            <AppFooter academyName={academy?.name ?? "Shape Full Academia"} />
          </main>
        </div>
        <AiChatWidget />
      </div>
    </AiChatProvider>
  );
}
