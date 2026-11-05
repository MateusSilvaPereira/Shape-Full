import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { KeyRound, Moon, Sun } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { useToast } from "@/components/ui/toast/ToastContext";
import { useTheme } from "@/features/theme/ThemeContext";
import { getApiErrorMessage, resolveAssetUrl } from "@/lib/apiClient";
import { useAuth } from "./AuthContext";
import * as authApi from "./api";

export function ResetPasswordPage() {
  const { academy } = useAuth();
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    setSubmitting(true);
    try {
      await authApi.resetPassword(token, newPassword);
      toast.success("Senha redefinida com sucesso! Faça login com a nova senha.");
      navigate("/login", { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, "Não foi possível redefinir a senha."));
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
              <KeyRound size={22} />
            )}
          </div>
          <h1>Criar nova senha</h1>
          <p>Escolha uma nova senha para acessar sua conta.</p>
        </div>

        {!token ? (
          <Alert variant="error">
            Link inválido ou incompleto. Solicite um novo link em "Esqueci minha senha".
          </Alert>
        ) : (
          <form onSubmit={handleSubmit}>
            <label>
              Nova senha
              <input
                type="password"
                required
                minLength={8}
                autoFocus
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
            </label>
            <label>
              Confirmar nova senha
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </label>
            {error && <Alert variant="error">{error}</Alert>}
            <button className="btn-primary login-submit" disabled={submitting}>
              {submitting ? "Salvando..." : "Redefinir senha"}
            </button>
          </form>
        )}

        <Link to="/login" className="login-back-link">
          Voltar para o login
        </Link>
      </div>
    </div>
  );
}
