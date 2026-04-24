import React, { useRef, useState } from 'react';
import { Paperclip, X, Image, FileText, Loader2 } from 'lucide-react';
import { Attachment } from '../../types';
import { formatFileSize, isImageType } from '../../services/storageService';

interface Props {
  attachments: Attachment[];
  onAdd: (files: File[]) => void;
  onRemove: (index: number) => void;
  uploading?: boolean;
  pendingFiles?: File[];
  accept?: string;
  hint?: string;
}

const ACCEPTED = '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.gif,.txt,.csv';
const IMAGES_ACCEPTED = '.png,.jpg,.jpeg,.webp,.gif';

export const FileUploader: React.FC<Props> = ({
  attachments,
  onAdd,
  onRemove,
  uploading = false,
  pendingFiles = [],
  accept,
  hint,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const acceptValue = accept ?? ACCEPTED;
  const hintText = hint ?? 'PDF, Excel, Word, imágenes (máx. 10 MB c/u)';

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    onAdd(Array.from(files));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          dragging
            ? 'border-indigo-400 bg-indigo-50'
            : 'border-zinc-200 hover:border-indigo-300 hover:bg-indigo-50/40'
        }`}
      >
        <Paperclip className="mx-auto text-zinc-400 mb-2" size={24} />
        <p className="text-sm text-zinc-500">
          Arrastrá archivos o <span className="text-indigo-600 font-semibold">hacé clic para seleccionar</span>
        </p>
        <p className="text-xs text-zinc-400 mt-1">{hintText}</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={acceptValue}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Pending files being uploaded */}
      {pendingFiles.length > 0 && (
        <div className="space-y-2">
          {pendingFiles.map((f, i) => (
            <div key={i} className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2.5">
              {isImageType(f.type) ? <Image size={16} className="text-indigo-400 flex-shrink-0" /> : <FileText size={16} className="text-indigo-400 flex-shrink-0" />}
              <span className="text-sm text-zinc-700 flex-1 truncate">{f.name}</span>
              <span className="text-xs text-zinc-400">{formatFileSize(f.size)}</span>
              {uploading && <Loader2 size={14} className="animate-spin text-indigo-500 flex-shrink-0" />}
            </div>
          ))}
        </div>
      )}

      {/* Already uploaded attachments */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((att, i) => (
            <div key={i} className="flex items-center gap-3 bg-white border border-zinc-100 rounded-xl px-4 py-2.5 shadow-sm">
              {isImageType(att.contentType)
                ? <Image size={16} className="text-emerald-500 flex-shrink-0" />
                : <FileText size={16} className="text-zinc-400 flex-shrink-0" />}
              <a
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-indigo-600 hover:underline flex-1 truncate"
              >
                {att.name}
              </a>
              <span className="text-xs text-zinc-400">{formatFileSize(att.size)}</span>
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="p-1 text-zinc-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-all flex-shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
