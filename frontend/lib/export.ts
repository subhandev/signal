import { StructuredReport } from '@/types';

export function exportMarkdown(report: StructuredReport): void {
  const lines: string[] = [
    `# SIGNAL Research Report`,
    `**Query:** ${report.query}`,
    `**Mode:** ${report.mode}`,
    `**Generated:** ${new Date(report.generated_at).toLocaleString()}`,
    `**Confidence:** ${report.confidence_level}`,
    ``,
    `---`,
    ``,
    `## Executive Summary`,
    ``,
    report.executive_summary,
    ``,
    `## Key Findings`,
    ``,
    ...report.key_findings.map((f) => `- ${f}`),
    ``,
    `## Detailed Analysis`,
    ``,
    ...report.detailed_analysis.flatMap((s) => [
      `### ${s.heading}`,
      ``,
      s.content,
      ``,
    ]),
    `## Market Context`,
    ``,
    report.market_context,
    ``,
    `## Risks & Gaps`,
    ``,
    report.risks_and_gaps,
    ``,
    `## Confidence Assessment`,
    ``,
    `**Level:** ${report.confidence_level}`,
    ``,
    report.confidence_rationale,
    ``,
    `## Sources`,
    ``,
    ...report.sources.map((s) => `- [${s.title}](${s.url})`),
  ];

  const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `signal-report-${Date.now()}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportPDF(report: StructuredReport): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth() - margin * 2;
  let y = margin;

  const addText = (text: string, size = 10, bold = false) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    const lines = doc.splitTextToSize(text, pageWidth);
    if (y + lines.length * size * 0.5 > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(lines, margin, y);
    y += lines.length * size * 0.45 + 3;
  };

  addText('SIGNAL Research Report', 18, true);
  addText(`Query: ${report.query}`, 10);
  addText(`Mode: ${report.mode} | Confidence: ${report.confidence_level}`, 10);
  addText(`Generated: ${new Date(report.generated_at).toLocaleString()}`, 10);
  y += 5;

  addText('Executive Summary', 13, true);
  addText(report.executive_summary);
  y += 3;

  addText('Key Findings', 13, true);
  report.key_findings.forEach((f) => addText(`• ${f}`));
  y += 3;

  report.detailed_analysis.forEach((section) => {
    addText(section.heading, 12, true);
    addText(section.content);
    y += 2;
  });

  addText('Market Context', 13, true);
  addText(report.market_context);
  y += 3;

  addText('Risks & Gaps', 13, true);
  addText(report.risks_and_gaps);
  y += 3;

  addText('Sources', 13, true);
  report.sources.forEach((s) => addText(`${s.title} — ${s.url}`));

  doc.save(`signal-report-${Date.now()}.pdf`);
}
