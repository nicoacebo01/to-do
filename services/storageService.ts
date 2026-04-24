import { Attachment } from '../types';

const CLOUD_NAME = 'dmzvnbrww';
const UPLOAD_PRESET = 'to-do finanzas';

export async function uploadAttachment(
  _requestId: string,
  file: File,
  onProgress?: (pct: number) => void
): Promise<Attachment> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', 'finance-ideas-hub');

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        onProgress?.(pct);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        resolve({
          name: file.name,
          url: data.secure_url,
          contentType: file.type,
          size: file.size,
          uploadedAt: new Date().toISOString(),
        });
      } else {
        reject(new Error('Error al subir el archivo a Cloudinary'));
      }
    };

    xhr.onerror = () => reject(new Error('Error de red al subir el archivo'));

    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`);
    xhr.send(formData);
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isImageType(contentType: string): boolean {
  return contentType.startsWith('image/');
}
