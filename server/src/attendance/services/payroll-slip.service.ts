import PDFDocument from "pdfkit";

type NumericValue = number | string | { toString(): string };

export type PayrollSlipData = {
  user: {
    name: string;
    username: string;
  };
  summary: {
    totalWorkCount: number;
    totalItems: number;
    hourlyHours: number;
    hourlyEarned: NumericValue;
    dailyCount: number;
    dailyEarned: NumericValue;
    pieceworkCount: number;
    pieceworkEarned: NumericValue;
    totalEarned: NumericValue;
    totalPaid: NumericValue;
    balance: NumericValue;
  };
  payments: Array<{
    paymentDate: Date;
    amount: NumericValue;
    note: string | null;
  }>;
};

const palette = {
  navy: "#102A4C",
  navySoft: "#173F60",
  teal: "#0F8B83",
  emerald: "#12825C",
  blue: "#2F7DF4",
  ink: "#172033",
  muted: "#718096",
  line: "#DCE5EF",
  surface: "#F5F8FC",
  white: "#FFFFFF",
};

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

const dateTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Jakarta",
});

function numeric(value: NumericValue) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function drawBrandHeader(document: PDFKit.PDFDocument, continued = false) {
  const pageWidth = document.page.width;
  document.save();
  document.rect(0, 0, pageWidth, 112).fill(palette.navy);
  document.circle(pageWidth - 42, 0, 112).fillOpacity(0.18).fill(palette.teal);
  document.fillOpacity(1);

  document.roundedRect(42, 28, 48, 48, 13).fill(palette.white);
  document
    .fillColor(palette.navy)
    .font("Helvetica-Bold")
    .fontSize(21)
    .text("A", 42, 41, { width: 48, align: "center" });

  document
    .fillColor(palette.white)
    .font("Helvetica-Bold")
    .fontSize(18)
    .text("ARTECH", 104, 31);
  document
    .fillColor("#BFD8EE")
    .font("Helvetica")
    .fontSize(8)
    .text("WORKFORCE & PAYROLL", 104, 56);

  document
    .fillColor("#D9E8F5")
    .font("Helvetica-Bold")
    .fontSize(9)
    .text(continued ? "SLIP GAJI - LANJUTAN" : "SLIP GAJI KUMULATIF", pageWidth - 230, 40, {
      width: 188,
      align: "right",
    });
  document
    .fillColor("#9FC6CE")
    .font("Helvetica")
    .fontSize(8)
    .text("Dokumen payroll resmi", pageWidth - 230, 57, { width: 188, align: "right" });
  document.restore();
  document.y = 136;
}

function ensureSpace(document: PDFKit.PDFDocument, needed: number) {
  const bottom = document.page.height - 70;
  if (document.y + needed <= bottom) return;
  document.addPage();
  drawBrandHeader(document, true);
}

function drawSectionTitle(document: PDFKit.PDFDocument, eyebrow: string, title: string) {
  const y = document.y;
  const width = document.page.width - 84;
  document
    .fillColor(palette.blue)
    .font("Helvetica-Bold")
    .fontSize(7.5)
    .text(eyebrow.toUpperCase(), 42, y, { width });
  document
    .fillColor(palette.ink)
    .font("Helvetica-Bold")
    .fontSize(14)
    .text(title, 42, y + 13, { width });
  document.y = y + 32;
  document.moveDown(0.8);
}

function drawSummaryCard(
  document: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  label: string,
  value: string,
  accent: string,
) {
  document.roundedRect(x, y, width, 72, 12).fillAndStroke(palette.surface, palette.line);
  document.roundedRect(x, y, 5, 72, 3).fill(accent);
  document
    .fillColor(palette.muted)
    .font("Helvetica-Bold")
    .fontSize(7.5)
    .text(label.toUpperCase(), x + 17, y + 16, { width: width - 28 });
  document
    .fillColor(palette.ink)
    .font("Helvetica-Bold")
    .fontSize(15)
    .text(value, x + 17, y + 37, { width: width - 28 });
}

