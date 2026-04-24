import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';
import { Attachment } from '../types';

export async function uploadAttachment(
  requestId: string,
  file: File,
  onProgress?: (pct: number) => void
): Promise<Attachment> {
  const path = `idea_requests/${requestId}/${Date.now()}_${file.name}`;
  const storageRef = ref(storage, path);
  const task = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    task.on(
      'state_changed',
      (snap) => {
        const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
        onProgress?.(pct);
      },
      reject,
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve({
          name: file.name,
          url,
          contentType: file.type,
          size: file.size,
          uploadedAt: new Date().toISOString(),
        });
      }
    );
  });
}

export async function deleteAttachment(url: string): Promise<void> {
  try {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  } catch {
    // Ignore if already deleted
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isImageType(contentType: string): boolean {
  return contentType.startsWith('image/');
}
