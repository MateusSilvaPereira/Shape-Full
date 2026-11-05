import { Pencil, UserRound, UserX } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { resolveAssetUrl } from "@/lib/apiClient";
import type { Professional } from "./types";

const ROLE_LABELS: Record<Professional["role"], string> = {
  ACADEMY_ADMIN: "Administrador",
  TRAINER: "Treinador",
  NUTRITIONIST: "Nutricionista",
  RECEPTIONIST: "Recepção",
};

const STATUS_LABEL: Record<Professional["status"], string> = {
  ACTIVE: "Ativo",
  PENDING: "Pendente",
  INACTIVE: "Inativo",
};

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

const AVATAR_COLORS = ["lavender", "blue", "pink", "green", "orange"];
function avatarColorFor(id: string) {
  const hash = [...id].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR");

interface ProfessionalTableProps {
  rows: Professional[];
  canManage: boolean;
  onEdit: (professional: Professional) => void;
  onDeactivate: (professional: Professional) => void;
}

export function ProfessionalTable({
  rows,
  canManage,
  onEdit,
  onDeactivate,
}: ProfessionalTableProps) {
  if (rows.length === 0) {
    return (
      <EmptyState icon={<UserRound size={22} />} title="Nenhum profissional encontrado." />
    );
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>PROFISSIONAL</th>
            <th>FUNÇÃO</th>
            <th>STATUS</th>
            <th>DESDE</th>
            {canManage && <th></th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id}>
              <td>
                <div className="student-cell">
                  <div className={"student-avatar " + avatarColorFor(p.id)}>
                    {p.avatarUrl ? (
                      <img
                        src={resolveAssetUrl(p.avatarUrl)!}
                        alt={p.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          borderRadius: "inherit",
                        }}
                      />
                    ) : (
                      initialsOf(p.name)
                    )}
                  </div>
                  <div>
                    <b>{p.name}</b>
                    <small>{p.email}</small>
                  </div>
                </div>
              </td>
              <td>{ROLE_LABELS[p.role]}</td>
              <td>
                <span className={"status " + STATUS_LABEL[p.status].toLowerCase()}>
                  <i />
                  {STATUS_LABEL[p.status]}
                </span>
              </td>
              <td>{dateFormatter.format(new Date(p.createdAt))}</td>
              {canManage && (
                <td>
                  <div className="row-actions">
                    <button
                      className="icon-btn"
                      title="Editar profissional"
                      onClick={() => onEdit(p)}
                    >
                      <Pencil size={14} />
                    </button>
                    {p.status !== "INACTIVE" && (
                      <button
                        className="icon-btn icon-btn-danger"
                        title="Desativar profissional"
                        onClick={() => onDeactivate(p)}
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
