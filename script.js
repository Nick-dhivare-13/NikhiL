const solarForm = document.querySelector('#solar-form');
const resultBox = document.querySelector('#calculator-result');
const formatINR = (amount) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(amount));
const savedSiteSettings = window.SolarSphereConfig?.get?.() || {};
const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[character]);
const SAMPLE_CONFIG = Object.freeze({
  city: 'Jalgaon (illustrative location)',
  panelWatts: 450,
  roofSqFtPerPanel: 22,
  performanceFactor: 0.76,
  sampleRatePerKwh: Number(savedSiteSettings.sampleRatePerKwh) || 6.8,
  sampleCostPerKw: Number(savedSiteSettings.sampleCostPerKw) || 62500,
  samplePackages: Array.isArray(savedSiteSettings.packages) ? savedSiteSettings.packages : [
    { name: 'Starter example', sizeKw: 2, note: 'A compact example system' },
    { name: 'Everyday example', sizeKw: 3, note: 'A mid-size example system', featured: true },
    { name: 'Expanded example', sizeKw: 5, note: 'A larger example system' }
  ]
});

const showFieldError = (input, message, targetId) => {
  const field = input.closest('.field');
  field?.classList.toggle('invalid', Boolean(message));
  const target = targetId ? document.getElementById(targetId) : field?.querySelector('.field-error');
  if (target) target.textContent = message;
};

const packageGrid = document.querySelector('#sample-packages');
packageGrid.innerHTML = SAMPLE_CONFIG.samplePackages.map((item) => {
  const sizeKw = Number(item.sizeKw);
  const panels = Math.ceil(sizeKw * 1000 / SAMPLE_CONFIG.panelWatts);
  const examplePrice = Number(item.price) > 0 ? Number(item.price) : sizeKw * SAMPLE_CONFIG.sampleCostPerKw;
  return `<article class="sample-package ${item.featured ? 'featured' : ''}">
    <span class="package-tag">SAMPLE DATA · NOT A QUOTE</span>
    <h3>${escapeHTML(item.name)}</h3><p>${escapeHTML(item.note)}</p>
    <div class="package-price">₹${formatINR(examplePrice)}<small> illustrative price</small></div>
    <ul><li>${item.sizeKw} kW sample system</li><li>${panels} × ${SAMPLE_CONFIG.panelWatts} W sample panels</li><li>Equipment and installation not specified</li></ul>
    <a href="offers.html">Sign in to request this package <span>→</span></a>
  </article>`;
}).join('');

solarForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const roof = Number(solarForm.elements.roofArea.value);
  const sun = Number(solarForm.elements.sunHours.value);
  const bill = Number(solarForm.elements.monthlyBill.value);
  const budget = Number(solarForm.elements.budget.value);
  let valid = true;
  const checks = [
    [solarForm.elements.roofArea, roof > 0 && roof <= 100000, 'Enter a roof area greater than 0 sq. ft.', 'roofArea-error'],
    [solarForm.elements.sunHours, sun >= 1 && sun <= 12, 'Enter sunlight hours from 1 to 12.', 'sunHours-error'],
    [solarForm.elements.monthlyBill, bill > 0 && bill <= 10000000, 'Enter a valid monthly bill amount.', 'monthlyBill-error'],
    [solarForm.elements.budget, budget > 0 && budget <= 100000000, 'Enter a valid investment budget.', 'budget-error']
  ];
  checks.forEach(([input, passes, message, target]) => {
    showFieldError(input, passes ? '' : message, target);
    valid = valid && passes;
  });
  if (!valid) { resultBox.hidden = true; return; }

  // Fictional assumptions make this a working UI prototype, not a real quote.
  const panels = Math.max(1, Math.floor(roof / SAMPLE_CONFIG.roofSqFtPerPanel));
  const capacity = panels * SAMPLE_CONFIG.panelWatts / 1000;
  const monthlyProduction = capacity * sun * 30 * SAMPLE_CONFIG.performanceFactor;
  const monthlySavings = Math.min(bill, monthlyProduction * SAMPLE_CONFIG.sampleRatePerKwh);
  const installationCost = capacity * SAMPLE_CONFIG.sampleCostPerKw;
  const payback = monthlySavings > 0 ? installationCost / (monthlySavings * 12) : 0;
  const withinBudget = installationCost <= budget;
  const budgetNote = withinBudget
    ? `In this example, the sample system is within the entered budget by ₹${formatINR(budget - installationCost)}. This is not a vendor offer.`
    : `In this example, the sample system is ₹${formatINR(installationCost - budget)} above the entered budget. This is not a vendor offer.`;
  const generatedOn = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date());
  const printEstimate = () => {
    const printWindow = window.open('', '_blank', 'width=760,height=820');
    if (!printWindow) { window.alert('Allow the estimate window to open, then choose Save as PDF in the print dialog.'); return; }
    printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>SolarSphere estimate illustration</title><style>
      body{font:15px Arial,sans-serif;color:#21354a;max-width:760px;margin:44px auto;padding:0 30px}h1{color:#16395c;font-size:28px}h2{font-size:17px;margin:28px 0 10px}.tag{display:inline-block;background:#fff0e2;color:#a65328;padding:7px 10px;font-weight:bold;font-size:11px;letter-spacing:.08em}.meta{color:#6c7a86;font-size:13px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.cell{padding:13px;background:#f4f7f5;border-radius:5px}.cell small{display:block;color:#6c7a86;margin-bottom:6px}.cell strong{font-size:18px}.note{margin-top:22px;padding:16px;background:#fff7ed;border-left:4px solid #f3783c;font-size:13px;line-height:1.6}.assumptions{font-size:13px;line-height:1.8;color:#596a78}footer{border-top:1px solid #ddd;margin-top:35px;padding-top:14px;color:#79858e;font-size:11px}@media print{body{margin:20px auto}}
    </style></head><body><span class="tag">SOLARSPHERE · ILLUSTRATIVE ESTIMATE</span><h1>SolarSphere estimate illustration</h1><p class="meta">Created ${generatedOn} · Location assumption: ${SAMPLE_CONFIG.city}</p><h2>Your example system</h2><div class="grid">
      <div class="cell"><small>Estimated panels</small><strong>${panels}</strong></div><div class="cell"><small>Sample capacity</small><strong>${capacity.toFixed(2)} kW</strong></div>
      <div class="cell"><small>Sample monthly generation</small><strong>${formatINR(monthlyProduction)} kWh</strong></div><div class="cell"><small>Sample monthly savings</small><strong>₹${formatINR(monthlySavings)}</strong></div>
      <div class="cell"><small>Illustrative system cost</small><strong>₹${formatINR(installationCost)}</strong></div><div class="cell"><small>Illustrative payback</small><strong>${payback.toFixed(1)} years</strong></div>
    </div><div class="note"><strong>Illustration notice:</strong> This report uses fictional sample assumptions. It is not a quote, financial offer, or verified Jalgaon production estimate. It includes no live vendor prices, official tariff, or subsidy data.</div>
    <h2>Assumptions used</h2><p class="assumptions">${SAMPLE_CONFIG.panelWatts} W per sample panel; ${SAMPLE_CONFIG.roofSqFtPerPanel} sq. ft. per panel; ${Math.round(SAMPLE_CONFIG.performanceFactor * 100)}% sample performance factor; ₹${SAMPLE_CONFIG.sampleRatePerKwh.toFixed(2)} per kWh sample value; ₹${formatINR(SAMPLE_CONFIG.sampleCostPerKw)} per kW sample cost. Entered sunlight: ${sun} hours/day. Entered monthly bill: ₹${formatINR(bill)}.</p>
    <footer>SolarSphere · Jalgaon solar estimate. Choose “Save as PDF” in the print dialog to keep a copy.</footer><script>window.addEventListener('load',()=>window.print())</script></body></html>`);
    printWindow.document.close();
  };

  resultBox.innerHTML = `
    <h4>Your illustrative solar estimate</h4>
    <p class="result-lead">${generatedOn} · Based on ${formatINR(roof)} sq. ft. and ${sun} sunlight hours/day. Location assumption: ${SAMPLE_CONFIG.city}.</p>
    <div class="result-metrics">
      <div class="result-metric"><span>Estimated panels</span><strong>${panels} panels</strong></div>
      <div class="result-metric"><span>System capacity</span><strong>${capacity.toFixed(2)} kW</strong></div>
      <div class="result-metric"><span>Monthly energy</span><strong>${formatINR(monthlyProduction)} kWh</strong></div>
      <div class="result-metric"><span>Estimated monthly savings</span><strong>₹${formatINR(monthlySavings)}</strong></div>
      <div class="result-metric"><span>Estimated installation</span><strong>₹${formatINR(installationCost)}</strong></div>
      <div class="result-metric"><span>Estimated payback</span><strong>${payback.toFixed(1)} years</strong></div>
    </div>
    <p class="result-message ${withinBudget ? '' : 'over'}">${budgetNote}</p>
    <p class="result-assumptions">Illustrative assumptions: ${SAMPLE_CONFIG.panelWatts} W panels · ${SAMPLE_CONFIG.roofSqFtPerPanel} sq. ft./panel · ${Math.round(SAMPLE_CONFIG.performanceFactor * 100)}% sample performance · ₹${SAMPLE_CONFIG.sampleRatePerKwh.toFixed(2)}/kWh · ₹${formatINR(SAMPLE_CONFIG.sampleCostPerKw)}/kW. No live tariff or subsidy included.</p>
    <div class="result-actions"><a href="#consult">Try enquiry form <span>→</span></a><a href="emi.html">Calculate EMI <span>→</span></a><button class="pdf-button" type="button">Save estimate as PDF</button><button class="share-button" type="button">Share example ↗</button></div>`;
  resultBox.hidden = false;
  resultBox.querySelector('.pdf-button').addEventListener('click', printEstimate);
  resultBox.querySelector('.share-button').addEventListener('click', async () => {
    const shareText = `SolarSphere estimate example (illustrative values only): ${panels} panels, ${capacity.toFixed(2)} kW, illustrative monthly savings ₹${formatINR(monthlySavings)}. ${window.location.href.split('#')[0]}#calculator`;
    try {
      if (navigator.share) await navigator.share({ title: 'My SolarSphere estimate', text: shareText });
      else if (navigator.clipboard) { await navigator.clipboard.writeText(shareText); resultBox.querySelector('.share-button').textContent = 'Copied to clipboard ✓'; }
      else window.prompt('Copy your estimate:', shareText);
    } catch (error) { if (error.name !== 'AbortError') window.prompt('Copy your estimate:', shareText); }
  });
});

