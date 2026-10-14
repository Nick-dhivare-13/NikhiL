/**
 * SolarSphere – script.js
 * Academic prototype · Sample data only.
 * All figures are fictional and for demonstration purposes.
 */

/* ============================================================
   CONFIG — fictional demo assumptions, easy to swap later
   ============================================================ */
const CONFIG = {
  PANEL_RATING_W:        450,      // Sample panel rating (watts)
  AREA_PER_PANEL_SQFT:   22,       // Sample roof area per panel (sq ft)
  PERFORMANCE_FACTOR:    0.76,     // Sample system performance factor (derate)
  ELECTRICITY_RATE_INR:  6.80,     // Sample electricity value (₹ per kWh)
  COST_PER_KW_INR:       62500,    // Sample installed cost (₹ per kW)
  LOCATION_LABEL:        'Jalgaon',// Demo location label
};

/* Derived sample package specs */
const SAMPLE_PACKAGES = [
  {
    kw: 2,
    name: '2 kW Sample System',
    featured: false,
    features: [
      '~9 sample panels (450 W each)',
      '~195 sq. ft. indicative roof area',
      'On-grid configuration (illustrative)',
      '5-year sample installation warranty',
      'Basic sample monitoring included',
    ],
  },
  {
    kw: 3,
    name: '3 kW Sample System',
    featured: true,
    features: [
      '~14 sample panels (450 W each)',
      '~295 sq. ft. indicative roof area',
      'On-grid + sample export metering',
      '5-year sample installation warranty',
      'Remote sample monitoring included',
    ],
  },
  {
    kw: 5,
    name: '5 kW Sample System',
    featured: false,
    features: [
      '~23 sample panels (450 W each)',
      '~490 sq. ft. indicative roof area',
      'On-grid commercial configuration',
      '5-year sample installation warranty',
      'Advanced sample monitoring + alerts',
    ],
  },
];

/* ============================================================
   HELPERS
   ============================================================ */
function formatINR(val) {
  return '₹' + Math.round(val).toLocaleString('en-IN');
}

function formatNum(val, decimals = 2) {
  return Number(val).toFixed(decimals);
}

/* ============================================================
   MOBILE NAV
   ============================================================ */
(function initNav() {
  const btn      = document.getElementById('menuBtn');
  const menu     = document.getElementById('mobileMenu');
  const links    = menu ? menu.querySelectorAll('.mobile-link') : [];

  if (!btn || !menu) return;

  function openMenu() {
    menu.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    btn.setAttribute('aria-label', 'Close navigation menu');
  }
  function closeMenu() {
    menu.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Open navigation menu');
  }

  btn.addEventListener('click', () => {
    menu.hidden ? openMenu() : closeMenu();
  });

  links.forEach(link => link.addEventListener('click', closeMenu));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu.hidden) closeMenu();
  });
})();

/* ============================================================
   CALCULATOR
   ============================================================ */
