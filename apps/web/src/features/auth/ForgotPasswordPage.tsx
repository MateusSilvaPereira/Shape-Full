import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, KeyRound, Moon, Sun } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { useTheme } from "@/features/theme/ThemeContext";
import { getApiErrorMessage, resolveAssetUrl } from "@/lib/apiClient";
import { useAuth } from "./AuthContext";
import * as authApi from "./api";

export function ForgotPasswordPage() {
  const { academy } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(getApiErrorMessage(err, "Não foi possível processar o pedido. Tente novamente."));
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
          <h1>Esqueceu sua senha?</h1>
          <p>Informe seu e-mail de acesso e enviaremos um link para redefinir a senha.</p>
        </div>

        {sent ? (
          <Alert variant="success">
            Se esse e-mail estiver cadastrado, você vai receber uma mensagem com o link de
            redefinição em alguns instantes. Confira também a caixa de spam.
          </Alert>
        ) : (
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
            {error && <Alert variant="error">{error}</Alert>}
            <button className="btn-primary login-submit" disabled={submitting}>
              {submitting ? "Enviando..." : "Enviar link de redefinição"}
            </button>
          </form>
        )}

        <Link to="/login" className="login-back-link">
          <ArrowLeft size={14} /> Voltar para o login
        </Link>
      </div>
    </div>
  );
}
