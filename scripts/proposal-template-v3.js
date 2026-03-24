// Professional HTML proposal template v3 with advanced refinements

export function generateProposalHTML(data) {
  const laborPercent = Math.round((data.laborCost / data.totalCost) * 100);
  const materialsPercent = Math.round((data.materialsCost / data.totalCost) * 100);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.jobTitle}</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html {
      scroll-behavior: smooth;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #2c3e50;
      background: white;
    }

    .page {
      width: 8.5in;
      height: 11in;
      margin: 0 auto;
      padding: 0.35in;
      background: white;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
      page-break-after: always;
      position: relative;
      overflow: hidden;
    }

    /* Subtle background pattern */
    .page::before {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      width: 200px;
      height: 200px;
      background: radial-gradient(circle, rgba(37, 99, 235, 0.03) 0%, transparent 70%);
      pointer-events: none;
    }

    .page-content {
      position: relative;
      z-index: 1;
    }

    /* HEADER SECTION */
    .header {
      background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #2563eb 100%);
      color: white;
      padding: 18px;
      border-radius: 10px;
      margin-bottom: 16px;
      box-shadow: 0 8px 16px rgba(15, 23, 42, 0.15);
      position: relative;
      overflow: hidden;
    }

    .header::after {
      content: '';
      position: absolute;
      right: -50px;
      top: -50px;
      width: 150px;
      height: 150px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 50%;
    }

    .header-content {
      position: relative;
      z-index: 1;
    }

    .company-name {
      font-size: 26px;
      font-weight: 800;
      margin-bottom: 6px;
      letter-spacing: -0.5px;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .company-info {
      font-size: 10px;
      line-height: 1.6;
      opacity: 0.92;
    }

    .company-info div {
      margin: 2px 0;
    }

    /* PROPOSAL TITLE SECTION */
    .proposal-header {
      margin: 12px 0 10px 0;
    }

    .proposal-title {
      font-size: 19px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 8px;
      border-bottom: 4px solid #f97316;
      padding-bottom: 8px;
      letter-spacing: -0.3px;
    }

    .proposal-meta {
      font-size: 9px;
      color: #64748b;
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px;
    }

    .meta-item {
      display: flex;
      flex-direction: column;
    }

    .meta-label {
      font-weight: 700;
      color: #475569;
      margin-bottom: 2px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-size: 8px;
    }

    .meta-value {
      color: #1e293b;
      font-weight: 600;
    }

    /* INFO BOXES */
    .info-boxes {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 8px;
      margin: 12px 0;
    }

    .info-box {
      border: 2px solid #e2e8f0;
      border-radius: 10px;
      padding: 11px;
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
      transition: all 0.3s ease;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .info-box:hover {
      border-color: #2563eb;
      box-shadow: 0 6px 16px rgba(37, 99, 235, 0.12);
      transform: translateY(-2px);
    }

    .info-box-title {
      font-size: 8px;
      font-weight: 800;
      color: #2563eb;
      text-transform: uppercase;
      margin-bottom: 7px;
      letter-spacing: 1.2px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .info-box-icon {
      width: 14px;
      height: 14px;
      background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
      border-radius: 3px;
      display: inline-block;
    }

    .info-box-content {
      font-size: 9px;
      line-height: 1.5;
      color: #334155;
    }

    .info-box-content strong {
      display: block;
      font-size: 10px;
      margin-bottom: 3px;
      color: #0f172a;
      font-weight: 700;
    }

    /* SECTIONS */
    .section {
      margin: 12px 0;
      page-break-inside: avoid;
    }

    .section-title {
      font-size: 12px;
      font-weight: 800;
      color: white;
      background: linear-gradient(90deg, #2563eb 0%, #1e40af 100%);
      padding: 9px 11px;
      border-radius: 8px;
      margin-bottom: 9px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      display: flex;
      align-items: center;
      gap: 7px;
      box-shadow: 0 4px 8px rgba(37, 99, 235, 0.15);
    }

    .section-icon {
      width: 16px;
      height: 16px;
      background: rgba(255, 255, 255, 0.25);
      border-radius: 3px;
      display: inline-block;
    }

    .section-content {
      font-size: 9px;
      line-height: 1.6;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      padding: 10px;
      border-radius: 8px;
      border-left: 5px solid #2563eb;
      color: #334155;
    }

    .summary-text {
      font-size: 9px;
      line-height: 1.6;
      color: #334155;
      margin-bottom: 6px;
    }

    .scope-list {
      list-style: none;
      padding: 0;
    }

    .scope-list li {
      font-size: 9px;
      line-height: 1.5;
      margin-bottom: 5px;
      padding-left: 18px;
      position: relative;
      color: #334155;
    }

    .scope-list li:before {
      content: "▸";
      position: absolute;
      left: 2px;
      color: #10b981;
      font-weight: bold;
      font-size: 12px;
    }

    /* INVESTMENT SECTION */
    .investment-section {
      display: grid;
      grid-template-columns: 1.1fr 0.9fr;
      gap: 12px;
      margin: 10px 0;
      page-break-inside: avoid;
    }

    .chart-container {
      position: relative;
      height: 260px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
      border-radius: 10px;
      border: 2px solid #e2e8f0;
      padding: 12px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
    }

    .cost-summary {
      display: flex;
      flex-direction: column;
      justify-content: center;
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      padding: 12px;
      border-radius: 10px;
      border: 2px solid #bae6fd;
      box-shadow: 0 4px 8px rgba(3, 102, 214, 0.1);
    }

    .cost-line {
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      margin-bottom: 7px;
      padding: 7px 0;
      border-bottom: 1px solid #cbd5e1;
    }

    .cost-line.total {
      font-weight: 800;
      font-size: 11px;
      color: white;
      background: linear-gradient(90deg, #2563eb 0%, #1e40af 100%);
      border: none;
      border-radius: 6px;
      padding: 9px;
      margin-top: 8px;
      box-shadow: 0 4px 8px rgba(37, 99, 235, 0.2);
    }

    .cost-label {
      font-weight: 700;
      color: #1e293b;
    }

    .cost-value {
      font-weight: 800;
      text-align: right;
      color: #2563eb;
    }

    .cost-line.total .cost-value {
      color: white;
    }

    .percentage {
      font-size: 8px;
      color: #64748b;
      margin-left: 6px;
    }

    /* DIVIDER */
    .divider {
      height: 2px;
      background: linear-gradient(90deg, transparent, #2563eb 20%, #2563eb 80%, transparent);
      margin: 10px 0;
      opacity: 0.5;
    }

    /* TERMS SECTION */
    .terms-section {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border-left: 5px solid #f59e0b;
      padding: 10px;
      margin: 10px 0;
      font-size: 8px;
      line-height: 1.5;
      border-radius: 8px;
      color: #78350f;
      box-shadow: 0 2px 4px rgba(245, 158, 11, 0.1);
    }

    /* FOOTER */
    .footer {
      margin-top: 12px;
      padding-top: 10px;
      border-top: 2px solid #e2e8f0;
      font-size: 7px;
      color: #64748b;
      text-align: center;
      line-height: 1.4;
    }

    .footer-badge {
      display: inline-block;
      background: linear-gradient(90deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: 700;
      margin-top: 5px;
      font-size: 7px;
      box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
    }

    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      .page {
        box-shadow: none;
        margin: 0;
        padding: 0.35in;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="page-content">
      <!-- Header -->
      <div class="header">
        <div class="header-content">
          <div class="company-name">${data.businessName}</div>
          <div class="company-info">
            <div>${data.businessPhone} • ${data.businessEmail}</div>
            <div>${data.businessAddress} • Lic# ${data.licenseNumber}</div>
          </div>
        </div>
      </div>

      <!-- Proposal Header -->
      <div class="proposal-header">
        <div class="proposal-title">${data.jobTitle}</div>
        <div class="proposal-meta">
          <div class="meta-item">
            <span class="meta-label">Client:</span>
            <span class="meta-value">${data.clientName}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Date:</span>
            <span class="meta-value">${data.preparedDate}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Valid Until:</span>
            <span class="meta-value">${data.validUntil}</span>
          </div>
        </div>
      </div>

      <!-- Info Boxes -->
      <div class="info-boxes">
        <div class="info-box">
          <div class="info-box-title"><span class="info-box-icon"></span>Client</div>
          <div class="info-box-content">
            <strong>${data.clientName}</strong>
            ${data.clientAddress}<br>
            ${data.clientPhone}<br>
            ${data.clientEmail}
          </div>
        </div>
        <div class="info-box">
          <div class="info-box-title"><span class="info-box-icon"></span>Job Site</div>
          <div class="info-box-content">
            <strong>${data.jobSite}</strong>
            ${data.jobDetails}
          </div>
        </div>
        <div class="info-box">
          <div class="info-box-title"><span class="info-box-icon"></span>Project</div>
          <div class="info-box-content">
            ${data.projectDetails}
          </div>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Executive Summary -->
      <div class="section">
        <div class="section-title"><span class="section-icon"></span>Executive Summary</div>
        <div class="summary-text">${data.executiveSummary}</div>
      </div>

      <!-- Scope of Work -->
      <div class="section">
        <div class="section-title"><span class="section-icon"></span>Scope of Work</div>
        <div class="section-content">
          <ul class="scope-list">
            ${data.scopeOfWork.map(item => `<li>${item}</li>`).join('')}
          </ul>
        </div>
      </div>

      <!-- Materials -->
      <div class="section">
        <div class="section-title"><span class="section-icon"></span>Materials & Equipment</div>
        <div class="section-content">
          <ul class="scope-list">
            ${data.materials.map(item => `<li>${item}</li>`).join('')}
          </ul>
        </div>
      </div>
    </div>
  </div>

  <!-- Page 2 -->
  <div class="page">
    <div class="page-content">
      <!-- Timeline -->
      <div class="section">
        <div class="section-title"><span class="section-icon"></span>Project Timeline</div>
        <div class="section-content">
          <ul class="scope-list">
            ${data.timeline.map(item => `<li>${item}</li>`).join('')}
          </ul>
        </div>
      </div>

      <!-- Why Choose Us -->
      <div class="section">
        <div class="section-title"><span class="section-icon"></span>Why Choose Us</div>
        <div class="summary-text">${data.whyChooseUs}</div>
      </div>

      <div class="divider"></div>

      <!-- Investment Summary with Chart -->
      <div class="section">
        <div class="section-title"><span class="section-icon"></span>Investment Summary</div>
        <div class="investment-section">
          <div class="chart-container">
            <canvas id="priceChart" width="200" height="200"></canvas>
          </div>
          <div class="cost-summary">
            <div class="cost-line">
              <span class="cost-label">Labor:</span>
              <span class="cost-value">
                $${data.laborCost.toLocaleString()}
                <span class="percentage">(${laborPercent}%)</span>
              </span>
            </div>
            <div class="cost-line">
              <span class="cost-label">Materials:</span>
              <span class="cost-value">
                $${data.materialsCost.toLocaleString()}
                <span class="percentage">(${materialsPercent}%)</span>
              </span>
            </div>
            <div class="cost-line total">
              <span class="cost-label">Total:</span>
              <span class="cost-value">$${data.totalCost.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Terms & Conditions -->
      <div class="section">
        <div class="section-title"><span class="section-icon"></span>Terms & Conditions</div>
        <div class="terms-section">
          ${data.termsAndConditions}
        </div>
      </div>

      <div class="footer">
        <p>Valid until <strong>${data.validUntil}</strong>. Contact us to discuss or schedule your project.</p>
        <div class="footer-badge">✓ Professional Proposal</div>
      </div>
    </div>
  </div>

  <script>
    // Generate professional pie chart
    const ctx = document.getElementById('priceChart');
    if (ctx) {
      const chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Labor', 'Materials'],
          datasets: [{
            data: [${data.laborCost}, ${data.materialsCost}],
            backgroundColor: ['#2563eb', '#f97316'],
            borderColor: ['#1e40af', '#ea580c'],
            borderWidth: 3,
            borderRadius: 6,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          cutout: '65%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                font: { size: 10, weight: 'bold' },
                padding: 12,
                usePointStyle: true,
                pointStyle: 'circle',
                color: '#1e293b'
              }
            },
            tooltip: {
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              padding: 10,
              titleFont: { size: 11, weight: 'bold' },
              bodyFont: { size: 10 },
              borderColor: '#2563eb',
              borderWidth: 2,
              cornerRadius: 6,
              displayColors: true
            }
          }
        }
      });
    }
  </script>
</body>
</html>
  `;
}
