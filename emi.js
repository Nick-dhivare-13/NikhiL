const formatMoney = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 0
}).format(Math.round(value));

const emiForm = document.querySelector('#emi-form');
const savedEmiSettings = window.SolarSphereConfig?.get?.().emi;
if (savedEmiSettings) {
  document.querySelector('#system-price').value = savedEmiSettings.systemPrice;
  document.querySelector('#down-payment').value = savedEmiSettings.downPayment;
  document.querySelector('#interest-rate').value = savedEmiSettings.interestRate;
  document.querySelector('#loan-months').value = savedEmiSettings.loanMonths;
}
const emiOutputs = {
  monthly: document.querySelector('#emi-monthly'),
  term: document.querySelector('#emi-term'),
  principal: document.querySelector('#emi-principal'),
  interest: document.querySelector('#emi-interest'),
  total: document.querySelector('#emi-total')
};

function calculateEmi(event) {
  event?.preventDefault();
  const priceInput = document.querySelector('#system-price');
  const downInput = document.querySelector('#down-payment');
  const rateInput = document.querySelector('#interest-rate');
  const monthsInput = document.querySelector('#loan-months');
  const price = Number(priceInput.value);
  const down = Number(downInput.value);
  const annualRate = Number(rateInput.value);
  const months = Number(monthsInput.value);
  const fields = [
    [priceInput, price > 0 && price <= 100000000, 'Enter a system price greater than zero.'],
    [downInput, down >= 0 && down < price, 'Down payment must be zero or more and less than the system price.'],
    [rateInput, annualRate >= 0 && annualRate <= 50, 'Enter an annual rate from 0% to 50%.'],
    [monthsInput, Number.isInteger(months) && months >= 1 && months <= 360, 'Enter a loan period from 1 to 360 whole months.']
  ];
  let valid = true;
  fields.forEach(([input, passes, message]) => {
    const field = input.closest('.field');
    field.classList.toggle('invalid', !passes);
    field.querySelector('.field-error').textContent = passes ? '' : message;
    valid = valid && passes;
  });
  if (!valid) return;

  const principal = price - down;
  const monthlyRate = annualRate / 1200;
  const monthlyPayment = monthlyRate === 0
    ? principal / months
    : principal * monthlyRate * ((1 + monthlyRate) ** months) / (((1 + monthlyRate) ** months) - 1);
  const totalInstallments = monthlyPayment * months;
  emiOutputs.monthly.textContent = formatMoney(monthlyPayment);
  emiOutputs.term.textContent = `${months} monthly payments · ${annualRate.toFixed(1)}% sample annual rate`;
  emiOutputs.principal.textContent = formatMoney(principal);
  emiOutputs.interest.textContent = formatMoney(totalInstallments - principal);
  emiOutputs.total.textContent = formatMoney(totalInstallments + down);
}

emiForm.addEventListener('submit', calculateEmi);
emiForm.addEventListener('input', (event) => {
  const field = event.target.closest('.field');
  if (field) { field.classList.remove('invalid'); field.querySelector('.field-error').textContent = ''; }
});
calculateEmi();

// Pull the admin-maintained sample interest rate and default term when served
// by the local backend. The calculator remains editable by the visitor.
fetch('/api/settings')
  .then((response) => response.ok ? response.json() : null)
  .then((settings) => {
    if (!settings) return;
    document.querySelector('#system-price').value = settings.systemPrice;
    document.querySelector('#down-payment').value = settings.downPayment;
    document.querySelector('#interest-rate').value = settings.annualInterestPercent;
    document.querySelector('#loan-months').value = Number(settings.defaultLoanYears) * 12;
    calculateEmi();
  })
  .catch(() => {});

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
