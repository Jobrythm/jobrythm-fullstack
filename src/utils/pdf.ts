import PDFDocument from 'pdfkit';
import type { Response } from 'express';
import type { Quote } from '../entities/Quote.js';
import type { Invoice } from '../entities/Invoice.js';
import type { User } from '../entities/User.js';
import type { LineItem } from '../entities/LineItem.js';

// ── helpers ───────────────────────────────────────────────────────────────────

function formatCents(cents: number): string {
  return (Number(cents) / 100).toFixed(2);
}

function formatDate(d: Date | string | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── shared document builder ───────────────────────────────────────────────────

function buildDocumentHeader(
  doc: PDFKit.PDFDocument,
  user: User,
  clientName: string,
  clientAddress: string | undefined,
  docType: 'QUOTE' | 'INVOICE',
  docNumber: string,
  issuedDate: Date,
  secondaryDateLabel: string,
  secondaryDate: Date | undefined,
) {
  const pageWidth = doc.page.width;
  const margin = 50;
  const rightCol = 320;

  // ── contractor block (left) ──────────────────────────────────────────────
  doc
    .fontSize(18)
    .font('Helvetica-Bold')
    .text(user.companyName || user.fullName, margin, margin, { width: 250 });

  if (user.companyAddress) {
    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#555555')
      .text(user.companyAddress, margin, doc.y + 4, { width: 250 });
  }

  // ── document type block (right) ──────────────────────────────────────────
  doc
    .fontSize(22)
    .font('Helvetica-Bold')
    .fillColor('#111111')
    .text(docType, rightCol, margin, { align: 'right', width: pageWidth - rightCol - margin });

  doc
    .fontSize(10)
    .font('Helvetica')
    .fillColor('#333333')
    .text(`#${docNumber}`, rightCol, doc.y + 2, { align: 'right', width: pageWidth - rightCol - margin });

  doc
    .fontSize(9)
    .fillColor('#555555')
    .text(`Issued: ${formatDate(issuedDate)}`, rightCol, doc.y + 4, { align: 'right', width: pageWidth - rightCol - margin })
    .text(`${secondaryDateLabel}: ${formatDate(secondaryDate)}`, rightCol, doc.y + 2, { align: 'right', width: pageWidth - rightCol - margin });

  // ── separator ────────────────────────────────────────────────────────────
  const separatorY = Math.max(doc.y, 120) + 12;
  doc
    .moveTo(margin, separatorY)
    .lineTo(pageWidth - margin, separatorY)
    .strokeColor('#dddddd')
    .lineWidth(1)
    .stroke();

  // ── bill to block ────────────────────────────────────────────────────────
  const billY = separatorY + 16;
  doc
    .fontSize(8)
    .font('Helvetica-Bold')
    .fillColor('#888888')
    .text('BILL TO', margin, billY);

  doc
    .fontSize(11)
    .font('Helvetica-Bold')
    .fillColor('#111111')
    .text(clientName, margin, doc.y + 4);

  if (clientAddress) {
    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#555555')
      .text(clientAddress, margin, doc.y + 2, { width: 250 });
  }

  return doc.y + 24;
}

function buildLineItemsTable(
  doc: PDFKit.PDFDocument,
  lineItems: LineItem[],
  startY: number,
) {
  const margin = 50;
  const pageWidth = doc.page.width;
  const usableWidth = pageWidth - margin * 2;

  // Column widths (fraction of usable width)
  const cols = {
    description: usableWidth * 0.38,
    category:    usableWidth * 0.14,
    qty:         usableWidth * 0.08,
    unit:        usableWidth * 0.08,
    unitPrice:   usableWidth * 0.16,
    total:       usableWidth * 0.16,
  };

  const colX = {
    description: margin,
    category:    margin + cols.description,
    qty:         margin + cols.description + cols.category,
    unit:        margin + cols.description + cols.category + cols.qty,
    unitPrice:   margin + cols.description + cols.category + cols.qty + cols.unit,
    total:       margin + cols.description + cols.category + cols.qty + cols.unit + cols.unitPrice,
  };

  const rowH = 20;
  const headerH = 24;
  let y = startY;

  // Header background
  doc
    .rect(margin, y, usableWidth, headerH)
    .fill('#f0f0f0');

  // Header text
  doc
    .fontSize(8)
    .font('Helvetica-Bold')
    .fillColor('#333333');

  doc.text('Description', colX.description + 4, y + 7);
  doc.text('Category',    colX.category + 4,    y + 7);
  doc.text('Qty',         colX.qty + 4,          y + 7);
  doc.text('Unit',        colX.unit + 4,         y + 7);
  doc.text('Unit Price',  colX.unitPrice + 4,    y + 7, { width: cols.unitPrice - 8, align: 'right' });
  doc.text('Total',       colX.total + 4,        y + 7, { width: cols.total - 8, align: 'right' });

  y += headerH;

  // Rows
  lineItems.forEach((item, i) => {
    if (y > doc.page.height - 150) {
      doc.addPage();
      y = 50;
    }

    const bg = i % 2 === 1 ? '#fafafa' : '#ffffff';
    doc.rect(margin, y, usableWidth, rowH).fill(bg);

    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#111111');

    doc.text(item.description, colX.description + 4, y + 6, { width: cols.description - 8, ellipsis: true });
    doc.text(item.category,    colX.category + 4,    y + 6, { width: cols.category - 8 });
    doc.text(String(Number(item.quantity)), colX.qty + 4, y + 6);
    doc.text(item.unit || '',  colX.unit + 4,        y + 6);
    doc.text(`£${formatCents(item.unitPrice)}`, colX.unitPrice + 4, y + 6, { width: cols.unitPrice - 8, align: 'right' });
    doc.text(`£${formatCents(item.totalPrice)}`, colX.total + 4, y + 6, { width: cols.total - 8, align: 'right' });

    y += rowH;
  });

  // Bottom border
  doc
    .moveTo(margin, y)
    .lineTo(pageWidth - margin, y)
    .strokeColor('#dddddd')
    .lineWidth(1)
    .stroke();

  return y;
}

function buildTotals(
  doc: PDFKit.PDFDocument,
  totalNet: number,
  vatRate: number,
  vatAmount: number,
  totalGross: number,
  startY: number,
) {
  const margin = 50;
  const pageWidth = doc.page.width;
  const labelX = pageWidth - margin - 260;
  const valueX = pageWidth - margin - 100;
  const valueWidth = 100;

  let y = startY + 12;

  const row = (label: string, value: string, bold = false) => {
    doc
      .fontSize(9)
      .font(bold ? 'Helvetica-Bold' : 'Helvetica')
      .fillColor(bold ? '#111111' : '#444444')
      .text(label, labelX, y)
      .text(value,  valueX, y, { width: valueWidth, align: 'right' });
    y += 16;
  };

  row('Subtotal (net)',           `£${formatCents(totalNet)}`);
  row(`VAT (${vatRate}%)`,        `£${formatCents(vatAmount)}`);
  doc.moveTo(labelX, y).lineTo(pageWidth - margin, y).strokeColor('#cccccc').lineWidth(0.5).stroke();
  y += 6;
  row('Total',                    `£${formatCents(totalGross)}`, true);

  return y;
}

function buildNotesTerms(doc: PDFKit.PDFDocument, notes: string | undefined, terms: string | undefined, startY: number) {
  const margin = 50;
  let y = startY + 20;

  if (notes) {
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#888888').text('NOTES', margin, y);
    y += 12;
    doc.fontSize(9).font('Helvetica').fillColor('#444444').text(notes, margin, y, { width: 300 });
    y = doc.y + 12;
  }

  if (terms) {
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#888888').text('TERMS', margin, y);
    y += 12;
    doc.fontSize(9).font('Helvetica').fillColor('#444444').text(terms, margin, y, { width: 300 });
  }
}

// ── public generators ─────────────────────────────────────────────────────────

export function generateQuotePdf(
  res: Response,
  quote: Quote & { job: { lineItems: LineItem[]; client: { name: string; address?: string } | null; title: string } },
  user: User,
): void {
  const doc = new PDFDocument({ margin: 0, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${quote.quoteNumber}.pdf"`);
  doc.pipe(res);

  const bodyStart = buildDocumentHeader(
    doc,
    user,
    quote.job.client?.name ?? 'Client',
    quote.job.client?.address,
    'QUOTE',
    quote.quoteNumber,
    quote.createdAt,
    'Valid Until',
    quote.validUntil,
  );

  const tableEnd = buildLineItemsTable(doc, quote.job.lineItems, bodyStart);
  const totalsEnd = buildTotals(doc, Number(quote.totalNet), Number(quote.vatRate), Number(quote.vatAmount), Number(quote.totalGross), tableEnd);
  buildNotesTerms(doc, quote.notes, quote.terms, totalsEnd);

  doc.end();
}

export function generateInvoicePdf(
  res: Response,
  invoice: Invoice & { job: { lineItems: LineItem[]; client: { name: string; address?: string } | null; title: string } },
  user: User,
): void {
  const doc = new PDFDocument({ margin: 0, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`);
  doc.pipe(res);

  const bodyStart = buildDocumentHeader(
    doc,
    user,
    invoice.job.client?.name ?? 'Client',
    invoice.job.client?.address,
    'INVOICE',
    invoice.invoiceNumber,
    invoice.createdAt,
    'Due',
    invoice.dueDate,
  );

  const tableEnd = buildLineItemsTable(doc, invoice.job.lineItems, bodyStart);
  const totalsEnd = buildTotals(doc, Number(invoice.totalNet), Number(invoice.vatRate), Number(invoice.vatAmount), Number(invoice.totalGross), tableEnd);
  buildNotesTerms(doc, invoice.notes, invoice.terms, totalsEnd);

  // Paid stamp
  if (invoice.paidAt) {
    const cx = doc.page.width / 2;
    const cy = 200;
    doc.save();
    doc.rotate(-35, { origin: [cx, cy] });
    doc.fontSize(48).font('Helvetica-Bold').fillColor('#22c55e').fillOpacity(0.15).text('PAID', cx - 90, cy - 24);
    doc.restore();
  }

  doc.end();
}
