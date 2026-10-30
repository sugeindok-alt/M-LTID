import 'server-only';
import { Resend } from 'resend';
import { createHash, randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import type { Database } from '@/db';
import { emailRecords } from '@/db/schema';
import type { Recipe } from './recipes';
import { AppError } from './errors';
export type Mail = {
  to: string;
  subject: string;
  html: string;
  text: string;
  key: string;
  kind: string;
  userId?: string;
};
export type MailTransport = (mail: Mail) => Promise<{ id: string; local?: boolean }>;
export const escapeHtml = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
export function emailLayout(title: string, content: string, url: string, action: string) {
  return `<!doctype html><html lang="nn"><body style="margin:0;background:#f7f5ee;color:#244333;font-family:Arial,sans-serif"><table role="presentation" width="100%"><tr><td align="center"><table role="presentation" width="560" style="max-width:100%;padding:40px 28px"><tr><td><p style="letter-spacing:8px;font-size:22px">MÅLTID</p><hr style="border:0;border-top:1px solid #c6d1bc"><h1 style="font-family:Georgia,serif;font-weight:400;font-size:36px">${escapeHtml(title)}</h1>${content}<p style="margin:32px 0"><a href="${escapeHtml(url)}" style="background:#244333;color:#fff;padding:16px 24px;border-radius:6px;text-decoration:none">${escapeHtml(action)}</a></p><p style="font-size:12px;line-height:1.6">God mat startar med gode råvarer.<br>Du får denne meldinga fordi du har brukt MÅLTID.</p></td></tr></table></td></tr></table></body></html>`;
}
export function linkMail(
  to: string,
  name: string,
  url: string,
  kind: 'verification' | 'reset' | 'welcome',
  userId: string,
): Mail {
  const title =
    kind === 'verification'
      ? 'Velkomen til bords.'
      : kind === 'reset'
        ? 'Eit nytt passord.'
        : 'Godt å ha deg her.';
  const message =
    kind === 'verification'
      ? 'Stadfest e-postadressa di for å lagre favorittane dine. Lenka er gyldig i éin time.'
      : kind === 'reset'
        ? 'Vel eit nytt passord. Lenka er gyldig i 30 minutt. Ignorer meldinga dersom du ikkje bad om dette.'
        : 'E-postadressa di er stadfesta. No kan du samle oppskrifter og planleggje neste handletur.';
  return {
    to,
    subject: `${title} — MÅLTID`,
    kind,
    userId,
    key: createHash('sha256').update(`${kind}:${userId}:${url}`).digest('hex'),
    text: `Hei ${name}! ${message}\n${url}`,
    html: emailLayout(
      title,
      `<p>Hei ${escapeHtml(name)}!</p><p style="line-height:1.7">${escapeHtml(message)}</p>`,
      url,
      kind === 'verification'
        ? 'Stadfest e-post'
        : kind === 'reset'
          ? 'Vel nytt passord'
          : 'Utforsk oppskriftene',
    ),
  };
}
export function recipeMail(
  to: string,
  recipe: Recipe,
  baseUrl: string,
  key: string,
  userId: string,
): Mail {
  const url = `${baseUrl}/oppskrifter/${recipe.id}`;
  return {
    to,
    subject: `${recipe.title} — MÅLTID`,
    kind: 'recipe',
    key,
    userId,
    text: `${recipe.title}\n${recipe.ingredients.map((i) => `${i.measure} ${i.name}`).join('\n')}\n${url}\nOppskrift: MÅLTID. Biletet er eit KI-generert serveringsforslag.`,
    html: emailLayout(
      recipe.title,
      `<img src="${escapeHtml(new URL(recipe.image, baseUrl).href)}" width="500" alt="${escapeHtml(recipe.title)}" style="max-width:100%;border-radius:8px"><ul style="line-height:1.8">${recipe.ingredients.map((i) => `<li>${escapeHtml(`${i.measure} ${i.name}`)}</li>`).join('')}</ul><p>Oppskrift: MÅLTID. Biletet er eit KI-generert serveringsforslag.</p>`,
      url,
      'Opne oppskrifta',
    ),
  };
}
export const configuredTransport: MailTransport = async (mail) => {
  if (process.env.EMAIL_TRANSPORT === 'file' && process.env.NODE_ENV !== 'production') {
    const { mkdir, writeFile } = await import('node:fs/promises');
    const { join } = await import('node:path');
    const id = randomUUID();
    const directory = join(process.cwd(), '.local', 'mail');
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, `${id}.html`), mail.html, { mode: 0o600 });
    return { id, local: true };
  }
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL)
    throw new AppError('E-posttenesta er ikkje konfigurert.', 503);
  const result = await new Resend(process.env.RESEND_API_KEY).emails.send(
    {
      from: process.env.RESEND_FROM_EMAIL,
      to: mail.to,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    },
    { idempotencyKey: mail.key, signal: AbortSignal.timeout(15000) },
  );
  if (result.error || !result.data?.id)
    throw new AppError('E-postleverandøren tok ikkje imot meldinga. Prøv igjen seinare.', 502);
  return { id: result.data.id };
};
export function createMailer(db: Database, transport: MailTransport = configuredTransport) {
  return async (mail: Mail) => {
    const [claim] = await db
      .insert(emailRecords)
      .values({
        id: randomUUID(),
        userId: mail.userId,
        kind: mail.kind,
        idempotencyKey: mail.key,
        status: 'pending',
      })
      .onConflictDoNothing()
      .returning();
    if (!claim) {
      const [prior] = await db
        .select()
        .from(emailRecords)
        .where(eq(emailRecords.idempotencyKey, mail.key));
      if (prior.status === 'accepted' || prior.status === 'local')
        return { id: prior.providerId!, local: prior.status === 'local' };
      throw new AppError(
        'Denne sendinga er allereie registrert. Vent litt før du prøver på nytt.',
        409,
      );
    }
    try {
      const result = await transport(mail);
      await db
        .update(emailRecords)
        .set({
          status: result.local ? 'local' : 'accepted',
          providerId: result.id,
          updatedAt: new Date(),
        })
        .where(eq(emailRecords.id, claim.id));
      return result;
    } catch (error) {
      await db
        .update(emailRecords)
        .set({ status: 'failed', updatedAt: new Date() })
        .where(eq(emailRecords.id, claim.id));
      throw error;
    }
  };
}
