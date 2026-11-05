export const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const ALLOWED_EXERCISE_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
export const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

export function validateAvatarFile(file: File): string | null {
  if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
    return "Formato inválido. Envie uma imagem JPG, PNG ou WEBP.";
  }
  if (file.size > MAX_AVATAR_SIZE) {
    return "A imagem deve ter no máximo 5MB.";
  }
  return null;
}

export function validateExerciseImageFile(file: File): string | null {
  if (!ALLOWED_EXERCISE_IMAGE_TYPES.includes(file.type)) {
    return "Formato inválido. Envie uma imagem JPG, PNG, WEBP ou GIF.";
  }
  if (file.size > MAX_AVATAR_SIZE) {
    return "O arquivo deve ter no máximo 5MB.";
  }
  return null;
}
