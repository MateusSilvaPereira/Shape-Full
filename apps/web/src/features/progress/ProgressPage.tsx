import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Percent, Plus, Ruler, Scale, Search, Trash2, UserRound } from "lucide-react";
import { PageHeading } from "@/components/layout/PageHeading";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/toast/ToastContext";
import {
  ActionCanceledError,
  useLoadingOverlay,
} from "@/components/ui/loading/LoadingOverlayContext";
import { useAuth } from "@/features/auth/AuthContext";
import { useTheme } from "@/features/theme/ThemeContext";
import { useStudents } from "@/features/students/useStudents";
import { getApiErrorMessage } from "@/lib/apiClient";
import { getBrandPalette } from "@/lib/color";
import { CHART_CHROME } from "@/lib/chartChrome";
import { useErrorToast } from "@/lib/useErrorToast";
import { ProgressFormModal } from "./ProgressFormModal";
import { useDeleteProgress, useProgressEntries } from "./useProgress";
import { delta, latestValue } from "./utils";
import type { ProgressEntry } from "./types";

const MANAGER_ROLES = ["SUPER_ADMIN", "ACADEMY_ADMIN", "TRAINER", "NUTRITIONIST"];
const dateFormatter = new Intl.DateTimeFormat("pt-BR");

function DeltaBadge({ value, unit, invert }: { value: number | null; unit: string; invert?: boolean }) {
  if (value === null || value === 0) return null;
  const isGood = invert ? value > 0 : value < 0;
  return (
    <small className={isGood ? "progress-delta good" : "progress-delta bad"}>
      {value > 0 ? "+" : ""}
      {value}
      {unit}
    </small>
  );
}

