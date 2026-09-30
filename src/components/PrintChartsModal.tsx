import React, { useState } from 'react';
import {
  Printer,
  Download,
  X,
  FileCheck,
  CheckCircle2,
  Calendar,
  Loader2,
  Clock,
  Coffee,
  AlertTriangle,
  PieChart as PieIcon,
  BarChart3,
  ListOrdered,
  ExternalLink,
} from 'lucide-react';
import jsPDF from 'jspdf';
import { RegistrationRecord } from '../types';

interface PrintChartsModalProps {
  records: RegistrationRecord[];
  logs?: any[];
  filterCelebration: string;
  filterPeriod?: string;
  onClose: () => void;
  onTriggerNativePrint?: () => void;
}

// Helper to draw a crisp Donut / Pie Chart on offscreen HTML5 Canvas
function drawPieChartToCanvas(
  data: { name: string; total: number; percent: number; color: string }[],
  width = 640,
  height = 360
): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  const total = data.reduce((sum, d) => sum + d.total, 0);
  const cx = width * 0.33;
  const cy = height * 0.5;
  const outerRadius = Math.min(cx, cy) * 0.82;
  const innerRadius = outerRadius * 0.52; // Donut hole

  let startAngle = -Math.PI / 2;

  if (total === 0) {
    ctx.beginPath();
    ctx.arc(cx, cy, outerRadius, 0, Math.PI * 2);
    ctx.arc(cx, cy, innerRadius, Math.PI * 2, 0, true);
    ctx.fillStyle = '#f8fafc';
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Sem dados no período', cx, cy);
  } else {
    data.forEach((slice) => {
      if (slice.total <= 0) return;
      const sliceAngle = (slice.total / total) * Math.PI * 2;
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.arc(cx, cy, outerRadius, startAngle, endAngle);
      ctx.arc(cx, cy, innerRadius, endAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = slice.color;
      ctx.fill();

      // Border between slices
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Label on slice
      if (slice.percent >= 8) {
        const midAngle = startAngle + sliceAngle / 2;
        const textRadius = (outerRadius + innerRadius) / 2;
        const tx = cx + Math.cos(midAngle) * textRadius;
        const ty = cy + Math.sin(midAngle) * textRadius;

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 15px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${slice.percent}%`, tx, ty);
      }

      startAngle = endAngle;
    });

    // Donut hole center content
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${total}`, cx, cy - 8);

    ctx.fillStyle = '#64748b';
    ctx.font = '12px sans-serif';
    ctx.fillText('Acolhidos', cx, cy + 14);
  }

  // Draw Legend on the right side
  const legendX = width * 0.60;
  let legendY = height * 0.22;

  data.forEach((item) => {
    // Color box
    ctx.fillStyle = item.color;
    ctx.beginPath();
    ctx.roundRect(legendX, legendY, 16, 16, 4);
    ctx.fill();

    // Name
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.name, legendX + 26, legendY + 8);

    // Count and percentage
    ctx.fillStyle = '#64748b';
    ctx.font = '12px sans-serif';
    ctx.fillText(`${item.total} pessoas (${item.percent}%)`, legendX + 26, legendY + 28);

    legendY += 58;
  });

  return canvas.toDataURL('image/png');
}

// Helper to draw a crisp Bar Chart on offscreen HTML5 Canvas
function drawBarChartToCanvas(
  data: { name: string; total: number; percent: number; color: string }[],
  width = 640,
  height = 360
): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  const maxVal = Math.max(...data.map((d) => d.total), 1);
  const chartLeft = 50;
  const chartRight = width - 30;
  const chartTop = 45;
  const chartBottom = height - 55;
  const chartWidth = chartRight - chartLeft;
  const chartHeight = chartBottom - chartTop;

  // Horizontal Grid Lines
  ctx.strokeStyle = '#f1f5f9';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = chartTop + (chartHeight * i) / 4;
    ctx.beginPath();
    ctx.moveTo(chartLeft, y);
    ctx.lineTo(chartRight, y);
    ctx.stroke();

    const gridVal = Math.round(maxVal - (maxVal * i) / 4);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${gridVal}`, chartLeft - 10, y);
  }

  const barCount = data.length;
  const gap = chartWidth / barCount;
  const barWidth = Math.min(68, gap * 0.58);

  data.forEach((d, idx) => {
    const barX = chartLeft + idx * gap + (gap - barWidth) / 2;
    const barH = maxVal > 0 ? (d.total / maxVal) * (chartHeight - 30) : 0;
    const barY = chartBottom - barH;

    // Draw Bar
    ctx.fillStyle = d.color;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth, Math.max(barH, 3), [6, 6, 0, 0]);
    ctx.fill();

    // Value and percentage on top
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${d.total}`, barX + barWidth / 2, barY - 16);

    ctx.fillStyle = '#64748b';
    ctx.font = '11px sans-serif';
    ctx.fillText(`(${d.percent}%)`, barX + barWidth / 2, barY - 3);

    // Label below
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(d.name, barX + barWidth / 2, chartBottom + 22);
  });

  return canvas.toDataURL('image/png');
}

