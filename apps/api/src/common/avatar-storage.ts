import { BadRequestException, Logger } from "@nestjs/common";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";
import * as fs from "fs";
import * as path from "path";

const logger = new Logger("ImageStorage");

export const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

export const AVATAR_FOLDER = "avatars";
export const AVATAR_URL_PREFIX = "/api/uploads/avatars";

export const LOGO_FOLDER = "logos";
export const LOGO_URL_PREFIX = "/api/uploads/logos";

export const BANNER_FOLDER = "banners";
export const BANNER_URL_PREFIX = "/api/uploads/banners";

export const EXERCISE_FOLDER = "exercises";
export const EXERCISE_URL_PREFIX = "/api/uploads/exercises";

// Mantidos apenas para compatibilidade com o fallback local em desenvolvimento.
const LOCAL_UPLOADS_ROOT = path.join(process.cwd(), "uploads");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "uploads";

const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    : null;

if (!supabase) {
  logger.warn(
    "Supabase Storage não configurado (SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY ausentes) — imagens serão salvas no disco local. Em produção isso faz as imagens serem perdidas a cada reinício do servidor.",
  );
  for (const folder of [AVATAR_FOLDER, LOGO_FOLDER, BANNER_FOLDER, EXERCISE_FOLDER]) {
    fs.mkdirSync(path.join(LOCAL_UPLOADS_ROOT, folder), { recursive: true });
  }
}

const CONTENT_TYPE: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

/**
 * Identifica o tipo real do arquivo pelos bytes mágicos (não confia no
 * Content-Type declarado pelo cliente, que pode ser falsificado).
 */
function sniffImageExtension(buffer: Buffer): "jpg" | "png" | "webp" | "gif" | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpg";
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "png";
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "webp";
  }
  if (
    buffer.length >= 6 &&
    (buffer.toString("ascii", 0, 6) === "GIF87a" ||
      buffer.toString("ascii", 0, 6) === "GIF89a")
  ) {
    return "gif";
  }
  return null;
}

/**
 * Salva uma imagem validada pelos bytes reais e retorna sua URL pública.
 * Usa Supabase Storage quando configurado; cai para disco local em dev.
 */
export async function saveImageFile(
  folder: string,
  urlPrefix: string,
  buffer: Buffer,
  allowGif = false,
): Promise<string> {
  const extension = sniffImageExtension(buffer);
  if (!extension || (extension === "gif" && !allowGif)) {
    throw new BadRequestException(
      allowGif
        ? "Formato inválido. Envie uma imagem JPG, PNG, WEBP ou GIF."
        : "Formato inválido. Envie uma imagem JPG, PNG ou WEBP.",
    );
  }
  const filename = `${randomBytes(12).toString("hex")}.${extension}`;

  if (supabase) {
    const storagePath = `${folder}/${filename}`;
    const { error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(storagePath, buffer, { contentType: CONTENT_TYPE[extension], upsert: false });
    if (error) {
      logger.error(`Falha ao enviar imagem para o Supabase Storage: ${error.message}`);
      throw new BadRequestException("Não foi possível enviar a imagem. Tente novamente.");
    }
    const { data } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(storagePath);
    return data.publicUrl;
  }

  fs.writeFileSync(path.join(LOCAL_UPLOADS_ROOT, folder, filename), buffer);
  return `${urlPrefix}/${filename}`;
}

/** Remove o arquivo de uma imagem anterior, se existir (melhor esforço, nunca lança erro). */
export async function deleteImageFile(folder: string, fileUrl: string | null) {
  if (!fileUrl) return;
  const filename = fileUrl.split("/").pop();
  if (!filename) return;

  if (supabase) {
    const { error } = await supabase.storage.from(SUPABASE_BUCKET).remove([`${folder}/${filename}`]);
    if (error) logger.warn(`Falha ao remover imagem antiga do Supabase Storage: ${error.message}`);
    return;
  }

  fs.unlink(path.join(LOCAL_UPLOADS_ROOT, folder, filename), () => {
    /* ignora se o arquivo já não existir */
  });
}

export function saveAvatarFile(buffer: Buffer): Promise<string> {
  return saveImageFile(AVATAR_FOLDER, AVATAR_URL_PREFIX, buffer);
}

export function deleteAvatarFile(avatarUrl: string | null) {
  return deleteImageFile(AVATAR_FOLDER, avatarUrl);
}

export function saveLogoFile(buffer: Buffer): Promise<string> {
  return saveImageFile(LOGO_FOLDER, LOGO_URL_PREFIX, buffer);
}

export function deleteLogoFile(logoUrl: string | null) {
  return deleteImageFile(LOGO_FOLDER, logoUrl);
}

export function saveBannerFile(buffer: Buffer): Promise<string> {
  return saveImageFile(BANNER_FOLDER, BANNER_URL_PREFIX, buffer);
}

export function deleteBannerFile(bannerUrl: string | null) {
  return deleteImageFile(BANNER_FOLDER, bannerUrl);
}

/** Imagens de exercícios aceitam GIF, pois animações ajudam a demonstrar o movimento. */
export function saveExerciseImageFile(buffer: Buffer): Promise<string> {
  return saveImageFile(EXERCISE_FOLDER, EXERCISE_URL_PREFIX, buffer, true);
}

export function deleteExerciseImageFile(imageUrl: string | null) {
  return deleteImageFile(EXERCISE_FOLDER, imageUrl);
}
