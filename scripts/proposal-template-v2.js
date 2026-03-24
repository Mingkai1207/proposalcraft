// Enhanced professional HTML proposal template with visual improvements

export function generateProposalHTML(data) {
  const chartData = {
    labor: data.laborCost,
    materials: data.materialsCost,
    total: data.totalCost,
  };

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
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
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
      padding: 0.4in;
      background: white;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
      page-break-after: always;
    }

    /* HEADER SECTION */
    .header {
      background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    .company-name {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }

    .company-info {
      font-size: 11px;
      line-height: 1.5;
      opacity: 0.95;
    }

    .company-info div {
      margin: 3px 0;
    }

    /* PROPOSAL TITLE SECTION */
    .proposal-header {
      margin: 15px 0 12px 0;
    }

    .proposal-title {
      font-size: 20px;
      font-weight: 700;
      color: #1e3a8a;
      margin-bottom: 6px;
      border-bottom: 3px solid #f97316;
      padding-bottom: 8px;
    }

    .proposal-meta {
      font-size: 10px;
      color: #64748b;
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 15px;
    }

    .meta-item {
      display: flex;
      flex-direction: column;
    }

    .meta-label {
      font-weight: 600;
      color: #475569;
      margin-bottom: 2px;
    }

    .meta-value {
      color: #1e293b;
      font-weight: 500;
    }

    /* INFO BOXES */
    .info-boxes {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 10px;
      margin: 15px 0;
    }

    .info-box {
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      transition: all 0.3s ease;
    }

    .info-box:hover {
      border-color: #2563eb;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.1);
    }

    .info-box-title {
      font-size: 9px;
      font-weight: 700;
      color: #2563eb;
      text-transform: uppercase;
      margin-bottom: 8px;
      letter-spacing: 1px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .info-box-icon {
      width: 16px;
      height: 16px;
      background: #2563eb;
      border-radius: 3px;
      display: inline-block;
    }

    .info-box-content {
      font-size: 10px;
      line-height: 1.5;
    }

    .info-box-content strong {
      display: block;
      font-size: 11px;
      margin-bottom: 4px;
      color: #1e293b;
    }

    /* SECTIONS */
    .section {
      margin: 14px 0;
      page-break-inside: avoid;
    }

    .section-title {
      font-size: 13px;
      font-weight: 700;
      color: white;
      background: linear-gradient(90deg, #2563eb 0%, #1e40af 100%);
      padding: 10px 12px;
      border-radius: 6px;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .section-icon {
      width: 18px;
      height: 18px;
      background: rgba(255,255,255,0.3);
      border-radius: 4px;
      display: inline-block;
    }

    .section-content {
      font-size: 10px;
      line-height: 1.6;
      background: #f8fafc;
      padding: 10px;
      border-radius: 6px;
      border-left: 4px solid #2563eb;
    }

    .summary-text {
      font-size: 10px;
      line-height: 1.6;
      color: #334155;
      margin-bottom: 8px;
    }

    .scope-list {
      list-style: none;
      padding: 0;
    }

    .scope-list li {
      font-size: 9px;
      line-height: 1.5;
      margin-bottom: 5px;
      padding-left: 16px;
      position: relative;
      color: #334155;
    }

    .scope-list li:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #10b981;
      font-weight: bold;
      font-size: 11px;
    }

    /* INVESTMENT SECTION */
    .investment-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin: 12px 0;
      page-break-inside: avoid;
    }

    .chart-container {
      position: relative;
      height: 280px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-radius: 8px;
      border: 2px solid #e2e8f0;
      padding: 15px;
    }

    .cost-summary {
      display: flex;
      flex-direction: column;
      justify-content: center;
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      padding: 15px;
      border-radius: 8px;
      border: 2px solid #bae6fd;
    }

    .cost-line {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      margin-bottom: 8px;
      padding: 8px 0;
      border-bottom: 1px solid #cbd5e1;
    }

    .cost-line.total {
      font-weight: 700;
      font-size: 12px;
      color: white;
      background: linear-gradient(90deg, #2563eb 0%, #1e40af 100%);
      border: none;
      border-radius: 6px;
      padding: 10px;
      margin-top: 10px;
      box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
    }

    .cost-label {
      font-weight: 600;
      color: #1e293b;
    }

    .cost-value {
      font-weight: 700;
      text-align: right;
      color: #2563eb;
    }

    .cost-line.total .cost-value {
      color: white;
    }

    .percentage {
      font-size: 9px;
      color: #64748b;
      margin-left: 8px;
    }

    /* DIVIDER */
    .divider {
      height: 2px;
      background: linear-gradient(90deg, transparent, #2563eb, transparent);
      margin: 12px 0;
    }

    /* TERMS SECTION */
    .terms-section {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border-left: 5px solid #f59e0b;
      padding: 12px;
      margin: 12px 0;
      font-size: 9px;
      line-height: 1.5;
      border-radius: 6px;
      color: #78350f;
    }

    /* FOOTER */
    .footer {
      margin-top: 15px;
      padding-top: 12px;
      border-top: 2px solid #e2e8f0;
      font-size: 8px;
      color: #64748b;
      text-align: center;
      line-height: 1.4;
    }

    .footer-badge {
      display: inline-block;
      background: #10b981;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: 600;
      margin-top: 6px;
      font-size: 8px;
    }

    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      .page {
        box-shadow: none;
        margin: 0;
        padding: 0.4in;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <div class="company-name">${data.businessName}</div>
      <div class="company-info">
        <div>${data.businessPhone} • ${data.businessEmail}</div>
        <div>${data.businessAddress} • Lic# ${data.licenseNumber}</div>
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
        <div class="info-box-title"><span class="info-box-icon"></span>Client Info</div>
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

  <!-- Page 2 -->
  <div class="page">
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
            <span class="cost-label">Labor Cost:</span>
            <span class="cost-value">
              $${data.laborCost.toLocaleString()}
              <span class="percentage">(${laborPercent}%)</span>
            </span>
          </div>
          <div class="cost-line">
            <span class="cost-label">Materials Cost:</span>
            <span class="cost-value">
              $${data.materialsCost.toLocaleString()}
              <span class="percentage">(${materialsPercent}%)</span>
            </span>
          </div>
          <div class="cost-line total">
            <span class="cost-label">Total Investment:</span>
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
      <p>This proposal is valid until <strong>${data.validUntil}</strong>. Please contact us to discuss any questions or to schedule your project.</p>
      <div class="footer-badge">✓ Professional Proposal</div>
    </div>
  </div>

  <script>
    // Generate enhanced pie chart
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
            borderWidth: 3,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                font: { size: 11, weight: 'bold' },
                padding: 15,
                usePointStyle: true,
                pointStyle: 'circle',
                color: '#1e293b'
              }
            },
            tooltip: {
              backgroundColor: 'rgba(30, 58, 138, 0.9)',
              padding: 12,
              titleFont: { size: 12, weight: 'bold' },
              bodyFont: { size: 11 },
              borderColor: '#2563eb',
              borderWidth: 1,
              cornerRadius: 6
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
