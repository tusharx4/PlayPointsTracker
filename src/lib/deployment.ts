/** Build-time public asset paths, shared by the document and PWA registration. */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
export const APP_ROOT = `${BASE_PATH}/`;

export function publicAsset(path: string): string {
  return `${APP_ROOT}${path.replace(/^\/+/, "")}`;
}