(function initCalculator() {
  const form            = document.getElementById('calcForm');
  const resultsContent  = document.getElementById('resultsContent');
  const placeholder     = document.getElementById('resultsPlaceholder');

  if (!form) return;

  /* --- Validation helpers --- */
  function setError(inputId, errId, msg) {
    const inp = document.getElementById(inputId);
    const err = document.getElementById(errId);
    if (inp) inp.classList.toggle('is-invalid', !!msg);
    if (err) err.textContent = msg || '';
    return !!msg;
  }
  function clearErrors() {
    ['roofArea','sunHours','monthlyBill','budget'].forEach(id => {
      const inp = document.getElementById(id);
      const err = document.getElementById(id + 'Err');
      if (inp) inp.classList.remove('is-invalid');
      if (err) err.textContent = '';
    });
  }

  function validate(area, sun, bill, budget) {
    let hasError = false;
    if (!area || area <= 0)
      hasError = setError('roofArea', 'roofAreaErr', 'Please enter a roof area greater than zero.') || hasError;
    if (!sun || sun < 1 || sun > 12)
      hasError = setError('sunHours', 'sunHoursErr', 'Sunlight hours must be between 1 and 12.') || hasError;
    if (!bill || bill <= 0)
      hasError = setError('monthlyBill', 'monthlyBillErr', 'Please enter a positive monthly bill.') || hasError;
    if (budget !== '' && (isNaN(budget) || budget < 0))
      hasError = setError('budget', 'budgetErr', 'Budget must be a positive number or left blank.') || hasError;
    return !hasError;
  }

  /* --- Calculation --- */
  function calculate(area, sun, bill) {
    const panelCount   = Math.max(1, Math.floor(area / CONFIG.AREA_PER_PANEL_SQFT));
    const capacityKw   = (panelCount * CONFIG.PANEL_RATING_W) / 1000;
    const monthlyKwh   = capacityKw * sun * 30 * CONFIG.PERFORMANCE_FACTOR;
    const monthlySave  = Math.min(bill, monthlyKwh * CONFIG.ELECTRICITY_RATE_INR);
    const systemCost   = capacityKw * CONFIG.COST_PER_KW_INR;
    const annualSave   = monthlySave * 12;
    const paybackYrs   = annualSave > 0 ? systemCost / annualSave : null;

    return { panelCount, capacityKw, monthlyKwh, monthlySave, systemCost, paybackYrs };
  }

  /* --- Render results --- */
  function renderResults(area, sun, bill, budget, res) {
    const budgetNote = (budget && budget > 0)
      ? `<p style="font-size:.82rem;color:${res.systemCost <= budget ? 'var(--success)' : 'var(--error)'}; margin-bottom:.75rem;">
           ${res.systemCost <= budget
              ? `✅ Sample system cost (${formatINR(res.systemCost)}) is within your budget.`
              : `⚠️ Sample system cost (${formatINR(res.systemCost)}) exceeds entered budget. Consider a smaller system.`}
         </p>`
      : '';

    resultsContent.innerHTML = `
      <h3>Sample Estimate — ${CONFIG.LOCATION_LABEL}</h3>
      <div class="calc-disclaimer">
        ⚠️ <strong>Sample data · not a real quote.</strong> Outputs are illustrative only.
      </div>
      ${budgetNote}
      <div class="result-grid">
        <div class="result-item">
          <div class="result-label">Panel Count</div>
          <div class="result-value">${res.panelCount} panels</div>
        </div>
        <div class="result-item">
          <div class="result-label">System Capacity</div>
          <div class="result-value">${formatNum(res.capacityKw, 2)} kW</div>
        </div>
        <div class="result-item">
          <div class="result-label">Monthly Generation</div>
          <div class="result-value">${formatNum(res.monthlyKwh, 0)} kWh</div>
        </div>
        <div class="result-item highlight">
          <div class="result-label">Est. Monthly Savings</div>
          <div class="result-value">${formatINR(res.monthlySave)}</div>
        </div>
        <div class="result-item highlight">
          <div class="result-label">Sample System Cost</div>
          <div class="result-value">${formatINR(res.systemCost)}</div>
        </div>
        <div class="result-item">
          <div class="result-label">Illustrative Payback</div>
          <div class="result-value">${res.paybackYrs !== null ? formatNum(res.paybackYrs, 1) + ' years' : 'N/A'}</div>
        </div>
      </div>

      <div class="assumptions-box">
        <h4>Sample Assumptions Used</h4>
        <ul>
          <li>Panel rating: ${CONFIG.PANEL_RATING_W} W</li>
          <li>Roof area per panel: ${CONFIG.AREA_PER_PANEL_SQFT} sq. ft.</li>
          <li>System performance factor: ${CONFIG.PERFORMANCE_FACTOR}</li>
          <li>Electricity value: ₹${CONFIG.ELECTRICITY_RATE_INR} /kWh</li>
          <li>Installed cost: ₹${CONFIG.COST_PER_KW_INR.toLocaleString('en-IN')} /kW</li>
          <li>Location label: ${CONFIG.LOCATION_LABEL}</li>
        </ul>
      </div>

      <div class="pdf-btn-wrap">
        <button class="btn btn-secondary btn-full" id="savePdfBtn" type="button">
          💾 Save Estimate as PDF
        </button>
      </div>
    `;

    /* Store for PDF */
    resultsContent.dataset.inputs  = JSON.stringify({ area, sun, bill, budget });
    resultsContent.dataset.results = JSON.stringify(res);

    /* Attach PDF handler */
    document.getElementById('savePdfBtn')
      .addEventListener('click', () => printEstimate(area, sun, bill, budget, res));
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearErrors();

    const area   = parseFloat(document.getElementById('roofArea').value);
    const sun    = parseFloat(document.getElementById('sunHours').value);
    const bill   = parseFloat(document.getElementById('monthlyBill').value);
    const budgetRaw = document.getElementById('budget').value.trim();
    const budget = budgetRaw === '' ? null : parseFloat(budgetRaw);

    if (!validate(area, sun, bill, budgetRaw)) return;

    const res = calculate(area, sun, bill);
    placeholder.hidden = true;
    resultsContent.hidden = false;
    renderResults(area, sun, bill, budget, res);

    /* Scroll to results on small screens */
    if (window.innerWidth < 900) {
      resultsContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
})();

/* ============================================================
   PDF PRINT
   ============================================================ */
function printEstimate(area, sun, bill, budget, res) {
  const today = new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric'
  });

  const budgetLine = budget
    ? `<tr><td>Budget entered</td><td>${formatINR(budget)}</td></tr>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>SolarSphere Sample Estimate – ${today}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 12pt; color: #1E293B; margin: 2cm; }
    h1   { font-size: 1.5rem; color: #0D2137; border-bottom: 2px solid #F97316; padding-bottom: .4rem; margin-bottom: .5rem; }
    h2   { font-size: 1rem; color: #1E3A5F; margin: 1.2rem 0 .5rem; }
    .banner { background: #FFF7ED; border: 1px solid #FED7AA; color: #9A3412; padding: .5rem .75rem; font-size: .85rem; border-radius: 4px; margin-bottom: 1rem; }
    .badge  { background: #F97316; color: #fff; padding: .2rem .5rem; font-size: .75rem; border-radius: 3px; }
    table   { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
    th, td  { text-align: left; padding: .45rem .6rem; border: 1px solid #E2E8F0; font-size: .9rem; }
    th      { background: #F1F5F9; font-weight: 600; }
    .highlight td:last-child { font-weight: 700; color: #C2540A; }
    .footer { margin-top: 2rem; font-size: .78rem; color: #64748B; border-top: 1px solid #E2E8F0; padding-top: .75rem; }
    @media print { body { margin: 1cm; } }
  </style>
</head>
<body>
  <p class="banner">⚠️ <strong>SAMPLE DATA – NOT A QUOTE.</strong>
  This output is generated by an academic prototype and is illustrative only.
  It is not a verified estimate for ${CONFIG.LOCATION_LABEL} or any specific site.</p>

  <h1>🌞 SolarSphere Sample Estimate</h1>
  <p><span class="badge">Academic Prototype</span> &nbsp; Generated: ${today} &nbsp;|&nbsp; Location label: ${CONFIG.LOCATION_LABEL}</p>

  <h2>Inputs Entered</h2>
  <table>
    <thead><tr><th>Field</th><th>Value</th></tr></thead>
    <tbody>
      <tr><td>Usable roof area</td><td>${area} sq. ft.</td></tr>
      <tr><td>Daily sunlight hours</td><td>${sun} hrs</td></tr>
      <tr><td>Monthly electricity bill</td><td>${formatINR(bill)}</td></tr>
      ${budgetLine}
    </tbody>
  </table>

  <h2>Sample Results</h2>
  <table>
    <thead><tr><th>Metric</th><th>Illustrative Value</th></tr></thead>
    <tbody>
      <tr><td>Panel count</td><td>${res.panelCount} panels</td></tr>
      <tr><td>System capacity</td><td>${formatNum(res.capacityKw, 2)} kW</td></tr>
      <tr><td>Monthly generation</td><td>${formatNum(res.monthlyKwh, 0)} kWh</td></tr>
      <tr class="highlight"><td>Estimated monthly savings</td><td>${formatINR(res.monthlySave)}</td></tr>
      <tr class="highlight"><td>Sample system cost</td><td>${formatINR(res.systemCost)}</td></tr>
      <tr><td>Illustrative payback period</td><td>${res.paybackYrs !== null ? formatNum(res.paybackYrs, 1) + ' years' : 'N/A'}</td></tr>
    </tbody>
  </table>

  <h2>Sample Assumptions Used</h2>
  <table>
    <thead><tr><th>Assumption</th><th>Value</th></tr></thead>
    <tbody>
      <tr><td>Panel rating</td><td>${CONFIG.PANEL_RATING_W} W</td></tr>
      <tr><td>Roof area per panel</td><td>${CONFIG.AREA_PER_PANEL_SQFT} sq. ft.</td></tr>
      <tr><td>System performance factor</td><td>${CONFIG.PERFORMANCE_FACTOR}</td></tr>
      <tr><td>Electricity value</td><td>₹${CONFIG.ELECTRICITY_RATE_INR} /kWh</td></tr>
      <tr><td>Installed cost</td><td>₹${CONFIG.COST_PER_KW_INR.toLocaleString('en-IN')} /kW</td></tr>
      <tr><td>Location label</td><td>${CONFIG.LOCATION_LABEL}</td></tr>
    </tbody>
  </table>

  <div class="footer">
    <p><strong>Disclaimer:</strong> All figures above are fictional sample data produced by an academic demonstration
    tool. They do not constitute a professional solar installation quote, financial advice, or a representation
    of real market rates in ${CONFIG.LOCATION_LABEL} or elsewhere. Consult a qualified local installer for an
    actual site assessment.</p>
    <p>SolarSphere · Student Prototype · Sample Data Only</p>
  </div>

  <script>window.onload = function(){ window.print(); }<\/script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) {
    alert('Pop-up blocked. Please allow pop-ups for this page and try again.');
    return;
  }
  win.document.write(html);
  win.document.close();
}

/* ============================================================
   SAMPLE PACKAGES — render from CONFIG
   ============================================================ */
(function renderPackages() {
  const grid = document.getElementById('packagesGrid');
  if (!grid) return;

  SAMPLE_PACKAGES.forEach(pkg => {
    const price = pkg.kw * CONFIG.COST_PER_KW_INR;
    const card  = document.createElement('article');
    card.className = 'package-card' + (pkg.featured ? ' featured' : '');
    card.setAttribute('aria-label', `${pkg.name} sample package`);

    const featuredBadge = pkg.featured
      ? `<div class="featured-badge" aria-label="Most popular sample">Popular</div>`
      : '';

    card.innerHTML = `
      ${featuredBadge}
      <div class="package-kw">${pkg.kw} <span>kW Sample</span></div>
      <div class="package-price">${formatINR(price)}</div>
      <div class="package-sample-tag">Sample data · not a quote</div>
      <ul class="package-features">
        ${pkg.features.map(f => `<li>${f}</li>`).join('')}
      </ul>
      <a href="#calculator" class="btn btn-primary btn-full">Try Calculator</a>
    `;
    grid.appendChild(card);
  });
})();

/* ============================================================
   ENQUIRY FORM DEMO
   ============================================================ */
(function initEnquiryForm() {
  const form    = document.getElementById('enquiryForm');
  const success = document.getElementById('enquirySuccess');
  const reset   = document.getElementById('resetEnquiry');

  if (!form || !success) return;

  // The former demo-only form is replaced by the local server-backed portal.
  // Keep a redirect fallback for any older cached copy of the markup.
  form.addEventListener('submit', (e) => { e.preventDefault(); location.href = 'auth.html'; });
  return;

  const MOBILE_RE = /^[6-9]\d{9}$/;           /* Indian 10-digit mobile */
  const EMAIL_RE  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PIN_RE    = /^\d{6}$/;

  function setErr(errId, inputId, msg) {
    const el  = document.getElementById(errId);
    const inp = inputId ? document.getElementById(inputId) : null;
    if (el)  el.textContent  = msg || '';
    if (inp) inp.classList.toggle('is-invalid', !!msg);
    return !!msg;
  }

  function clearAll() {
    const errIds = ['enqNameErr','enqMobileErr','enqEmailErr',
                    'enqPincodeErr','enqBillErr','enqBudgetErr','enqConsentErr'];
    const inpIds = ['enqName','enqMobile','enqEmail',
                    'enqPincode','enqBill','enqBudget'];
    errIds.forEach(id => { const e = document.getElementById(id); if (e) e.textContent = ''; });
    inpIds.forEach(id => { const i = document.getElementById(id); if (i) i.classList.remove('is-invalid'); });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearAll();

    const name    = form.enqName.value.trim();
    const mobile  = form.enqMobile.value.trim();
    const email   = form.enqEmail.value.trim();
    const pincode = form.enqPincode.value.trim();
    const bill    = parseFloat(form.enqBill.value);
    const budget  = parseFloat(form.enqBudget.value);
    const consent = form.enqConsent.checked;

    let ok = true;

    if (!name || name.length < 2)
      ok = !setErr('enqNameErr', 'enqName', 'Please enter your full name (at least 2 characters).') && ok;
    if (!MOBILE_RE.test(mobile))
      ok = !setErr('enqMobileErr', 'enqMobile', 'Enter a valid 10-digit Indian mobile number starting with 6–9.') && ok;
    if (!EMAIL_RE.test(email))
      ok = !setErr('enqEmailErr', 'enqEmail', 'Enter a valid email address.') && ok;
    if (!PIN_RE.test(pincode))
      ok = !setErr('enqPincodeErr', 'enqPincode', 'Enter a valid 6-digit Indian pincode.') && ok;
    if (isNaN(bill) || bill <= 0)
      ok = !setErr('enqBillErr', 'enqBill', 'Please enter a positive monthly bill amount.') && ok;
    if (isNaN(budget) || budget <= 0)
      ok = !setErr('enqBudgetErr', 'enqBudget', 'Please enter a positive budget amount.') && ok;
    if (!consent)
      ok = !setErr('enqConsentErr', null, 'Please tick the consent checkbox to continue.') && ok;

    if (!ok) return;

    form.hidden = true;
    success.hidden = false;
  });

  reset.addEventListener('click', () => {
    form.reset();
    clearAll();
    form.hidden = false;
    success.hidden = true;
    form.querySelector('input')?.focus();
  });
})();
