import nodemailer from 'nodemailer';
import { getEmailConfig } from './appSettings.js';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

async function createTransporterWithConfig() {
  const config = await getEmailConfig();

  if (!config.host || !config.user || !config.password) {
    throw new Error('Email is not configured. Set SMTP host, user, and password in Admin → Email settings.');
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port ?? 587,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.password,
    },
  });

  const from = config.fromName
    ? `"${config.fromName}" <${config.fromEmail ?? config.user}>`
    : (config.fromEmail ?? config.user);

  return { transporter, from };
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const { transporter, from } = await createTransporterWithConfig();

  await transporter.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });
}

export async function sendQuoteEmail(
  to: string,
  quoteNumber: string,
  clientName: string,
  companyName?: string,
): Promise<void> {
  const company = companyName ? ` from ${companyName}` : '';
  await sendEmail({
    to,
    subject: `Your Quote ${quoteNumber}${company}`,
    html: `
      <p>Hi ${clientName},</p>
      <p>Please find your quote <strong>${quoteNumber}</strong> below${company}.</p>
      <p>If you have any questions, please don't hesitate to get in touch.</p>
      <p>Kind regards${companyName ? `,<br>${companyName}` : ''}</p>
    `,
    text: `Hi ${clientName},\n\nPlease find your quote ${quoteNumber} below${company}.\n\nIf you have any questions, please don't hesitate to get in touch.\n\nKind regards${companyName ? `\n${companyName}` : ''}`,
  });
}

export async function sendInvoiceEmail(
  to: string,
  invoiceNumber: string,
  clientName: string,
  companyName?: string,
): Promise<void> {
  const company = companyName ? ` from ${companyName}` : '';
  await sendEmail({
    to,
    subject: `Invoice ${invoiceNumber}${company}`,
    html: `
      <p>Hi ${clientName},</p>
      <p>Please find your invoice <strong>${invoiceNumber}</strong> below${company}.</p>
      <p>If you have any questions, please don't hesitate to get in touch.</p>
      <p>Kind regards${companyName ? `,<br>${companyName}` : ''}</p>
    `,
    text: `Hi ${clientName},\n\nPlease find your invoice ${invoiceNumber} below${company}.\n\nIf you have any questions, please don't hesitate to get in touch.\n\nKind regards${companyName ? `\n${companyName}` : ''}`,
  });
}
