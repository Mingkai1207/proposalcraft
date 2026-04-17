export function generateProposalHTML(data) {
  const laborPercent = Math.round((data.laborCost / data.totalCost) * 100);
  const materialsPercent = 100 - laborPercent;

  // Clean content - remove markdown artifacts
  const cleanText = (text) => {
    if (!text) return '';
    return text
      .replace(/^#+\s*/gm, '') // Remove markdown headers
      .replace(/\*\*/g, '') // Remove bold markers
      .replace(/###/g, '') // Remove ### markers
      .replace(/\*\s*/g, '') // Remove bullet markers
      .replace(/^\s*-\s*/gm, '') // Remove dash markers
      .trim();
  };

  const scopeItems = Array.isArray(data.scopeOfWork) 
    ? data.scopeOfWork.map(item => cleanText(item)).filter(item => item.length > 0)
    : ['Professional assessment', 'Installation', 'Quality assurance'];

  const materials = Array.isArray(data.materials)
    ? data.materials.map(item => cleanText(item)).filter(item => item.length > 0)
    : ['Premium materials', 'Professional equipment'];

  const timeline = Array.isArray(data.timeline)
    ? data.timeline.map(item => cleanText(item)).filter(item => item.length > 0)
    : ['Day 1: Preparation', 'Day 2: Installation', 'Day 3: Final inspection'];

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${cleanText(data.jobTitle)}</title>
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
      line-height: 1.6;
      color: #1a1a1a;
      background: #f5f5f5;
    }

    .page {
      width: 8.5in;
      height: 11in;
      margin: 0.5in auto;
      padding: 0.5in;
      background: white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      page-break-after: always;
      overflow: hidden;
    }

    .header {
      background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
      color: white;
      padding: 0.4in 0.3in;
      margin: -0.5in -0.5in 0.3in -0.5in;
      border-bottom: 3px solid #1e40af;
    }

    .company-name {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 0.1in;
      letter-spacing: -0.5px;
    }

    .company-info {
      font-size: 11px;
      line-height: 1.4;
      opacity: 0.95;
    }

    .company-info p {
      margin: 2px 0;
    }

    .job-title {
      font-size: 20px;
      font-weight: 600;
      color: #1a1a1a;
      margin: 0.2in 0 0.15in 0;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 0.1in;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 0.15in;
      margin: 0.2in 0;
      font-size: 10px;
    }

    .info-box {
      background: #f8f9fa;
      border-left: 3px solid #2563eb;
      padding: 0.15in;
      border-radius: 2px;
    }

    .info-box-label {
      font-weight: 600;
      color: #2563eb;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 0.05in;
    }

    .info-box-content {
      color: #1a1a1a;
      line-height: 1.4;
    }

    .section {
      margin: 0.2in 0;
    }

    .section-title {
      font-size: 14px;
      font-weight: 700;
      color: #1a1a1a;
      margin: 0.15in 0 0.1in 0;
      padding-bottom: 0.08in;
      border-bottom: 2px solid #e5e7eb;
    }

    .section-content {
      font-size: 11px;
      line-height: 1.5;
      color: #333;
    }

    .bullet-list {
      margin: 0.1in 0 0.1in 0.2in;
      list-style: none;
    }

    .bullet-list li {
      margin: 0.05in 0;
      padding-left: 0.15in;
      position: relative;
    }

    .bullet-list li:before {
      content: '✓';
      position: absolute;
      left: 0;
      color: #2563eb;
      font-weight: bold;
    }

    .summary-text {
      font-size: 11px;
      line-height: 1.6;
      color: #333;
      margin: 0.1in 0;
    }

    .chart-container {
      margin: 0.15in 0;
      text-align: center;
      height: 1.8in;
    }

    .pricing-summary {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.15in;
      margin: 0.15in 0;
      font-size: 10px;
    }

    .price-item {
      background: #f8f9fa;
      padding: 0.1in;
      border-radius: 3px;
      border-left: 2px solid #2563eb;
    }

    .price-label {
      font-weight: 600;
      color: #666;
      font-size: 9px;
    }

    .price-value {
      font-size: 13px;
      font-weight: 700;
      color: #2563eb;
      margin-top: 0.03in;
    }

    .total-price {
      grid-column: 1 / -1;
      background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
      color: white;
      padding: 0.12in;
      border-radius: 3px;
      text-align: center;
      border: none;
    }

    .total-price .price-label {
      color: rgba(255,255,255,0.9);
    }

    .total-price .price-value {
      color: white;
      font-size: 16px;
    }

    .footer {
      font-size: 9px;
      color: #999;
      text-align: center;
      margin-top: 0.2in;
      padding-top: 0.1in;
      border-top: 1px solid #e5e7eb;
    }

    .page-number {
      position: absolute;
      bottom: 0.2in;
      right: 0.3in;
      font-size: 9px;
      color: #999;
    }

    @media print {
      body {
        background: white;
      }
      .page {
        margin: 0;
        box-shadow: none;
        page-break-after: always;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="company-name">${cleanText(data.businessName)}</div>
      <div class="company-info">
        <p>${cleanText(data.businessPhone)} • ${cleanText(data.businessEmail)}</p>
        <p>${cleanText(data.businessAddress)} • License: ${cleanText(data.licenseNumber)}</p>
      </div>
    </div>

    <div class="job-title">${cleanText(data.jobTitle)}</div>

    <div class="info-grid">
      <div class="info-box">
        <div class="info-box-label">Client</div>
        <div class="info-box-content">
          <strong>${cleanText(data.clientName)}</strong><br>
          ${cleanText(data.clientAddress)}
        </div>
      </div>
      <div class="info-box">
        <div class="info-box-label">Job Site</div>
        <div class="info-box-content">
          ${cleanText(data.jobSite)}
        </div>
      </div>
      <div class="info-box">
        <div class="info-box-label">Project Info</div>
        <div class="info-box-content">
          Valid until: ${cleanText(data.validUntil)}
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Executive Summary</div>
      <div class="summary-text">
        ${cleanText(data.executiveSummary)}
      </div>
    </div>

    <div class="section">
      <div class="section-title">Scope of Work</div>
      <ul class="bullet-list">
        ${scopeItems.slice(0, 4).map(item => `<li>${item}</li>`).join('')}
      </ul>
    </div>

    <div class="section">
      <div class="section-title">Materials & Equipment</div>
      <ul class="bullet-list">
        ${materials.slice(0, 3).map(item => `<li>${item}</li>`).join('')}
      </ul>
    </div>

    <div class="section">
      <div class="section-title">Project Timeline</div>
      <ul class="bullet-list">
        ${timeline.slice(0, 3).map(item => `<li>${item}</li>`).join('')}
      </ul>
    </div>

    <div class="section">
      <div class="section-title">Investment Summary</div>
      
      <div class="pricing-summary">
        <div class="price-item">
          <div class="price-label">Labor</div>
          <div class="price-value">$${data.laborCost.toLocaleString()}</div>
        </div>
        <div class="price-item">
          <div class="price-label">Materials</div>
          <div class="price-value">$${data.materialsCost.toLocaleString()}</div>
        </div>
        <div class="price-item total-price">
          <div class="price-label">Total Investment</div>
          <div class="price-value">$${data.totalCost.toLocaleString()}</div>
        </div>
      </div>

      <div class="chart-container">
        <canvas id="priceChart"></canvas>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Why Choose Us</div>
      <div class="summary-text">
        ${cleanText(data.whyChooseUs)}
      </div>
    </div>

    <div class="section">
      <div class="section-title">Terms & Conditions</div>
      <div class="summary-text" style="font-size: 10px;">
        ${cleanText(data.termsAndConditions)}
      </div>
    </div>

    <div class="footer">
      Proposal prepared on ${cleanText(data.preparedDate)} • Valid until ${cleanText(data.validUntil)}
    </div>

    <div class="page-number">Page 1 of 1</div>
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
              borderWidth: 2,
              borderRadius: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  font: { size: 11 },
                  padding: 12,
                  usePointStyle: true
                }
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return context.label + ': ' + context.parsed + '%';
                  }
                }
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
}
