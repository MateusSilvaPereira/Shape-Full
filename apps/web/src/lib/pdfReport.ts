import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const value = parseInt(clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

export interface ReportSection {
  heading: string;
  columns: [string, string];
  rows: (string | number)[][];
}

export interface ReportOptions {
  academyName: string;
  primaryColor?: string;
  title: string;
  subtitle?: string;
  sections: ReportSection[];
  fileName: string;
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "long",
  timeStyle: "short",
});

/** Gera e baixa um relatório em PDF com a identidade visual da academia. */
export function downloadReportPdf({
  academyName,
  primaryColor = "#6B2FA3",
  title,
  subtitle,
  sections,
  fileName,
}: ReportOptions) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const [r, g, b] = hexToRgb(primaryColor);
  const margin = 40;

  // Cabeçalho com a cor da marca
  doc.setFillColor(r, g, b);
  doc.rect(0, 0, pageWidth, 96, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(academyName.toUpperCase(), margin, 32);
  doc.setFontSize(20);
  doc.text(title, margin, 58);
  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.text(subtitle, margin, 76);
  }

  let cursorY = 124;
  doc.setTextColor(90, 90, 100);
  doc.setFontSize(9);
  doc.text(`Gerado em ${dateFormatter.format(new Date())}`, margin, cursorY);
  cursorY += 20;

  sections.forEach((section, index) => {
    doc.setTextColor(30, 25, 40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(section.heading, margin, cursorY);
    cursorY += 10;

    autoTable(doc, {
      startY: cursorY,
      margin: { left: margin, right: margin },
      head: [section.columns],
      body: section.rows.map((row) => row.map(String)),
      theme: "striped",
      headStyles: { fillColor: [r, g, b], textColor: 255, fontStyle: "bold", fontSize: 10 },
      bodyStyles: { fontSize: 10, textColor: [40, 35, 50] },
      alternateRowStyles: { fillColor: [247, 245, 251] },
      styles: { cellPadding: 7 },
    });

    cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 28;
    if (cursorY > doc.internal.pageSize.getHeight() - 80 && index < sections.length - 1) {
      doc.addPage();
      cursorY = 50;
    }
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setDrawColor(230, 225, 240);
    doc.line(margin, pageHeight - 40, pageWidth - margin, pageHeight - 40);
    doc.setFontSize(8.5);
    doc.setTextColor(140, 135, 150);
    doc.setFont("helvetica", "normal");
    doc.text(`${academyName} · Relatório gerado pelo sistema`, margin, pageHeight - 26);
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin, pageHeight - 26, { align: "right" });
  }

  doc.save(fileName);
}
