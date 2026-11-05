import { useState } from "react";
import { Image as ImageIcon, Pencil, Plus, Trash2 } from "lucide-react";
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
import { getApiErrorMessage, resolveAssetUrl } from "@/lib/apiClient";
import { useErrorToast } from "@/lib/useErrorToast";
import { BannerFormModal } from "./BannerFormModal";
import { useBanners, useDeleteBanner, useUpdateBanner } from "./useBanners";
import type { Banner } from "./types";

const MANAGER_ROLES = ["SUPER_ADMIN", "ACADEMY_ADMIN"];

export function BannersPage() {
  const { user } = useAuth();
  const { toast, confirm } = useToast();
  const { run } = useLoadingOverlay();
  const canManage = Boolean(user && MANAGER_ROLES.includes(user.role));

  const bannersQuery = useBanners(canManage);
  const updateBanner = useUpdateBanner();
  const deleteBanner = useDeleteBanner();
  useErrorToast(
    bannersQuery.isError,
    bannersQuery.error,
    "Não foi possível carregar os banners.",
  );

  if (!canManage) {
    return (
      <>
        <PageHeading
          title="Conteúdo e banners"
          subtitle="Gerencie os banners promocionais exibidos para os alunos."
        />
        <Alert variant="info">
          Apenas administradores podem gerenciar o conteúdo e os banners.
        </Alert>
      </>
    );
  }

  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<Banner | undefined>(undefined);

  function openCreate() {
    setSelected(undefined);
    setModalOpen(true);
  }

  function openEdit(banner: Banner) {
    setSelected(banner);
    setModalOpen(true);
  }

  async function handleToggleActive(banner: Banner) {
    try {
      await run(`Atualizando ${banner.title}...`, (signal) =>
        updateBanner.mutateAsync({
          id: banner.id,
          input: { active: !banner.active },
          signal,
        }),
      );
      toast.success(
        banner.active
          ? `${banner.title} foi desativado.`
          : `${banner.title} foi ativado.`,
      );
    } catch (err) {
      if (err instanceof ActionCanceledError) {
        toast.info("Ação cancelada.");
        return;
      }
      toast.error(getApiErrorMessage(err, "Não foi possível atualizar o banner."));
    }
  }

  async function handleDelete(banner: Banner) {
    const ok = await confirm({
      title: "Excluir banner",
      message: `Tem certeza que deseja excluir "${banner.title}"?`,
      confirmLabel: "Excluir",
      danger: true,
    });
    if (!ok) return;
    try {
      await run(`Excluindo ${banner.title}...`, (signal) =>
        deleteBanner.mutateAsync({ id: banner.id, signal }),
      );
      toast.success(`${banner.title} foi excluído com sucesso.`);
    } catch (err) {
      if (err instanceof ActionCanceledError) {
        toast.info("Ação cancelada.");
        return;
      }
      toast.error(getApiErrorMessage(err, `Não foi possível excluir ${banner.title}.`));
    }
  }

  return (
    <>
      <PageHeading
        title="Conteúdo e banners"
        subtitle="Gerencie os banners promocionais exibidos para os alunos."
        actions={
          canManage && (
            <button className="btn-primary" onClick={openCreate}>
              <Plus size={17} /> Novo banner
            </button>
          )
        }
      />

      <section className="panel module-panel">
        {bannersQuery.isError && (
          <Alert variant="error">
            {getApiErrorMessage(bannersQuery.error, "Erro ao carregar banners.")}
          </Alert>
        )}

        {bannersQuery.isLoading && (
          <div className="banner-grid" style={{ marginTop: 18 }}>
            <Skeleton height={140} />
            <Skeleton height={140} />
            <Skeleton height={140} />
          </div>
        )}

        {bannersQuery.data && bannersQuery.data.length === 0 && (
          <EmptyState
            icon={<ImageIcon size={24} />}
            title="Nenhum banner cadastrado"
            description="Crie o primeiro banner promocional para sua academia."
            action={
              canManage && (
                <button className="btn-primary" onClick={openCreate}>
                  <Plus size={16} /> Novo banner
                </button>
              )
            }
          />
        )}

        {bannersQuery.data && bannersQuery.data.length > 0 && (
          <div className="banner-grid" style={{ marginTop: 18 }}>
            {bannersQuery.data.map((banner) => (
              <article className="panel banner-card" key={banner.id}>
                <img
                  className="banner-card-image"
                  src={resolveAssetUrl(banner.imageUrl) ?? ""}
                  alt={banner.title}
                />
                <div className="banner-card-head">
                  <div>
                    <span
                      className={"status " + (banner.active ? "ativo" : "inativo")}
                      style={{ cursor: canManage ? "pointer" : "default" }}
                      onClick={() => canManage && handleToggleActive(banner)}
                      title={canManage ? "Clique para alternar o status" : undefined}
                    >
                      <i />
                      {banner.active ? "Ativo" : "Inativo"}
                    </span>
                    <h3>{banner.title}</h3>
                  </div>
                  {canManage && (
                    <div className="row-actions">
                      <button
                        className="icon-btn"
                        title="Editar banner"
                        onClick={() => openEdit(banner)}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className="icon-btn icon-btn-danger"
                        title="Excluir banner"
                        onClick={() => handleDelete(banner)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
                <div className="banner-card-meta">
                  <span>Ordem: {banner.order}</span>
                  {banner.linkUrl && (
                    <a href={banner.linkUrl} target="_blank" rel="noreferrer">
                      Ver link
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {modalOpen && (
        <BannerFormModal banner={selected} onClose={() => setModalOpen(false)} />
      )}
    </>
  );
}
