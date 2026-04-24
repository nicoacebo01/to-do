import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';

admin.initializeApp();
const db = admin.firestore();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTransporter() {
  const cfg = functions.config().mail as { email: string; password: string };
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: cfg.email, pass: cfg.password },
  });
}

function getAppUrl(): string {
  const cfg = functions.config().mail as { appurl?: string };
  return cfg.appurl ?? 'https://to-do-d3f44.web.app';
}

function getSenderEmail(): string {
  const cfg = functions.config().mail as { email: string };
  return cfg.email;
}

async function getAmbassadorEmails(): Promise<string[]> {
  const snap = await db.collection('idea_users')
    .where('role', '==', 'AMBASSADOR')
    .get();
  return snap.docs.map((d) => (d.data() as { email: string }).email).filter(Boolean);
}

function emailWrapper(title: string, body: string, appUrl: string): string {
  return `
  <!DOCTYPE html>
  <html lang="es">
  <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
      <tr><td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:#3730a3;padding:20px 28px;border-radius:12px 12px 0 0;">
              <p style="margin:0;color:#c7d2fe;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Ideas &amp; Mejoras</p>
              <h1 style="margin:4px 0 0;color:#fff;font-size:17px;font-weight:900;">${title}</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background:#fff;padding:28px;border:1px solid #e4e4e7;border-top:none;border-radius:0 0 12px 12px;">
              ${body}
              <div style="margin-top:28px;padding-top:20px;border-top:1px solid #f1f5f9;">
                <a href="${appUrl}" style="display:inline-block;background:#4f46e5;color:#fff;font-weight:700;font-size:13px;padding:10px 22px;border-radius:8px;text-decoration:none;">
                  Abrir la app →
                </a>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 0;text-align:center;">
              <p style="margin:0;color:#a1a1aa;font-size:11px;">Ideas &amp; Mejoras — Finanzas · Lartirigoyen</p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
  </html>`;
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    'Tengo una idea': '💡 Tengo una idea',
    'Lo estamos laburando': '🔧 Lo estamos laburando',
    '¡Lo logramos!': '🎉 ¡Lo logramos!',
  };
  return map[status] ?? status;
}

// ---------------------------------------------------------------------------
// Trigger 1: Nueva solicitud → notificar a embajadores
// ---------------------------------------------------------------------------

export const notifyAmbassadorsOnNewRequest = functions
  .region('us-central1')
  .firestore.document('idea_requests/{requestId}')
  .onCreate(async (snap) => {
    const data = snap.data() as {
      title: string;
      team: string;
      priority: string;
      currentProcess: string;
      submittedBy: { name: string; email: string };
    };

    const ambassadors = await getAmbassadorEmails();
    if (!ambassadors.length) return;

    const body = `
      <p style="color:#52525b;font-size:14px;margin:0 0 16px;">
        <strong>${data.submittedBy.name}</strong> (${data.submittedBy.email})
        cargó una nueva solicitud en el equipo <strong>${data.team}</strong>.
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <tr style="background:#f4f4f5;">
          <td style="padding:8px 12px;font-weight:700;color:#3f3f46;width:130px;">Solicitud</td>
          <td style="padding:8px 12px;color:#18181b;">${data.title}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;font-weight:700;color:#3f3f46;">Equipo</td>
          <td style="padding:8px 12px;color:#18181b;">${data.team}</td>
        </tr>
        <tr style="background:#f4f4f5;">
          <td style="padding:8px 12px;font-weight:700;color:#3f3f46;">Prioridad</td>
          <td style="padding:8px 12px;color:#18181b;">${data.priority}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;font-weight:700;color:#3f3f46;vertical-align:top;">Proceso actual</td>
          <td style="padding:8px 12px;color:#52525b;">${data.currentProcess.slice(0, 300)}${data.currentProcess.length > 300 ? '…' : ''}</td>
        </tr>
      </table>`;

    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"Ideas & Mejoras" <${getSenderEmail()}>`,
      to: ambassadors.join(', '),
      subject: `[Nueva solicitud] ${data.title} — ${data.team}`,
      html: emailWrapper(`Nueva solicitud: ${data.title}`, body, getAppUrl()),
    });

    functions.logger.info(`Notificación enviada a ${ambassadors.length} embajador(es) — nueva solicitud: ${data.title}`);
  });

// ---------------------------------------------------------------------------
// Trigger 2: Cambio de estado → notificar al solicitante
// ---------------------------------------------------------------------------

export const notifyRequesterOnStatusChange = functions
  .region('us-central1')
  .firestore.document('idea_requests/{requestId}')
  .onUpdate(async (change) => {
    const before = change.before.data() as { status: string };
    const after = change.after.data() as {
      status: string;
      title: string;
      team: string;
      submittedBy: { name: string; email: string };
      statusHistory: Array<{ changedByName: string }>;
    };

    if (before.status === after.status) return;

    const changedBy = after.statusHistory?.at(-1)?.changedByName ?? 'El embajador';
    const isDone = after.status === '¡Lo logramos!';

    const body = `
      <p style="color:#52525b;font-size:14px;margin:0 0 20px;">
        Hola <strong>${after.submittedBy.name}</strong>, tu solicitud cambió de estado.
      </p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 20px;margin-bottom:20px;">
        <p style="margin:0;font-size:13px;color:#166534;font-weight:700;">${statusLabel(after.status)}</p>
        <p style="margin:4px 0 0;font-size:12px;color:#4ade80;">${changedBy} actualizó el estado de tu solicitud.</p>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <tr style="background:#f4f4f5;">
          <td style="padding:8px 12px;font-weight:700;color:#3f3f46;width:130px;">Solicitud</td>
          <td style="padding:8px 12px;color:#18181b;">${after.title}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;font-weight:700;color:#3f3f46;">Estado anterior</td>
          <td style="padding:8px 12px;color:#71717a;">${statusLabel(before.status)}</td>
        </tr>
        <tr style="background:#f4f4f5;">
          <td style="padding:8px 12px;font-weight:700;color:#3f3f46;">Estado nuevo</td>
          <td style="padding:8px 12px;color:#18181b;">${statusLabel(after.status)}</td>
        </tr>
      </table>
      ${isDone ? `
      <div style="margin-top:20px;background:#fef3c7;border:1px solid #fde68a;border-radius:10px;padding:16px 20px;">
        <p style="margin:0;font-size:14px;color:#92400e;font-weight:700;">🎉 ¡Tu solicitud fue completada!</p>
        <p style="margin:4px 0 0;font-size:12px;color:#b45309;">Entrá a la app para ver el detalle de la resolución.</p>
      </div>` : ''}`;

    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"Ideas & Mejoras" <${getSenderEmail()}>`,
      to: after.submittedBy.email,
      subject: `${isDone ? '🎉' : '🔄'} Tu solicitud avanzó: ${after.title}`,
      html: emailWrapper(`Actualización: ${after.title}`, body, getAppUrl()),
    });

    functions.logger.info(`Notificación de estado enviada a ${after.submittedBy.email}`);
  });