solarForm.addEventListener('input', (event) => {
  if (event.target.matches('input')) showFieldError(event.target, '', `${event.target.id}-error`);
});

const consultForm = document.querySelector('#consult-form');
const consultMessage = document.querySelector('#consult-message');
if (consultForm) {
consultForm.addEventListener('submit', (event) => {
  event.preventDefault();
  consultMessage.textContent = '';
  let valid = true;
  const values = new FormData(consultForm);
  const validations = [
    ['name', String(values.get('name') || '').trim().length >= 2, 'Please enter your name.'],
    ['phone', /^[6-9]\d{9}$/.test(String(values.get('phone') || '').replace(/\D/g, '')), 'Enter a valid 10-digit Indian mobile number.'],
    ['email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(values.get('email') || '').trim()), 'Enter an email address such as you@example.com.'],
    ['pincode', /^[1-9]\d{5}$/.test(String(values.get('pincode') || '').trim()), 'Enter a valid 6-digit Indian pincode.'],
    ['bill', Number(values.get('bill')) > 0 && Number(values.get('bill')) <= 10000000, 'Enter a valid monthly bill amount.'],
    ['budget', Number(values.get('budget')) > 0 && Number(values.get('budget')) <= 100000000, 'Enter a realistic budget amount.']
  ];
  validations.forEach(([name, passes, message]) => {
    const input = consultForm.elements[name];
    const field = input.closest('.field');
    field.classList.toggle('invalid', !passes);
    field.querySelector('.field-error').textContent = passes ? '' : message;
    valid = valid && passes;
  });
  const consent = consultForm.querySelector('[name="consent"], .consent input');
  if (!consent.checked) { valid = false; consultMessage.textContent = 'Please confirm this preview does not send your details.'; }
  if (!valid) return;
  consultMessage.style.color = '#527c61';
  consultMessage.textContent = 'Form preview complete. The entries were validated; nothing was saved or sent.';
  consultForm.reset();
});

consultForm.addEventListener('input', (event) => {
  const field = event.target.closest('.field');
  if (field) { field.classList.remove('invalid'); field.querySelector('.field-error').textContent = ''; }
  if (event.target.matches('[name="pincode"]')) event.target.value = event.target.value.replace(/\D/g, '').slice(0, 6);
});
}

const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav-links');
menuToggle.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
});
nav.addEventListener('click', (event) => {
  if (event.target.closest('a')) { nav.classList.remove('open'); menuToggle.setAttribute('aria-expanded', 'false'); }
});
