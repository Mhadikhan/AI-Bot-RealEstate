/** Server upload limits (Green API max ~100MB per file for WhatsApp delivery). */
export const MAX_IMAGE_UPLOAD_BYTES = 100 * 1024 * 1024; // 100 MB
export const MAX_VIDEO_UPLOAD_BYTES = 1024 * 1024 * 1024; // 1 GB

export function formatUploadLimit(bytes: number) {
  if (bytes >= 1024 * 1024 * 1024) {
    const gb = bytes / (1024 * 1024 * 1024);
    return gb === 1 ? "1 GB" : `${gb} GB`;
  }
  const mb = Math.round(bytes / (1024 * 1024));
  return `${mb} MB`;
}

export const IMAGE_UPLOAD_LABEL = formatUploadLimit(MAX_IMAGE_UPLOAD_BYTES);
export const VIDEO_UPLOAD_LABEL = formatUploadLimit(MAX_VIDEO_UPLOAD_BYTES);