export function ProgressPage() {
  const { user, academy } = useAuth();
  const { theme } = useTheme();
  const { toast, confirm } = useToast();
  const { run } = useLoadingOverlay();
  const canManage = Boolean(user && MANAGER_ROLES.includes(user.role));

  const [studentQuery, setStudentQuery] = useState("");
  const studentsQuery = useStudents(studentQuery || undefined);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const entriesQuery = useProgressEntries(selectedStudentId);
  const deleteProgress = useDeleteProgress(selectedStudentId);
  useErrorToast(
    entriesQuery.isError,
    entriesQuery.error,
    "Não foi possível carregar o histórico de evolução.",
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ProgressEntry | undefined>(undefined);

  const selectedStudent = studentsQuery.data?.find((s) => s.id === selectedStudentId);
  const entries = entriesQuery.data ?? [];
  const palette = getBrandPalette(academy?.primaryColor ?? "#6b2fa3", theme);
  const chrome = CHART_CHROME[theme];

  const chartData = entries
    .filter((e) => e.weightKg != null)
    .map((e) => ({
      date: dateFormatter.format(new Date(e.measuredAt)),
      peso: e.weightKg,
    }));

  function openCreate() {
    setEditingEntry(undefined);
    setModalOpen(true);
  }

  function openEdit(entry: ProgressEntry) {
    setEditingEntry(entry);
    setModalOpen(true);
  }

  async function handleDelete(entry: ProgressEntry) {
    const ok = await confirm({
      title: "Excluir registro",
      message: "Tem certeza que deseja excluir este registro de evolução?",
      confirmLabel: "Excluir",
      danger: true,
    });
    if (!ok) return;
    try {
      await run("Excluindo registro...", (signal) =>
        deleteProgress.mutateAsync({ id: entry.id, signal }),
      );
      toast.success("Registro excluído com sucesso.");
    } catch (err) {
      if (err instanceof ActionCanceledError) {
        toast.info("Ação cancelada.");
        return;
      }
      toast.error(getApiErrorMessage(err, "Não foi possível excluir o registro."));
    }
  }

  return (
    <>
      <PageHeading
        title="Evolução"
        subtitle="Acompanhe peso, gordura corporal e medidas dos seus alunos ao longo do tempo."
      />

      <section className="panel module-panel">
        <div className="table-toolbar">
          <div className="searchbox wide">
            <Search size={16} />
            <input
              placeholder="Buscar aluno para ver a evolução..."
              value={studentQuery}
              onChange={(e) => setStudentQuery(e.target.value)}
            />
          </div>
        </div>

        {!selectedStudentId && (
          <div className="progress-student-list">
            {studentsQuery.data?.map((s) => (
              <button
                key={s.id}
                type="button"
                className="progress-student-item"
                onClick={() => setSelectedStudentId(s.id)}
              >
                <UserRound size={14} />
                <span>{s.user.name}</span>
              </button>
            ))}
            {studentsQuery.data?.length === 0 && (
              <EmptyState icon={<UserRound size={22} />} title="Nenhum aluno encontrado." />
            )}
          </div>
        )}
      </section>

      {selectedStudentId && selectedStudent && (
        <>
          <div className="panel-head" style={{ margin: "18px 0 14px" }}>
            <div className="panel-head-title">
              <span className="panel-icon">
                <UserRound size={14} />
              </span>
              <div>
                <h3>{selectedStudent.user.name}</h3>
                <p>Histórico de evolução física</p>
              </div>
            </div>
            <div className="heading-actions">
              <button className="btn-secondary" onClick={() => setSelectedStudentId(null)}>
                Trocar aluno
              </button>
              {canManage && (
                <button className="btn-primary" onClick={openCreate}>
                  <Plus size={16} /> Nova medição
                </button>
              )}
            </div>
          </div>

          {entriesQuery.isError && (
            <Alert variant="error">
              {getApiErrorMessage(entriesQuery.error, "Erro ao carregar evolução.")}
            </Alert>
          )}

          {entriesQuery.isLoading && (
            <div className="stats-grid">
              <Skeleton height={100} />
              <Skeleton height={100} />
              <Skeleton height={100} />
            </div>
          )}

          {entriesQuery.data && entries.length === 0 && (
            <EmptyState
              icon={<Scale size={24} />}
              title="Nenhum registro ainda"
              description="Adicione a primeira medição para começar a acompanhar a evolução."
              action={
                canManage && (
                  <button className="btn-primary" onClick={openCreate}>
                    <Plus size={16} /> Nova medição
                  </button>
                )
              }
            />
          )}

          {entries.length > 0 && (
            <>
              <div className="stats-grid progress-stats-grid">
                <div className="stat-card purple-tone">
                  <div className="stat-top">
                    <span>Peso atual</span>
                    <div className="stat-icon purple">
                      <Scale />
                    </div>
                  </div>
                  <div className="stat-value">
                    {latestValue(entries, "weightKg") ?? "—"} kg
                  </div>
                  <div className="stat-bottom">
                    <DeltaBadge value={delta(entries, "weightKg")} unit="kg" />
                  </div>
                </div>
                <div className="stat-card blue-tone">
                  <div className="stat-top">
                    <span>Gordura corporal</span>
                    <div className="stat-icon blue">
                      <Percent />
                    </div>
                  </div>
                  <div className="stat-value">
                    {latestValue(entries, "bodyFatPct") ?? "—"}%
                  </div>
                  <div className="stat-bottom">
                    <DeltaBadge value={delta(entries, "bodyFatPct")} unit="%" />
                  </div>
                </div>
                <div className="stat-card orange-tone">
                  <div className="stat-top">
                    <span>Cintura</span>
                    <div className="stat-icon orange">
                      <Ruler />
                    </div>
                  </div>
                  <div className="stat-value">
                    {latestValue(entries, "waistCm") ?? "—"} cm
                  </div>
                  <div className="stat-bottom">
                    <DeltaBadge value={delta(entries, "waistCm")} unit="cm" />
                  </div>
                </div>
              </div>

              {chartData.length > 1 && (
                <section className="panel chart-panel" style={{ minHeight: 240 }}>
                  <div className="panel-head">
                    <div>
                      <h3>Evolução do peso</h3>
                      <p>Histórico de peso ao longo das medições</p>
                    </div>
                  </div>
                  <div className="chart" style={{ height: 180 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 12, right: 8, left: -22, bottom: 0 }}>
                        <defs>
                          <linearGradient id="progressFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={palette.brandHover} stopOpacity={0.28} />
                            <stop offset="100%" stopColor={palette.brandHover} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke={chrome.grid} vertical={false} />
                        <XAxis dataKey="date" tick={{ fill: chrome.tick, fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis domain={["auto", "auto"]} tick={{ fill: chrome.tick, fontSize: 10 }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            background: chrome.tooltipBg,
                            border: `1px solid ${chrome.tooltipBorder}`,
                            borderRadius: 10,
                            color: chrome.tooltipText,
                          }}
                        />
                        <Area type="monotone" dataKey="peso" name="Peso (kg)" stroke={palette.brandHover} strokeWidth={2.5} fill="url(#progressFill)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </section>
              )}

              <section className="panel module-panel">
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>DATA</th>
                        <th>PESO</th>
                        <th>GORDURA</th>
                        <th>CINTURA</th>
                        <th>OBSERVAÇÕES</th>
                        {canManage && <th></th>}
                      </tr>
                    </thead>
                    <tbody>
                      {[...entries].reverse().map((entry) => (
                        <tr key={entry.id} onClick={() => canManage && openEdit(entry)} style={canManage ? { cursor: "pointer" } : undefined}>
                          <td>{dateFormatter.format(new Date(entry.measuredAt))}</td>
                          <td>{entry.weightKg != null ? `${entry.weightKg} kg` : "—"}</td>
                          <td>{entry.bodyFatPct != null ? `${entry.bodyFatPct}%` : "—"}</td>
                          <td>{entry.waistCm != null ? `${entry.waistCm} cm` : "—"}</td>
                          <td>{entry.notes ?? "—"}</td>
                          {canManage && (
                            <td>
                              <div className="row-actions">
                                <button
                                  className="icon-btn icon-btn-danger"
                                  title="Excluir registro"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(entry);
                                  }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </>
      )}

      {modalOpen && selectedStudentId && selectedStudent && (
        <ProgressFormModal
          studentId={selectedStudentId}
          studentName={selectedStudent.user.name}
          entry={editingEntry}
          onClose={() => {
            setModalOpen(false);
            setEditingEntry(undefined);
          }}
        />
      )}
    </>
  );
}
