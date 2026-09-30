/**
 * Utility to reliably print HTML content in web applications and iframe sandboxes.
 * Uses a multi-strategy approach:
 * 1. Blob URL in a clean pop-up/tab (bypasses iframe sandbox restrictions completely).
 * 2. Dedicated off-screen iframe print fallback.
 * 3. Direct window print fallback.
 */

export function buildCompletePrintHtml(htmlContent: string, title: string = 'Documento AD Leiria'): string {
  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #f8fafc;
      font-size: 12px;
      line-height: 1.4;
      padding: 0;
    }
    .print-toolbar {
      background: #1e293b;
      color: white;
      padding: 12px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .print-toolbar-title {
      font-weight: 700;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .print-btn {
      background: #dc2626;
      color: white;
      border: none;
      padding: 8px 18px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: background 0.15s;
    }
    .print-btn:hover {
      background: #b91c1c;
    }
    .close-btn {
      background: #334155;
      color: #e2e8f0;
      border: none;
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      margin-left: 8px;
    }
    .print-canvas {
      max-width: 800px;
      margin: 24px auto;
      background: #ffffff;
      padding: 32px;
      border-radius: 12px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
      border: 1px solid #e2e8f0;
    }
    .header-banner {
      border-bottom: 2px solid #dc2626;
      padding-bottom: 12px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 8px;
      margin-bottom: 18px;
    }
    .kpi-card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px;
      text-align: center;
      background: #f8fafc;
    }
    .kpi-card.highlight {
      border-color: #f59e0b;
      background: #fef3c7;
    }
    .section {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 14px;
      page-break-inside: avoid;
      background: #ffffff;
    }
    .section-title {
      font-size: 13px;
      font-weight: 800;
      color: #991b1b;
      margin-bottom: 8px;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    th {
      text-align: left;
      background: #f1f5f9;
      padding: 6px 8px;
      font-weight: 700;
      color: #334155;
      border-bottom: 1px solid #cbd5e1;
    }
    td {
      padding: 6px 8px;
      border-bottom: 1px solid #f1f5f9;
      color: #1e293b;
    }
    .progress-track {
      background: #e2e8f0;
      border-radius: 4px;
      height: 10px;
      width: 100%;
      overflow: hidden;
    }
    .progress-bar {
      height: 100%;
      background: #dc2626;
      border-radius: 4px;
    }
    .footer {
      margin-top: 24px;
      padding-top: 12px;
      border-top: 1px solid #cbd5e1;
      font-size: 10px;
      color: #64748b;
      display: flex;
      justify-content: space-between;
    }

    @media print {
      .print-toolbar {
        display: none !important;
      }
      body {
        background: #ffffff !important;
        padding: 0 !important;
      }
      .print-canvas {
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
        box-shadow: none !important;
        max-width: 100% !important;
      }
    }
  </style>
</head>
<body>
  <div class="print-toolbar">
    <div class="print-toolbar-title">
      <span>📄 ${title}</span>
    </div>
    <div>
      <button class="print-btn" onclick="window.print()">
        🖨️ Imprimir / Guardar em PDF
      </button>
      <button class="close-btn" onclick="window.close()">
        Fechar
      </button>
    </div>
  </div>
  <div class="print-canvas">
    ${htmlContent}
  </div>
  <script>
    window.addEventListener('DOMContentLoaded', () => {
      // Auto trigger print when page opens
      setTimeout(() => {
        try {
          window.print();
        } catch (e) {
          console.warn('Auto print triggered:', e);
        }
      }, 400);
    });
  </script>
</body>
</html>`;
}

export function printHtmlViaIframe(htmlContent: string, title: string = 'Documento AD Leiria'): Promise<boolean> {
  return new Promise((resolve) => {
    const fullHtml = buildCompletePrintHtml(htmlContent, title);

    // 1. Try to open in a new clean window / tab (best experience, avoids iframe sandbox)
    try {
      const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);
      const newWin = window.open(blobUrl, '_blank');

      if (newWin) {
        newWin.focus();
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
        resolve(true);
        return;
      }
    } catch (e) {
      console.warn('Could not open new window for print, falling back to iframe:', e);
    }

    // 2. Fallback: Use offscreen iframe
    try {
      const oldIframe = document.getElementById('ad-leiria-print-iframe');
      if (oldIframe) {
        oldIframe.remove();
      }

      const iframe = document.createElement('iframe');
      iframe.id = 'ad-leiria-print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.top = '0';
      iframe.style.left = '-9999px';
      iframe.style.width = '800px';
      iframe.style.height = '1000px';
      iframe.style.border = '0';
      iframe.style.zIndex = '-1000';

      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (!doc) {
        window.print();
        resolve(false);
        return;
      }

      doc.open();
      doc.write(fullHtml);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          resolve(true);
        } catch (err) {
          console.warn('Iframe print error, falling back:', err);
          window.print();
          resolve(false);
        }
      }, 500);
    } catch (err) {
      console.warn('Print helper encountered error:', err);
      window.print();
      resolve(false);
    }
  });
}

