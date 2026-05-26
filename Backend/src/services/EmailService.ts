import { db } from '@/db/firestoreConfig';
import type { EmailDeliveryLog } from '@/types/admin';
import { FieldValue } from 'firebase-admin/firestore';
import nodemailer from 'nodemailer';

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  template: string;
};

const isEmailEnabled = (): boolean => {
  const value = process.env.EMAIL_DELIVERY_ENABLED?.trim().toLowerCase();
  return value === 'true' || value === '1' || value === 'yes' || value === 'on';
};

const getSecureFlag = (): boolean => {
  const value = process.env.SMTP_SECURE?.trim().toLowerCase();
  return value === 'true' || value === '1' || value === 'yes' || value === 'on';
};

export class EmailService {
  private static async log(payload: Omit<EmailDeliveryLog, 'id' | 'createdAt'>): Promise<void> {
    try {
      await db.collection('emailLogs').add({
        ...payload,
        createdAt: FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error('Failed to log email delivery:', error);
    }
  }

  static async send(payload: EmailPayload): Promise<void> {
    const normalizedTo = payload.to.trim().toLowerCase();
    const from = process.env.SMTP_FROM || process.env.SMTP_USER || '';

    if (!isEmailEnabled()) {
      await this.log({
        to: normalizedTo,
        subject: payload.subject,
        template: payload.template,
        status: 'disabled',
        error: null,
      });
      return;
    }

    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: getSecureFlag(),
        auth:
          process.env.SMTP_USER && process.env.SMTP_PASS
            ? {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
              }
            : undefined,
      });

      await transporter.sendMail({
        from,
        to: normalizedTo,
        subject: payload.subject,
        html: payload.html,
        text: payload.text || payload.html.replace(/<[^>]+>/g, ' '),
      });

      await this.log({
        to: normalizedTo,
        subject: payload.subject,
        template: payload.template,
        status: 'sent',
        error: null,
      });
    } catch (error) {
      await this.log({
        to: normalizedTo,
        subject: payload.subject,
        template: payload.template,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown email delivery error',
      });
    }
  }

  static async sendSimple(params: {
    to: string;
    subject: string;
    title: string;
    message: string;
    template: string;
    actionUrl?: string;
    actionLabel?: string;
  }): Promise<void> {
    const action =
      params.actionUrl && params.actionLabel
        ? `<p><a href="${params.actionUrl}" style="display:inline-block;background:#0ea5e9;color:#fff;padding:10px 14px;border-radius:8px;text-decoration:none">${params.actionLabel}</a></p>`
        : '';

    await this.send({
      to: params.to,
      subject: params.subject,
      template: params.template,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
          <h2>${params.title}</h2>
          <p>${params.message}</p>
          ${action}
          <p style="font-size:12px;color:#6b7280">Rescuenect</p>
        </div>
      `,
    });
  }
}
