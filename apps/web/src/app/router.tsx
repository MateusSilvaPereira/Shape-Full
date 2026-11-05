import { Navigate, Routes, Route } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/features/auth/AuthContext";
import { LoginPage } from "@/features/auth/LoginPage";
import { ForgotPasswordPage } from "@/features/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "@/features/auth/ResetPasswordPage";
import { AiAssistantPage } from "@/features/ai/AiAssistantPage";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { BannersPage } from "@/features/banners/BannersPage";
import { ExercisesPage } from "@/features/exercises/ExercisesPage";
import { FinancePage } from "@/features/finance/FinancePage";
import { MembershipsPage } from "@/features/memberships/MembershipsPage";
import { NutritionPage } from "@/features/nutrition/NutritionPage";
import { ProfessionalsPage } from "@/features/professionals/ProfessionalsPage";
import { ProfilePage } from "@/features/profile/ProfilePage";
import { ProgressPage } from "@/features/progress/ProgressPage";
import { ReportsPage } from "@/features/reports/ReportsPage";
import { SettingsPage } from "@/features/settings/SettingsPage";
import { StudentsPage } from "@/features/students/StudentsPage";
import { MyTrainingPage } from "@/features/training/MyTrainingPage";
import { TrainingPage } from "@/features/training/TrainingPage";
import { ProtectedRoute } from "./ProtectedRoute";

function HomeRoute() {
  const { user } = useAuth();
  if (user?.role === "STUDENT") return <Navigate to="/meus-treinos" replace />;
  return <DashboardPage />;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
      <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/meus-treinos" element={<MyTrainingPage />} />
          <Route path="/assistente" element={<AiAssistantPage />} />
          <Route path="/alunos" element={<StudentsPage />} />
          <Route path="/perfil" element={<ProfilePage />} />
          <Route path="/nutricao" element={<NutritionPage />} />
          <Route path="/configuracoes" element={<SettingsPage />} />
          <Route path="/profissionais" element={<ProfessionalsPage />} />
          <Route path="/evolucao" element={<ProgressPage />} />
          <Route path="/exercicios" element={<ExercisesPage />} />
          <Route path="/treinos" element={<TrainingPage />} />
          <Route path="/planos" element={<MembershipsPage />} />
          <Route path="/conteudo" element={<BannersPage />} />
          <Route path="/financeiro" element={<FinancePage />} />
          <Route path="/relatorios" element={<ReportsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
