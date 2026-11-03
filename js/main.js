/* =====================================================================
   ПЕРИМЕТР — логика сайта
   Тексты, контакты и цены берутся из config.js — здесь их менять не нужно.
   ===================================================================== */
(() => {
  'use strict';

  const S = window.SITE;
  const ICONS = window.ICONS || {};
  const html = document.documentElement;

  if (!S) {
    console.error('Не найден файл настроек config.js');
    html.classList.remove('js-anim');
    return;
  }

  /* ---------- Помощники ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none)').matches;

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
  const getPath = (path) => path.split('.').reduce((obj, key) => (obj == null ? undefined : obj[key]), S);
  const pad2 = (n) => String(n).padStart(2, '0');
  const formatNumber = (n) => Number(n).toLocaleString('ru-RU');

  function icon(name, extraClass = '') {
    const ic = ICONS[name];
    if (!ic) return '';
    const cls = ['ico', ic.fill ? 'ico--fill' : '', extraClass].filter(Boolean).join(' ');
    return `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ic.body}</svg>`;
  }

  /* Пустой <span data-icon="..."> заменяется самой иконкой,
     у остальных элементов иконка добавляется внутрь. */
  function renderIcons(root = document) {
    $$('[data-icon]', root).forEach((el) => {
      const svg = icon(el.dataset.icon);
      el.removeAttribute('data-icon');
      if (!svg) return;
      if (el.tagName === 'SPAN' && !el.className) el.outerHTML = svg;
      else el.insertAdjacentHTML('beforeend', svg);
    });
  }

  /* ---------- Телефон и мессенджеры ---------- */
  const phoneHref = 'tel:' + String(S.company.phone || '').replace(/[^\d+]/g, '');

  function messengerHref(m) {
    const text = S.messengerText ? encodeURIComponent(S.messengerText) : '';
    if (m.id === 'whatsapp' && m.phone) {
      return `https://wa.me/${String(m.phone).replace(/\D/g, '')}${text ? '?text=' + text : ''}`;
    }
    if (m.id === 'telegram' && m.username) {
      return `https://t.me/${String(m.username).replace(/^@/, '')}${text ? '?text=' + text : ''}`;
    }
    return m.url || '';
  }
  const messengerIcon = (id) => ({ whatsapp: 'whatsapp', telegram: 'telegram', vk: 'vk' }[id] || 'message-circle');
  const messengers = (S.messengers || []).filter((m) => m.enabled && messengerHref(m));

  /* ---------- Подстановка текстов из config.js ---------- */
  $$('[data-text]').forEach((el) => {
    const value = getPath(el.dataset.text);
    if (value != null) el.textContent = value;
  });
  // *слово* в тексте становится акцентным (курсив, бронза)
  const accentHtml = (text) => escapeHtml(text).replace(/\*([^*]+)\*/g, '<em>$1</em>');
  $$('[data-accent]').forEach((el) => {
    const value = getPath(el.dataset.accent);
    if (value != null) el.innerHTML = accentHtml(value);
  });
  $$('[data-phone-link]').forEach((a) => { a.href = phoneHref; });
  $$('[data-consent-link]').forEach((a) => { a.href = (S.legal && S.legal.consentUrl) || '#'; });
  $$('[data-privacy-link]').forEach((a) => { a.href = (S.legal && S.legal.privacyUrl) || '#'; });
  $$('[data-email-link]').forEach((a) => { a.href = `mailto:${S.company.email || ''}`; });
  $$('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });

  // Маршрут и карта по координатам из config.js
  const coords = S.company.coords || {};
  if (coords.lat && coords.lon) {
    const point = `${coords.lon},${coords.lat}`;
    $$('[data-route-link]').forEach((a) => { a.href = `https://yandex.ru/maps/?rtext=~${coords.lat},${coords.lon}&rtt=auto`; });
    $$('[data-map]').forEach((frame) => {
      frame.src = `https://yandex.ru/map-widget/v1/?ll=${encodeURIComponent(point)}&z=${Number(S.company.mapZoom) || 14}&pt=${encodeURIComponent(`${point},pm2dgl`)}`;
    });
  } else {
    $$('[data-route-link]').forEach((a) => { a.href = `https://yandex.ru/maps/?text=${encodeURIComponent(S.company.address || '')}`; });
  }
  // Карта «оживает» по нажатию, чтобы не перехватывать прокрутку страницы
  $$('[data-map-shield]').forEach((shield) => {
    shield.addEventListener('click', () => shield.closest('.map').classList.add('is-active'));
  });

  /* ---------- Меню ---------- */
  const nav = S.nav || [];
  const navList = $('[data-render="nav"]');
  if (navList) {
    navList.innerHTML = nav.map((item) => (
      `<li><a class="nav__link" href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a></li>`
    )).join('');
  }
  const footerNav = $('[data-render="footerNav"]');
  if (footerNav) {
    footerNav.innerHTML = nav.map((item) => `<li><a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a></li>`).join('');
  }
  const menuList = $('[data-render="menu"]');
  if (menuList) {
    menuList.innerHTML = nav.map((item, i) => (
      `<li><a class="menu__link" style="--i:${i}" href="${escapeHtml(item.href)}">${escapeHtml(item.label)}${icon('arrow-right')}</a></li>`
    )).join('');
  }

  /* ---------- Кнопки мессенджеров ---------- */
  const messengersHtml = messengers.map((m) => (
    `<a class="messenger messenger--${escapeHtml(m.id)}" href="${escapeHtml(messengerHref(m))}" target="_blank" rel="noopener">` +
    `${icon(messengerIcon(m.id))}<span>${escapeHtml(m.label)}</span></a>`
  )).join('');
  $$('[data-render="messengers"]').forEach((el) => { el.innerHTML = messengersHtml; });

  const floatBar = $('[data-render="floatBar"]');
  if (floatBar) {
    floatBar.innerHTML =
      `<a class="float-bar__call" href="${phoneHref}">${icon('phone')}<span>Позвонить</span></a>` +
      messengers.slice(0, 2).map((m) => (
        `<a class="float-bar__icon float-bar__icon--${escapeHtml(m.id)}" href="${escapeHtml(messengerHref(m))}" target="_blank" rel="noopener" aria-label="Написать в ${escapeHtml(m.label)}">${icon(messengerIcon(m.id))}</a>`
      )).join('');
  }

  /* ---------- Первый экран: заголовок, слайды, цифры ---------- */
  const hero = S.hero || {};
  const slides = hero.slides || [];

  // *слово* в заголовке становится акцентным (курсив, бронза)
  const titleEl = $('[data-render="heroTitle"]');
  if (titleEl) {
    const words = (text) => text.split(/\s+/).filter(Boolean)
      .map((w) => `<span class="w"><span>${escapeHtml(w)}</span></span>`).join(' ');
    titleEl.innerHTML = String(hero.title || '').split(/(\*[^*]+\*)/).filter((p) => p.trim())
      .map((part) => (/^\*[^*]+\*$/.test(part) ? `<em>${words(part.slice(1, -1))}</em>` : words(part)))
      .join(' ');
  }

  const slidesEl = $('[data-render="heroSlides"]');
  if (slidesEl) {
    // Первое фото грузится сразу, остальные — после загрузки страницы
    slidesEl.innerHTML = slides.map((s, i) => {
      const a = i === 0 ? '' : 'data-';
      const img = escapeHtml(s.image);
      return `<div class="swiper-slide hero__slide">
          <picture>
            <source media="(max-width: 767px)" ${a}srcset="${img}-m.webp">
            <img ${a}srcset="${img}-1280.webp 1280w, ${img}-1920.webp 1920w" sizes="100vw" ${a}src="${img}-1920.webp"
                 alt="${escapeHtml(s.alt)}" width="1920" height="1200" decoding="async" ${i === 0 ? 'fetchpriority="high"' : ''}>
          </picture>
        </div>`;
    }).join('');
  }

  const statsEl = $('[data-render="heroStats"]');
  if (statsEl) {
    statsEl.innerHTML = (hero.stats || []).map((st) => (
      `<li class="stat">${icon(st.icon, 'stat__icon')}<div>` +
      `<span class="stat__value"><span data-count="${Number(st.value) || 0}">${formatNumber(st.value)}</span>` +
      `<span class="stat__suffix">${escapeHtml(st.suffix || '')}</span></span>` +
      `<span class="stat__label">${escapeHtml(st.label)}</span></div></li>`
    )).join('');
  }

  const advEl = $('[data-render="advantages"]');
  if (advEl) {
    advEl.innerHTML = (S.advantages || []).map((a) => (
      `<li class="adv__item" data-reveal><span class="icon-box">${icon(a.icon)}</span>` +
      `<div><h3 class="adv__title">${escapeHtml(a.title)}</h3><p class="adv__text">${escapeHtml(a.text)}</p></div></li>`
    )).join('');
  }

  renderIcons();

  /* ---------- Блокировка прокрутки под окнами ---------- */
  let lockCount = 0;
  let lockY = 0;

  function lockScroll() {
    if (lockCount++ > 0) return;
    lockY = window.scrollY;
    const scrollbar = window.innerWidth - html.clientWidth;
    Object.assign(document.body.style, {
      position: 'fixed', top: `-${lockY}px`, left: '0', right: '0', width: '100%',
      paddingRight: scrollbar > 0 ? `${scrollbar}px` : '',
    });
  }

  function unlockScroll() {
    if (lockCount === 0 || --lockCount > 0) return;
    Object.assign(document.body.style, { position: '', top: '', left: '', right: '', width: '', paddingRight: '' });
    html.style.scrollBehavior = 'auto';
    window.scrollTo(0, lockY);
    html.style.scrollBehavior = '';
  }

  /* ---------- Шапка ---------- */
  const header = $('#header');
  const onScroll = () => {
    if (lockCount > 0) return;
    header.classList.toggle('is-scrolled', window.scrollY > 24);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Мобильное меню ---------- */
  const burger = $('.burger');
  const menu = $('#menu');
  let modalOpen = false;
  let projectOpen = false;
  let pastHeroButtons = false;

  function updateFloatBar() {
    if (!floatBar) return;
    const hidden = modalOpen || projectOpen || menu.classList.contains('is-open');
    floatBar.classList.toggle('is-visible', pastHeroButtons && !hidden);
  }

  function setMenu(open) {
    if (open === menu.classList.contains('is-open')) return;
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    menu.inert = !open;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    header.classList.toggle('is-menu-open', open);
    if (open) lockScroll(); else unlockScroll();
    updateFloatBar();
  }

  menu.inert = true;
  burger.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
  window.matchMedia('(min-width: 1280px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

  /* ---------- Плавная прокрутка по якорям ---------- */
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute('href');
    if (id.length < 2) return;
    const target = document.getElementById(id.slice(1));
    e.preventDefault();
    setMenu(false);
    if (!target) return;
    requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', id === '#top' ? location.pathname + location.search : id);
    });
  });

  // Подсветка пункта меню текущего раздела
  const navLinks = $$('.nav__link');
  const navSections = navLinks.map((a) => document.getElementById(a.getAttribute('href').slice(1))).filter(Boolean);
  if (navSections.length && 'IntersectionObserver' in window) {
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${entry.target.id}`));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navSections.forEach((s) => navObserver.observe(s));
  }

  /* ---------- Слайдер первого экрана ---------- */
  const heroSection = $('.hero');
  const card = $('.pcard');
  const cardEls = {
    index: $('[data-card="index"]'),
    total: $('[data-card="total"]'),
    type: $('[data-card="type"]'),
    title: $('[data-card="title"]'),
    text: $('[data-card="text"]'),
    tags: $('[data-card="tags"]'),
  };
  let heroSwiper = null;
  let cardTimer = 0;

  function fillCard(i) {
    const s = slides[i];
    if (!s) return;
    cardEls.index.textContent = pad2(i + 1);
    cardEls.total.textContent = pad2(slides.length);
    cardEls.type.textContent = s.type || '';
    cardEls.title.textContent = s.title || '';
    cardEls.text.textContent = s.text || '';
    cardEls.tags.innerHTML = (s.tags || []).map((t) => `<li class="tag">${escapeHtml(t)}</li>`).join('');
  }

  function changeCard(i) {
    if (reduceMotion) { fillCard(i); return; }
    card.classList.add('is-changing');
    clearTimeout(cardTimer);
    cardTimer = setTimeout(() => {
      fillCard(i);
      card.classList.remove('is-changing');
    }, 260);
  }

  // Фото слайдов подгружаются по мере надобности: текущий, следующий и предыдущий
  function loadSlide(i) {
    const all = $$('.hero__slide');
    const slide = all[(i + all.length) % all.length];
    if (!slide) return;
    $$('[data-srcset], [data-src]', slide).forEach((el) => {
      if (el.dataset.srcset) { el.srcset = el.dataset.srcset; el.removeAttribute('data-srcset'); }
      if (el.dataset.src) { el.src = el.dataset.src; el.removeAttribute('data-src'); }
    });
  }
  const loadAround = (i) => { loadSlide(i); loadSlide(i + 1); loadSlide(i - 1); };

  fillCard(0);
  if (document.readyState === 'complete') setTimeout(() => loadAround(0), 300);
  else window.addEventListener('load', () => setTimeout(() => loadAround(0), 300), { once: true });

  const progressBar = $('.pcard__progress span');
  const prevBtn = $('.hero-prev');
  const nextBtn = $('.hero-next');

  if (window.Swiper && slides.length > 1) {
    heroSwiper = new window.Swiper('.hero__slider', {
      effect: 'fade',
      fadeEffect: { crossFade: true },
      speed: reduceMotion ? 0 : 1400,
      rewind: true,
      allowTouchMove: false,
      autoplay: reduceMotion ? false : {
        delay: (Number(hero.autoplaySeconds) || 7) * 1000,
        disableOnInteraction: false,
      },
      navigation: { prevEl: prevBtn, nextEl: nextBtn },
      keyboard: { enabled: true, onlyInViewport: true },
      a11y: { enabled: true, prevSlideMessage: 'Предыдущий проект', nextSlideMessage: 'Следующий проект' },
      on: {
        slideChange(sw) {
          loadAround(sw.realIndex);
          changeCard(sw.realIndex);
        },
        autoplayTimeLeft(sw, timeLeft, progress) {
          if (progressBar) progressBar.style.transform = `scaleX(${1 - progress})`;
        },
      },
    });

    // Пауза, пока курсор на карточке проекта
    card.addEventListener('mouseenter', () => heroSwiper.autoplay && heroSwiper.autoplay.pause());
    card.addEventListener('mouseleave', () => heroSwiper.autoplay && heroSwiper.autoplay.resume());

    // Пауза, когда первый экран прокручен
    if ('IntersectionObserver' in window && !reduceMotion) {
      new IntersectionObserver(([entry]) => {
        if (!heroSwiper.autoplay) return;
        if (entry.isIntersecting) heroSwiper.autoplay.resume();
        else heroSwiper.autoplay.pause();
      }).observe(heroSection);
    }

    // Свайп по фото на телефоне
    let startX = 0;
    let startY = 0;
    let tracking = false;
    heroSection.addEventListener('touchstart', (e) => {
      tracking = !e.target.closest('a, button, input');
      if (!tracking) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });
    heroSection.addEventListener('touchend', (e) => {
      if (!tracking) return;
      tracking = false;
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        if (dx < 0) heroSwiper.slideNext(); else heroSwiper.slidePrev();
      }
    }, { passive: true });
  } else {
    if (prevBtn) prevBtn.hidden = true;
    if (nextBtn) nextBtn.hidden = true;
    if (progressBar) progressBar.parentElement.hidden = true;
  }

  /* ---------- Каталог: лента категорий и карточки ---------- */
  const catalog = S.catalog || {};
  const categories = catalog.categories || [];
  const tabsTrack = $('[data-render="catalogTabs"]');
  const cardsEl = $('[data-catalog="cards"]');
  const introEl = $('[data-catalog="intro"]');
  const catalogPanel = $('#catalog-panel');

  if (tabsTrack && cardsEl && categories.length) {
    tabsTrack.innerHTML = categories.map((cat, i) => (
      `<button class="ribbon__item" type="button" role="tab" id="catalog-tab-${i}" aria-controls="catalog-panel" ` +
      `aria-selected="false" tabindex="-1" data-index="${i}">${escapeHtml(cat.short || cat.name)}</button>`
    )).join('');

    const tabs = $$('.ribbon__item', tabsTrack);
    let current = -1;
    let renderToken = 0;

    const priceText = (item) => (
      `<span class="product__from">от</span>${formatNumber(item.price)} <span class="product__unit">${escapeHtml(item.unit || '₽')}</span>`
    );

    const productHtml = (cat, item) => {
      const img = escapeHtml(item.image);
      const specs = (item.specs || []).map((s) => `<li>${escapeHtml(s)}</li>`).join('');
      return `<article class="product">
          <div class="product__media">
            <img src="${img}-560.webp" srcset="${img}-560.webp 560w, ${img}-900.webp 900w"
                 sizes="(max-width: 767px) 84vw, (max-width: 1023px) 46vw, 420px"
                 alt="${escapeHtml(item.alt || `${cat.name}: ${item.title}`)}" width="900" height="675" loading="lazy" decoding="async">
            ${item.badge ? `<span class="product__badge">${escapeHtml(item.badge)}</span>` : ''}
          </div>
          <div class="product__body">
            <h3 class="product__title">${escapeHtml(item.title)}</h3>
            <p class="product__text">${escapeHtml(item.text)}</p>
            ${specs ? `<ul class="product__specs">${specs}</ul>` : ''}
            <div class="product__footer">
              <p class="product__price">${priceText(item)}</p>
              <button class="btn btn--outline btn--sm" type="button" data-lead="price"
                      data-lead-detail="${escapeHtml(`${cat.name} — ${item.title}`)}">${escapeHtml(catalog.priceButton || 'Узнать цену')}</button>
            </div>
          </div>
        </article>`;
    };

    // Фото плавно проявляются, когда загрузятся
    const watchImages = (root) => {
      $$('img', root).forEach((img) => {
        if (img.complete && img.naturalWidth) img.classList.add('is-loaded');
        else img.addEventListener('load', () => img.classList.add('is-loaded'), { once: true });
      });
    };

    const renderCards = (index, animate) => {
      const cat = categories[index];
      const token = ++renderToken;
      const gsap = window.gsap;
      const useAnim = animate && gsap && !reduceMotion;

      const swap = () => {
        if (token !== renderToken) return;
        introEl.textContent = cat.intro || '';
        cardsEl.innerHTML = (cat.items || []).map((item) => productHtml(cat, item)).join('');
        cardsEl.scrollLeft = 0;
        catalogPanel.setAttribute('aria-labelledby', tabs[index].id);
        watchImages(cardsEl);
        if (useAnim) {
          gsap.fromTo(introEl, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' });
          gsap.fromTo(cardsEl.children, { opacity: 0, y: 26 }, {
            opacity: 1, y: 0, duration: 0.75, stagger: 0.08, ease: 'power3.out', clearProps: 'transform',
          });
        }
      };

      if (useAnim && cardsEl.children.length) {
        gsap.to(introEl, { opacity: 0, y: -6, duration: 0.22, ease: 'power2.in' });
        gsap.to(cardsEl.children, {
          opacity: 0, y: -12, duration: 0.24, stagger: 0.03, ease: 'power2.in', onComplete: swap,
        });
      } else {
        swap();
      }
    };

    const applyTabs = (index) => {
      tabs.forEach((tab, i) => {
        const active = i === index;
        tab.classList.toggle('is-active', active);
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
        tab.dataset.dist = String(Math.min(Math.abs(i - index), 3));
      });
    };

    // Сначала без анимации узнаём, где окажется активная категория, потом плавно едем туда
    const scrollTargetFor = (index) => {
      tabsTrack.classList.add('is-measuring');
      applyTabs(index);
      const tab = tabs[index];
      const left = tab.offsetLeft + tab.offsetWidth / 2 - tabsTrack.clientWidth / 2;
      applyTabs(current < 0 ? index : current);
      void tabsTrack.offsetWidth;
      tabsTrack.classList.remove('is-measuring');
      return left;
    };

    const selectCategory = (index, { instant = false, focus = false } = {}) => {
      const next = (index + categories.length) % categories.length;
      const left = scrollTargetFor(next);
      requestAnimationFrame(() => {
        applyTabs(next);
        tabsTrack.scrollTo({ left, behavior: instant || reduceMotion ? 'auto' : 'smooth' });
      });
      if (focus) tabs[next].focus({ preventScroll: true });
      if (next !== current) renderCards(next, !instant);
      current = next;
    };

    tabsTrack.addEventListener('click', (e) => {
      const tab = e.target.closest('.ribbon__item');
      if (tab) selectCategory(Number(tab.dataset.index));
    });

    tabsTrack.addEventListener('keydown', (e) => {
      const moves = { ArrowRight: current + 1, ArrowLeft: current - 1, Home: 0, End: categories.length - 1 };
      if (!(e.key in moves)) return;
      e.preventDefault();
      selectCategory(moves[e.key], { focus: true });
    });

    $('.ribbon__arrow--prev').addEventListener('click', () => selectCategory(current - 1));
    $('.ribbon__arrow--next').addEventListener('click', () => selectCategory(current + 1));

    // После поворота экрана или изменения окна возвращаем активную категорию в центр
    let resizeTimer = 0;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const tab = tabs[current];
        tabsTrack.scrollTo({ left: tab.offsetLeft + tab.offsetWidth / 2 - tabsTrack.clientWidth / 2 });
      }, 150);
    });

    selectCategory(0, { instant: true });
  }

  /* ---------- Наши проекты: 3D-карусель ---------- */
  const projectsCfg = S.projects || {};
  const projects = projectsCfg.items || [];
  const projectsEl = $('[data-render="projects"]');
  const projectsProgress = $('.projects__progress span');
  let projectsSwiper = null;

  const projectTags = (p) => [p.type, p.material, p.size, p.term].filter(Boolean);

  const setProjectsProgress = (i) => {
    if (projectsProgress) projectsProgress.style.transform = `scaleX(${(i + 1) / projects.length})`;
  };

  if (projectsEl && projects.length) {
    projectsEl.innerHTML = projects.map((p, i) => (
      `<div class="swiper-slide project-slide" data-index="${i}">
        <article class="project">
          <img src="${escapeHtml(p.cover)}" alt="${escapeHtml(`${p.title}: ${p.work}`)}" width="800" height="1000" loading="lazy" decoding="async">
          <div class="project__shade" aria-hidden="true"></div>
          <span class="project__count" aria-hidden="true"><b>${pad2(i + 1)}</b> / ${pad2(projects.length)}</span>
          <span class="project__plus" aria-hidden="true">${icon('arrow-right')}</span>
          <div class="project__body">
            <p class="project__work">${escapeHtml(p.work)}</p>
            <h3 class="project__title">${escapeHtml(p.title)}</h3>
            <ul class="tags">${projectTags(p).map((t) => `<li class="tag tag--glass">${escapeHtml(t)}</li>`).join('')}</ul>
          </div>
          <button class="project__open" type="button" aria-label="Смотреть проект «${escapeHtml(p.title)}»"></button>
        </article>
      </div>`
    )).join('');

    setProjectsProgress(0);

    if (window.Swiper) {
      projectsSwiper = new window.Swiper('.projects__slider', {
        effect: 'coverflow',
        centeredSlides: true,
        slidesPerView: 'auto',
        loop: projects.length > 4,
        speed: reduceMotion ? 0 : 800,
        grabCursor: true,
        watchSlidesProgress: true,
        coverflowEffect: { rotate: 8, stretch: 0, depth: 170, modifier: 1, scale: 0.9, slideShadows: false },
        navigation: { prevEl: $('.projects-prev'), nextEl: $('.projects-next') },
        keyboard: { enabled: true, onlyInViewport: true },
        a11y: { enabled: true, prevSlideMessage: 'Предыдущий проект', nextSlideMessage: 'Следующий проект' },
        on: {
          slideChange(sw) { setProjectsProgress(sw.realIndex); },
          // Видны центральная карточка и по две с каждой стороны, дальние плавно гаснут
          progress(sw) {
            sw.slides.forEach((slide) => {
              const distance = Math.abs(slide.progress);
              slide.style.opacity = String(Math.max(0, Math.min(1, 2.7 - distance)));
              slide.style.pointerEvents = distance > 2.5 ? 'none' : '';
            });
          },
        },
      });
    }

    // Нажатие на центральную карточку открывает галерею, на боковую — подвигает её в центр
    projectsEl.addEventListener('click', (e) => {
      const button = e.target.closest('.project__open');
      if (!button) return;
      const slide = button.closest('.project-slide');
      const index = Number(slide.dataset.index);
      if (!projectsSwiper || slide.classList.contains('swiper-slide-active')) openProject(index);
      else projectsSwiper.slideToLoop(index);
    });
  }

  /* ---------- Окно с галереей проекта ---------- */
  const lightbox = $('#project-modal');
  const lbDialog = $('.lightbox__dialog', lightbox);
  const lb = (name) => $(`[data-lightbox="${name}"]`, lightbox);
  let lbSwiper = null;
  let lbLastFocus = null;
  let lbCloseTimer = 0;

  function setLightboxPhoto(k, total) {
    lb('count').textContent = `${pad2(k + 1)} / ${pad2(total)}`;
    $$('.lightbox__thumb', lightbox).forEach((t, i) => {
      t.classList.toggle('is-active', i === k);
      if (i === k) t.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    });
  }

  function fillLightbox(index) {
    const p = projects[index];
    const photos = (p.gallery && p.gallery.length ? p.gallery : [p.cover]).filter(Boolean);
    lb('number').textContent = `Проект ${pad2(index + 1)} / ${pad2(projects.length)}`;
    lb('title').textContent = p.title || '';
    lb('work').textContent = p.work || '';
    lb('text').textContent = p.text || '';
    ['type', 'material', 'size', 'term'].forEach((key) => { lb(key).textContent = p[key] || '—'; });
    lb('cta').dataset.leadDetail = `${p.title} — ${p.work}`;

    lb('slides').innerHTML = photos.map((src, k) => (
      `<div class="swiper-slide lightbox__slide"><img src="${escapeHtml(src)}" alt="${escapeHtml(`${p.title} — фото ${k + 1}`)}" decoding="async"></div>`
    )).join('');
    lb('thumbs').innerHTML = photos.length > 1 ? photos.map((src, k) => (
      `<button class="lightbox__thumb" type="button" aria-label="Фото ${k + 1}" data-k="${k}"><img src="${escapeHtml(src)}" alt=""></button>`
    )).join('') : '';
    lightbox.classList.toggle('is-single', photos.length < 2);

    if (window.Swiper) {
      if (!lbSwiper) {
        lbSwiper = new window.Swiper('.lightbox__slider', {
          speed: reduceMotion ? 0 : 600,
          navigation: { prevEl: $('.lightbox__arrow--prev'), nextEl: $('.lightbox__arrow--next') },
          a11y: { enabled: true, prevSlideMessage: 'Предыдущее фото', nextSlideMessage: 'Следующее фото' },
          on: {
            slideChange(sw) { setLightboxPhoto(sw.activeIndex, sw.slides.length); },
          },
        });
      } else {
        lbSwiper.update();
        lbSwiper.slideTo(0, 0);
      }
    }
    setLightboxPhoto(0, photos.length);
  }

  function openProject(index) {
    if (!projects[index]) return;
    setMenu(false);
    lbLastFocus = document.activeElement;
    clearTimeout(lbCloseTimer);
    lightbox.hidden = false;
    fillLightbox(index);
    lbDialog.scrollTop = 0;
    $('.lightbox__info', lightbox).scrollTop = 0;
    projectOpen = true;
    lockScroll();
    updateFloatBar();
    if (projectsSwiper && projectsSwiper.keyboard) projectsSwiper.keyboard.disable();
    requestAnimationFrame(() => requestAnimationFrame(() => lightbox.classList.add('is-open')));
    lbDialog.focus({ preventScroll: true });
  }

  function closeProject({ restoreFocus = true } = {}) {
    if (!projectOpen) return;
    projectOpen = false;
    lightbox.classList.remove('is-open');
    lbCloseTimer = setTimeout(() => { lightbox.hidden = true; }, reduceMotion ? 0 : 450);
    unlockScroll();
    updateFloatBar();
    if (projectsSwiper && projectsSwiper.keyboard) projectsSwiper.keyboard.enable();
    if (lbDialog.contains(document.activeElement)) document.activeElement.blur();
    if (restoreFocus && lbLastFocus && typeof lbLastFocus.focus === 'function') lbLastFocus.focus({ preventScroll: true });
  }

  lightbox.addEventListener('click', (e) => {
    if (e.target.closest('[data-lightbox-close]')) { closeProject(); return; }
    const thumb = e.target.closest('.lightbox__thumb');
    if (thumb && lbSwiper) lbSwiper.slideTo(Number(thumb.dataset.k));
  });

  // «Подробнее» на первом экране открывает проект, указанный у слайда в config.js
  const heroMore = $('.pcard__more');
  if (heroMore) {
    heroMore.addEventListener('click', (e) => {
      const slide = slides[heroSwiper ? heroSwiper.realIndex : 0];
      const number = Number(slide && slide.project);
      if (!number || !projects[number - 1]) return;
      e.preventDefault();
      e.stopPropagation();
      openProject(number - 1);
    });
  }

  /* ---------- Калькулятор стоимости ---------- */
  const calcCfg = S.calculator || {};
  const calcForm = $('#calc-form');

  // 1 день, 2 дня, 5 дней
  const plural = (n, one, few, many) => {
    const n10 = n % 10;
    const n100 = n % 100;
    if (n10 === 1 && n100 !== 11) return one;
    if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return few;
    return many;
  };

  if (calcForm) {
    const materials = calcCfg.fenceMaterials || [];
    const heights = calcCfg.heights || [];
    const gates = calcCfg.gates || [];
    const lengthCfg = Object.assign({ min: 5, max: 500, step: 5, default: 60 }, calcCfg.length);
    const spread = Object.assign({ from: 0.92, to: 1.12 }, calcCfg.range);

    const pillsHtml = (name, items, checked) => items.map((item, i) => (
      `<label class="pill"><input type="radio" name="${name}" value="${i}"${i === checked ? ' checked' : ''}>` +
      `<span>${escapeHtml(item.label || item.name)}</span></label>`
    )).join('');
    $('[data-render="calcMaterials"]').innerHTML = pillsHtml('material', materials, 0);
    $('[data-render="calcHeights"]').innerHTML = pillsHtml('height', heights, Math.min(Number(calcCfg.defaultHeight) || 0, heights.length - 1));
    $('[data-render="calcGates"]').innerHTML = pillsHtml('gate', gates, 0);

    const range = $('#calc-length');
    const lengthNum = $('#calc-length-num');
    [range, lengthNum].forEach((input) => {
      input.min = lengthCfg.min;
      input.max = lengthCfg.max;
      input.step = lengthCfg.step;
      input.value = lengthCfg.default;
    });
    lengthNum.step = 1;
    $('[data-calc="min-length"]').textContent = `${lengthCfg.min} м`;
    $('[data-calc="max-length"]').textContent = `${lengthCfg.max} м`;

    const out = {
      min: $('[data-calc="min"]'),
      max: $('[data-calc="max"]'),
      lines: $('[data-calc="lines"]'),
      days: $('[data-calc="days"]'),
      sticky: $('[data-calc="sticky"]'),
    };
    const roundThousand = (n) => Math.round(n / 1000) * 1000;
    const clampLength = (v) => Math.min(lengthCfg.max, Math.max(lengthCfg.min, Math.round(Number(v) || lengthCfg.min)));
    let lastResult = null;

    const getState = () => {
      const data = new FormData(calcForm);
      const kind = data.get('kind') || 'both';
      return {
        kind,
        fence: kind !== 'gates',
        gatesOn: kind !== 'fence',
        material: materials[Number(data.get('material'))] || materials[0],
        height: heights[Number(data.get('height'))] || heights[0] || { label: '2 м', k: 1 },
        gate: gates[Number(data.get('gate'))] || gates[0],
        automation: data.get('automation') === 'yes',
        wicket: data.get('wicket') === 'yes',
        length: clampLength(lengthNum.value),
      };
    };

    const compute = (st) => {
      const lines = [];
      if (st.fence && st.material) {
        lines.push([`Забор · ${st.material.name} · ${st.length} м × ${st.height.label}`, st.length * st.material.price * (Number(st.height.k) || 1)]);
      }
      if (st.gatesOn && st.gate) {
        lines.push([`Ворота · ${st.gate.name}`, st.gate.price]);
        if (st.automation) lines.push(['Автоматика', st.gate.automation]);
      }
      if (st.wicket) lines.push(['Калитка', Number(calcCfg.wicketPrice) || 0]);
      const total = lines.reduce((sum, line) => sum + line[1], 0);
      const fenceDays = st.fence ? Math.ceil(st.length / (Number(calcCfg.metersPerDay) || 40)) : 0;
      return {
        lines,
        min: roundThousand(total * spread.from),
        max: roundThousand(total * spread.to),
        days: Math.max(1, fenceDays + (st.gatesOn ? 1 : 0)),
      };
    };

    // Плавная смена цифр итога
    const shown = { min: 0, max: 0 };
    let frame = 0;
    const animateTotal = (min, max) => {
      cancelAnimationFrame(frame);
      const from = { min: shown.min, max: shown.max };
      const start = performance.now();
      const duration = reduceMotion || !from.max ? 0 : 500;
      const step = (now) => {
        const t = duration ? Math.min(1, (now - start) / duration) : 1;
        const eased = 1 - Math.pow(1 - t, 3);
        shown.min = from.min + (min - from.min) * eased;
        shown.max = from.max + (max - from.max) * eased;
        out.min.textContent = formatNumber(roundThousand(shown.min));
        out.max.textContent = formatNumber(roundThousand(shown.max));
        if (t < 1) frame = requestAnimationFrame(step);
      };
      step(start);
    };

    const update = () => {
      const st = getState();
      $$('[data-show]', calcForm).forEach((el) => {
        el.hidden = el.dataset.show === 'fence' ? !st.fence : !st.gatesOn;
      });
      range.style.setProperty('--p', `${((Number(range.value) - lengthCfg.min) / (lengthCfg.max - lengthCfg.min)) * 100}%`);

      const res = compute(st);
      out.lines.innerHTML = res.lines.map(([label, cost]) => (
        `<li><span>${escapeHtml(label)}</span><span>${formatNumber(Math.round(cost))} ₽</span></li>`
      )).join('');
      out.days.textContent = `Монтаж ≈ ${res.days} ${plural(res.days, 'день', 'дня', 'дней')} после изготовления`;
      out.sticky.textContent = `${formatNumber(Math.round(res.min / 1000))}–${formatNumber(Math.round(res.max / 1000))} тыс. ₽`;
      animateTotal(res.min, res.max);
      lastResult = { st, res };
    };

    calcForm.addEventListener('change', update);
    range.addEventListener('input', () => {
      lengthNum.value = range.value;
      update();
    });
    lengthNum.addEventListener('input', () => {
      const v = Number(lengthNum.value);
      if (v >= lengthCfg.min && v <= lengthCfg.max) {
        range.value = v;
        update();
      }
    });
    lengthNum.addEventListener('change', () => {
      const v = clampLength(lengthNum.value);
      lengthNum.value = v;
      range.value = v;
      update();
    });
    lengthNum.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); lengthNum.blur(); } });

    // «Получить точный расчёт»: все выбранные параметры уходят в заявку
    calcForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!lastResult) update();
      const { st, res } = lastResult;
      const parts = [{ fence: 'Забор', gates: 'Ворота', both: 'Забор + ворота' }[st.kind]];
      if (st.fence) parts.push(`${st.material.name}, ${st.length} м, высота ${st.height.label}`);
      if (st.gatesOn) parts.push(`ворота ${st.gate.name.toLowerCase()}, автоматика: ${st.automation ? 'нужна' : 'не нужна'}`);
      parts.push(`калитка: ${st.wicket ? 'нужна' : 'не нужна'}`);
      parts.push(`по калькулятору ${formatNumber(res.min)}–${formatNumber(res.max)} ₽`);
      fillRequestFromCalc(st, parts.join('; '));
    });

    update();
  }

  /* ---------- Как мы работаем ---------- */
  const stepsEl = $('[data-render="steps"]');
  if (stepsEl) {
    stepsEl.innerHTML = ((S.process && S.process.steps) || []).map((step, i) => (
      `<li class="step" data-reveal>
        <span class="step__num" aria-hidden="true">${pad2(i + 1)}</span>
        <span class="step__track" aria-hidden="true"><span class="step__dot"></span></span>
        <h3 class="step__title"><span class="visually-hidden">Шаг ${i + 1}. </span>${escapeHtml(step.title)}</h3>
        <p class="step__text">${escapeHtml(step.text)}</p>
        ${step.meta ? `<span class="step__meta">${escapeHtml(step.meta)}</span>` : ''}
      </li>`
    )).join('');
  }

  /* ---------- Отзывы ---------- */
  const reviewsCfg = S.reviews || {};
  const reviews = reviewsCfg.items || [];
  const initials = (name) => String(name || '')
    .replace(/[«»"]/g, '')
    .replace(/^(ООО|ОАО|АО|ИП|ЗАО)\s+/i, '')
    .split(/\s+/).filter(Boolean).slice(0, 2)
    .map((w) => w[0]).join('').toUpperCase();
  const avatarTone = (i) => ['', ' avatar--bronze', ' avatar--steel'][i % 3];
  const starsHtml = (rating) => Array.from({ length: 5 }, (_, i) => (
    icon('star', i < Math.round(Number(rating) || 5) ? '' : 'is-empty')
  )).join('');

  const proofAvatars = $('[data-render="proofAvatars"]');
  if (proofAvatars && reviews.length) {
    proofAvatars.innerHTML = reviews.slice(0, 4).map((r, i) => `<span class="avatar${avatarTone(i)}">${escapeHtml(initials(r.name))}</span>`).join('') +
      (reviews.length > 4 ? `<span class="avatar avatar--more">+${reviews.length - 4}</span>` : '');
  }
  const proofStars = $('[data-render="proofStars"]');
  if (proofStars) proofStars.innerHTML = starsHtml(5);

  const reviewsEl = $('[data-render="reviews"]');
  const reviewsProgress = $('.reviews__progress span');
  if (reviewsEl && reviews.length) {
    reviewsEl.innerHTML = reviews.map((r, i) => (
      `<div class="swiper-slide review-slide">
        <article class="review">
          <span class="stars" role="img" aria-label="Оценка ${Math.round(Number(r.rating) || 5)} из 5">${starsHtml(r.rating)}</span>
          <p class="review__text">${escapeHtml(r.text)}</p>
          <div class="review__author">
            <span class="avatar${avatarTone(i)}" aria-hidden="true">${escapeHtml(initials(r.name))}</span>
            <div class="review__who">
              <p class="review__name">${escapeHtml(r.name)}</p>
              <p class="review__meta">${escapeHtml([r.work, r.place].filter(Boolean).join(' · '))}</p>
            </div>
            ${r.date ? `<p class="review__date">${escapeHtml(r.date)}</p>` : ''}
          </div>
        </article>
      </div>`
    )).join('');

    const setReviewsProgress = (i) => {
      if (reviewsProgress) reviewsProgress.style.transform = `scaleX(${(i + 1) / reviews.length})`;
    };
    setReviewsProgress(0);

    if (window.Swiper) {
      new window.Swiper('.reviews__slider', {
        slidesPerView: 'auto',
        centeredSlides: true,
        loop: reviews.length > 3,
        spaceBetween: 20,
        speed: reduceMotion ? 0 : 700,
        grabCursor: true,
        navigation: { prevEl: $('.reviews-prev'), nextEl: $('.reviews-next') },
        keyboard: { enabled: true, onlyInViewport: true },
        a11y: { enabled: true, prevSlideMessage: 'Предыдущий отзыв', nextSlideMessage: 'Следующий отзыв' },
        on: { slideChange(sw) { setReviewsProgress(sw.realIndex); } },
      });
    }
  }

  /* ---------- Вопросы и ответы ---------- */
  const faqEl = $('[data-render="faq"]');
  if (faqEl) {
    faqEl.innerHTML = ((S.faq && S.faq.items) || []).map((item, i) => (
      `<div class="faq__item${i === 0 ? ' is-open' : ''}" data-reveal>
        <h3>
          <button class="faq__q" type="button" id="faq-q-${i}" aria-expanded="${i === 0}" aria-controls="faq-a-${i}">
            <span>${escapeHtml(item.q)}</span>
            <span class="faq__icon" aria-hidden="true"></span>
          </button>
        </h3>
        <div class="faq__a" id="faq-a-${i}" role="region" aria-labelledby="faq-q-${i}">
          <div><p>${escapeHtml(item.a)}</p></div>
        </div>
      </div>`
    )).join('');

    faqEl.addEventListener('click', (e) => {
      const button = e.target.closest('.faq__q');
      if (!button) return;
      const item = button.closest('.faq__item');
      const open = !item.classList.contains('is-open');
      item.classList.toggle('is-open', open);
      button.setAttribute('aria-expanded', String(open));
    });
  }

  /* ---------- Плавающие кнопки на телефоне ---------- */
  const heroButtons = $('.hero__buttons');
  if (heroButtons && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      pastHeroButtons = !entry.isIntersecting && entry.boundingClientRect.top < 0;
      updateFloatBar();
    }).observe(heroButtons);
  }

  /* =====================================================================
     ФОРМЫ: маска телефона, проверка полей, отправка
     ===================================================================== */
  const digitsOf = (v) => String(v).replace(/\D/g, '');

  function formatPhone(raw) {
    let d = digitsOf(raw);
    if (!d) return '';
    if (d[0] === '8') d = '7' + d.slice(1);
    else if (d[0] !== '7') d = '7' + d;
    const p = d.slice(1, 11);
    let out = '+7';
    if (p.length) out += ' (' + p.slice(0, 3);
    if (p.length > 3) out += ') ' + p.slice(3, 6);
    if (p.length > 6) out += '-' + p.slice(6, 8);
    if (p.length > 8) out += '-' + p.slice(8, 10);
    return out;
  }

  function attachPhoneMask(input) {
    let prevDigits = '';
    input.addEventListener('focus', () => {
      if (!input.value) {
        input.value = '+7 (';
        prevDigits = '7';
        requestAnimationFrame(() => input.setSelectionRange(input.value.length, input.value.length));
      }
    });
    input.addEventListener('blur', () => {
      if (digitsOf(input.value).length <= 1) { input.value = ''; prevDigits = ''; }
    });
    input.addEventListener('input', () => {
      const raw = input.value;
      const caret = input.selectionStart ?? raw.length;
      const atEnd = caret >= raw.length;
      let digits = digitsOf(raw);
      // Если после «+7 (» первой набрали 8 или 7 — это код страны, пропускаем его
      if (prevDigits === '7' && digits.length === 2 && (digits[1] === '8' || digits[1] === '7')) digits = '7';
      const formatted = formatPhone(digits);
      prevDigits = digitsOf(formatted);
      if (formatted === raw) return;
      const digitsBeforeCaret = digitsOf(raw.slice(0, caret)).length;
      input.value = formatted;
      if (atEnd) return;
      let pos = 0;
      let seen = 0;
      while (pos < formatted.length && seen < digitsBeforeCaret) {
        if (/\d/.test(formatted[pos])) seen += 1;
        pos += 1;
      }
      input.setSelectionRange(pos, pos);
    });
  }

  const validators = {
    name(input) {
      const v = input.value.trim();
      if (!v) return 'Как к вам обращаться?';
      if (v.length < 2) return 'Имя слишком короткое';
      return '';
    },
    phone(input) {
      const n = digitsOf(input.value).length;
      if (n <= 1) return 'Введите номер телефона';
      if (n < 11) return 'Введите номер полностью: +7 (___) ___-__-__';
      return '';
    },
    consent(input) {
      return input.checked ? '' : 'Отметьте согласие — без него мы не можем принять заявку';
    },
  };

  function validateField(input) {
    const check = validators[input.name];
    if (!check) return true;
    const message = check(input);
    const wrap = input.closest('[data-field]');
    const error = document.getElementById(input.getAttribute('aria-describedby'));
    if (wrap) {
      wrap.classList.toggle('is-invalid', Boolean(message));
      wrap.classList.toggle('is-valid', !message && input.type !== 'checkbox');
    }
    if (error) error.textContent = message;
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    return !message;
  }

  function resetFieldStates(form) {
    $$('[data-field]', form).forEach((w) => w.classList.remove('is-invalid', 'is-valid'));
    $$('.field__error', form).forEach((e) => { e.textContent = ''; });
    $$('[aria-invalid]', form).forEach((i) => i.removeAttribute('aria-invalid'));
  }

  function setupFieldValidation(form) {
    $$('input, textarea', form).forEach((input) => {
      if (!validators[input.name]) return;
      const wrap = input.closest('[data-field]');
      input.addEventListener('blur', () => {
        if (input.type === 'checkbox') return;
        if (input.value.trim() && !(input.name === 'phone' && digitsOf(input.value).length <= 1)) validateField(input);
      });
      input.addEventListener(input.type === 'checkbox' ? 'change' : 'input', () => {
        if (wrap && (wrap.classList.contains('is-invalid') || wrap.classList.contains('is-valid'))) validateField(input);
        else if (input.name === 'phone' && digitsOf(input.value).length === 11) validateField(input);
      });
    });
  }

  // Рекламные метки (utm) запоминаются и уходят вместе с заявкой
  const utm = (() => {
    const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'yclid', 'gclid'];
    let saved = {};
    try { saved = JSON.parse(sessionStorage.getItem('utm') || '{}'); } catch (err) { saved = {}; }
    const params = new URLSearchParams(location.search);
    keys.forEach((k) => { if (params.get(k)) saved[k] = params.get(k); });
    try { sessionStorage.setItem('utm', JSON.stringify(saved)); } catch (err) { /* хранилище недоступно */ }
    return Object.keys(saved).map((k) => `${k}=${saved[k]}`).join(', ');
  })();

  async function sendLead(fields) {
    const key = String((S.form && S.form.web3formsKey) || '').trim();
    if (!key) {
      throw new Error('Форма не подключена: вставьте ключ Web3Forms в config.js → form.web3formsKey');
    }
    const payload = {
      access_key: key,
      subject: `${(S.form && S.form.emailSubject) || 'Новая заявка с сайта'} — ${S.brand.name}`,
      from_name: `Сайт ${S.brand.name}`,
      ...fields,
      'Страница': location.href.split('#')[0],
    };
    if (utm) payload['Рекламные метки'] = utm;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || `Сервис заявок ответил ошибкой ${res.status}`);
      return data;
    } finally {
      clearTimeout(timer);
    }
  }

  /* ---------- Окно с короткой формой ---------- */
  const modal = $('#lead-modal');
  const dialog = $('.modal__dialog', modal);
  const leadForm = $('#lead-form');
  let lastFocus = null;
  let closeTimer = 0;

  function showModalState(name) {
    $$('[data-modal-state]', modal).forEach((el) => { el.hidden = el.dataset.modalState !== name; });
    dialog.scrollTop = 0;
  }

  function openModal(kind, detail) {
    const presets = (S.form && S.form.modals) || {};
    const preset = presets[kind] || presets.measure || {};
    $('#lead-title').textContent = preset.title || 'Заявка';
    $('#lead-text').textContent = preset.text || '';
    const detailEl = $('#lead-detail');
    detailEl.textContent = detail || '';
    detailEl.hidden = !detail;
    leadForm.elements.source.value = [preset.title, detail].filter(Boolean).join(': ');
    showModalState('form');
    resetFieldStates(leadForm);

    setMenu(false);
    // Если заявку открыли из галереи проекта — галерею закрываем, фокус потом вернём на карточку
    if (projectOpen) {
      lastFocus = lbLastFocus;
      closeProject({ restoreFocus: false });
    } else {
      lastFocus = document.activeElement;
    }
    clearTimeout(closeTimer);
    modal.hidden = false;
    modalOpen = true;
    lockScroll();
    updateFloatBar();
    requestAnimationFrame(() => requestAnimationFrame(() => modal.classList.add('is-open')));
    // На телефоне не открываем клавиатуру сразу — фокус на самом окне
    (isTouch ? dialog : $('#lead-name')).focus({ preventScroll: true });
  }

  function closeModal() {
    if (!modalOpen) return;
    modalOpen = false;
    modal.classList.remove('is-open');
    closeTimer = setTimeout(() => { modal.hidden = true; }, reduceMotion ? 0 : 450);
    unlockScroll();
    updateFloatBar();
    if (dialog.contains(document.activeElement)) document.activeElement.blur();
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus({ preventScroll: true });
  }

  function trapFocus(e, container) {
    const focusable = $$('a[href], button:not([disabled]), input:not([type="hidden"]):not([tabindex="-1"]), textarea, select', container)
      .filter((el) => el.getClientRects().length > 0 && !el.closest('[hidden]'));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === container)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-lead]');
    if (!trigger) return;
    e.preventDefault();
    openModal(trigger.dataset.lead, trigger.dataset.leadDetail || '');
  });

  modal.addEventListener('click', (e) => {
    if (e.target.closest('[data-modal-close]')) closeModal();
    else if (e.target.closest('[data-modal-retry]')) showModalState('form');
  });

  document.addEventListener('keydown', (e) => {
    if (modalOpen) {
      if (e.key === 'Escape') closeModal();
      else if (e.key === 'Tab') trapFocus(e, dialog);
    } else if (projectOpen) {
      if (e.key === 'Escape') closeProject();
      else if (e.key === 'Tab') trapFocus(e, lbDialog);
      else if (e.key === 'ArrowRight' && lbSwiper) lbSwiper.slideNext();
      else if (e.key === 'ArrowLeft' && lbSwiper) lbSwiper.slidePrev();
    } else if (e.key === 'Escape') {
      setMenu(false);
    }
  });

  attachPhoneMask($('#lead-phone'));
  setupFieldValidation(leadForm);

  // Общая отправка для окна и большой формы: проверка, ловушка для ботов, отправка, итог
  async function handleLeadSubmit(form, collect, showState, onSuccess) {
    const required = ['name', 'phone', 'consent'].map((n) => form.elements.namedItem(n)).filter(Boolean);
    const invalid = required.filter((f) => !validateField(f));
    if (invalid.length) {
      invalid[0].focus();
      return;
    }

    // Поле-ловушку заполняют только боты: делаем вид, что всё прошло, но ничего не отправляем
    const trap = form.elements.namedItem('website');
    if (trap && trap.value) {
      form.reset();
      resetFieldStates(form);
      showState('success');
      return;
    }

    const button = $('[type="submit"]', form);
    button.classList.add('is-loading');
    button.disabled = true;
    try {
      await sendLead(collect());
      form.reset();
      resetFieldStates(form);
      if (onSuccess) onSuccess();
      showState('success');
    } catch (err) {
      console.error('[Заявка не отправлена]', err);
      showState('error');
    } finally {
      button.classList.remove('is-loading');
      button.disabled = false;
    }
  }

  leadForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const field = (n) => leadForm.elements.namedItem(n);
    handleLeadSubmit(leadForm, () => ({
      'Имя': field('name').value.trim(),
      'Телефон': field('phone').value,
      'Заявка': field('source').value || 'Заявка с сайта',
    }), showModalState);
  });

  /* ---------- Большая форма «Оставить заявку» ---------- */
  const requestCfg = S.request || {};
  const requestForm = $('#request-form');

  function showRequestState(name) {
    $$('[data-request-state]').forEach((el) => { el.hidden = el.dataset.requestState !== name; });
    if (name === 'form') return;
    const panel = $(`[data-request-state="${name}"]`);
    panel.focus({ preventScroll: true });
    panel.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
  }

  if (requestForm) {
    const pills = (name, options, checked) => options.map((label, i) => (
      `<label class="pill"><input type="radio" name="${name}" value="${escapeHtml(label)}"${i === checked ? ' checked' : ''}>` +
      `<span>${escapeHtml(label)}</span></label>`
    )).join('');
    $('[data-render="requestType"]').innerHTML = pills('type', requestCfg.typeOptions || [], Number(requestCfg.typeDefault) || 0);
    $('[data-render="requestAutomation"]').innerHTML = pills('automation', requestCfg.automationOptions || [], Number(requestCfg.automationDefault) || 0);
    const visual = $('[data-request="visual"]');
    if (visual && requestCfg.visual) visual.src = requestCfg.visual;

    attachPhoneMask($('#req-phone'));
    setupFieldValidation(requestForm);

    requestForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const field = (n) => requestForm.elements.namedItem(n);
      const length = field('length').value;
      handleLeadSubmit(requestForm, () => ({
        'Имя': field('name').value.trim(),
        'Телефон': field('phone').value,
        'Что нужно': field('type') ? field('type').value || '—' : '—',
        'Автоматика': field('automation') ? field('automation').value || '—' : '—',
        'Адрес участка': field('address').value.trim() || '—',
        'Длина забора': length ? `${length} м` : '—',
        'Комментарий': field('comment').value.trim() || '—',
        'Заявка': 'Форма «Оставить заявку»',
      }), showRequestState, () => { $('#request-notice').hidden = true; });
    });

    $('[data-request-retry]').addEventListener('click', () => showRequestState('form'));
    $('[data-request-again]').addEventListener('click', () => {
      showRequestState('form');
      $('#req-name').focus();
    });
  }

  // «Получить точный расчёт»: параметры калькулятора переносятся в большую форму
  function fillRequestFromCalc(st, summary) {
    if (!requestForm) {
      openModal('calc', summary);
      return;
    }
    const typeIndex = { gates: 0, fence: 1, both: 2 }[st.kind];
    $$('input[name="type"]', requestForm).forEach((r, i) => { r.checked = i === typeIndex; });
    if (st.gatesOn) {
      $$('input[name="automation"]', requestForm).forEach((r, i) => { r.checked = i === (st.automation ? 0 : 1); });
    }
    requestForm.elements.namedItem('length').value = st.fence ? String(st.length) : '';
    requestForm.elements.namedItem('comment').value = `Расчёт из калькулятора: ${summary}`;

    const notice = $('#request-notice');
    notice.textContent = requestCfg.calcNotice || '';
    notice.hidden = !requestCfg.calcNotice;

    showRequestState('form');
    $('#request').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    if (!isTouch) setTimeout(() => $('#req-name').focus({ preventScroll: true }), reduceMotion ? 0 : 900);
  }

  /* ---------- Данные о компании для поисковиков (schema.org) ---------- */
  try {
    const company = S.company || {};
    const pageUrl = location.href.split('#')[0].split('?')[0];
    const structured = [{
      '@context': 'https://schema.org',
      '@type': 'HomeAndConstructionBusiness',
      name: S.brand.name,
      description: hero.subtitle || '',
      url: pageUrl,
      image: new URL('assets/og/og-image.jpg', pageUrl).href,
      telephone: String(company.phone || '').replace(/[^\d+]/g, ''),
      email: company.email || undefined,
      areaServed: company.city || undefined,
      address: { '@type': 'PostalAddress', streetAddress: company.address || '', addressCountry: 'RU' },
      geo: coords.lat && coords.lon ? { '@type': 'GeoCoordinates', latitude: coords.lat, longitude: coords.lon } : undefined,
      priceRange: '₽₽',
    }];
    const faqItems = (S.faq && S.faq.items) || [];
    if (faqItems.length) {
      structured.push({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqItems.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      });
    }
    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.textContent = JSON.stringify(structured);
    document.head.appendChild(ld);
  } catch (err) {
    console.warn('Не удалось добавить данные для поисковиков', err);
  }

  /* =====================================================================
     АНИМАЦИИ (GSAP)
     ===================================================================== */
  function countUp() {
    $$('[data-count]').forEach((el) => {
      const end = Number(el.dataset.count) || 0;
      el.style.display = 'inline-block';
      el.style.minWidth = `${el.getBoundingClientRect().width}px`;
      const state = { v: 0 };
      el.textContent = '0';
      window.gsap.to(state, {
        v: end,
        duration: 1.8,
        ease: 'power2.out',
        onUpdate: () => { el.textContent = formatNumber(Math.round(state.v)); },
      });
    });
  }

  function initReveal() {
    const gsap = window.gsap;
    if (!window.ScrollTrigger) {
      gsap.to('[data-reveal]', { opacity: 1, duration: .6 });
      return;
    }
    window.ScrollTrigger.batch('[data-reveal]', {
      start: 'top 90%',
      once: true,
      onEnter: (batch) => gsap.fromTo(batch, { y: 28, opacity: 0 }, {
        y: 0, opacity: 1, duration: 1, ease: 'power3.out', stagger: 0.09, overwrite: true,
      }),
    });
  }

  function initAnimations() {
    const gsap = window.gsap;
    if (!gsap || reduceMotion) {
      html.classList.remove('js-anim');
      return;
    }
    window.__animStarted = true;
    if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

    const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 1 } });
    tl.fromTo('.hero__media', { opacity: 0 }, { opacity: 1, duration: 1.6, ease: 'power2.out' }, 0)
      .fromTo('.header', { y: -16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9 }, 0.1)
      .fromTo('.eyebrow-pill', { y: 16, opacity: 0 }, { y: 0, opacity: 1 }, 0.25)
      .fromTo('.hero__title .w > span', { yPercent: 110, y: 0 }, { yPercent: 0, y: 0, duration: 1.15, stagger: 0.055, ease: 'power4.out' }, 0.3)
      .fromTo('.hero__lead', { y: 20, opacity: 0 }, { y: 0, opacity: 1 }, 0.65)
      .fromTo('.hero__buttons > *', { y: 20, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.08 }, 0.75)
      .fromTo('.pcard', { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1 }, 0.7)
      .fromTo('.stats', { y: 20, opacity: 0 }, { y: 0, opacity: 1 }, 0.9)
      .add(countUp, 1.0)
      .add(initReveal, 0.8);

    if (window.ScrollTrigger) {
      // Лёгкий параллакс: фото уходит медленнее, текст — чуть быстрее и гаснет
      gsap.to('.hero__media', {
        yPercent: 16,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
      });
      gsap.to('.hero__inner', {
        y: -70,
        opacity: 0.15,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
      });
    }
  }

  try {
    initAnimations();
  } catch (err) {
    console.error(err);
    html.classList.remove('js-anim');
  }
})();
