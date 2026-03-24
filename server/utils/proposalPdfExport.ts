import puppeteer from "puppeteer";

export interface ProposalPdfData {
  businessName: string;
  businessPhone: string;
  businessEmail: string;
  businessAddress: string;
  licenseNumber: string;
  clientName: string;
  clientAddress: string;
  clientPhone: string;
  clientEmail: string;
  jobTitle: string;
  preparedDate: string;
  validUntil: string;
  jobSite: string;
  jobDetails: string;
  projectDetails: string;
  executiveSummary: string;
  scopeOfWork: string[];
  materials: string[];
  timeline: string[];
  whyChooseUs: string;
  termsAndConditions: string;
  laborCost: number;
  materialsCost: number;
  totalCost: number;
}

/**
 * AGGRESSIVE text cleaning - removes ALL markdown and formatting artifacts
 */
function sanitizeText(text: string | undefined): string {
  if (!text) return '';
  
  let cleaned = String(text);
  
  // Remove markdown headers
  cleaned = cleaned.replace(/^#+\s+/gm, '');
  
  // Remove markdown formatting
  cleaned = cleaned.replace(/\*\*(.+?)\*\*/g, '$1');
  cleaned = cleaned.replace(/\*(.+?)\*/g, '$1');
  cleaned = cleaned.replace(/__(.+?)__/g, '$1');
  cleaned = cleaned.replace(/_(.+?)_/g, '$1');
  
  // Remove code blocks
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
  cleaned = cleaned.replace(/`(.+?)`/g, '$1');
  
  // Remove HTML
  cleaned = cleaned.replace(/<[^>]*>/g, '');
  
  // Remove list markers
  cleaned = cleaned.replace(/^[\s]*[-*+•]\s+/gm, '');
  cleaned = cleaned.replace(/^[\s]*\d+\.\s+/gm, '');
  
  // Remove links
  cleaned = cleaned.replace(/\[(.+?)\]\(.+?\)/g, '$1');
  
  // Remove images
  cleaned = cleaned.replace(/!\[(.+?)\]\(.+?\)/g, '$1');
  
  // Remove horizontal rules
  cleaned = cleaned.replace(/^[\s]*[-*_]{3,}[\s]*$/gm, '');
  
  // Remove blockquotes
  cleaned = cleaned.replace(/^>\s+/gm, '');
  
  // Clean up whitespace
  cleaned = cleaned.replace(/\s{2,}/g, ' ');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  // Final trim
  return cleaned.trim();
}

/**
 * Sanitize array of items
 */
function sanitizeArray(items: string[] | undefined): string[] {
  if (!Array.isArray(items)) return [];
  
  return items
    .map(item => sanitizeText(item))
    .filter(item => item.length > 0 && item !== 'about:blank')
    .slice(0, 5); // Limit to 5 items max
}

export async function generateProposalPdf(data: ProposalPdfData): Promise<Buffer> {
  // SANITIZE ALL INPUT DATA
  const sanitized = {
    businessName: sanitizeText(data.businessName) || 'Your Business',
    businessPhone: sanitizeText(data.businessPhone) || '(555) 000-0000',
    businessEmail: sanitizeText(data.businessEmail) || 'info@business.com',
    businessAddress: sanitizeText(data.businessAddress) || '123 Main St, City, ST 12345',
    licenseNumber: sanitizeText(data.licenseNumber) || 'License #',
    clientName: sanitizeText(data.clientName) || 'Valued Client',
    clientAddress: sanitizeText(data.clientAddress) || 'Client Address',
    jobTitle: sanitizeText(data.jobTitle) || 'Proposal',
    preparedDate: sanitizeText(data.preparedDate) || new Date().toLocaleDateString(),
    validUntil: sanitizeText(data.validUntil) || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    jobSite: sanitizeText(data.jobSite) || 'Job Site',
    executiveSummary: sanitizeText(data.executiveSummary) || 'Professional proposal for your project.',
    scopeOfWork: sanitizeArray(data.scopeOfWork),
    materials: sanitizeArray(data.materials),
    timeline: sanitizeArray(data.timeline),
    whyChooseUs: sanitizeText(data.whyChooseUs) || 'Professional service backed by experience.',
    termsAndConditions: sanitizeText(data.termsAndConditions) || '50% deposit required. Balance on completion.',
    laborCost: Math.max(0, data.laborCost || 0),
    materialsCost: Math.max(0, data.materialsCost || 0),
    totalCost: Math.max(1, data.totalCost || 5000),
  };

  // Ensure we have at least some scope items
  if (sanitized.scopeOfWork.length === 0) {
    sanitized.scopeOfWork = ['Professional assessment', 'Installation', 'Quality assurance'];
  }
  if (sanitized.materials.length === 0) {
    sanitized.materials = ['Premium materials', 'Professional equipment'];
  }
  if (sanitized.timeline.length === 0) {
    sanitized.timeline = ['Day 1: Preparation', 'Day 2: Installation'];
  }

  const laborPercent = Math.round((sanitized.laborCost / sanitized.totalCost) * 100);
  const materialsPercent = 100 - laborPercent;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${sanitized.jobTitle}</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html, body {
      width: 100%;
      height: 100%;
    }

    body {
      font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.5;
      color: #1a1a1a;
      background: white;
    }

    .page {
      width: 8.5in;
      height: 11in;
      margin: 0 auto;
      padding: 0.4in;
      background: white;
      overflow: hidden;
      page-break-after: always;
    }

    .header {
      background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
      color: white;
      padding: 0.3in 0.25in;
      margin: -0.4in -0.4in 0.25in -0.4in;
      border-bottom: 3px solid #1e40af;
    }

    .company-name {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 0.08in;
    }

    .company-info {
      font-size: 10px;
      line-height: 1.3;
      opacity: 0.95;
    }

    .company-info p {
      margin: 1px 0;
    }

    .job-title {
      font-size: 18px;
      font-weight: 600;
      color: #1a1a1a;
      margin: 0.15in 0 0.1in 0;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 0.08in;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 0.12in;
      margin: 0.15in 0;
      font-size: 9px;
    }

    .info-box {
      background: #f8f9fa;
      border-left: 3px solid #2563eb;
      padding: 0.12in;
      border-radius: 2px;
    }

    .info-box-label {
      font-weight: 600;
      color: #2563eb;
      font-size: 8px;
      text-transform: uppercase;
      margin-bottom: 0.04in;
    }

    .info-box-content {
      color: #1a1a1a;
      line-height: 1.3;
      font-size: 9px;
    }

    .section {
      margin: 0.15in 0;
    }

    .section-title {
      font-size: 12px;
      font-weight: 700;
      color: #1a1a1a;
      margin: 0.1in 0 0.08in 0;
      padding-bottom: 0.06in;
      border-bottom: 2px solid #e5e7eb;
    }

    .bullet-list {
      margin: 0.08in 0 0.08in 0.15in;
      list-style: none;
    }

    .bullet-list li {
      margin: 0.04in 0;
      padding-left: 0.12in;
      position: relative;
      font-size: 10px;
      line-height: 1.4;
    }

    .bullet-list li:before {
      content: '✓';
      position: absolute;
      left: 0;
      color: #2563eb;
      font-weight: bold;
    }

    .summary-text {
      font-size: 10px;
      line-height: 1.5;
      color: #333;
      margin: 0.08in 0;
    }

    .pricing-summary {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.12in;
      margin: 0.12in 0;
      font-size: 9px;
    }

    .price-item {
      background: #f8f9fa;
      padding: 0.08in;
      border-radius: 3px;
      border-left: 2px solid #2563eb;
    }

    .price-label {
      font-weight: 600;
      color: #666;
      font-size: 8px;
    }

    .price-value {
      font-size: 12px;
      font-weight: 700;
      color: #2563eb;
      margin-top: 0.02in;
    }

    .total-price {
      grid-column: 1 / -1;
      background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
      color: white;
      padding: 0.1in;
      border-radius: 3px;
      text-align: center;
    }

    .total-price .price-label {
      color: rgba(255,255,255,0.9);
    }

    .total-price .price-value {
      color: white;
      font-size: 14px;
    }

    .chart-container {
      margin: 0.12in 0;
      text-align: center;
      height: 1.4in;
    }

    .footer {
      font-size: 8px;
      color: #999;
      text-align: center;
      margin-top: 0.15in;
      padding-top: 0.08in;
      border-top: 1px solid #e5e7eb;
    }

    @media print {
      body {
        background: white;
      }
      .page {
        margin: 0;
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="company-name">${sanitized.businessName}</div>
      <div class="company-info">
        <p>${sanitized.businessPhone} • ${sanitized.businessEmail}</p>
        <p>${sanitized.businessAddress} • Lic: ${sanitized.licenseNumber}</p>
      </div>
    </div>

    <div class="job-title">${sanitized.jobTitle}</div>

    <div class="info-grid">
      <div class="info-box">
        <div class="info-box-label">Client</div>
        <div class="info-box-content"><strong>${sanitized.clientName}</strong><br>${sanitized.clientAddress}</div>
      </div>
      <div class="info-box">
        <div class="info-box-label">Job Site</div>
        <div class="info-box-content">${sanitized.jobSite}</div>
      </div>
      <div class="info-box">
        <div class="info-box-label">Valid Until</div>
        <div class="info-box-content">${sanitized.validUntil}</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Executive Summary</div>
      <div class="summary-text">${sanitized.executiveSummary}</div>
    </div>

    <div class="section">
      <div class="section-title">Scope of Work</div>
      <ul class="bullet-list">
        ${sanitized.scopeOfWork.map(item => `<li>${item}</li>`).join('')}
      </ul>
    </div>

    <div class="section">
      <div class="section-title">Materials & Equipment</div>
      <ul class="bullet-list">
        ${sanitized.materials.map(item => `<li>${item}</li>`).join('')}
      </ul>
    </div>

    <div class="section">
      <div class="section-title">Investment Summary</div>
      <div class="pricing-summary">
        <div class="price-item">
          <div class="price-label">Labor</div>
          <div class="price-value">$${sanitized.laborCost.toLocaleString()}</div>
        </div>
        <div class="price-item">
          <div class="price-label">Materials</div>
          <div class="price-value">$${sanitized.materialsCost.toLocaleString()}</div>
        </div>
        <div class="price-item total-price">
          <div class="price-label">Total</div>
          <div class="price-value">$${sanitized.totalCost.toLocaleString()}</div>
        </div>
      </div>
      <div class="chart-container">
        <canvas id="priceChart"></canvas>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Why Choose Us</div>
      <div class="summary-text">${sanitized.whyChooseUs}</div>
    </div>

    <div class="section">
      <div class="section-title">Terms & Conditions</div>
      <div class="summary-text">${sanitized.termsAndConditions}</div>
    </div>

    <div class="footer">
      Prepared: ${sanitized.preparedDate} • Valid until: ${sanitized.validUntil}
    </div>
  </div>

  <script>
    setTimeout(() => {
      const ctx = document.getElementById('priceChart');
      if (ctx) {
        new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['Labor', 'Materials'],
            datasets: [{
              data: [${laborPercent}, ${materialsPercent}],
              backgroundColor: ['#2563eb', '#f97316'],
              borderColor: ['#1e40af', '#ea580c'],
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: { font: { size: 10 }, padding: 10 }
              }
            }
          }
        });
      }
    }, 500);
  </script>
</body>
</html>
  `;

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 1500));

    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      printBackground: true,
    }) as Buffer;

    return Buffer.from(pdfBuffer as Uint8Array);
  } finally {
    await browser.close();
  }
}
