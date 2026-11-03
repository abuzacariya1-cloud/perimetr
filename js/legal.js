/* =====================================================================
   Страницы «Политика конфиденциальности» и «Согласие»:
   подставляет название, реквизиты и контакты из config.js
   ===================================================================== */
(() => {
  'use strict';

  const S = window.SITE;
  if (!S) return;

  const getPath = (path) => path.split('.').reduce((obj, key) => (obj == null ? undefined : obj[key]), S);

  document.querySelectorAll('[data-text]').forEach((el) => {
    const value = getPath(el.dataset.text);
    if (value != null && value !== '') el.textContent = value;
  });
  document.querySelectorAll('[data-email-link]').forEach((a) => { a.href = `mailto:${S.company.email || ''}`; });
  document.querySelectorAll('[data-phone-link]').forEach((a) => { a.href = `tel:${String(S.company.phone || '').replace(/[^\d+]/g, '')}`; });
  document.querySelectorAll('[data-privacy-link]').forEach((a) => { a.href = (S.legal && S.legal.privacyUrl) || 'privacy.html'; });
  document.querySelectorAll('[data-consent-link]').forEach((a) => { a.href = (S.legal && S.legal.consentUrl) || 'consent.html'; });
  document.querySelectorAll('[data-site-link]').forEach((a) => {
    const url = (S.legal && S.legal.siteUrl) || location.origin;
    a.href = url;
    a.textContent = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  });
  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });

  document.title = document.title.replace('{brand}', S.brand.name);

  const icon = (name) => {
    const ic = window.ICONS && window.ICONS[name];
    return ic ? `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${ic.body}</svg>` : '';
  };
  document.querySelectorAll('[data-icon]').forEach((el) => { el.outerHTML = icon(el.dataset.icon); });
})();
