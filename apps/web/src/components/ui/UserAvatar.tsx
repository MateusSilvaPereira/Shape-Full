import { resolveAssetUrl } from "@/lib/apiClient";

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

interface UserAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
}

export function UserAvatar({ name, avatarUrl, size = 33, className }: UserAvatarProps) {
  const src = resolveAssetUrl(avatarUrl);
  return (
    <div
      className={"avatar admin " + (className ?? "")}
      style={{
        width: size,
        height: size,
        overflow: "hidden",
        fontSize: Math.round(size * 0.32),
        flexShrink: 0,
      }}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        initialsOf(name)
      )}
    </div>
  );
}
