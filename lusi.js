const lusiQuestions = [
  { id: 'about', question: 'What is SolarSphere?', answer: 'SolarSphere helps Jalgaon households explore solar estimates, compare sample packages, and track quote requests. It is not a real installer or quotation service.', related: ['calculator', 'illustrative-data'] },
  { id: 'calculator', question: 'How is the estimate calculated?', answer: 'It estimates panel count from the sample roof-area rule, then calculates sample system capacity, monthly generation, savings, cost, and payback. The assumptions are fictional and are displayed with the result.', related: ['illustrative-data', 'pdf'] },
  { id: 'illustrative-data', question: 'Are the prices and savings real?', answer: 'Package prices and calculator results use sample values. They are not current Jalgaon prices, utility tariffs, subsidy figures, or offers from a solar company.', related: ['calculator', 'pdf'] },
  { id: 'pdf', question: 'How do I save an estimate as PDF?', answer: 'Enter valid details in the calculator, choose “Show my estimate,” then select “Save estimate as PDF.” In the print window, choose “Save as PDF” as the destination.', related: ['calculator', 'illustrative-data'] },
  { id: 'form', question: 'Does the enquiry form contact anyone?', answer: 'A quote request is saved in the local MySQL database so it can be tracked. It does not contact an installer or send information to an external service.', related: ['about', 'privacy'] },
  { id: 'privacy', question: 'Is Lusi connected to a live AI?', answer: 'Not yet. Lusi shows prepared answers to the listed questions. No messages are sent to an AI service, and no chat is saved.', related: ['about', 'form'] }
];
const lusiBackdrop = document.querySelector('#lusi-backdrop');
const lusiLauncher = document.querySelector('#lusi-open');
const lusiClose = document.querySelector('#lusi-close');
const lusiQuestionList = document.querySelector('#lusi-questions');
const lusiAnswer = document.querySelector('#lusi-answer');
let lastLusiFocus = null;
let activeLusiQuestion = null;

const renderLusiQuestions = () => {
  lusiQuestionList.innerHTML = lusiQuestions.map((item) => `<button class="lusi-question" type="button" data-lusi-question="${item.id}" aria-expanded="${activeLusiQuestion === item.id}" aria-controls="lusi-answer"><span>${item.question}</span><span class="lusi-question-arrow" aria-hidden="true">${activeLusiQuestion === item.id ? '−' : '+'}</span></button>`).join('');
};
const showLusiAnswer = (id) => {
  const item = lusiQuestions.find((question) => question.id === id);
  if (!item) return;
  activeLusiQuestion = item.id;
  renderLusiQuestions();
  lusiQuestionList.querySelector(`[data-lusi-question="${item.id}"]`)?.focus();
  const relatedQuestions = item.related.map((relatedId) => lusiQuestions.find((question) => question.id === relatedId)).filter(Boolean);
  lusiAnswer.innerHTML = `<p>${item.answer}</p><div class="lusi-related"><span>RELATED QUESTIONS</span>${relatedQuestions.map((related) => `<button type="button" data-lusi-question="${related.id}">${related.question} <span aria-hidden="true">→</span></button>`).join('')}</div>`;
};
renderLusiQuestions();
lusiLauncher.addEventListener('click', () => {
  lastLusiFocus = document.activeElement;
  lusiBackdrop.hidden = false;
  document.body.classList.add('lusi-open');
  lusiClose.focus();
});
const closeLusi = () => {
  lusiBackdrop.hidden = true;
  document.body.classList.remove('lusi-open');
  if (lastLusiFocus instanceof HTMLElement) lastLusiFocus.focus();
};
lusiClose.addEventListener('click', closeLusi);
lusiBackdrop.addEventListener('click', (event) => { if (event.target === lusiBackdrop) closeLusi(); });
lusiQuestionList.addEventListener('click', (event) => {
  const questionButton = event.target.closest('[data-lusi-question]');
  if (questionButton) showLusiAnswer(questionButton.dataset.lusiQuestion);
});
lusiAnswer.addEventListener('click', (event) => {
  const questionButton = event.target.closest('[data-lusi-question]');
  if (questionButton) showLusiAnswer(questionButton.dataset.lusiQuestion);
});
document.addEventListener('keydown', (event) => {
  if (lusiBackdrop.hidden) return;
  if (event.key === 'Escape') { closeLusi(); return; }
  if (event.key !== 'Tab') return;
  const focusable = [...lusiBackdrop.querySelectorAll('button:not([disabled])')];
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});
