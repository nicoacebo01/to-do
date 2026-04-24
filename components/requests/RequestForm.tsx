import React, { useState } from 'react';
import { createRequest } from '../../services/requestService';
import { uploadAttachment } from '../../services/storageService';
import { useAuth } from '../../contexts/AuthContext';
import { FileUploader } from './FileUploader';
import { IdeaRequest, Team, Priority, Status, Attachment } from '../../types';
import { Lightbulb, ArrowLeft, Send, Loader2, Clock, Zap, Target, AlignLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
}

export const RequestForm: React.FC<Props> = ({ onSuccess, onCancel }) => {
  const { appUser } = useAuth();

  const [form, setForm] = useState({
    title: '',
    team: appUser?.team ?? Team.PLANIFICACION,
    currentProcess: '',
    timeSpent: '',
    hoursPerWeek: 0,
    desiredProcess: '',
    expectedBenefit: '',
    priority: Priority.MEDIUM,
  });

  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (field: string, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleAddFiles = (files: File[]) => setPendingFiles((prev) => [...prev, ...files]);
  const handleRemoveAttachment = (index: number) =>
    setAttachments((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appUser) return;
    setError('');
    setSubmitting(true);

    try {
      // Create the request first to get an ID
      const tempId = `temp_${Date.now()}`;
      let uploadedAttachments: Attachment[] = [...attachments];

      // Upload pending files
      if (pendingFiles.length > 0) {
        setUploading(true);
        for (const file of pendingFiles) {
          const att = await uploadAttachment(tempId, file);
          uploadedAttachments.push(att);
        }
        setUploading(false);
      }

      const data: Omit<IdeaRequest, 'id' | 'createdAt' | 'updatedAt' | 'statusHistory'> = {
        title: form.title.trim(),
        team: form.team,
        submittedBy: { email: appUser.email, name: appUser.name },
        currentProcess: form.currentProcess.trim(),
        timeSpent: form.timeSpent.trim(),
        hoursPerWeek: form.hoursPerWeek,
        desiredProcess: form.desiredProcess.trim(),
        expectedBenefit: form.expectedBenefit.trim(),
        priority: form.priority,
        status: Status.IDEA,
        attachments: uploadedAttachments,
        ambassadorNotes: '',
      };

      await createRequest(data);
      onSuccess();
    } catch (err) {
      console.error(err);
      setError('Error al enviar la solicitud. Intentá de nuevo.');
      setSubmitting(false);
      setUploading(false);
    }
  };

  const inputClass =
    'w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm resize-none';

  const labelClass = 'block text-xs font-bold text-zinc-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onCancel}
          className="p-2 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-xl transition-all"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <Lightbulb className="text-indigo-600" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-black text-zinc-900">Nueva solicitud</h1>
            <p className="text-xs text-zinc-500">Contanos tu idea o mejora</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Identificación */}
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-black text-zinc-500 uppercase tracking-widest">Identificación</h2>

          <div>
            <label className={labelClass}>
              Título de la solicitud <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Ej: Automatizar conciliación de cuentas diaria"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Equipo <span className="text-red-500">*</span>
              </label>
              <select
                value={form.team}
                onChange={(e) => set('team', e.target.value)}
                className={inputClass}
              >
                {Object.values(Team).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Prioridad</label>
              <select
                value={form.priority}
                onChange={(e) => set('priority', e.target.value)}
                className={inputClass}
              >
                {Object.values(Priority).map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Card 2: Proceso actual */}
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
            <Clock size={14} /> Situación actual
          </h2>

          <div>
            <label className={labelClass}>
              <AlignLeft size={12} /> ¿Cómo hacen esto hoy? <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={form.currentProcess}
              onChange={(e) => set('currentProcess', e.target.value)}
              placeholder="Describí el proceso paso a paso tal como lo realizan actualmente..."
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                ¿Cuánto tiempo demanda? <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.timeSpent}
                onChange={(e) => set('timeSpent', e.target.value)}
                placeholder="Ej: 2hs por cierre, 30min/día"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Horas semanales estimadas</label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={form.hoursPerWeek || ''}
                onChange={(e) => set('hoursPerWeek', parseFloat(e.target.value) || 0)}
                placeholder="0"
                className={inputClass}
              />
              <p className="text-[10px] text-zinc-400 mt-1">Para calcular el impacto total</p>
            </div>
          </div>
        </div>

        {/* Card 3: Automatización deseada */}
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
            <Zap size={14} /> Automatización deseada
          </h2>

          <div>
            <label className={labelClass}>
              ¿Cómo les gustaría que funcione? <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={form.desiredProcess}
              onChange={(e) => set('desiredProcess', e.target.value)}
              placeholder="Describí cómo imaginás que debería funcionar el proceso automatizado..."
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              <Target size={12} /> Beneficio esperado <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={form.expectedBenefit}
              onChange={(e) => set('expectedBenefit', e.target.value)}
              placeholder="¿Qué problemas resolvería? ¿Qué errores eliminaría? ¿Qué tiempo ahorraría?"
              className={inputClass}
            />
          </div>
        </div>

        {/* Card 4: Adjuntos */}
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-black text-zinc-500 uppercase tracking-widest">
            Adjuntos y capturas
          </h2>
          <p className="text-xs text-zinc-500">
            Podés adjuntar capturas de pantalla, archivos Excel, PDFs o cualquier material que ayude a entender el proceso.
          </p>
          <FileUploader
            attachments={attachments}
            onAdd={handleAddFiles}
            onRemove={handleRemoveAttachment}
            uploading={uploading}
            pendingFiles={pendingFiles}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pb-8">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-white border border-zinc-200 text-zinc-600 font-bold rounded-xl hover:bg-zinc-50 transition-all"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {uploading ? 'Subiendo archivos...' : 'Enviando...'}
              </>
            ) : (
              <>
                <Send size={18} />
                Enviar solicitud
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};
