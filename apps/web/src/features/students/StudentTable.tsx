import { Pencil, UserX, Users } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { resolveAssetUrl } from "@/lib/apiClient";
import type { Student } from "./types";

const AVATAR_COLORS = ["lavender", "blue", "pink", "green", "orange"];

function avatarColorFor(id: string) {
  const hash = [...id].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

const STATUS_LABEL: Record<Student["user"]["status"], string> = {
  ACTIVE: "Ativo",
  PENDING: "Pendente",
  INACTIVE: "Inativo",
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR");

interface StudentTableProps {
  rows: Student[];
  canManage: boolean;
  onEdit?: (student: Student) => void;
  onDeactivate?: (student: Student) => void;
  emptyMessage?: string;
}

export function StudentTable({
  rows,
  canManage,
  onEdit,
  onDeactivate,
  emptyMessage = "Nenhum aluno encontrado.",
}: StudentTableProps) {
  if (rows.length === 0) {
    return <EmptyState icon={<Users size={22} />} title={emptyMessage} />;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ALUNO</th>
            <th>PLANO</th>
            <th>STATUS</th>
            <th>MATRÍCULA</th>
            {canManage && <th></th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.id}>
              <td>
                <div className="student-cell">
                  <div className={"student-avatar " + avatarColorFor(s.id)}>
                    {s.user.avatarUrl ? (
                      <img
                        src={resolveAssetUrl(s.user.avatarUrl)!}
                        alt={s.user.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          borderRadius: "inherit",
                        }}
                      />
                    ) : (
                      initialsOf(s.user.name)
                    )}
                  </div>
                  <div>
                    <b>{s.user.name}</b>
                    <small>{s.user.email}</small>
                  </div>
                </div>
              </td>
              <td>{s.memberships[0]?.planName ?? "Sem plano"}</td>
              <td>
                <span
                  className={"status " + STATUS_LABEL[s.user.status].toLowerCase()}
                >
                  <i />
                  {STATUS_LABEL[s.user.status]}
                </span>
              </td>
              <td>{dateFormatter.format(new Date(s.user.createdAt))}</td>
              {canManage && (
                <td>
                  <div className="row-actions">
                    <button
                      className="icon-btn"
                      title="Editar aluno"
                      onClick={() => onEdit?.(s)}
                    >
                      <Pencil size={14} />
                    </button>
                    {s.user.status !== "INACTIVE" && (
                      <button
                        className="icon-btn"
                        title="Desativar aluno"
                        onClick={() => onDeactivate?.(s)}
                      >
                        <UserX size={14} />
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
