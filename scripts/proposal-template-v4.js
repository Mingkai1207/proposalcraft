// Professional HTML proposal template v4 - Final polish and optimization

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
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.5;
      color: #2c3e50;
      background: white;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
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

    .page::before {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      width: 180px;
      height: 180px;
      background: radial-gradient(circle, rgba(37, 99, 235, 0.02) 0%, transparent 70%);
      pointer-events: none;
      z-index: 0;
    }

    .page-content {
      position: relative;
      z-index: 1;
    }

    /* HEADER */
    .header {
      background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #2563eb 100%);
      color: white;
      padding: 16px;
      border-radius: 10px;
      margin-bottom: 14px;
      box-shadow: 0 8px 16px rgba(15, 23, 42, 0.15);
      position: relative;
      overflow: hidden;
    }

    .header::after {
      content: '';
      position: absolute;
      right: -40px;
      top: -40px;
      width: 120px;
      height: 120px;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 50%;
    }

    .header-content {
      position: relative;
      z-index: 1;
    }

    .company-name {
      font-size: 24px;
      font-weight: 800;
      margin-bottom: 4px;
      letter-spacing: -0.5px;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .company-info {
      font-size: 9px;
      line-height: 1.5;
      opacity: 0.93;
    }

    .company-info div {
      margin: 1px 0;
    }

    /* PROPOSAL TITLE */
    .proposal-header {
      margin: 10px 0 8px 0;
    }

    .proposal-title {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 6px;
      border-bottom: 4px solid #f97316;
      padding-bottom: 6px;
      letter-spacing: -0.3px;
    }

    .proposal-meta {
      font-size: 8px;
      color: #64748b;
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 10px;
    }

    .meta-item {
      display: flex;
      flex-direction: column;
    }

    .meta-label {
      font-weight: 700;
      color: #475569;
      margin-bottom: 1px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-size: 7px;
    }

    .meta-value {
      color: #1e293b;
      font-weight: 600;
      font-size: 8px;
    }

    /* INFO BOXES */
    .info-boxes {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 7px;
      margin: 10px 0;
    }

    .info-box {
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px;
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
      transition: all 0.3s ease;
    }

    .info-box:hover {
      border-color: #2563eb;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.1);
    }

    .info-box-title {
      font-size: 7px;
      font-weight: 800;
      color: #2563eb;
      text-transform: uppercase;
      margin-bottom: 6px;
      letter-spacing: 1px;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .info-box-icon {
      width: 12px;
      height: 12px;
      background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
      border-radius: 2px;
      display: inline-block;
    }

    .info-box-content {
      font-size: 8px;
      line-height: 1.5;
      color: #334155;
    }

    .info-box-content strong {
      display: block;
      font-size: 9px;
      margin-bottom: 2px;
      color: #0f172a;
      font-weight: 700;
    }

    /* SECTIONS */
    .section {
      margin: 10px 0;
      page-break-inside: avoid;
    }

    .section-title {
      font-size: 11px;
      font-weight: 800;
      color: white;
      background: linear-gradient(90deg, #2563eb 0%, #1e40af 100%);
      padding: 8px 10px;
      border-radius: 6px;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.7px;
      display: flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 3px 6px rgba(37, 99, 235, 0.12);
    }

    .section-icon {
      width: 14px;
      height: 14px;
      background: rgba(255, 255, 255, 0.25);
      border-radius: 2px;
      display: inline-block;
    }

    .section-content {
      font-size: 8px;
      line-height: 1.5;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      padding: 9px;
      border-radius: 6px;
      border-left: 4px solid #2563eb;
      color: #334155;
    }

    .summary-text {
      font-size: 8px;
      line-height: 1.5;
      color: #334155;
      margin-bottom: 4px;
    }

    .scope-list {
      list-style: none;
      padding: 0;
    }

    .scope-list li {
      font-size: 8px;
      line-height: 1.4;
      margin-bottom: 4px;
      padding-left: 16px;
      position: relative;
      color: #334155;
    }

    .scope-list li:before {
      content: "▸";
      position: absolute;
      left: 2px;
      color: #10b981;
      font-weight: bold;
      font-size: 10px;
    }

    /* INVESTMENT SECTION */
    .investment-section {
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 10px;
      margin: 8px 0;
      page-break-inside: avoid;
    }

    .chart-container {
      position: relative;
      height: 240px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
      border-radius: 8px;
      border: 2px solid #e2e8f0;
      padding: 10px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
    }

    .cost-summary {
      display: flex;
      flex-direction: column;
      justify-content: center;
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      padding: 10px;
      border-radius: 8px;
      border: 2px solid #bae6fd;
      box-shadow: 0 2px 4px rgba(3, 102, 214, 0.08);
    }

    .cost-line {
      display: flex;
      justify-content: space-between;
      font-size: 8px;
      margin-bottom: 6px;
      padding: 6px 0;
      border-bottom: 1px solid #cbd5e1;
    }

    .cost-line.total {
      font-weight: 800;
      font-size: 10px;
      color: white;
      background: linear-gradient(90deg, #2563eb 0%, #1e40af 100%);
      border: none;
      border-radius: 5px;
      padding: 8px;
      margin-top: 6px;
      box-shadow: 0 3px 6px rgba(37, 99, 235, 0.15);
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
      font-size: 7px;
      color: #64748b;
      margin-left: 4px;
    }

    /* DIVIDER */
    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, #2563eb 20%, #2563eb 80%, transparent);
      margin: 8px 0;
      opacity: 0.4;
    }

    /* TERMS */
    .terms-section {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border-left: 4px solid #f59e0b;
      padding: 9px;
      margin: 8px 0;
      font-size: 7px;
      line-height: 1.4;
      border-radius: 6px;
      color: #78350f;
      box-shadow: 0 2px 4px rgba(245, 158, 11, 0.08);
    }

    /* FOOTER */
    .footer {
      margin-top: 10px;
      padding-top: 8px;
      border-top: 2px solid #e2e8f0;
      font-size: 7px;
      color: #64748b;
      text-align: center;
      line-height: 1.3;
    }

    .footer-badge {
      display: inline-block;
      background: linear-gradient(90deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 3px 7px;
      border-radius: 3px;
      font-weight: 700;
      margin-top: 4px;
      font-size: 6px;
      box-shadow: 0 2px 4px rgba(16, 185, 129, 0.15);
    }

    @media print {
      body { margin: 0; padding: 0; }
      .page { box-shadow: none; margin: 0; padding: 0.35in; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="page-content">
      <div class="header">
        <div class="header-content">
          <div class="company-name">${data.businessName}</div>
          <div class="company-info">
            <div>${data.businessPhone} • ${data.businessEmail}</div>
            <div>${data.businessAddress} • Lic# ${data.licenseNumber}</div>
          </div>
        </div>
      </div>

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

      <div class="section">
        <div class="section-title"><span class="section-icon"></span>Executive Summary</div>
        <div class="summary-text">${data.executiveSummary}</div>
      </div>

      <div class="section">
        <div class="section-title"><span class="section-icon"></span>Scope of Work</div>
        <div class="section-content">
          <ul class="scope-list">
            ${data.scopeOfWork.map(item => `<li>${item}</li>`).join('')}
          </ul>
        </div>
      </div>

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

  <div class="page">
    <div class="page-content">
      <div class="section">
        <div class="section-title"><span class="section-icon"></span>Project Timeline</div>
        <div class="section-content">
          <ul class="scope-list">
            ${data.timeline.map(item => `<li>${item}</li>`).join('')}
          </ul>
        </div>
      </div>

      <div class="section">
        <div class="section-title"><span class="section-icon"></span>Why Choose Us</div>
        <div class="summary-text">${data.whyChooseUs}</div>
      </div>

      <div class="divider"></div>

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
    const ctx = document.getElementById('priceChart');
    if (ctx) {
      new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Labor', 'Materials'],
          datasets: [{
            data: [${data.laborCost}, ${data.materialsCost}],
            backgroundColor: ['#2563eb', '#f97316'],
            borderColor: ['#1e40af', '#ea580c'],
            borderWidth: 2.5,
            borderRadius: 5,
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
                font: { size: 9, weight: 'bold' },
                padding: 10,
                usePointStyle: true,
                pointStyle: 'circle',
                color: '#1e293b'
              }
            },
            tooltip: {
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              padding: 8,
              titleFont: { size: 10, weight: 'bold' },
              bodyFont: { size: 9 },
              borderColor: '#2563eb',
              borderWidth: 1.5,
              cornerRadius: 5,
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
