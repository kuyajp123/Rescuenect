import { db } from '@/db/firestoreConfig';
import type { EmailDeliveryLog } from '@/types/admin';
import { FieldValue } from 'firebase-admin/firestore';
// import nodemailer from 'nodemailer';
// import { Resend } from 'resend';

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

const getAppEnv = (): string => (process.env.NODE_ENV || process.env.APP_ENV || '').trim().toLowerCase();

const shouldUseResend = (): boolean => getAppEnv() === 'production';

const buildTextBody = (payload: EmailPayload): string => payload.text || payload.html.replace(/<[^>]+>/g, ' ');

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

  private static async sendWithSmtp(payload: EmailPayload, normalizedTo: string, textBody: string): Promise<void> {
    const from = process.env.SMTP_FROM || process.env.SMTP_USER || '';
    
    // -- install nodemailer and uncomment the code below to enable SMTP email sending
    // const transporter = nodemailer.createTransport({
    //   host: process.env.SMTP_HOST,
    //   port: Number(process.env.SMTP_PORT || 587),
    //   secure: getSecureFlag(),
    //   auth:
    //     process.env.SMTP_USER && process.env.SMTP_PASS
    //       ? {
    //           user: process.env.SMTP_USER,
    //           pass: process.env.SMTP_PASS,
    //         }
    //       : undefined,
    // });

    // await transporter.sendMail({
    //   from,
    //   to: normalizedTo,
    //   subject: payload.subject,
    //   html: payload.html,
    //   text: textBody,
    // });
  }

  private static async sendWithResend(payload: EmailPayload, normalizedTo: string, textBody: string): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY?.trim() || '';
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    const from = process.env.RESEND_FROM?.trim() || '';
    if (!from) {
      throw new Error('RESEND_FROM is not configured');
    }

    // -- install the Resend SDK and uncomment the code below to enable Resend email sending
    // const resend = new Resend(apiKey);
    // const { data, error } = await resend.emails.send({
    //   from,
    //   to: normalizedTo,
    //   subject: payload.subject,
    //   html: payload.html,
    //   text: textBody,
    // });

    // // Resend returns { data, error } instead of throwing in many cases.
    // if (error) {
    //   throw new Error(`Resend: ${error.message}`);
    // }

    // if (!data?.id) {
    //   throw new Error('Resend: send failed (no id returned)');
    // }
  }

  static async send(payload: EmailPayload): Promise<void> {
    const normalizedTo = payload.to.trim().toLowerCase();

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

    const textBody = buildTextBody(payload);

    const useResend = shouldUseResend();
    const provider: 'smtp' | 'resend' = useResend ? 'resend' : 'smtp';
    try {
      if (useResend) {
        await this.sendWithResend(payload, normalizedTo, textBody);
      } else {
        await this.sendWithSmtp(payload, normalizedTo, textBody);
      }

      await this.log({
        to: normalizedTo,
        subject: payload.subject,
        template: payload.template,
        status: 'sent',
        error: null,
        provider,
      });
    } catch (error) {
      await this.log({
        to: normalizedTo,
        subject: payload.subject,
        template: payload.template,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown email delivery error',
        provider,
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

/*
  We temporarily disable email sending. but the EmailService must remain in the codebase, we want to preserve the email logs and related functionality. By keeping the service but making it a no-op, we can easily re-enable email sending in the future without losing any of the existing infrastructure or historical data.
*/

// affected code is commented out with the indicator of `--- EMAIL DISABLED ---`

/*
  ENV KEYS TO CONFIGURE FOR RE-ENABLING EMAILS:
  - EMAIL_DELIVERY_ENABLED (set to 'true' to enable)
  - For SMTP:
    - SMTP_HOST
    - SMTP_PORT
    - SMTP_USER
    - SMTP_PASS
    - SMTP_FROM (optional, defaults to SMTP_USER)
    - SMTP_SECURE (set to 'true' if using SSL/TLS on port 465)
  - For Resend:
    - RESEND_API_KEY
    - RESEND_FROM
*/