function drawPaymentHeader(document: PDFKit.PDFDocument) {
  const left = 42;
  const width = document.page.width - 84;
  const y = document.y;
  document.roundedRect(left, y, width, 28, 7).fill(palette.navySoft);
  document.fillColor(palette.white).font("Helvetica-Bold").fontSize(8);
  document.text("TANGGAL", left + 12, y + 10, { width: 92 });
  document.text("KETERANGAN", left + 112, y + 10, { width: width - 250 });
  document.text("NOMINAL", left + width - 126, y + 10, { width: 114, align: "right" });
  document.y = y + 35;
}

export async function createPayrollSlipPdf(data: PayrollSlipData) {
  const document = new PDFDocument({
    size: "A4",
    margin: 42,
    bufferPages: true,
    info: {
      Title: `Slip Gaji - ${data.user.name}`,
      Author: "ARTECH",
      Subject: "Ringkasan payroll kumulatif",
    },
  });
  const chunks: Buffer[] = [];
  document.on("data", (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
  const completed = new Promise<Buffer>((resolve, reject) => {
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);
  });

  const generatedAt = new Date();
  const documentNumber = `ART-PAY-${data.user.username.toUpperCase()}-${generatedAt
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "")}`;
  const contentWidth = document.page.width - 84;

  drawBrandHeader(document);

  document
    .fillColor(palette.ink)
    .font("Helvetica-Bold")
    .fontSize(22)
    .text(data.user.name, 42, document.y, { width: contentWidth * 0.58 });
  document
    .fillColor(palette.muted)
    .font("Helvetica")
    .fontSize(10)
    .text(`@${data.user.username}`, 42, document.y + 4);

  const metaX = document.page.width - 252;
  const metaY = 135;
  document.roundedRect(metaX, metaY, 210, 62, 10).fillAndStroke(palette.surface, palette.line);
  document.fillColor(palette.muted).font("Helvetica-Bold").fontSize(7).text("NOMOR DOKUMEN", metaX + 13, metaY + 12);
  document.fillColor(palette.ink).font("Helvetica-Bold").fontSize(8.5).text(documentNumber, metaX + 13, metaY + 25, { width: 184 });
  document.fillColor(palette.muted).font("Helvetica").fontSize(7.5).text(`Dicetak ${dateTimeFormatter.format(generatedAt)} WIB`, metaX + 13, metaY + 43, { width: 184 });

  document.y = 220;
  drawSectionTitle(document, "Ringkasan payroll", "Posisi pendapatan saat slip diterbitkan");
  const cardGap = 10;
  const cardWidth = (contentWidth - cardGap * 2) / 3;
  const cardY = document.y;
  drawSummaryCard(document, 42, cardY, cardWidth, "Total pendapatan", rupiah.format(numeric(data.summary.totalEarned)), palette.blue);
  drawSummaryCard(document, 42 + cardWidth + cardGap, cardY, cardWidth, "Sudah dibayar", rupiah.format(numeric(data.summary.totalPaid)), palette.teal);
  drawSummaryCard(document, 42 + (cardWidth + cardGap) * 2, cardY, cardWidth, "Sisa gaji", rupiah.format(numeric(data.summary.balance)), palette.emerald);
  document.y = cardY + 94;

  drawSectionTitle(document, "Komposisi upah", "Sumber pendapatan");
  const rows = [
    ["Jam-jaman", `${Number(data.summary.hourlyHours).toFixed(2)} jam`, rupiah.format(numeric(data.summary.hourlyEarned))],
    ["Harian", `${data.summary.dailyCount} pekerjaan`, rupiah.format(numeric(data.summary.dailyEarned))],
    ["Borongan", `${data.summary.pieceworkCount} pekerjaan / ${data.summary.totalItems} item`, rupiah.format(numeric(data.summary.pieceworkEarned))],
  ];
  rows.forEach(([label, detail, value], index) => {
    const y = document.y;
    document.roundedRect(42, y, contentWidth, 40, 8).fill(index % 2 === 0 ? palette.surface : palette.white);
    document.fillColor(palette.ink).font("Helvetica-Bold").fontSize(9.5).text(label, 55, y + 9, { width: 140 });
    document.fillColor(palette.muted).font("Helvetica").fontSize(8).text(detail, 55, y + 23, { width: 240 });
    document.fillColor(palette.ink).font("Helvetica-Bold").fontSize(10).text(value, document.page.width - 220, y + 14, { width: 165, align: "right" });
    document.y = y + 43;
  });

  document.moveDown(0.8);
  ensureSpace(document, 110);
  drawSectionTitle(document, "Riwayat pembayaran", "Transaksi gaji yang telah diterima");
  drawPaymentHeader(document);

  if (!data.payments.length) {
    document.roundedRect(42, document.y, contentWidth, 48, 8).fillAndStroke(palette.surface, palette.line);
    document.fillColor(palette.muted).font("Helvetica").fontSize(9).text("Belum ada pembayaran yang tercatat.", 55, document.y + 17, { width: contentWidth - 26 });
    document.y += 59;
  } else {
    data.payments
      .slice()
      .reverse()
      .forEach((payment, index) => {
        const note = payment.note?.trim() || "Pembayaran gaji";
        const noteHeight = document.heightOfString(note, { width: contentWidth - 250 });
        const rowHeight = Math.max(36, noteHeight + 18);
        if (document.y + rowHeight > document.page.height - 70) {
          document.addPage();
          drawBrandHeader(document, true);
          drawSectionTitle(document, "Riwayat pembayaran", "Lanjutan transaksi");
          drawPaymentHeader(document);
        }
        const y = document.y;
        document.rect(42, y, contentWidth, rowHeight).fill(index % 2 === 0 ? palette.white : palette.surface);
        document.moveTo(42, y + rowHeight).lineTo(42 + contentWidth, y + rowHeight).strokeColor(palette.line).lineWidth(0.6).stroke();
        document.fillColor(palette.ink).font("Helvetica-Bold").fontSize(8.5).text(dateFormatter.format(payment.paymentDate), 54, y + 13, { width: 92 });
        document.fillColor(palette.muted).font("Helvetica").fontSize(8.5).text(note, 154, y + 11, { width: contentWidth - 250 });
        document.fillColor(palette.ink).font("Helvetica-Bold").fontSize(8.5).text(rupiah.format(numeric(payment.amount)), 42 + contentWidth - 126, y + 13, { width: 114, align: "right" });
        document.y = y + rowHeight;
      });
  }

  ensureSpace(document, 70);
  document.moveDown(1.2);
  const noteY = document.y;
  document.roundedRect(42, noteY, contentWidth, 52, 9).fillAndStroke("#EDF7F5", "#CBE8E2");
  document.fillColor(palette.emerald).font("Helvetica-Bold").fontSize(8).text("CATATAN DOKUMEN", 55, noteY + 11);
  document.fillColor("#386B63").font("Helvetica").fontSize(8).text(
    "Slip ini menampilkan posisi payroll kumulatif saat dokumen diterbitkan. Koreksi pekerjaan atau pembayaran setelah waktu cetak akan tercermin pada slip berikutnya.",
    55,
    noteY + 25,
    { width: contentWidth - 26 },
  );

  const pageRange = document.bufferedPageRange();
  for (let pageIndex = pageRange.start; pageIndex < pageRange.start + pageRange.count; pageIndex += 1) {
    document.switchToPage(pageIndex);
    const footerY = document.page.height - 54;
    document.moveTo(42, footerY - 9).lineTo(document.page.width - 42, footerY - 9).strokeColor(palette.line).lineWidth(0.6).stroke();
    document.fillColor(palette.muted).font("Helvetica").fontSize(7.5).text("ARTECH Workforce - Dokumen dibuat otomatis oleh sistem", 42, footerY, { width: 360, lineBreak: false });
    document.fillColor(palette.muted).font("Helvetica-Bold").fontSize(7.5).text(`Halaman ${pageIndex + 1} dari ${pageRange.count}`, document.page.width - 155, footerY, { width: 113, align: "right", lineBreak: false });
  }

  document.end();
  return completed;
}
