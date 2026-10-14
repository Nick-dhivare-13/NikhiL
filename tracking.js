const processSteps = [
  { title: 'Enquiry received', description: 'Your request and contact preference are recorded.' },
  { title: 'Site assessment', description: 'Roof space, shade, wiring, and site conditions are reviewed.' },
  { title: 'System design and estimate', description: 'A proposed system layout, equipment list, and cost estimate are prepared.' },
  { title: 'Approval and scheduling', description: 'The customer reviews the proposal and agrees on the next steps.' },
  { title: 'Installation and inspection', description: 'The installation is completed and the system is checked.' },
  { title: 'Handover and support', description: 'System documents and care guidance are shared with the customer.' }
];

const exampleRecord = {
  reference: 'JLG-26-001',
  label: 'Illustrative rooftop project',
  currentStep: 2
};
const processGrid = document.querySelector('#process-grid');
const trackingForm = document.querySelector('#tracking-form');
const trackingInput = document.querySelector('#tracking-id');
const trackingMessage = document.querySelector('#tracking-help');
const trackingResult = document.querySelector('#tracking-result');

processGrid.innerHTML = processSteps.map((step, index) => `<article class="process-card"><span class="process-number">${String(index + 1).padStart(2, '0')}</span><h3>${step.title}</h3><p>${step.description}</p></article>`).join('');

trackingForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const reference = trackingInput.value.trim().toUpperCase();
  trackingMessage.textContent = '';
  trackingMessage.classList.remove('tracking-error');
  try {
    const response = await fetch(`/api/enquiries/track/${encodeURIComponent(reference)}`, { credentials: 'same-origin' });
    if (response.status === 401) {
      location.href = `auth.html?next=${encodeURIComponent('tracking.html')}`;
      return;
    }
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'No request found.');
    const q = result.enquiry;
    const progress = { 'Received': 0, 'Reviewing': 1, 'Site visit planned': 1, 'Estimate prepared': 2, 'Closed': 5 };
    const currentStep = progress[q.status] ?? 0;
    const safe = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
    trackingResult.innerHTML = `<div class="tracking-result-top"><div><span class="card-kicker">SAVED REQUEST · ${safe(q.reference_code)}</span><h2 id="tracking-result-title">${safe(q.company_name_snapshot)} · ${safe(q.package_name_snapshot)}</h2></div><span class="status-chip">${safe(q.status)}</span></div><p class="tracking-current">Current request status: <strong>${safe(q.status)}</strong></p><ol class="tracking-timeline">${processSteps.map((step, index) => { const state=index<currentStep?'completed':index===currentStep?'current':'upcoming';const label=state==='completed'?'Complete':state==='current'?'Current stage':'Upcoming';return `<li class="timeline-step ${state}"><span class="timeline-marker">${index<currentStep?'✓':String(index+1)}</span><div><strong>${step.title}</strong><p>${step.description}</p></div><span class="timeline-label">${label}</span></li>`;}).join('')}</ol><p class="tracking-sample-note">This status belongs to your saved college-project request. It does not represent an actual installation.</p>`;
    trackingResult.hidden = false;
    trackingResult.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    trackingResult.hidden = true;
    trackingMessage.textContent = error.message;
    trackingMessage.classList.add('tracking-error');
  }
});

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