// ---------------------------------------------------------------------------
// Trigger 3: Nuevo mensaje → notificar al otro lado
// ---------------------------------------------------------------------------

export const notifyOnNewComment = functions
  .region('us-central1')
  .firestore.document('idea_requests/{requestId}/comments/{commentId}')
  .onCreate(async (snap, context) => {
    const comment = snap.data() as {
      authorName: string;
      authorEmail: string;
      authorRole?: string;
      text: string;
    };

    const requestSnap = await db.collection('idea_requests').doc(context.params.requestId).get();
    if (!requestSnap.exists) return;

    const request = requestSnap.data() as {
      title: string;
      team: string;
      submittedBy: { name: string; email: string };
    };

    const commentBody = (recipientName: string) => `
      <p style="color:#52525b;font-size:14px;margin:0 0 16px;">
        Hola <strong>${recipientName}</strong>, hay un nuevo mensaje en la solicitud <strong>${request.title}</strong>.
      </p>
      <div style="background:#f5f3ff;border-left:4px solid #7c3aed;border-radius:0 10px 10px 0;padding:14px 18px;margin-bottom:20px;">
        <p style="margin:0;font-size:12px;font-weight:700;color:#6d28d9;">${comment.authorName}${comment.authorRole === 'AMBASSADOR' ? ' · Embajador' : ''}</p>
        <p style="margin:6px 0 0;font-size:14px;color:#18181b;">${comment.text}</p>
      </div>
      <p style="color:#71717a;font-size:12px;margin:0;">
        Solicitud: <strong>${request.title}</strong> — ${request.team}
      </p>`;

    const transporter = getTransporter();

    if (comment.authorRole === 'AMBASSADOR') {
      // Ambassador commented → notify requester (if not the same person)
      if (comment.authorEmail === request.submittedBy.email) return;
      await transporter.sendMail({
        from: `"Ideas & Mejoras" <${getSenderEmail()}>`,
        to: request.submittedBy.email,
        subject: `💬 El embajador respondió en: ${request.title}`,
        html: emailWrapper(`Nuevo mensaje del embajador`, commentBody(request.submittedBy.name), getAppUrl()),
      });
      functions.logger.info(`Notificación de mensaje enviada a solicitante: ${request.submittedBy.email}`);
    } else {
      // Member commented → notify ambassadors (excluding commenter)
      const ambassadors = await getAmbassadorEmails();
      const recipients = ambassadors.filter((e) => e !== comment.authorEmail);
      if (!recipients.length) return;
      await transporter.sendMail({
        from: `"Ideas & Mejoras" <${getSenderEmail()}>`,
        to: recipients.join(', '),
        subject: `💬 Nueva consulta en: ${request.title}`,
        html: emailWrapper(`Nueva consulta de ${comment.authorName}`, commentBody('embajador'), getAppUrl()),
      });
      functions.logger.info(`Notificación de mensaje enviada a ${recipients.length} embajador(es)`);
    }
  });
