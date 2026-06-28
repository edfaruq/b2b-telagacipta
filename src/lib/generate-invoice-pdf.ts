import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from "pdf-lib";
import { INVOICE_COMPANY, INVOICE_LOGO_PATH } from "@/lib/invoice-company";
import type { BuyerInvoiceRecord } from "@/lib/invoice-fetch";

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 50;
const LOGO_MAX_WIDTH = 108;
const COL_GUTTER = 28;
const ADDRESS_LINE_HEIGHT = 13;
const ADDRESS_FONT_SIZE = 10;

const color = {
  navy: rgb(0.02, 0.11, 0.29),
  text: rgb(0.1, 0.21, 0.4),
  muted: rgb(0.42, 0.52, 0.69),
  border: rgb(0.82, 0.87, 1),
  green: rgb(0.09, 0.4, 0.2),
};

/** Standard PDF fonts only support WinAnsi; strip/replace unsupported chars. */
function pdfSafe(text: string): string {
  return text
    .replace(/\u2014/g, "-")
    .replace(/\u2013/g, "-")
    .replace(/[^\u0020-\u00FF]/g, "");
}

function formatLongDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function drawText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  opts: { font: PDFFont; size: number; color?: ReturnType<typeof rgb> }
) {
  page.drawText(pdfSafe(text), {
    x,
    y,
    size: opts.size,
    font: opts.font,
    color: opts.color ?? color.text,
  });
}

function wrapTextLines(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const safe = pdfSafe(text).trim();
  if (!safe) return [];

  const words = safe.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  const pushWord = (word: string) => {
    if (font.widthOfTextAtSize(word, fontSize) <= maxWidth) {
      current = word;
      return;
    }
    let chunk = "";
    for (const ch of word) {
      const next = chunk + ch;
      if (font.widthOfTextAtSize(next, fontSize) <= maxWidth) {
        chunk = next;
      } else {
        if (chunk) lines.push(chunk);
        chunk = ch;
      }
    }
    current = chunk;
  };

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      pushWord(word);
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawWrappedBlock(
  page: PDFPage,
  items: string[],
  x: number,
  startY: number,
  maxWidth: number,
  font: PDFFont
): number {
  let y = startY;
  for (const item of items) {
    for (const line of wrapTextLines(item, font, ADDRESS_FONT_SIZE, maxWidth)) {
      drawText(page, line, x, y, { font, size: ADDRESS_FONT_SIZE });
      y -= ADDRESS_LINE_HEIGHT;
    }
  }
  return y;
}

export async function generateInvoicePdfBuffer(invoice: BuyerInvoiceRecord): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const page = pdfDoc.addPage([PAGE_W, PAGE_H]);

  let y = PAGE_H - MARGIN;

  drawText(page, "Invoice", MARGIN, y - 26, { font: fontBold, size: 26, color: color.navy });

  const logoBytes = await readFile(path.join(process.cwd(), INVOICE_LOGO_PATH));
  const logoImage = await pdfDoc.embedPng(logoBytes);
  const logoScale = LOGO_MAX_WIDTH / logoImage.width;
  const logoW = logoImage.width * logoScale;
  const logoH = logoImage.height * logoScale;
  page.drawImage(logoImage, {
    x: PAGE_W - MARGIN - logoW,
    y: PAGE_H - MARGIN - logoH,
    width: logoW,
    height: logoH,
  });

  y -= 56;

  const meta = [
    ["Invoice number", invoice.number],
    ["Date of issue", formatLongDate(invoice.issuedAt)],
    ["Date due", formatLongDate(invoice.dueAt)],
  ] as const;

  for (const [label, value] of meta) {
    drawText(page, label, MARGIN, y, { font, size: 8, color: color.muted });
    drawText(page, value, MARGIN, y - 12, { font, size: 10 });
    y -= 28;
  }

  y -= 12;

  const colWidth = (PAGE_W - 2 * MARGIN - COL_GUTTER) / 2;
  const billColX = MARGIN + colWidth + COL_GUTTER;
  const fromItems = [INVOICE_COMPANY.name, ...INVOICE_COMPANY.lines, INVOICE_COMPANY.email];
  const billItems = invoice.billToLines.filter((line) => line?.trim());

  drawText(page, "From", MARGIN, y, { font, size: 8, color: color.muted });
  drawText(page, "Bill to", billColX, y, { font, size: 8, color: color.muted });

  const bodyStartY = y - 12;
  const fromEndY = drawWrappedBlock(page, fromItems, MARGIN, bodyStartY, colWidth, font);
  const billEndY = drawWrappedBlock(page, billItems, billColX, bodyStartY, colWidth, font);

  y = Math.min(fromEndY, billEndY) - 28;

  drawText(
    page,
    `${invoice.totalLabel} due ${formatLongDate(invoice.dueAt)}`,
    MARGIN,
    y,
    { font: fontBold, size: 16, color: color.navy }
  );
  y -= 28;

  if (invoice.status === "lunas") {
    drawText(page, "PAID", MARGIN, y, { font: fontBold, size: 11, color: color.green });
    y -= 18;
    if (invoice.paymentMethodLabel) {
      drawText(page, `Payment method: ${invoice.paymentMethodLabel}`, MARGIN, y, {
        font,
        size: 10,
        color: color.muted,
      });
      y -= 18;
    } else {
      y -= 4;
    }
  }

  y -= 14;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_W - MARGIN, y },
    thickness: 1,
    color: color.border,
  });
  y -= 22;

  const colQty = MARGIN + 230;
  const colUnit = MARGIN + 280;
  const colAmt = MARGIN + 380;

  drawText(page, "Description", MARGIN, y, { font, size: 8, color: color.muted });
  drawText(page, "Qty", colQty, y, { font, size: 8, color: color.muted });
  drawText(page, "Unit price", colUnit, y, { font, size: 8, color: color.muted });
  drawText(page, "Amount", colAmt, y, { font, size: 8, color: color.muted });
  y -= 20;

  drawText(page, invoice.productName, MARGIN, y, { font, size: 10 });
  drawText(page, String(invoice.quantity), colQty, y, { font, size: 10 });
  drawText(page, invoice.lines.unitPrice, colUnit, y, { font, size: 10 });
  drawText(page, invoice.lines.subtotal, colAmt, y, { font, size: 10 });
  y -= 14;
  drawText(page, `Shipping via ${invoice.lines.expedition || "—"}`, MARGIN, y, {
    font,
    size: 9,
    color: color.muted,
  });
  y -= 28;

  const totalsX = 330;
  const totalRows: [string, string, boolean][] = [
    ["Subtotal", invoice.lines.subtotal, false],
    ["Shipping", invoice.lines.shipping, false],
    ["Total", invoice.lines.total, true],
    ["Amount due", invoice.totalLabel, true],
  ];

  for (const [label, value, bold] of totalRows) {
    drawText(page, label, totalsX, y, {
      font: bold ? fontBold : font,
      size: 10,
      color: color.muted,
    });
    drawText(page, value, totalsX + 95, y, {
      font: bold ? fontBold : font,
      size: 10,
      color: color.navy,
    });
    y -= 18;
  }

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}
