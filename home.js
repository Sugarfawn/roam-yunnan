(function () {
  'use strict';

  const slides = window.HomePhotos;
  const $ = selector => document.querySelector(selector);
  const backgrounds = [...document.querySelectorAll('.home-background')];
  const cards = $('#cover-cards');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let active = 0;
  let visibleBackground = 0;
  let requestVersion = 0;
  let timer = 0;
  let userPaused = reducedMotion.matches;
  let pointerOnGallery = false;
  let keyboardOnGallery = false;
  let progressAnimation = null;

  function stopProgress() {
    if (progressAnimation) progressAnimation.cancel();
    progressAnimation = null;
    $('#cover-progress').style.width = '0%';
  }

  function syncPlayback() {
    window.clearTimeout(timer);
    timer = 0;
    stopProgress();
    const paused = userPaused || pointerOnGallery || keyboardOnGallery || document.hidden || reducedMotion.matches;
    $('#cover-pause').setAttribute('aria-pressed', String(userPaused || reducedMotion.matches));
    $('#cover-pause').setAttribute('aria-label', userPaused || reducedMotion.matches ? '开启自动轮播' : '暂停自动轮播');
    $('#cover-pause').textContent = userPaused || reducedMotion.matches ? '▷' : 'Ⅱ';
    if (paused) return;

    const bar = $('#cover-progress');
    if (bar.animate) {
      progressAnimation = bar.animate([{ width: '0%' }, { width: '100%' }], { duration: 5600, easing: 'linear', fill: 'forwards' });
    }
    timer = window.setTimeout(() => select((active + 1) % slides.length), 7200);
  }

  function preload(slide) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => {
        if (image.decode) image.decode().catch(() => {}).then(resolve);
        else resolve();
      };
      image.onerror = reject;
      image.src = slide.background;
    });
  }

  function setCopy(element, lines) {
    element.replaceChildren(...lines.flatMap((line, index) => index
      ? [document.createElement('br'), document.createTextNode(line)]
      : [document.createTextNode(line)]));
  }

  async function select(index) {
    const next = (index + slides.length) % slides.length;
    if (next === active && backgrounds[visibleBackground].classList.contains('is-visible')) {
      syncPlayback();
      return;
    }
    const version = ++requestVersion;
    const slide = slides[next];
    try {
      await preload(slide);
    } catch {
      $('#cover-announcement').textContent = `暂时无法载入${slide.place}的照片，请稍后重试。`;
      $('#home-text').classList.remove('is-leaving');
      syncPlayback();
      return;
    }
    if (version !== requestVersion) return;

    const nextBackground = backgrounds[1 - visibleBackground];
    const oldBackground = backgrounds[visibleBackground];
    const text = $('#home-text');
    const wasReduced = reducedMotion.matches;
    text.classList.add('is-leaving');
    $('#cover-cards').classList.add('is-switching');
    if (!wasReduced) await new Promise(resolve => window.setTimeout(resolve, 160));
    if (version !== requestVersion) return;

    nextBackground.style.objectPosition = slide.position;
    nextBackground.alt = '';
    const revealBackground = () => {
      if (version !== requestVersion) return;
      nextBackground.onload = null;
      nextBackground.classList.add('is-visible');
      oldBackground.classList.remove('is-visible');
      visibleBackground = 1 - visibleBackground;
    };
    nextBackground.onload = revealBackground;
    nextBackground.src = slide.background;
    if (nextBackground.complete && nextBackground.naturalWidth) revealBackground();

    active = next;
    setCopy($('#cover-title'), slide.title);
    setCopy($('#cover-description'), slide.description);
    $('#cover-location').textContent = `${slide.city} · ${slide.place}`;
    $('#cover-english').textContent = slide.english;
    $('#cover-author').textContent = slide.author;
    $('#cover-index').textContent = String(active + 1).padStart(2, '0');
    cards.querySelectorAll('.home-card').forEach((card, cardIndex) => {
      const selected = cardIndex === active;
      card.classList.toggle('is-selected', selected);
      card.setAttribute('aria-pressed', String(selected));
    });
    const selectedCard = cards.querySelector('.home-card.is-selected');
    if (selectedCard) {
      const rail = cards.getBoundingClientRect();
      const card = selectedCard.getBoundingClientRect();
      const offset = card.left < rail.left + 3 ? card.left - rail.left - 3
        : card.right > rail.right - 3 ? card.right - rail.right + 3 : 0;
      if (offset) {
        if (typeof cards.scrollBy === 'function') cards.scrollBy({ left: offset, behavior: wasReduced ? 'instant' : 'smooth' });
        else cards.scrollLeft += offset;
      }
    }
    $('#cover-announcement').textContent = `${slide.city} · ${slide.place}`;
    text.classList.remove('is-leaving');
    cards.classList.remove('is-switching');
    syncPlayback();
  }

  function openDialog(dialog) {
    if (!dialog.open) dialog.showModal();
    window.clearTimeout(timer);
    timer = 0;
    stopProgress();
    window.requestAnimationFrame(() => dialog.querySelector('[data-close]').focus());
  }

  cards.innerHTML = `<div class="home-card-track">${slides.map((slide, index) => `
    <button class="home-card ${index === active ? 'is-selected' : ''}" type="button" data-slide="${index}" aria-label="选择${slide.city}：${slide.place}" aria-pressed="${index === active}">
      <img src="${slide.card}" alt="${slide.city}实景摄影：${slide.place}" loading="${index < 4 ? 'eager' : 'lazy'}" decoding="async" style="object-position:${slide.position}">
      <span class="card-number">${String(index + 1).padStart(2, '0')} / ${slide.city}</span><span class="card-arrow" aria-hidden="true">↗</span>
      <span class="card-copy"><small>${String(index + 1).padStart(2, '0')} / ${slide.city}</small><strong>${slide.place}</strong><i>${slide.english}</i></span>
    </button>`).join('')}</div>`;

  cards.addEventListener('click', event => {
    const button = event.target.closest('[data-slide]');
    if (button) select(Number(button.dataset.slide));
  });
  $('#cover-prev').addEventListener('click', () => select(active - 1));
  $('#cover-next').addEventListener('click', () => select(active + 1));
  $('#cover-pause').addEventListener('click', () => {
    userPaused = !userPaused;
    syncPlayback();
  });
  cards.addEventListener('pointerenter', () => { pointerOnGallery = true; syncPlayback(); });
  cards.addEventListener('pointerleave', () => { pointerOnGallery = false; syncPlayback(); });
  cards.addEventListener('focusin', () => { keyboardOnGallery = true; syncPlayback(); });
  cards.addEventListener('focusout', event => {
    if (!cards.contains(event.relatedTarget)) { keyboardOnGallery = false; syncPlayback(); }
  });
  $('#cover-cards').addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      select(active + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  $('#travel-cover').addEventListener('keydown', event => {
    if (event.target.closest('button, a, dialog, input, select')) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      select(active + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  let touchStart = null;
  $('#travel-cover').addEventListener('touchstart', event => {
    touchStart = event.target.closest('.home-cards') ? null : { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }, { passive: true });
  $('#travel-cover').addEventListener('touchend', event => {
    if (!touchStart) return;
    const dx = event.changedTouches[0].clientX - touchStart.x;
    const dy = event.changedTouches[0].clientY - touchStart.y;
    if (Math.abs(dx) > 64 && Math.abs(dx) > Math.abs(dy) * 1.4) select(active + (dx < 0 ? 1 : -1));
    touchStart = null;
  }, { passive: true });
  // Homepage and exploration navigation use native anchors; the carousel stays independent.
  $('#photo-credits').addEventListener('click', () => openDialog($('#credits-dialog')));
  $('#photo-credit-link').addEventListener('click', () => openDialog($('#credits-dialog')));
  document.addEventListener('visibilitychange', syncPlayback);
  reducedMotion.addEventListener?.('change', syncPlayback);

  document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
  document.querySelectorAll('.home-dialog').forEach(dialog => {
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener('close', () => { if (!document.querySelector('dialog[open]')) syncPlayback(); });
  });
  $('#credits-list').innerHTML = slides.map(slide => `
    <article class="photo-credit"><img src="${slide.card}" alt="" loading="lazy"><div><h3>${slide.city} · ${slide.place}</h3><p>摄影：${slide.author} · ${slide.license}</p><a href="${slide.source}" target="_blank" rel="noopener noreferrer">原图与作者</a><a href="${slide.licenseUrl}" target="_blank" rel="noopener noreferrer">授权</a></div></article>`).join('');

  backgrounds[0].style.objectPosition = slides[0].position;
  syncPlayback();
  void preload(slides[(active + 1) % slides.length]).catch(() => {});
})();
