import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { LogIn, Moon, Sun } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { useToast } from "@/components/ui/toast/ToastContext";
import {
  ActionCanceledError,
  useLoadingOverlay,
} from "@/components/ui/loading/LoadingOverlayContext";
import { useTheme } from "@/features/theme/ThemeContext";
import { getApiErrorMessage, resolveAssetUrl } from "@/lib/apiClient";
import { useAuth } from "./AuthContext";

export function LoginPage() {
  const { status, academy, login } = useAuth();
  const { toast } = useToast();
  const { run } = useLoadingOverlay();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (status === "authenticated") {
    const redirectTo =
      (location.state as { from?: string } | null)?.from ?? "/";
    return <Navigate to={redirectTo} replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await run("Entrando...", (signal) => login(email, password, signal));
      navigate("/", { replace: true });
    } catch (err) {
      if (err instanceof ActionCanceledError) {
        toast.info("Login cancelado.");
        return;
      }
      const message = getApiErrorMessage(err, "Não foi possível entrar.");
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-shell">
      <button
        type="button"
        className="icon-btn theme-toggle-floating"
        onClick={toggleTheme}
        title={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
        aria-label="Alternar tema"
      >
        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      </button>
      <div className="login-card">
        <div className="login-brand">
          <div className="login-logo">
            {academy?.logoUrl ? (
              <img src={resolveAssetUrl(academy.logoUrl) ?? ""} alt={academy.name} />
            ) : (
              <LogIn size={22} />
            )}
          </div>
          <h1>{academy?.name ?? "Shape Full"}</h1>
          <p>Entre para acessar o painel administrativo</p>
        </div>
        <form onSubmit={handleSubmit}>
          <label>
            E-mail
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@academia.com"
            />
          </label>
          <label>
            Senha
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>
          {error && <Alert variant="error">{error}</Alert>}
          <button className="btn-primary login-submit" disabled={submitting}>
            {submitting ? "Entrando..." : "Entrar"}
          </button>
        </form>
        <Link to="/esqueci-senha" className="login-back-link">
          Esqueci minha senha
        </Link>
      </div>
    </div>
  );
}
