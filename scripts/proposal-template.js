// Professional HTML proposal template with embedded CSS

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
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      background: white;
    }

    .page {
      width: 8.5in;
      height: 11in;
      margin: 0 auto;
      padding: 0.5in;
      background: white;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
      page-break-after: always;
    }

    .header {
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 20px;
    }

    .company-name {
      font-size: 28px;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 5px;
    }

    .company-info {
      font-size: 11px;
      color: #666;
      line-height: 1.4;
    }

    .company-info div {
      margin: 2px 0;
    }

    .proposal-title {
      font-size: 22px;
      font-weight: bold;
      color: #1e293b;
      margin: 20px 0 10px 0;
    }

    .proposal-meta {
      font-size: 11px;
      color: #666;
      margin-bottom: 15px;
    }

    .info-boxes {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px;
      margin: 20px 0;
    }

    .info-box {
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 12px;
      background: #f9fafb;
    }

    .info-box-title {
      font-size: 10px;
      font-weight: bold;
      color: #7c3aed;
      text-transform: uppercase;
      margin-bottom: 8px;
      letter-spacing: 0.5px;
    }

    .info-box-content {
      font-size: 11px;
      line-height: 1.5;
    }

    .info-box-content strong {
      display: block;
      font-size: 12px;
      margin-bottom: 4px;
    }

    .section {
      margin: 20px 0;
    }

    .section-title {
      font-size: 14px;
      font-weight: bold;
      color: #1e293b;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 8px;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .section-content {
      font-size: 11px;
      line-height: 1.6;
    }

    .summary-text {
      font-size: 11px;
      line-height: 1.6;
      color: #333;
      margin-bottom: 10px;
    }

    .scope-list {
      list-style: none;
      padding: 0;
    }

    .scope-list li {
      font-size: 10px;
      line-height: 1.5;
      margin-bottom: 6px;
      padding-left: 16px;
      position: relative;
    }

    .scope-list li:before {
      content: "•";
      position: absolute;
      left: 0;
      color: #2563eb;
      font-weight: bold;
    }

    .investment-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin: 20px 0;
      page-break-inside: avoid;
    }

    .chart-container {
      position: relative;
      height: 250px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .cost-summary {
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .cost-line {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      margin-bottom: 10px;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }

    .cost-line.total {
      font-weight: bold;
      font-size: 13px;
      color: #2563eb;
      border-bottom: 2px solid #2563eb;
      border-top: 2px solid #2563eb;
      padding: 10px 0;
      margin-top: 10px;
    }

    .cost-label {
      font-weight: 500;
    }

    .cost-value {
      font-weight: bold;
      text-align: right;
    }

    .percentage {
      font-size: 10px;
      color: #666;
      margin-left: 10px;
    }

    .terms-section {
      background: #f0f9ff;
      border-left: 4px solid #2563eb;
      padding: 12px;
      margin: 15px 0;
      font-size: 10px;
      line-height: 1.5;
      border-radius: 4px;
    }

    .footer {
      margin-top: 20px;
      padding-top: 15px;
      border-top: 1px solid #e5e7eb;
      font-size: 9px;
      color: #666;
      text-align: center;
    }

    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      .page {
        box-shadow: none;
        margin: 0;
        padding: 0.5in;
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

    <!-- Proposal Title -->
    <div class="proposal-title">${data.jobTitle}</div>
    <div class="proposal-meta">
      Prepared for: <strong>${data.clientName}</strong> • Date: <strong>${data.preparedDate}</strong> • Valid until: <strong>${data.validUntil}</strong>
    </div>

    <!-- Info Boxes -->
    <div class="info-boxes">
      <div class="info-box">
        <div class="info-box-title">Client Information</div>
        <div class="info-box-content">
          <strong>${data.clientName}</strong>
          ${data.clientAddress}<br>
          ${data.clientPhone}<br>
          ${data.clientEmail}
        </div>
      </div>
      <div class="info-box">
        <div class="info-box-title">Job Site</div>
        <div class="info-box-content">
          <strong>${data.jobSite}</strong>
          ${data.jobDetails}
        </div>
      </div>
      <div class="info-box">
        <div class="info-box-title">Project Details</div>
        <div class="info-box-content">
          ${data.projectDetails}
        </div>
      </div>
    </div>

    <!-- Executive Summary -->
    <div class="section">
      <div class="section-title">Executive Summary</div>
      <div class="summary-text">${data.executiveSummary}</div>
    </div>

    <!-- Scope of Work -->
    <div class="section">
      <div class="section-title">Scope of Work</div>
      <ul class="scope-list">
        ${data.scopeOfWork.map(item => `<li>${item}</li>`).join('')}
      </ul>
    </div>

    <!-- Materials -->
    <div class="section">
      <div class="section-title">Materials & Equipment</div>
      <ul class="scope-list">
        ${data.materials.map(item => `<li>${item}</li>`).join('')}
      </ul>
    </div>
  </div>

  <!-- Page 2 -->
  <div class="page">
    <!-- Timeline -->
    <div class="section">
      <div class="section-title">Project Timeline</div>
      <ul class="scope-list">
        ${data.timeline.map(item => `<li>${item}</li>`).join('')}
      </ul>
    </div>

    <!-- Why Choose Us -->
    <div class="section">
      <div class="section-title">Why Choose Us</div>
      <div class="summary-text">${data.whyChooseUs}</div>
    </div>

    <!-- Investment Summary with Chart -->
    <div class="section">
      <div class="section-title">Investment Summary</div>
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
      <div class="section-title">Terms & Conditions</div>
      <div class="terms-section">
        ${data.termsAndConditions}
      </div>
    </div>

    <div class="footer">
      <p>This proposal is valid until ${data.validUntil}. Please contact us to discuss any questions or to schedule your project.</p>
    </div>
  </div>

  <script>
    // Generate pie chart
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
            borderWidth: 2,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                font: { size: 11 },
                padding: 15,
                usePointStyle: true,
              }
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
