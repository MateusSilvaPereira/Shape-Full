import { useState } from "react";
import { Apple, Plus, Search } from "lucide-react";
import { PageHeading } from "@/components/layout/PageHeading";
import { Alert } from "@/components/ui/Alert";
import { Carousel } from "@/components/ui/Carousel";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/toast/ToastContext";
import {
  ActionCanceledError,
  useLoadingOverlay,
} from "@/components/ui/loading/LoadingOverlayContext";
import { useAuth } from "@/features/auth/AuthContext";
import { getApiErrorMessage } from "@/lib/apiClient";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { useErrorToast } from "@/lib/useErrorToast";
import { MealPlanCard } from "./MealPlanCard";
import { MealPlanDetailModal } from "./MealPlanDetailModal";
import { MealPlanFormModal } from "./MealPlanFormModal";
import { useDeleteMealPlan, useMealPlans } from "./useMealPlans";
import type { MealPlan } from "./types";

const NUTRITION_PHOTOS = [
  { src: "/gallery/nutricao-1.jpg", alt: "Treino e alimentação equilibrada" },
  { src: "/gallery/nutricao-2.jpg", alt: "Alimentação saudável e exercício" },
  { src: "/gallery/nutricao-3.jpg", alt: "Salada e hidratação" },
  { src: "/gallery/nutricao-4.jpg", alt: "Café da manhã saudável" },
  { src: "/gallery/nutricao-5.jpg", alt: "Rotina de alimentação e treino" },
];

const MANAGER_ROLES = ["SUPER_ADMIN", "ACADEMY_ADMIN", "NUTRITIONIST"];

function CardSkeleton() {
  return (
    <div className="panel meal-plan-card">
      <Skeleton width="60%" height={14} />
      <Skeleton width="40%" height={10} className="skeleton-block" />
      <div className="skeleton-rows" style={{ marginTop: 16 }}>
        <div className="skeleton-row">
          <Skeleton width={26} height={26} radius={8} />
          <div className="skeleton-row-lines">
            <Skeleton width="70%" height={10} />
            <Skeleton width="50%" height={9} />
          </div>
        </div>
        <div className="skeleton-row">
          <Skeleton width={26} height={26} radius={8} />
          <div className="skeleton-row-lines">
            <Skeleton width="65%" height={10} />
            <Skeleton width="45%" height={9} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function NutritionPage() {
  const { user } = useAuth();
  const { toast, confirm } = useToast();
  const { run } = useLoadingOverlay();
  const canManage = Boolean(user && MANAGER_ROLES.includes(user.role));

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query);
  const plansQuery = useMealPlans(debouncedQuery || undefined);
  const deleteMealPlan = useDeleteMealPlan();
  useErrorToast(
    plansQuery.isError,
    plansQuery.error,
    "Não foi possível carregar os planos alimentares.",
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<MealPlan | undefined>(undefined);
  const [viewing, setViewing] = useState<MealPlan | undefined>(undefined);

  function openCreate() {
    setSelected(undefined);
    setModalOpen(true);
  }

  function openEdit(plan: MealPlan) {
    setSelected(plan);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setSelected(undefined);
  }

  async function handleDelete(plan: MealPlan) {
    const ok = await confirm({
      title: "Excluir plano alimentar",
      message: `Tem certeza que deseja excluir "${plan.title}"? Essa ação não pode ser desfeita.`,
      confirmLabel: "Excluir",
      danger: true,
    });
    if (!ok) return;
    try {
      await run(`Excluindo ${plan.title}...`, (signal) =>
        deleteMealPlan.mutateAsync({ id: plan.id, signal }),
      );
      toast.success(`${plan.title} foi excluído com sucesso.`);
    } catch (err) {
      if (err instanceof ActionCanceledError) {
        toast.info("Ação cancelada.");
        return;
      }
      toast.error(
        getApiErrorMessage(err, `Não foi possível excluir ${plan.title}.`),
      );
    }
  }

  return (
    <>
      <PageHeading
        title="Nutrição"
        subtitle="Monte e acompanhe os planos alimentares dos seus alunos."
        actions={
          canManage && (
            <button className="btn-primary" onClick={openCreate}>
              <Plus size={17} /> Novo plano
            </button>
          )
        }
      />

      <Carousel images={NUTRITION_PHOTOS} intervalMs={5000} className="small" />

      <div className="table-toolbar">
        <div className="searchbox wide">
          <Search size={16} />
          <input
            placeholder="Pesquisar plano por título..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {plansQuery.isError && (
        <Alert variant="error">
          {getApiErrorMessage(
            plansQuery.error,
            "Erro ao carregar planos alimentares.",
          )}
        </Alert>
      )}

      {plansQuery.isLoading && (
        <div className="meal-plan-grid">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      )}

      {plansQuery.data && plansQuery.data.length === 0 && (
        <EmptyState
          icon={<Apple size={24} />}
          title={
            query ? "Nenhum plano encontrado" : "Nenhum plano alimentar ainda"
          }
          description={
            query
              ? "Tente buscar por outro título."
              : "Crie o primeiro plano alimentar para seus alunos."
          }
          action={
            canManage &&
            !query && (
              <button className="btn-primary" onClick={openCreate}>
                <Plus size={16} /> Novo plano
              </button>
            )
          }
        />
      )}

      {plansQuery.data && plansQuery.data.length > 0 && (
        <div className="meal-plan-grid">
          {plansQuery.data.map((plan) => (
            <MealPlanCard
              key={plan.id}
              plan={plan}
              canManage={canManage}
              onView={() => setViewing(plan)}
              onEdit={() => openEdit(plan)}
              onDelete={() => handleDelete(plan)}
            />
          ))}
        </div>
      )}

      {modalOpen && (
        <MealPlanFormModal plan={selected} onClose={closeModal} />
      )}
      {viewing && (
        <MealPlanDetailModal plan={viewing} onClose={() => setViewing(undefined)} />
      )}
    </>
  );
}
