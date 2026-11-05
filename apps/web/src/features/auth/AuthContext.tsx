import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { applyBrandPalette } from "@/lib/color";
import { useTheme } from "@/features/theme/ThemeContext";
import { useToast } from "@/components/ui/toast/ToastContext";
import * as authApi from "./api";
import { clearSession, getStoredToken, storeToken } from "./session";
import type { AcademyBranding, AuthenticatedUser } from "./types";

type AuthStatus = "loading" | "authenticated" | "guest";

interface AuthContextValue {
  status: AuthStatus;
  user: AuthenticatedUser | null;
  academy: AcademyBranding | null;
  login: (email: string, password: string, signal?: AbortSignal) => Promise<void>;
  logout: () => void;
  updateUser: (user: AuthenticatedUser) => void;
  updateAcademy: (academy: AcademyBranding) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const ACADEMY_SLUG = import.meta.env.VITE_ACADEMY_SLUG;

export function AuthProvider({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  const { toast } = useToast();
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [academy, setAcademy] = useState<AcademyBranding | null>(null);

  const setBrandedAcademy = useCallback(
    (next: AcademyBranding | null) => {
      setAcademy(next);
      if (next?.primaryColor) applyBrandPalette(next.primaryColor, theme);
    },
    [theme],
  );

  // Reaplica a paleta (sem precisar refazer a requisição) quando o usuário troca de tema.
  useEffect(() => {
    if (academy?.primaryColor) applyBrandPalette(academy.primaryColor, theme);
  }, [theme]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const token = getStoredToken();

      if (token) {
        try {
          const session = await authApi.fetchSession();
          if (cancelled) return;
          setUser(session.user);
          setBrandedAcademy(session.academy);
          setStatus("authenticated");
          return;
        } catch {
          clearSession();
          if (!cancelled)
            toast.warning("Sua sessão expirou. Faça login novamente.");
        }
      }

      try {
        const branding = await authApi.fetchAcademyBySlug(ACADEMY_SLUG);
        if (cancelled) return;
        setBrandedAcademy(branding);
      } catch {
        if (!cancelled)
          toast.warning(
            "Não foi possível carregar os dados da academia. Exibindo tema padrão.",
          );
      }
      if (!cancelled) setStatus("guest");
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [setBrandedAcademy, toast]);

  const login = useCallback(
    async (email: string, password: string, signal?: AbortSignal) => {
      const result = await authApi.login(email, password, signal);
      storeToken(result.accessToken);
      setUser(result.user);
      setBrandedAcademy(result.academy);
      setStatus("authenticated");
      toast.success(`Bem-vindo(a), ${result.user.name.split(" ")[0]}!`);
    },
    [setBrandedAcademy, toast],
  );

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    setStatus("guest");
    toast.success("Você saiu da sua conta.");
  }, [toast]);

  const updateUser = useCallback((next: AuthenticatedUser) => {
    setUser(next);
  }, []);

  const updateAcademy = useCallback(
    (next: AcademyBranding) => {
      setBrandedAcademy(next);
    },
    [setBrandedAcademy],
  );

  const value = useMemo(
    () => ({ status, user, academy, login, logout, updateUser, updateAcademy }),
    [status, user, academy, login, logout, updateUser, updateAcademy],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
