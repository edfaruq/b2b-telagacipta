import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from "pdf-lib";
import type { AdminLaporanData } from "@/lib/fetch-admin-laporan";
import { INVOICE_COMPANY, INVOICE_LOGO_PATH } from "@/lib/invoice-company";

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 50;
const LOGO_MAX_WIDTH = 108;
const COL_GUTTER = 28;
const ADDRESS_LINE_HEIGHT = 13;
const ADDRESS_FONT_SIZE = 10;
const FOOTER_Y = 40;

const color = {
  navy: rgb(0.02, 0.11, 0.29),
  text: rgb(0.1, 0.21, 0.4),
  muted: rgb(0.42, 0.52, 0.69),
  border: rgb(0.82, 0.87, 1),
  green: rgb(0.09, 0.4, 0.2),
};

function pdfSafe(text: string): string {
  return text
    .replace(/\u2014/g, "-")
    .replace(/\u2013/g, "-")
    .replace(/[^\u0020-\u00FF]/g, "");
}

function formatLongDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatShortDateTime(iso: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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

function truncate(text: string, font: PDFFont, size: number, maxWidth: number): string {
  const safe = pdfSafe(text);
  if (font.widthOfTextAtSize(safe, size) <= maxWidth) return safe;
  let out = safe;
  while (out.length > 1 && font.widthOfTextAtSize(`${out}...`, size) > maxWidth) {
    out = out.slice(0, -1);
  }
  return `${out}...`;
}

function paymentShort(method: string) {
  return method.includes("PayPal") ? "PayPal" : "Bank transfer";
}

type PageCtx = { page: PDFPage; y: number };

export async function generateReportPdfBuffer(report: AdminLaporanData): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const logoBytes = await readFile(path.join(process.cwd(), INVOICE_LOGO_PATH));
  const logoImage = await pdfDoc.embedPng(logoBytes);
  const logoScale = LOGO_MAX_WIDTH / logoImage.width;
  const logoW = logoImage.width * logoScale;
  const logoH = logoImage.height * logoScale;

  const generatedAt = new Date();
  const pages: PageCtx[] = [];

  const drawLogo = (page: PDFPage) => {
    page.drawImage(logoImage, {
      x: PAGE_W - MARGIN - logoW,
      y: PAGE_H - MARGIN - logoH,
      width: logoW,
      height: logoH,
    });
  };

  const drawTableColumns = (target: PageCtx) => {
    const { page } = target;
    const y = target.y;
    const colQty = MARGIN + 250;
    const colPayment = MARGIN + 300;
    const colAmt = MARGIN + 400;

    drawText(page, "Description", MARGIN, y, { font, size: 8, color: color.muted });
    drawText(page, "Qty", colQty, y, { font, size: 8, color: color.muted });
    drawText(page, "Payment", colPayment, y, { font, size: 8, color: color.muted });
    drawText(page, "Amount", colAmt, y, { font, size: 8, color: color.muted });
    target.y = y - 20;
  };

  const newPage = (continued = false): PageCtx => {
    const page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    drawLogo(page);
    const ctx: PageCtx = { page, y: PAGE_H - MARGIN };

    if (continued) {
      drawText(page, "Transaction Report (continued)", MARGIN, ctx.y - 26, {
        font: fontBold,
        size: 18,
        color: color.navy,
      });
      ctx.y -= 56;
      page.drawLine({
        start: { x: MARGIN, y: ctx.y },
        end: { x: PAGE_W - MARGIN, y: ctx.y },
        thickness: 1,
        color: color.border,
      });
      ctx.y -= 22;
      drawTableColumns(ctx);
    }

    pages.push(ctx);
    return ctx;
  };

  let ctx = newPage();

  drawText(ctx.page, "Transaction Report", MARGIN, ctx.y - 26, {
    font: fontBold,
    size: 26,
    color: color.navy,
  });
  ctx.y -= 56;

  const meta = [
    ["Reporting period", report.periodLabel],
    ["Generated on", formatLongDate(generatedAt)],
    ["Total transactions", String(report.summary.orderCount)],
  ] as const;

  for (const [label, value] of meta) {
    drawText(ctx.page, label, MARGIN, ctx.y, { font, size: 8, color: color.muted });
    drawText(ctx.page, value, MARGIN, ctx.y - 12, { font, size: 10 });
    ctx.y -= 28;
  }

  ctx.y -= 12;

  const colWidth = (PAGE_W - 2 * MARGIN - COL_GUTTER) / 2;
  const rightColX = MARGIN + colWidth + COL_GUTTER;
  const fromItems = [INVOICE_COMPANY.name, ...INVOICE_COMPANY.lines, INVOICE_COMPANY.email];
  const summaryItems = [
    `Period: ${report.periodLabel}`,
    "Status: Completed deliveries",
    `Transactions: ${report.summary.orderCount}`,
    `Total value: ${report.summary.totalRevenueLabel}`,
  ];

  drawText(ctx.page, "From", MARGIN, ctx.y, { font, size: 8, color: color.muted });
  drawText(ctx.page, "Report summary", rightColX, ctx.y, { font, size: 8, color: color.muted });

  const bodyStartY = ctx.y - 12;
  const fromEndY = drawWrappedBlock(ctx.page, fromItems, MARGIN, bodyStartY, colWidth, font);
  const summaryEndY = drawWrappedBlock(ctx.page, summaryItems, rightColX, bodyStartY, colWidth, font);
  ctx.y = Math.min(fromEndY, summaryEndY) - 28;

  drawText(
    ctx.page,
    `${report.summary.totalRevenueLabel} total for ${report.periodLabel}`,
    MARGIN,
    ctx.y,
    { font: fontBold, size: 16, color: color.navy }
  );
  ctx.y -= 22;

  drawText(ctx.page, "COMPLETED ORDERS", MARGIN, ctx.y, {
    font: fontBold,
    size: 11,
    color: color.green,
  });
  ctx.y -= 18;
  drawText(ctx.page, "Successful transactions (paid & delivered)", MARGIN, ctx.y, {
    font,
    size: 10,
    color: color.muted,
  });
  ctx.y -= 22;

  ctx.page.drawLine({
    start: { x: MARGIN, y: ctx.y },
    end: { x: PAGE_W - MARGIN, y: ctx.y },
    thickness: 1,
    color: color.border,
  });
  ctx.y -= 22;

  const colQty = MARGIN + 250;
  const colPayment = MARGIN + 300;
  const colAmt = MARGIN + 400;
  const totalsX = 330;

  const ensureSpace = (needed: number) => {
    if (ctx.y - needed < FOOTER_Y + 20) {
      ctx = newPage(true);
    }
  };

  if (report.transactions.length === 0) {
    drawText(ctx.page, "No successful transactions for this month.", MARGIN, ctx.y, {
      font,
      size: 10,
      color: color.muted,
    });
  } else {
    drawTableColumns(ctx);

    for (const row of report.transactions) {
      ensureSpace(42);

      drawText(ctx.page, row.productName, MARGIN, ctx.y, { font, size: 10 });
      drawText(ctx.page, row.quantityLabel, colQty, ctx.y, { font, size: 10 });
      drawText(ctx.page, paymentShort(row.paymentMethod), colPayment, ctx.y, { font, size: 10 });
      drawText(ctx.page, row.totalLabel, colAmt, ctx.y, { font, size: 10 });
      ctx.y -= 14;

      const subParts = [
        row.invoiceNumber,
        row.buyerName,
        row.expedition ? `via ${row.expedition}` : "",
        `Delivered ${formatShortDateTime(row.deliveredAt)}`,
      ].filter(Boolean);
      drawText(ctx.page, truncate(subParts.join(" · "), font, 9, 230), MARGIN, ctx.y, {
        font,
        size: 9,
        color: color.muted,
      });
      ctx.y -= 28;
    }

    ensureSpace(80);
    const totalRows: [string, string, boolean][] = [
      ["Total transactions", String(report.summary.orderCount), false],
      ["Total value", report.summary.totalRevenueLabel, true],
    ];

    for (const [label, value, bold] of totalRows) {
      drawText(ctx.page, label, totalsX, ctx.y, {
        font: bold ? fontBold : font,
        size: 10,
        color: color.muted,
      });
      drawText(ctx.page, value, totalsX + 95, ctx.y, {
        font: bold ? fontBold : font,
        size: 10,
        color: color.navy,
      });
      ctx.y -= 18;
    }
  }

  const totalPages = pages.length;
  pages.forEach((p, index) => {
    drawText(p.page, `Page ${index + 1} of ${totalPages}`, MARGIN, FOOTER_Y, {
      font,
      size: 8,
      color: color.muted,
    });
  });

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}