export const PrintChartsModal: React.FC<PrintChartsModalProps> = ({
  records,
  filterCelebration,
  onClose,
  onTriggerNativePrint,
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState<string | null>(null);
  const [pdfSuccess, setPdfSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [openedBlobUrl, setOpenedBlobUrl] = useState<string | null>(null);

  // Filter records by celebration if selected
  const filtered = records.filter(
    (r) => filterCelebration === 'todos' || r.celebracaoDomingo === filterCelebration
  );

  const totalPessoas = filtered.length;
  const visitantes = filtered.filter((r) => r.decisionType === 'VISITANTE').length;
  const conversoes = filtered.filter((r) => r.decisionType === 'CONVERSAO').length;
  const reconcils = filtered.filter((r) => r.decisionType === 'RECONCILIACAO').length;
  const aptosCafe = filtered.filter(
    (r) =>
      r.acompanhamento?.visita1 &&
      r.acompanhamento?.visita2 &&
      r.acompanhamento?.visita3 &&
      r.acompanhamento?.visita4
  ).length;
  const cafeMarcado = filtered.filter((r) => r.acompanhamento?.cafeComPastor).length;

  // Age statistics (Gráfico de Pizza)
  const ageCounts: Record<string, number> = {
    '12 a 17 anos': 0,
    '18 a 35 anos': 0,
    '35 anos acima': 0,
  };
  filtered.forEach((r) => {
    if (r.faixaEtaria && ageCounts[r.faixaEtaria] !== undefined) {
      ageCounts[r.faixaEtaria] += 1;
    } else if (r.faixaEtaria) {
      ageCounts[r.faixaEtaria] = (ageCounts[r.faixaEtaria] || 0) + 1;
    }
  });

  const ageData = [
    {
      name: '12 a 17 anos',
      total: ageCounts['12 a 17 anos'],
      percent: totalPessoas > 0 ? Math.round((ageCounts['12 a 17 anos'] / totalPessoas) * 100) : 0,
      color: '#f59e0b', // Amber
    },
    {
      name: '18 a 35 anos',
      total: ageCounts['18 a 35 anos'],
      percent: totalPessoas > 0 ? Math.round((ageCounts['18 a 35 anos'] / totalPessoas) * 100) : 0,
      color: '#dc2626', // Red
    },
    {
      name: '35 anos acima',
      total: ageCounts['35 anos acima'],
      percent: totalPessoas > 0 ? Math.round((ageCounts['35 anos acima'] / totalPessoas) * 100) : 0,
      color: '#1e293b', // Dark Slate
    },
  ];

  // Decisions data
  const decisoesData = [
    {
      name: 'Visitantes',
      total: visitantes,
      percent: totalPessoas > 0 ? Math.round((visitantes / totalPessoas) * 100) : 0,
      color: '#dc2626',
    },
    {
      name: 'Novas Conversões',
      total: conversoes,
      percent: totalPessoas > 0 ? Math.round((conversoes / totalPessoas) * 100) : 0,
      color: '#f59e0b',
    },
    {
      name: 'Reconciliações',
      total: reconcils,
      percent: totalPessoas > 0 ? Math.round((reconcils / totalPessoas) * 100) : 0,
      color: '#059669',
    },
  ];

  // Celebrations data
  const c10h = filtered.filter((r) => r.celebracaoDomingo === '10h').length;
  const c17h = filtered.filter((r) => r.celebracaoDomingo === '17h').length;
  const c21h = filtered.filter((r) => r.celebracaoDomingo === '21h').length;
  const outro = filtered.filter((r) => r.celebracaoDomingo === 'Outro').length;

  const cultosData = [
    {
      name: 'Domingo 10h',
      total: c10h,
      percent: totalPessoas > 0 ? Math.round((c10h / totalPessoas) * 100) : 0,
      color: '#dc2626',
    },
    {
      name: 'Domingo 17h',
      total: c17h,
      percent: totalPessoas > 0 ? Math.round((c17h / totalPessoas) * 100) : 0,
      color: '#991b1b',
    },
    {
      name: 'Sexta 21h',
      total: c21h,
      percent: totalPessoas > 0 ? Math.round((c21h / totalPessoas) * 100) : 0,
      color: '#d97706',
    },
    {
      name: 'Outras Reuniões',
      total: outro,
      percent: totalPessoas > 0 ? Math.round((outro / totalPessoas) * 100) : 0,
      color: '#64748b',
    },
  ];

  // Integration steps
  const v1Count = filtered.filter((r) => r.acompanhamento?.visita1).length;
  const v2Count = filtered.filter((r) => r.acompanhamento?.visita2).length;
  const v3Count = filtered.filter((r) => r.acompanhamento?.visita3).length;
  const v4Count = filtered.filter((r) => r.acompanhamento?.visita4).length;
  const cafeRealizado = filtered.filter(
    (r) => r.acompanhamento?.cafeComPastor && r.acompanhamento?.cafeComPastorData
  ).length;

  const jornadaData = [
    {
      etapa: '1ª Visita (Passo 1)',
      desc: '1º Contato / Boas-vindas',
      pessoas: v1Count,
      percent: totalPessoas > 0 ? Math.round((v1Count / totalPessoas) * 100) : 0,
      color: '#f87171',
    },
    {
      etapa: '2ª Visita (Passo 2)',
      desc: 'Apresentação e Convite',
      pessoas: v2Count,
      percent: totalPessoas > 0 ? Math.round((v2Count / totalPessoas) * 100) : 0,
      color: '#ef4444',
    },
    {
      etapa: '3ª Visita (Passo 3)',
      desc: 'Integração na AD Leiria',
      pessoas: v3Count,
      percent: totalPessoas > 0 ? Math.round((v3Count / totalPessoas) * 100) : 0,
      color: '#dc2626',
    },
    {
      etapa: '4ª Visita (Integrados)',
      desc: 'Apto para Café com Pastor',
      pessoas: v4Count,
      percent: totalPessoas > 0 ? Math.round((v4Count / totalPessoas) * 100) : 0,
      color: '#b91c1c',
    },
    {
      etapa: 'Café Realizado',
      desc: 'Encontro com o Pastor',
      pessoas: cafeRealizado,
      percent: totalPessoas > 0 ? Math.round((cafeRealizado / totalPessoas) * 100) : 0,
      color: '#b45309',
    },
  ];

  // Scheduled / Candidates Coffee with pastor
  const coffeeRecords = filtered
    .filter(
      (r) =>
        r.acompanhamento?.cafeComPastor ||
        (r.acompanhamento?.visita1 &&
          r.acompanhamento?.visita2 &&
          r.acompanhamento?.visita3 &&
          r.acompanhamento?.visita4)
    )
    .slice(0, 15);

  // Origin statistics
  const countsOrigem: Record<string, number> = {};
  filtered.forEach((r) => {
    const canal = r.comoConheceu || 'Não especificado';
    countsOrigem[canal] = (countsOrigem[canal] || 0) + 1;
  });
  const origemList = Object.entries(countsOrigem)
    .map(([name, total]) => ({
      name,
      total,
      percent: totalPessoas > 0 ? Math.round((total / totalPessoas) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // BUILD COMPLETE JSPDF DOCUMENT WITH PIE CHART, BARS AND TABLES
  const buildOfficialPdf = (): jsPDF => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 12;
    const contentWidth = pageWidth - margin * 2;

    const dateStr = new Date().toLocaleDateString('pt-PT');
    const timeStr = new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });

    // ==========================================
    // PAGE 1: CABEÇALHO, KPIS E GRÁFICOS PRINCIPAIS
    // ==========================================

    // 1. Top Decorative Bar
    pdf.setFillColor(220, 38, 38); // Red 600
    pdf.rect(0, 0, pageWidth, 5, 'F');

    // 2. Church Header
    pdf.setTextColor(15, 23, 42); // Slate 900
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(15);
    pdf.text('ASSEMBLEIA DE DEUS EM LEIRIA', margin, 14);

    pdf.setTextColor(185, 28, 28); // Red 700
    pdf.setFontSize(9);
    pdf.text('MINISTÉRIO INTEGRARTE • RELATÓRIO EXECUTIVO DE ACOLHIMENTO E INTEGRAÇÃO', margin, 19);

    // Filter Badge (Right Aligned)
    const celebracaoLabel =
      filterCelebration === 'todos' ? 'Todos os Cultos' : `Celebração ${filterCelebration}`;
    pdf.setFillColor(241, 245, 249);
    pdf.roundedRect(pageWidth - margin - 65, 8, 65, 14, 2, 2, 'F');
    pdf.setTextColor(51, 65, 85);
    pdf.setFontSize(7.5);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Filtro: ${celebracaoLabel}`, pageWidth - margin - 61, 13);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Emitido em: ${dateStr} às ${timeStr}`, pageWidth - margin - 61, 19);

    // Separator Line
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.5);
    pdf.line(margin, 24, pageWidth - margin, 24);

    // 3. KPI CARDS (6 Cards Row)
    const kpis = [
      { title: 'TOTAL', val: `${totalPessoas}`, r: 15, g: 23, b: 42 },
      { title: 'VISITANTES', val: `${visitantes}`, r: 220, g: 38, b: 38 },
      { title: 'CONVERSÕES', val: `${conversoes}`, r: 217, g: 119, b: 6 },
      { title: 'RECONCIL.', val: `${reconcils}`, r: 5, g: 150, b: 105 },
      { title: 'APTOS CAFÉ', val: `${aptosCafe}`, r: 79, g: 70, b: 229 },
      { title: 'CAFÉ MARC.', val: `${cafeMarcado}`, r: 180, g: 83, b: 9 },
    ];

    const kpiCardW = (contentWidth - 5 * 2.5) / 6;
    const kpiCardH = 15;
    const kpiY = 27;

    kpis.forEach((kpi, idx) => {
      const x = margin + idx * (kpiCardW + 2.5);
      pdf.setFillColor(248, 250, 252);
      pdf.setDrawColor(226, 232, 240);
      pdf.roundedRect(x, kpiY, kpiCardW, kpiCardH, 2, 2, 'FD');

      pdf.setTextColor(100, 116, 139);
      pdf.setFontSize(6.5);
      pdf.setFont('helvetica', 'bold');
      pdf.text(kpi.title, x + kpiCardW / 2, kpiY + 4.5, { align: 'center' });

      pdf.setTextColor(kpi.r, kpi.g, kpi.b);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(kpi.val, x + kpiCardW / 2, kpiY + 12, { align: 'center' });
    });

    // 4. SECTION 1: GRÁFICO DE PIZZA (FAIXA ETÁRIA) & DECISÕES REGISTADAS
    const row1Y = 46;
    const colW = (contentWidth - 4) / 2;
    const cardH1 = 66;

    // Card 1: Gráfico de Pizza (Faixa Etária)
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(226, 232, 240);
    pdf.roundedRect(margin, row1Y, colW, cardH1, 3, 3, 'FD');

    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(9.5);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Distribuição por Faixa Etária (Pizza)', margin + 4, row1Y + 6);
    pdf.setTextColor(100, 116, 139);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Composição etária dos acolhidos no período', margin + 4, row1Y + 10);

    // Generate Donut/Pie Chart image
    const pieImage = drawPieChartToCanvas(ageData, 640, 360);
    if (pieImage) {
      pdf.addImage(pieImage, 'PNG', margin + 2, row1Y + 12, colW - 4, cardH1 - 14);
    }

    // Card 2: Gráfico de Barras (Decisões Registadas)
    const col2X = margin + colW + 4;
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(226, 232, 240);
    pdf.roundedRect(col2X, row1Y, colW, cardH1, 3, 3, 'FD');

    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(9.5);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Decisões Registadas', col2X + 4, row1Y + 6);
    pdf.setTextColor(100, 116, 139);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Divisão entre Visitantes, Conversões e Reconciliações', col2X + 4, row1Y + 10);

    // Generate Decisions Bar Chart image
    const decisoesImage = drawBarChartToCanvas(decisoesData, 640, 360);
    if (decisoesImage) {
      pdf.addImage(decisoesImage, 'PNG', col2X + 2, row1Y + 12, colW - 4, cardH1 - 14);
    }

    // 5. SECTION 2: CULTOS DE DOMINGO/SEXTA & MEIO DE CHEGADA (ORIGEM)
    const row2Y = row1Y + cardH1 + 4;
    const cardH2 = 66;

    // Card 3: Gráfico de Barras (Frequência por Celebração)
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(226, 232, 240);
    pdf.roundedRect(margin, row2Y, colW, cardH2, 3, 3, 'FD');

    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(9.5);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Frequência por Celebração', margin + 4, row2Y + 6);
    pdf.setTextColor(100, 116, 139);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Distribuição das presenças por horário de culto', margin + 4, row2Y + 10);

    const cultosImage = drawBarChartToCanvas(cultosData, 640, 360);
    if (cultosImage) {
      pdf.addImage(cultosImage, 'PNG', margin + 2, row2Y + 12, colW - 4, cardH2 - 14);
    }

    // Card 4: Origem / Como Conheceu a Igreja
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(226, 232, 240);
    pdf.roundedRect(col2X, row2Y, colW, cardH2, 3, 3, 'FD');

    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(9.5);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Meio de Chegada (Origem)', col2X + 4, row2Y + 6);
    pdf.setTextColor(100, 116, 139);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Canais de convite mais frequentes', col2X + 4, row2Y + 10);

    let origY = row2Y + 15;
    origemList.forEach((orig) => {
      pdf.setTextColor(30, 41, 59);
      pdf.setFontSize(7.5);
      pdf.setFont('helvetica', 'bold');
      pdf.text(orig.name.slice(0, 24), col2X + 6, origY + 3);

      pdf.setTextColor(100, 116, 139);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${orig.total} (${orig.percent}%)`, col2X + colW - 22, origY + 3);

      // Progress line
      pdf.setFillColor(241, 245, 249);
      pdf.roundedRect(col2X + 6, origY + 5, colW - 12, 3, 1.5, 1.5, 'F');
      pdf.setFillColor(220, 38, 38);
      const barFillW = Math.max(2, ((colW - 12) * orig.percent) / 100);
      pdf.roundedRect(col2X + 6, origY + 5, barFillW, 3, 1.5, 1.5, 'F');

      origY += 9.5;
    });

    // 6. SECTION 3: JORNADA DE ACOMPANHAMENTO (PROGRESS BARS)
    const row3Y = row2Y + cardH2 + 4;
    const cardH3 = 78;

    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(226, 232, 240);
    pdf.roundedRect(margin, row3Y, contentWidth, cardH3, 3, 3, 'FD');

    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Jornada de Acompanhamento (Passos 1 ao 4 & Café com o Pastor)', margin + 6, row3Y + 7);
    pdf.setTextColor(100, 116, 139);
    pdf.setFontSize(7.5);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Evolução dos acolhidos até à integração plena na família AD Leiria', margin + 6, row3Y + 12);

    let stepY = row3Y + 18;
    jornadaData.forEach((step) => {
      // Step box
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(margin + 6, stepY, contentWidth - 12, 10.5, 2, 2, 'F');

      // Step title
      pdf.setTextColor(15, 23, 42);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.text(step.etapa, margin + 10, stepY + 4.5);

      pdf.setTextColor(100, 116, 139);
      pdf.setFontSize(6.5);
      pdf.setFont('helvetica', 'normal');
      pdf.text(step.desc, margin + 10, stepY + 8.5);

      // Progress track
      const trackX = margin + 70;
      const trackW = contentWidth - 120;
      pdf.setFillColor(226, 232, 240);
      pdf.roundedRect(trackX, stepY + 3.5, trackW, 4, 2, 2, 'F');

      // Progress bar fill
      pdf.setFillColor(220, 38, 38);
      const fillW = Math.max(2, (trackW * step.percent) / 100);
      pdf.roundedRect(trackX, stepY + 3.5, fillW, 4, 2, 2, 'F');

      // Counter & percentage
      pdf.setTextColor(15, 23, 42);
      pdf.setFontSize(8.5);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${step.pessoas} (${step.percent}%)`, contentWidth + margin - 24, stepY + 6.5);

      stepY += 12;
    });

    // Page 1 Footer
    pdf.setDrawColor(226, 232, 240);
    pdf.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);
    pdf.setTextColor(148, 163, 184);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Assembleia de Deus em Leiria • Ministério Integrarte • Documento Confidencial', margin, pageHeight - 6);
    pdf.text('Página 1 de 2', pageWidth - margin - 15, pageHeight - 6);

    // ==========================================
    // PAGE 2: MARCAÇÕES CAFÉ COM PASTOR & APTOS
    // ==========================================
    pdf.addPage();

    // Top Decorative Bar
    pdf.setFillColor(220, 38, 38);
    pdf.rect(0, 0, pageWidth, 4, 'F');

    // Page 2 Header
    pdf.setTextColor(15, 23, 42);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.text('ASSEMBLEIA DE DEUS EM LEIRIA', margin, 12);

    pdf.setTextColor(185, 28, 28);
    pdf.setFontSize(8.5);
    pdf.text('QUADRO DE MARCAÇÃO E CANDIDATOS AO CAFÉ COM O PASTOR', margin, 17);

    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.5);
    pdf.line(margin, 21, pageWidth - margin, 21);

    // Summary Box of Coffee
    pdf.setFillColor(254, 243, 199); // Amber 100
    pdf.setDrawColor(251, 191, 36);
    pdf.roundedRect(margin, 24, contentWidth, 14, 2, 2, 'FD');

    pdf.setTextColor(146, 64, 14); // Amber 800
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text(
      `Total de Acolhidos Aptos: ${aptosCafe}  •  Cafés Agendados/Realizados: ${cafeMarcado}  •  Aguardando Agendamento: ${Math.max(0, aptosCafe - cafeMarcado)}`,
      margin + 6,
      32
    );

    // Table of Records
    const tableY = 42;
    pdf.setFillColor(241, 245, 249);
    pdf.rect(margin, tableY, contentWidth, 7, 'F');

    pdf.setTextColor(51, 65, 85);
    pdf.setFontSize(7.5);
    pdf.setFont('helvetica', 'bold');
    pdf.text('NOME COMPLETO', margin + 4, tableY + 5);
    pdf.text('TELEFONE / WHATSAPP', margin + 65, tableY + 5);
    pdf.text('CULTOS', margin + 110, tableY + 5);
    pdf.text('STATUS CAFÉ', margin + 135, tableY + 5);
    pdf.text('DATA AGENDADA', margin + 160, tableY + 5);

    let rowY = tableY + 7;
    const maxRows = Math.min(coffeeRecords.length, 18);

    if (maxRows === 0) {
      pdf.setTextColor(148, 163, 184);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Nenhum acolhido registrado com passos concluídos ou café pendente.', margin + 4, rowY + 10);
    } else {
      coffeeRecords.slice(0, maxRows).forEach((rec, rIdx) => {
        if (rIdx % 2 === 1) {
          pdf.setFillColor(248, 250, 252);
          pdf.rect(margin, rowY, contentWidth, 6.8, 'F');
        }

        pdf.setTextColor(15, 23, 42);
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'bold');
        pdf.text(rec.nome.slice(0, 32), margin + 4, rowY + 4.5);

        pdf.setTextColor(71, 85, 105);
        pdf.setFont('helvetica', 'normal');
        pdf.text(rec.telefone || 'Não informado', margin + 65, rowY + 4.5);
        pdf.text(rec.celebracaoDomingo || '10h', margin + 110, rowY + 4.5);

        const isRealizado = rec.acompanhamento?.cafeComPastor && rec.acompanhamento?.cafeComPastorData;
        const isAgendado = rec.acompanhamento?.cafeComPastor && !rec.acompanhamento?.cafeComPastorData;

        if (isRealizado) {
          pdf.setTextColor(5, 150, 105);
          pdf.text('Realizado', margin + 135, rowY + 4.5);
          pdf.text(rec.acompanhamento?.cafeComPastorData || '-', margin + 160, rowY + 4.5);
        } else if (isAgendado) {
          pdf.setTextColor(217, 119, 6);
          pdf.text('Agendado', margin + 135, rowY + 4.5);
          pdf.text(rec.acompanhamento?.cafeComPastorData || 'Definir', margin + 160, rowY + 4.5);
        } else {
          pdf.setTextColor(79, 70, 229);
          pdf.text('Apto p/ Café', margin + 135, rowY + 4.5);
          pdf.text('Pendente', margin + 160, rowY + 4.5);
        }

        rowY += 6.8;
      });
    }

    // Signatures Block
    const sigY = pageHeight - 45;
    pdf.setDrawColor(203, 213, 225);
    pdf.line(margin + 10, sigY + 12, margin + 70, sigY + 12);
    pdf.line(pageWidth - margin - 70, sigY + 12, pageWidth - margin - 10, sigY + 12);

    pdf.setTextColor(100, 116, 139);
    pdf.setFontSize(7);
    pdf.text('Responsável pelo Ministério Integrarte', margin + 40, sigY + 16, { align: 'center' });
    pdf.text('Visto da Liderança Pastoral', pageWidth - margin - 40, sigY + 16, { align: 'center' });

    // Page 2 Footer
    pdf.setDrawColor(226, 232, 240);
    pdf.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);
    pdf.setTextColor(148, 163, 184);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Assembleia de Deus em Leiria • Ministério Integrarte • Documento Confidencial', margin, pageHeight - 6);
    pdf.text('Página 2 de 2', pageWidth - margin - 15, pageHeight - 6);

    return pdf;
  };

  // 1. DIRECT DOWNLOAD HANDLER (.PDF FILE)
  const handleDownloadDirectPdf = async () => {
    setIsGeneratingPdf(true);
    setPdfSuccess(false);
    setErrorMessage(null);
    setPdfProgress('A gerar documento PDF em alta resolução...');

    try {
      await new Promise((r) => setTimeout(r, 100));
      const pdf = buildOfficialPdf();
      const fileDate = new Date().toISOString().slice(0, 10);
      pdf.save(`AD_Leiria_Relatorio_Metricas_${fileDate}.pdf`);

      setPdfSuccess(true);
      setPdfProgress('Ficheiro PDF descarregado com sucesso!');
      setTimeout(() => {
        setIsGeneratingPdf(false);
        setPdfProgress(null);
      }, 2000);
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      setIsGeneratingPdf(false);
      setPdfProgress(null);
      setErrorMessage('Não foi possível gerar o PDF. Verifique os dados e tente novamente.');
    }
  };

  // 2. BULLETPROOF PRINT / SAVE AS PDF HANDLER
  const handlePrintClick = async () => {
    setIsGeneratingPdf(true);
    setPdfSuccess(false);
    setErrorMessage(null);
    setPdfProgress('A preparar documento para impressão e salvar em PDF...');

    try {
      await new Promise((r) => setTimeout(r, 100));
      const pdf = buildOfficialPdf();
      pdf.autoPrint();

      const blob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(blob);
      setOpenedBlobUrl(blobUrl);

      // Attempt 1: Open in a clean new browser tab/window (bypasses iframe sandbox)
      const printWindow = window.open(blobUrl, '_blank');

      if (printWindow) {
        setPdfSuccess(true);
        setPdfProgress('Janela de impressão e visualização aberta com sucesso!');
        setTimeout(() => {
          setIsGeneratingPdf(false);
          setPdfProgress(null);
        }, 2000);
        return;
      }

      // Attempt 2: If pop-up was blocked by browser sandbox, use dedicated hidden iframe
      const oldIframe = document.getElementById('ad-leiria-print-frame');
      if (oldIframe) oldIframe.remove();

      const iframe = document.createElement('iframe');
      iframe.id = 'ad-leiria-print-frame';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.src = blobUrl;
      document.body.appendChild(iframe);

      iframe.onload = () => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setPdfSuccess(true);
          setPdfProgress('Diálogo de impressão acionado no navegador!');
        } catch {
          // If browser restricts print inside frame, trigger safe direct download
          const fileDate = new Date().toISOString().slice(0, 10);
          pdf.save(`AD_Leiria_Relatorio_Metricas_${fileDate}.pdf`);
          setPdfSuccess(true);
          setPdfProgress('Documento PDF gerado e descarregado com sucesso!');
        }
        setTimeout(() => {
          setIsGeneratingPdf(false);
          setPdfProgress(null);
          iframe.remove();
        }, 2000);
      };
    } catch (err: any) {
      console.warn('Print handler error, attempting fallback:', err);
      // Fallback: try trigger parent print or download
      if (onTriggerNativePrint) {
        try {
          onTriggerNativePrint();
          setIsGeneratingPdf(false);
          return;
        } catch {}
      }
      handleDownloadDirectPdf();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden my-4 border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-red-700 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <Printer className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-black text-lg text-white">
                Relatório de Métricas & Gráficos em PDF
              </h3>
              <p className="text-xs text-red-100">
                Assembleia de Deus em Leiria • Ministério Integrarte
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {errorMessage && (
            <div className="bg-amber-50 border border-amber-300 p-3.5 rounded-2xl flex items-start gap-3 text-xs text-amber-900 font-medium">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>{errorMessage}</div>
            </div>
          )}

          {pdfProgress && (
            <div
              className={`p-3.5 rounded-2xl flex items-center gap-3 text-xs font-bold transition-all ${
                pdfSuccess
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : 'bg-red-50 text-red-900 border border-red-200'
              }`}
            >
              {isGeneratingPdf && !pdfSuccess ? (
                <Loader2 className="w-4 h-4 animate-spin text-red-600 shrink-0" />
              ) : (
                <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              )}
              <span className="flex-1">{pdfProgress}</span>
              {openedBlobUrl && (
                <a
                  href={openedBlobUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 bg-emerald-700 text-white rounded-lg text-[11px] font-bold inline-flex items-center gap-1 hover:bg-emerald-800"
                >
                  <ExternalLink className="w-3 h-3" />
                  Abrir PDF
                </a>
              )}
            </div>
          )}

          {/* Summary Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 border-b border-slate-200 pb-2">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-red-600" />
                Data do Relatório: {new Date().toLocaleDateString('pt-PT')}
              </span>
              <span className="bg-red-100 text-red-800 px-2.5 py-0.5 rounded-md font-mono text-[11px]">
                {filterCelebration === 'todos' ? 'Todos os Cultos' : `Culto ${filterCelebration}`}
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center pt-1">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total</span>
                <span className="text-lg font-black text-slate-900">{totalPessoas}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Visitantes</span>
                <span className="text-lg font-black text-red-600">{visitantes}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Conversões</span>
                <span className="text-lg font-black text-amber-600">{conversoes}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Reconcil.</span>
                <span className="text-lg font-black text-emerald-600">{reconcils}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Aptos Café</span>
                <span className="text-lg font-black text-indigo-600">{aptosCafe}</span>
              </div>
              <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                <span className="text-[10px] uppercase font-bold text-amber-800 block">Café Marc.</span>
                <span className="text-lg font-black text-amber-700">{cafeMarcado}</span>
              </div>
            </div>
          </div>

          {/* Included Sections Checklist */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Conteúdo Incluso no Documento PDF (Design Oficial):
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 font-medium">
              <div className="flex items-center gap-2 bg-emerald-50/70 border border-emerald-200/80 p-2.5 rounded-xl text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Cabeçalho Oficial AD Leiria & NIF</span>
              </div>
              <div className="flex items-center gap-2 bg-emerald-50/70 border border-emerald-200/80 p-2.5 rounded-xl text-emerald-900">
                <PieIcon className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-bold">Gráfico de Pizza: Distribuição por Faixa Etária</span>
              </div>
              <div className="flex items-center gap-2 bg-emerald-50/70 border border-emerald-200/80 p-2.5 rounded-xl text-emerald-900">
                <BarChart3 className="w-4 h-4 text-red-600 shrink-0" />
                <span>Gráfico: Tipos de Decisões Registadas</span>
              </div>
              <div className="flex items-center gap-2 bg-emerald-50/70 border border-emerald-200/80 p-2.5 rounded-xl text-emerald-900">
                <Clock className="w-4 h-4 text-red-700 shrink-0" />
                <span>Gráfico: Frequência por Celebração (10h, 17h, 21h)</span>
              </div>
              <div className="flex items-center gap-2 bg-emerald-50/70 border border-emerald-200/80 p-2.5 rounded-xl text-emerald-900">
                <ListOrdered className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Jornada dos 4 Passos de Integração</span>
              </div>
              <div className="flex items-center gap-2 bg-emerald-50/70 border border-emerald-200/80 p-2.5 rounded-xl text-emerald-900">
                <Coffee className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Quadro de Marcações Café com Pastor</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100">
            {/* Direct Download Option (jsPDF) */}
            <button
              type="button"
              disabled={isGeneratingPdf}
              onClick={handleDownloadDirectPdf}
              className="p-4 rounded-2xl border-2 border-red-600 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-left transition-all shadow-md flex flex-col justify-between cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase tracking-wider text-red-100">
                  Ficheiro .PDF Direto
                </span>
                {isGeneratingPdf ? (
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                ) : (
                  <Download className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                )}
              </div>
              <div>
                <span className="text-sm font-black block">Baixar Relatório em PDF</span>
                <p className="text-[11px] text-red-100 mt-1 font-normal leading-tight">
                  Gera e transfere imediatamente o ficheiro PDF de alta resolução com o gráfico de pizza e tabelas.
                </p>
              </div>
            </button>

            {/* Print / Save as PDF Option */}
            <button
              type="button"
              disabled={isGeneratingPdf}
              onClick={handlePrintClick}
              className="p-4 rounded-2xl border-2 border-slate-300 bg-white hover:border-red-500 hover:bg-red-50/30 active:bg-slate-50 text-slate-900 font-bold text-left transition-all shadow-xs flex flex-col justify-between cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 group-hover:text-red-600">
                  Impressão & Salvar em PDF
                </span>
                {isGeneratingPdf ? (
                  <Loader2 className="w-5 h-5 animate-spin text-red-600" />
                ) : (
                  <Printer className="w-5 h-5 text-slate-700 group-hover:text-red-600" />
                )}
              </div>
              <div>
                <span className="text-sm font-black block">Imprimir / Salvar em PDF</span>
                <p className="text-[11px] text-slate-500 mt-1 font-normal leading-tight">
                  Abre o documento oficial no visualizador para imprimir na impressora ou salvar em PDF.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500 font-medium">
            Assembleia de Deus em Leiria • Documento Oficial
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
