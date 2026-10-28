'use strict';
// Set the verified business WhatsApp number here, with country code and digits only.
const BUSINESS = Object.freeze({ whatsapp: '27827638437' });
const $ = (selector) => document.querySelector(selector);
const menu = $('.menu-toggle');
menu.addEventListener('click', () => {
  const expanded = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(expanded));
  menu.setAttribute('aria-label', expanded ? 'Close navigation' : 'Open navigation');
  $('#navigation').classList.toggle('is-open', expanded);
});
$('#navigation').addEventListener('click', (event) => {
  if (!event.target.closest('a')) return;
  menu.setAttribute('aria-expanded', 'false');
  menu.setAttribute('aria-label', 'Open navigation');
  $('#navigation').classList.remove('is-open');
});
document.querySelectorAll('[data-service]').forEach(link => link.addEventListener('click', () => {
  $('#quote-form select').value = link.dataset.service;
}));
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
if (!motionQuery.matches && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
  }), { threshold: 0.08 });
  document.documentElement.classList.add('js-motion');
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}
$('#year').textContent = new Date().getFullYear();
const panel = $('#assistant');
let previousFocus;
function openAssistant() { previousFocus = document.activeElement; panel.hidden = false; $('#chat-input').focus(); }
function closeAssistant() { panel.hidden = true; previousFocus?.focus(); }
document.querySelectorAll('.assistant-open').forEach(button => button.addEventListener('click', openAssistant));
$('#chat-close').addEventListener('click', closeAssistant);
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !panel.hidden) closeAssistant(); });
function answerFor(input) {
  const text = input.toLowerCase();
  if (/price|cost|quote|budget|rand|how much/.test(text)) return 'A quote depends on your appliances, energy use and property. Use “Get a free quote” to prepare an enquiry with your location and requirements. This demo does not provide confirmed pricing.';
  if (/certificate|compliance|\bcoc\b/.test(text)) return 'Pro Bright lists electrical compliance services. An inspection is needed to assess the installation and any work required before certification. Select “Certificate of compliance” in the enquiry form.';
  if (/backup|battery|inverter|load.?shedding/.test(text)) return 'An inverter and battery can support selected essentials during an outage. Think about the appliances you need and how long they must run. The team can assess the capacity needed and future solar compatibility.';
  if (/solar|panel|sun/.test(text)) return 'Solar panels turn sunlight into electricity. The right system depends on roof space, daytime consumption and backup requirements. Prepare an enquiry with your electricity usage and location so the team can assess your needs.';
  if (/wire|electri|repair|fault/.test(text)) return 'You can enquire about electrical installations, repairs and compliance. Describe the work in the quote form. If there is sparking, smoke or exposed live wiring, keep clear and contact a qualified electrician; this demo cannot dispatch help.';
  if (/contact|whatsapp|phone|number|human/.test(text)) return BUSINESS.whatsapp ? 'Use the green WhatsApp button to start a conversation with the team. A message is only sent when you choose to send it in WhatsApp.' : 'The client’s WhatsApp number has not been added yet. You can prepare and copy your enquiry using the contact form. This is a website demonstration.';
  if (/hello|\bhi\b|\bhey\b/.test(text)) return 'Hello! ☀️ Are you exploring solar, battery backup, electrical work or a quote?';
  if (/area|where|location|rustenburg/.test(text)) return 'Pro Bright appears in Rustenburg service listings. Include your suburb or town in your enquiry so the team can confirm coverage for your property.';
  if (/size|kw|kwh|capacity/.test(text)) return 'Sizing needs an appliance list, running and starting loads, and desired backup hours. Share your recent electricity usage and essentials with the team for a tailored assessment.';
  return 'I can give guided demo answers about solar, battery backup, electrical compliance and quote requests. For project-specific advice, use the enquiry form. I’m a scripted demo assistant, not a live AI or team member.';
}
function addMessage(text, role) { const bubble = document.createElement('div'); bubble.className = `message ${role}`; bubble.textContent = text; $('#chat-messages').append(bubble); $('#chat-messages').scrollTop = $('#chat-messages').scrollHeight; }
function ask(text) { const clean = text.trim(); if (!clean) return; addMessage(clean, 'user'); addMessage(answerFor(clean), 'bot'); }
$('#chat-form').addEventListener('submit', event => { event.preventDefault(); ask($('#chat-input').value); $('#chat-input').value = ''; });
document.querySelectorAll('[data-question]').forEach(button => button.addEventListener('click', () => ask(button.dataset.question)));
const dialog = $('#enquiry-dialog');
function prepareEnquiry(message, isWhatsApp = false) {
  $('#prepared-message').value = message;
  $('#dialog-title').textContent = isWhatsApp ? 'Let’s connect on WhatsApp.' : 'Your enquiry is ready.';
  $('#dialog-info').textContent = BUSINESS.whatsapp ? 'Review your message, then open WhatsApp to send it to Pro Bright.' : 'This demo is waiting for the client’s WhatsApp number. Copy your message for now. No enquiry has been sent.';
  const send = $('#send-whatsapp');
  send.hidden = !BUSINESS.whatsapp;
  if (BUSINESS.whatsapp) send.href = `https://wa.me/${BUSINESS.whatsapp}?text=${encodeURIComponent(message)}`;
  $('#copy-status').textContent = '';
  dialog.showModal();
}
$('#quote-form').addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  prepareEnquiry(`Hi Pro Bright! I’d like to enquire about ${data.get('service')}.\n\nName: ${data.get('name')}\nContact: ${data.get('phone')}\n\nProject: ${data.get('message')}`);
});
$('#whatsapp-button').addEventListener('click', () => prepareEnquiry('Hi Pro Bright! I’m interested in your solar and electrical services. Can you help me with a quote?', true));
$('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
$('#copy-message').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText($('#prepared-message').value); $('#copy-status').textContent = 'Message copied. You can paste it into your preferred messaging app.'; }
  catch { $('#prepared-message').focus(); $('#prepared-message').select(); $('#copy-status').textContent = 'Your message is selected. Use your device’s Copy command.'; }
});
