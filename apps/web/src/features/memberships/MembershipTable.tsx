import { CreditCard, Pencil, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { STATUS_CLASSES, STATUS_LABELS } from "./constants";
import type { Membership } from "./types";

const dateFormatter = new Intl.DateTimeFormat("pt-BR");
const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

interface MembershipTableProps {
  rows: Membership[];
  canManage: boolean;
  canDelete: boolean;
  onEdit: (membership: Membership) => void;
  onDelete: (membership: Membership) => void;
  emptyMessage?: string;
}

export function MembershipTable({
  rows,
  canManage,
  canDelete,
  onEdit,
  onDelete,
  emptyMessage = "Nenhuma matrícula encontrada.",
}: MembershipTableProps) {
  if (rows.length === 0) {
    return <EmptyState icon={<CreditCard size={22} />} title={emptyMessage} />;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ALUNO</th>
            <th>PLANO</th>
            <th>VALOR</th>
            <th>STATUS</th>
            <th>INÍCIO</th>
            <th>FIM</th>
            {(canManage || canDelete) && <th></th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((membership) => (
            <tr key={membership.id}>
              <td>
                <div className="student-cell">
                  <div>
                    <b>{membership.student.user.name}</b>
                    <small>{membership.student.user.email}</small>
                  </div>
                </div>
              </td>
              <td>{membership.planName}</td>
              <td>{currencyFormatter.format(Number(membership.monthlyPrice))}</td>
              <td>
                <span className={"status " + STATUS_CLASSES[membership.status]}>
                  <i />
                  {STATUS_LABELS[membership.status]}
                </span>
              </td>
              <td>{dateFormatter.format(new Date(membership.startDate))}</td>
              <td>
                {membership.endDate
                  ? dateFormatter.format(new Date(membership.endDate))
                  : "—"}
              </td>
              {(canManage || canDelete) && (
                <td>
                  <div className="row-actions">
                    {canManage && (
                      <button
                        className="icon-btn"
                        title="Editar matrícula"
                        onClick={() => onEdit(membership)}
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        className="icon-btn icon-btn-danger"
                        title="Excluir matrícula"
                        onClick={() => onDelete(membership)}
                      >
                        <Trash2 size={14} />
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
