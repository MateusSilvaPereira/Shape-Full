import { useState } from "react";
import { Plus, Search, Users } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableRowsSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/toast/ToastContext";
import {
  ActionCanceledError,
  useLoadingOverlay,
} from "@/components/ui/loading/LoadingOverlayContext";
import { PageHeading } from "@/components/layout/PageHeading";
import { useAuth } from "@/features/auth/AuthContext";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { useErrorToast } from "@/lib/useErrorToast";
import { getApiErrorMessage } from "@/lib/apiClient";
import { StudentFormModal } from "./StudentFormModal";
import { StudentTable } from "./StudentTable";
import { useDeactivateStudent, useStudents } from "./useStudents";
import type { Student } from "./types";

const MANAGER_ROLES = ["SUPER_ADMIN", "ACADEMY_ADMIN", "RECEPTIONIST"];

export function StudentsPage() {
  const { user } = useAuth();
  const { toast, confirm } = useToast();
  const { run } = useLoadingOverlay();
  const canManage = Boolean(user && MANAGER_ROLES.includes(user.role));

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query);
  const studentsQuery = useStudents(debouncedQuery || undefined);
  const deactivateStudent = useDeactivateStudent();
  useErrorToast(
    studentsQuery.isError,
    studentsQuery.error,
    "Não foi possível carregar a lista de alunos.",
  );

  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [selected, setSelected] = useState<Student | undefined>(undefined);

  function openCreate() {
    setSelected(undefined);
    setModalMode("create");
  }

  function openEdit(student: Student) {
    setSelected(student);
    setModalMode("edit");
  }

  function closeModal() {
    setModalMode(null);
    setSelected(undefined);
  }

  async function handleDeactivate(student: Student) {
    const ok = await confirm({
      title: "Desativar aluno",
      message: `Tem certeza que deseja desativar ${student.user.name}? O histórico dele continua preservado.`,
      confirmLabel: "Desativar",
      danger: true,
    });
    if (!ok) return;
    try {
      await run(`Desativando ${student.user.name}...`, (signal) =>
        deactivateStudent.mutateAsync({ id: student.id, signal }),
      );
      toast.success(`${student.user.name} foi desativado com sucesso.`);
    } catch (err) {
      if (err instanceof ActionCanceledError) {
        toast.info("Ação cancelada.");
        return;
      }
      toast.error(
        getApiErrorMessage(
          err,
          `Não foi possível desativar ${student.user.name}.`,
        ),
      );
    }
  }

  return (
    <>
      <PageHeading
        title="Alunos"
        subtitle="Gerencie os alunos cadastrados na sua academia."
        actions={
          canManage && (
            <button className="btn-primary" onClick={openCreate}>
              <Plus size={17} /> Novo aluno
            </button>
          )
        }
      />
      <section className="panel module-panel">
        <div className="table-toolbar">
          <div className="searchbox wide">
            <Search size={16} />
            <input
              placeholder="Pesquisar aluno por nome ou e-mail..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {studentsQuery.isLoading && (
          <div className="skeleton-wrap">
            <TableRowsSkeleton rows={5} />
          </div>
        )}
        {studentsQuery.isError && (
          <Alert variant="error">
            {getApiErrorMessage(studentsQuery.error, "Erro ao carregar alunos.")}
          </Alert>
        )}
        {studentsQuery.data && studentsQuery.data.length === 0 && (
          <EmptyState
            icon={<Users size={24} />}
            title={query ? "Nenhum aluno encontrado" : "Nenhum aluno cadastrado ainda"}
            description={
              query
                ? "Tente buscar por outro nome ou e-mail."
                : "Cadastre o primeiro aluno da sua academia para começar."
            }
            action={
              canManage &&
              !query && (
                <button className="btn-primary" onClick={openCreate}>
                  <Plus size={16} /> Novo aluno
                </button>
              )
            }
          />
        )}
        {studentsQuery.data && studentsQuery.data.length > 0 && (
          <StudentTable
            rows={studentsQuery.data}
            canManage={canManage}
            onEdit={openEdit}
            onDeactivate={handleDeactivate}
          />
        )}
      </section>

      {modalMode && (
        <StudentFormModal student={selected} onClose={closeModal} />
      )}
    </>
  );
}
