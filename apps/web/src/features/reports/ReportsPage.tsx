import {
  Apple,
  BarChart3,
  Dumbbell,
  Download,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import { PageHeading } from "@/components/layout/PageHeading";
import { Alert } from "@/components/ui/Alert";
import { Stat } from "@/components/ui/Stat";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/features/auth/AuthContext";
import { useStudents } from "@/features/students/useStudents";
import { useMemberships } from "@/features/memberships/useMemberships";
import { useMealPlans } from "@/features/nutrition/useMealPlans";
import { useTrainingPrograms } from "@/features/training/useTraining";
import { useExercises } from "@/features/exercises/useExercises";
import { useProfessionals } from "@/features/professionals/useProfessionals";
import { downloadReportPdf } from "@/lib/pdfReport";
import type { ReportSection } from "@/lib/pdfReport";

const ADMIN_ROLES = ["SUPER_ADMIN", "ACADEMY_ADMIN"];

const STUDENT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Ativos",
  PENDING: "Pendentes",
  INACTIVE: "Inativos",
};

const ROLE_LABELS: Record<string, string> = {
  ACADEMY_ADMIN: "Administradores",
  TRAINER: "Treinadores",
  NUTRITIONIST: "Nutricionistas",
  RECEPTIONIST: "Recepcionistas",
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function BreakdownList({
  items,
}: {
  items: { label: string; value: number; max: number }[];
}) {
  return (
    <div className="finance-plan-list">
      {items.map((item) => (
        <div className="finance-plan-row" key={item.label}>
          <div className="finance-plan-row-head">
            <b>{item.label}</b>
            <span>{item.value}</span>
          </div>
          <div className="finance-plan-bar">
            <div style={{ width: `${item.max ? (item.value / item.max) * 100 : 0}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function DownloadButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" className="icon-btn" onClick={onClick} title={label} aria-label={label}>
      <Download size={14} />
    </button>
  );
}

export function ReportsPage() {
  const { user, academy } = useAuth();
  const isAdmin = Boolean(user && ADMIN_ROLES.includes(user.role));
  const academyName = academy?.name ?? "Shape Full Academia";
  const primaryColor = academy?.primaryColor;

  const studentsQuery = useStudents();
  const membershipsQuery = useMemberships();
  const mealPlansQuery = useMealPlans();
  const trainingQuery = useTrainingPrograms();
  const exercisesQuery = useExercises();
  const professionalsQuery = useProfessionals(undefined, isAdmin);

  const isLoading =
    studentsQuery.isLoading ||
    membershipsQuery.isLoading ||
    mealPlansQuery.isLoading ||
    trainingQuery.isLoading ||
    exercisesQuery.isLoading;

  const students = studentsQuery.data ?? [];
  const memberships = membershipsQuery.data ?? [];
  const mealPlans = mealPlansQuery.data ?? [];
  const trainingPrograms = trainingQuery.data ?? [];
  const exercises = exercisesQuery.data ?? [];
  const professionals = professionalsQuery.data ?? [];

  const studentsByStatus = students.reduce<Record<string, number>>((acc, s) => {
    acc[s.user.status] = (acc[s.user.status] ?? 0) + 1;
    return acc;
  }, {});
  const maxStudentStatus = Math.max(1, ...Object.values(studentsByStatus));

  const activeMemberships = memberships.filter((m) => m.status === "ACTIVE");
  const adimplenciaRate =
    memberships.length > 0
      ? Math.round((activeMemberships.length / memberships.length) * 100)
      : 0;
  const mrr = activeMemberships.reduce((sum, m) => sum + Number(m.monthlyPrice), 0);

  const activeMealPlans = mealPlans.filter((p) => p.status === "ACTIVE").length;
  const activeTrainingPrograms = trainingPrograms.filter((p) => p.active).length;

  const professionalsByRole = professionals.reduce<Record<string, number>>((acc, p) => {
    acc[p.role] = (acc[p.role] ?? 0) + 1;
    return acc;
  }, {});
  const maxRoleCount = Math.max(1, ...Object.values(professionalsByRole));

  const studentsSection: ReportSection = {
    heading: "Alunos por status",
    columns: ["Status", "Quantidade"],
    rows: Object.entries(STUDENT_STATUS_LABELS).map(([key, label]) => [
      label,
      studentsByStatus[key] ?? 0,
    ]),
  };

  const contentSection: ReportSection = {
    heading: "Conteúdo cadastrado",
    columns: ["Item", "Quantidade"],
    rows: [
      ["Exercícios na biblioteca", exercises.length],
      ["Planos alimentares", mealPlans.length],
      ["Programas de treino", trainingPrograms.length],
    ],
  };

  const teamSection: ReportSection = {
    heading: "Equipe por função",
    columns: ["Função", "Quantidade"],
    rows: Object.entries(ROLE_LABELS).map(([key, label]) => [
      label,
      professionalsByRole[key] ?? 0,
    ]),
  };

  const summarySection: ReportSection = {
    heading: "Resumo geral",
    columns: ["Indicador", "Valor"],
    rows: [
      ["Total de alunos", students.length],
      ["Adimplência", `${adimplenciaRate}%`],
      ["Receita mensal recorrente", currencyFormatter.format(mrr)],
      ["Planos alimentares ativos", `${activeMealPlans} de ${mealPlans.length}`],
      [
        "Programas de treino ativos",
        `${activeTrainingPrograms} de ${trainingPrograms.length}`,
      ],
    ],
  };

  function downloadSection(section: ReportSection, fileSuffix: string) {
    downloadReportPdf({
      academyName,
      primaryColor,
      title: section.heading,
      subtitle: "Relatório individual",
      sections: [section],
      fileName: `relatorio-${fileSuffix}.pdf`,
    });
  }

  function downloadFullReport() {
    const sections = [summarySection, studentsSection, contentSection];
    if (isAdmin) sections.push(teamSection);
    downloadReportPdf({
      academyName,
      primaryColor,
      title: "Relatório completo",
      subtitle: "Visão consolidada de alunos, matrículas, nutrição e treinos",
      sections,
      fileName: "relatorio-completo.pdf",
    });
  }

  return (
    <>
      <PageHeading
        title="Relatórios"
        subtitle="Visão consolidada de alunos, matrículas, nutrição e treinos."
        actions={
          !isLoading && (
            <button type="button" className="btn-primary" onClick={downloadFullReport}>
              <Download size={16} /> Baixar relatório completo
            </button>
          )
        }
      />

      {isLoading && (
        <div className="stats-grid">
          <Skeleton height={100} />
          <Skeleton height={100} />
          <Skeleton height={100} />
          <Skeleton height={100} />
        </div>
      )}

      {!isLoading && (
        <>
          <div className="stats-grid">
            <Stat
              title="Total de alunos"
              value={String(students.length)}
              icon={<Users />}
              tone="purple"
              sub={`${studentsByStatus.ACTIVE ?? 0} ativos`}
            />
            <Stat
              title="Adimplência"
              value={`${adimplenciaRate}%`}
              icon={<Wallet />}
              tone="blue"
              sub={`${currencyFormatter.format(mrr)} em receita ativa`}
            />
            <Stat
              title="Planos alimentares ativos"
              value={String(activeMealPlans)}
              icon={<Apple />}
              tone="green"
              sub={`de ${mealPlans.length} cadastrados`}
            />
            <Stat
              title="Programas de treino ativos"
              value={String(activeTrainingPrograms)}
              icon={<Dumbbell />}
              tone="orange"
              sub={`de ${trainingPrograms.length} cadastrados`}
            />
          </div>

          <div className="dashboard-grid">
            <section className="panel chart-panel">
              <div className="panel-head">
                <div className="panel-head-title">
                  <span className="panel-icon">
                    <Users size={14} />
                  </span>
                  <div>
                    <h3>Alunos por status</h3>
                    <p>Distribuição da base de alunos cadastrados</p>
                  </div>
                </div>
                <DownloadButton
                  label="Baixar relatório de alunos"
                  onClick={() => downloadSection(studentsSection, "alunos")}
                />
              </div>
              <BreakdownList
                items={Object.entries(STUDENT_STATUS_LABELS).map(([key, label]) => ({
                  label,
                  value: studentsByStatus[key] ?? 0,
                  max: maxStudentStatus,
                }))}
              />
            </section>

            <section className="panel goal-panel">
              <div className="panel-head">
                <div className="panel-head-title">
                  <span className="panel-icon">
                    <BarChart3 size={14} />
                  </span>
                  <div>
                    <h3>Conteúdo cadastrado</h3>
                    <p>Biblioteca de exercícios e planos</p>
                  </div>
                </div>
                <DownloadButton
                  label="Baixar relatório de conteúdo"
                  onClick={() => downloadSection(contentSection, "conteudo")}
                />
              </div>
              <BreakdownList
                items={[
                  {
                    label: "Exercícios na biblioteca",
                    value: exercises.length,
                    max: Math.max(1, exercises.length, mealPlans.length, trainingPrograms.length),
                  },
                  {
                    label: "Planos alimentares",
                    value: mealPlans.length,
                    max: Math.max(1, exercises.length, mealPlans.length, trainingPrograms.length),
                  },
                  {
                    label: "Programas de treino",
                    value: trainingPrograms.length,
                    max: Math.max(1, exercises.length, mealPlans.length, trainingPrograms.length),
                  },
                ]}
              />
            </section>
          </div>

          {isAdmin && (
            <section className="panel module-panel">
              <div className="panel-head">
                <div className="panel-head-title">
                  <span className="panel-icon">
                    <ShieldCheck size={14} />
                  </span>
                  <div>
                    <h3>Equipe por função</h3>
                    <p>Distribuição dos profissionais cadastrados</p>
                  </div>
                </div>
                {professionals.length > 0 && (
                  <DownloadButton
                    label="Baixar relatório de equipe"
                    onClick={() => downloadSection(teamSection, "equipe")}
                  />
                )}
              </div>
              {professionals.length === 0 ? (
                <Alert variant="info">Nenhum profissional cadastrado ainda.</Alert>
              ) : (
                <BreakdownList
                  items={Object.entries(ROLE_LABELS).map(([key, label]) => ({
                    label,
                    value: professionalsByRole[key] ?? 0,
                    max: maxRoleCount,
                  }))}
                />
              )}
            </section>
          )}
        </>
      )}
    </>
  );
}
