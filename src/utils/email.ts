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

  const port = config.port ?? 587;
  // Port 465 uses implicit TLS (secure: true); all other ports (587, 25, etc.)
  // use STARTTLS (secure: false). Deriving from port avoids the
  // "wrong version number" SSL error caused by misconfigured smtp_secure settings.
  const secure = port === 465;

  const transporter = nodemailer.createTransport({
    host: config.host,
    port,
    secure,
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
  totalGross?: number,
  portalUrl?: string,
): Promise<void> {
  const company = companyName ? ` from ${companyName}` : '';
  const amountLine = totalGross !== undefined
    ? `<p><strong>Amount: £${(totalGross / 100).toFixed(2)}</strong></p>`
    : '';
  const ctaButton = portalUrl
    ? `<p style="margin-top:16px"><a href="${portalUrl}" style="background:#2563eb;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">View &amp; Approve Quote</a></p>`
    : '';
  const ctaText = portalUrl ? `\n\nView and approve your quote here: ${portalUrl}` : '';

  await sendEmail({
    to,
    subject: `Your Quote ${quoteNumber}${company}`,
    html: `
      <p>Hi ${clientName},</p>
      <p>Please find your quote <strong>${quoteNumber}</strong> attached${company}.</p>
      ${amountLine}
      ${ctaButton}
      <p>If you have any questions, please don't hesitate to get in touch.</p>
      <p>Kind regards${companyName ? `,<br>${companyName}` : ''}</p>
    `,
    text: `Hi ${clientName},\n\nPlease find your quote ${quoteNumber} below${company}.${ctaText}\n\nIf you have any questions, please don't hesitate to get in touch.\n\nKind regards${companyName ? `\n${companyName}` : ''}`,
  });
}

export async function sendInvoiceEmail(
  to: string,
  invoiceNumber: string,
  clientName: string,
  companyName?: string,
  totalGross?: number,
  dueDate?: Date,
  portalUrl?: string,
): Promise<void> {
  const company = companyName ? ` from ${companyName}` : '';
  const amountLine = totalGross !== undefined
    ? `<p><strong>Amount due: £${(totalGross / 100).toFixed(2)}</strong></p>`
    : '';
  const dueLine = dueDate
    ? `<p>Due: ${new Date(dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>`
    : '';
  const ctaButton = portalUrl
    ? `<p style="margin-top:16px"><a href="${portalUrl}" style="background:#2563eb;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">View &amp; Pay Invoice</a></p>`
    : '';
  const ctaText = portalUrl ? `\n\nView and pay your invoice here: ${portalUrl}` : '';

  await sendEmail({
    to,
    subject: `Invoice ${invoiceNumber}${company}`,
    html: `
      <p>Hi ${clientName},</p>
      <p>Please find your invoice <strong>${invoiceNumber}</strong> attached${company}.</p>
      ${amountLine}
      ${dueLine}
      ${ctaButton}
      <p>If you have any questions, please don't hesitate to get in touch.</p>
      <p>Kind regards${companyName ? `,<br>${companyName}` : ''}</p>
    `,
    text: `Hi ${clientName},\n\nPlease find your invoice ${invoiceNumber} below${company}.${ctaText}\n\nIf you have any questions, please don't hesitate to get in touch.\n\nKind regards${companyName ? `\n${companyName}` : ''}`,
  });
}
