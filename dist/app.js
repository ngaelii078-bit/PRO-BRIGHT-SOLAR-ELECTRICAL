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
initMotion();

function initMotion() {
  const root = document.documentElement;
  const headings = [...document.querySelectorAll('main h1, main h2')];
  // Split text nodes only: line breaks, emphasis and colour spans stay intact.
  const groups = headings.map(heading => {
    const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    heading.setAttribute('aria-label', nodes.map(node => node.textContent.trim()).filter(Boolean).join(' '));
    let index = 0;
    nodes.forEach(node => {
      const fragment = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).filter(Boolean).forEach(part => {
        if (/^\s+$/.test(part)) { fragment.append(document.createTextNode(part)); return; }
        const mask = document.createElement('span');
        mask.className = 'word-mask';
        mask.setAttribute('aria-hidden', 'true');
        const word = document.createElement('span');
        word.className = 'reveal-word';
        word.style.setProperty('--word-index', index++);
        word.textContent = part;
        mask.append(word);
        fragment.append(mask);
      });
      node.replaceWith(fragment);
    });
    heading.classList.add('word-heading');
    // Avoid fading the entire parent while its individual words are revealing.
    const parentReveal = heading.closest('.reveal');
    parentReveal?.classList.remove('reveal');
    return { heading, words: [...heading.querySelectorAll('.reveal-word')], hero: heading.tagName === 'H1', top: 0, height: 0, current: null };
  });
  const scrollGroups = groups.filter(group => !group.hero);
  const progress = document.createElement('div');
  progress.className = 'scroll-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.append(progress);
  let frame = 0;
  let viewport = window.innerHeight;
  let pageRange = 1;
  let revealObserver;
  const clamp = value => Math.max(0, Math.min(1, value));
  function measure() {
    viewport = window.innerHeight;
    pageRange = Math.max(1, root.scrollHeight - viewport);
    scrollGroups.forEach(group => { const rect = group.heading.getBoundingClientRect(); group.top = rect.top + window.scrollY; group.height = rect.height; });
    schedule();
  }
  function render() {
    frame = 0;
    if (motionQuery.matches || document.hidden) return;
    const scroll = window.scrollY;
    let moving = false;
    scrollGroups.forEach(group => {
      // The whole word sequence unfolds between 91% and 43% of viewport height.
      const start = group.top - viewport * .91;
      const range = viewport * .48 + Math.min(group.height * .35, 90);
      const target = clamp((scroll - start) / range);
      if (group.current === null) group.current = target;
      const delta = target - group.current;
      group.current = Math.abs(delta) < .0008 ? target : group.current + delta * .13;
      if (group.current !== target) moving = true;
      group.words.forEach((word, index) => {
        const stagger = group.words.length === 1 ? 0 : (index / (group.words.length - 1)) * .67;
        const local = clamp((group.current - stagger) / .33);
        const eased = 1 - Math.pow(1 - local, 3);
        word.style.opacity = String(.12 + eased * .88);
        word.style.transform = `translate3d(0,${((1 - eased) * 28).toFixed(2)}px,0)`;
      });
    });
    progress.style.transform = `scaleX(${clamp(scroll / pageRange)})`;
    if (moving) schedule();
  }
  function schedule() { if (!frame && !motionQuery.matches) frame = requestAnimationFrame(render); }
  function configure() {
    cancelAnimationFrame(frame); frame = 0;
    revealObserver?.disconnect();
    root.classList.toggle('motion-ready', !motionQuery.matches);
    root.classList.toggle('js-motion', !motionQuery.matches && 'IntersectionObserver' in window);
    if (motionQuery.matches) {
      scrollGroups.forEach(group => group.words.forEach(word => { word.style.removeProperty('opacity'); word.style.removeProperty('transform'); }));
      return;
    }
    if ('IntersectionObserver' in window) {
      revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('visible'); revealObserver.unobserve(entry.target); }
      }), { threshold: .1 });
      document.querySelectorAll('.reveal').forEach((el, index) => {
        el.style.transitionDelay = `${(index % 3) * 85}ms`;
        revealObserver.observe(el);
      });
    }
    measure();
  }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', measure, { passive: true });
  window.addEventListener('load', measure, { once: true });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) measure(); });
  motionQuery.addEventListener('change', configure);
  // Font swaps and image loading must not move the reveal's cached scroll positions.
  document.fonts?.ready.then(measure);
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(document.querySelector('main'));
  configure();
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
