(function () {
  'use strict';

  const DATA = window.RoamPickCatalogue;
  if (!DATA) return;

  const STORAGE_KEY = 'roam.attractions.v1';
  const params = new URLSearchParams(window.location.search);
  const requested = params.get('place');
  const regionId = Object.hasOwn(DATA,requested) ? requested : 'meili';
  const region = DATA[regionId];
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const pad = n => String(n).padStart(2, '0');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const STAR_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z" /></svg>';
  const CHECK_SVG = '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m3.2 8.2 3.1 3.1 6.5-7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  let store = loadStore();
  let state = normalize(store[regionId]);
  let activeFilter = '全部';
  let keyword = '';
  let toastTimer = 0;

  const list = $('#attractionList');
  const selectionList = $('#selectionList');

  function loadStore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch (err) {
      $('#storageWarning').hidden=false;
      return {};
    }
  }

  function normalize(value) {
    const valid = new Set(region.items.map(item => item.id));
    const source = value && typeof value === 'object' ? value : {};
    const selected = Array.isArray(source.selected)
      ? source.selected.filter(id => valid.has(id))
      : [];
    const must = Array.isArray(source.must)
      ? source.must.filter(id => valid.has(id) && selected.includes(id))
      : [];
    return { selected: [...new Set(selected)], must: [...new Set(must)] };
  }

  function save() {
    store[regionId] = state;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (err) {
      $('#storageWarning').hidden=false;
      showToast('浏览器存储不可用，刷新后可能不会保留。');
    }
  }

  function showToast(message) {
    const toast = $('#toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2200);
  }

  function isSelected(id) {
    return state.selected.includes(id);
  }

  function isMust(id) {
    return state.must.includes(id);
  }

  function getItem(id) {
    return region.items.find(item => item.id === id);
  }

  function renderHeader() {
    $('#placeName').textContent = region.name;
    $('#placeKicker').textContent = region.kicker;
    $('#placeIntro').textContent = region.intro;
    $('#regionMeta').textContent = `${region.city} · ${region.prefecture}`;
    $('#totalCount').textContent = region.items.length;
    $('#headerContext').textContent = `${region.name} · ${region.city}`;
    $('#selectionPlace').textContent = region.name;
    $('#selectionEn').textContent = region.en;
    $('#selectionPhoto').src = region.photo;
    $('#selectionPhoto').alt = `${region.name}风景`;
    $('#backMap').href = `/explore/yunnan/?place=${encodeURIComponent(regionId)}`;
    document.title = `${region.name} · 选景点 · 漫游 ROAM`;
    if (requested !== regionId) {
      const url = new URL(window.location.href);
      url.searchParams.set('place', regionId);
      window.history.replaceState({}, '', url);
    }
  }

  function renderFilters() {
    const tags = [];
    region.items.forEach((item) => {
      item.tags.forEach((tag) => {
        if (!tags.includes(tag)) tags.push(tag);
      });
    });
    const filters = ['全部', ...tags];
    $('#filterChips').innerHTML = filters.map(tag => `
      <button class="filter-chip ${activeFilter === tag ? 'is-active' : ''}" type="button" data-filter="${tag}" aria-pressed="${activeFilter === tag}">${tag}</button>
    `).join('');
  }

  function filteredItems() {
    return region.items.filter(item => (activeFilter === '全部'||item.tags.includes(activeFilter)) && item.name.toLocaleLowerCase().includes(keyword.toLocaleLowerCase()));
  }

  function renderList(preserveScroll) {
    const scrollTop = preserveScroll ? list.scrollTop : 0;
    const items = filteredItems();
    $('#searchStatus').textContent=items.length+' / '+region.items.length+' 个景点';
    if (!items.length) {
      list.innerHTML = `<div class="selection-empty"><span class="empty-star">✦</span><strong>没有找到匹配的景点</strong><span>试试其他名称，或者回到「全部」。</span></div>`;
      return;
    }
    list.innerHTML = items.map((item) => {
      const index = region.items.findIndex(i => i.id === item.id);
      const selected = isSelected(item.id);
      const must = isMust(item.id);
      return `<article class="attraction-card ${selected ? 'is-selected' : ''}" data-attraction="${item.id}" tabindex="0" role="button" aria-pressed="${selected}" aria-label="${selected ? '取消选择' : '选择'}${item.name}">
        <span class="select-mark" aria-hidden="true">
          <span class="mark-number">${pad(index + 1)}</span>
          <span class="mark-check">${CHECK_SVG}</span>
        </span>
        <div class="attraction-copy">
          ${item.photo ? `<img class="spot-thumbnail" src="${item.photo.src}" alt="${item.photo.subject||item.name}" loading="lazy">` : '<span class="spot-thumbnail photo-pending">照片待补</span>'}
          <div class="attr-title-row">
            <h3>${item.name}</h3>
            ${must ? '<span class="must-badge">★ 必去</span>' : ''}
          </div>
          <div class="attr-tag-row">
            <span>${item.area}</span>
            <span>${item.duration}</span>
            ${item.tags.map(tag => `<span>${tag}</span>`).join('')}
          </div>
          <p class="attr-note">${item.note}</p>
          ${item.photo ? `<a class="photo-credit" href="${item.photo.source}" target="_blank" rel="noopener noreferrer">${item.photo.author} · ${item.photo.license} ↗${item.id==='lijiang-mural'?' · 入口外景，非壁画内景':''}</a>` : ''}
        </div>
        <button class="star-btn ${must ? 'is-must' : ''}" type="button" data-star="${item.id}" aria-label="${must ? '取消必去' : '标记必去'}${item.name}" aria-pressed="${must}">
          ${STAR_SVG}
        </button>
      </article>`;
    }).join('');
    if (preserveScroll) list.scrollTop = scrollTop;
  }

  function renderSelection(scrollToEnd) {
    if (!state.selected.length) {
      selectionList.innerHTML = `<div class="selection-empty">
        <span class="empty-star">✦</span>
        <strong>还没有选地点</strong>
        <span>从左侧点选想去的地方，<br>点星标把它标成必去。</span>
      </div>`;
    } else {
      selectionList.innerHTML = state.selected.map((id, index) => {
        const item = getItem(id);
        if (!item) return '';
        const must = isMust(id);
        return `<div class="selection-item" data-selected="${id}">
          <span class="selection-index">${pad(index + 1)}</span>
          <button class="selection-copy" type="button" data-focus="${id}" aria-label="回到${item.name}">
            <strong>${item.name}</strong>
            <small>${item.area} · ${item.duration}${must ? ' · 必去' : ''}</small>
          </button>
          <button class="selection-star ${must ? 'is-must' : ''}" type="button" data-must="${id}" aria-label="${must ? '取消必去' : '标记必去'}${item.name}" aria-pressed="${must}">
            ${STAR_SVG}
          </button>
          <button class="selection-remove" type="button" data-remove="${id}" aria-label="从清单移除${item.name}">×</button>
        </div>`;
      }).join('');
    }
    updateCounts();
    if (scrollToEnd) {
      window.requestAnimationFrame(() => {
        selectionList.scrollTop = selectionList.scrollHeight;
      });
    }
  }

  function updateCounts() {
    const count = state.selected.length;
    const must = state.must.length;
    $('#inlineSelected').textContent = count;
    $('#selectedCount').textContent = count;
    $('#mustCount').textContent = must;
    $('#selectionCount').textContent = `${count} / ${region.items.length}`;
    $('#clearSelection').disabled = count === 0;
    $('#nextStep').disabled=count===0;
  }

  function renderAll() {
    renderHeader();
    renderFilters();
    renderList(false);
    renderSelection(false);
  }

  function toggleSelect(id) {
    if (!getItem(id)) return;
    const index = state.selected.indexOf(id);
    if (index >= 0) {
      state.selected.splice(index, 1);
      state.must = state.must.filter(itemId => itemId !== id);
    } else {
      state.selected.push(id);
    }
    save();
    renderList(true);
    renderSelection(false);
  }

  function toggleMust(id) {
    if (!getItem(id)) return;
    if (!isSelected(id)) {
      state.selected.push(id);
      state.must.push(id);
      showToast('已加入清单，并标记为必去。');
    } else if (isMust(id)) {
      state.must = state.must.filter(itemId => itemId !== id);
    } else {
      state.must.push(id);
      showToast('已标记为必去。');
    }
    save();
    renderList(true);
    renderSelection(false);
  }

  function removeSelected(id) {
    state.selected = state.selected.filter(itemId => itemId !== id);
    state.must = state.must.filter(itemId => itemId !== id);
    save();
    renderList(true);
    renderSelection(false);
  }

  function focusCard(id) {
    const item = getItem(id);
    if (!item) return;
    keyword='';$('#spotSearch').value='';renderList(false);
    if (activeFilter !== '全部' && !item.tags.includes(activeFilter)) {
      activeFilter = '全部';
      renderFilters();
      renderList(false);
    }
    const card = list.querySelector(`[data-attraction="${id}"]`);
    if (!card) return;
    card.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
    card.classList.remove('is-highlighted');
    void card.offsetWidth;
    card.classList.add('is-highlighted');
    window.setTimeout(() => card.classList.remove('is-highlighted'), 1300);
  }

  function clearSelection() {
    if (!state.selected.length) return;
    state = { selected: [], must: [] };
    save();
    renderList(true);
    renderSelection(false);
    showToast('已清空这一站的清单。');
  }

  function bind() {
    $('#filterChips').addEventListener('click', (event) => {
      const chip = event.target.closest('[data-filter]');
      if (!chip) return;
      activeFilter = chip.dataset.filter;
      renderFilters();
      renderList(false);
    });

    list.addEventListener('click', (event) => {
      if(event.target.closest('a'))return;
      const star = event.target.closest('[data-star]');
      if (star) {
        event.stopPropagation();
        toggleMust(star.dataset.star);
        return;
      }
      const card = event.target.closest('[data-attraction]');
      if (card) toggleSelect(card.dataset.attraction);
    });

    list.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const card = event.target.closest('[data-attraction]');
      if (!card || event.target.closest('[data-star],a')) return;
      event.preventDefault();
      const id=card.dataset.attraction;toggleSelect(id);list.querySelector('[data-attraction="'+id+'"]')?.focus({preventScroll:true});
    });

    selectionList.addEventListener('click', (event) => {
      const remove = event.target.closest('[data-remove]');
      if (remove) {
        removeSelected(remove.dataset.remove);
        return;
      }
      const must = event.target.closest('[data-must]');
      if (must) {
        toggleMust(must.dataset.must);
        return;
      }
      const focus = event.target.closest('[data-focus]');
      if (focus) focusCard(focus.dataset.focus);
    });

    $('#clearSelection').addEventListener('click', clearSelection);
    $('#spotSearch').addEventListener('input',()=>{keyword=$('#spotSearch').value.trim();renderList(false);});
    $('#nextStep').addEventListener('click',()=>$('#nextStageDialog').showModal());
    $('#closeNextStage').addEventListener('click',()=>$('#nextStageDialog').close());
  }

  function init() {
    bind();
    renderAll();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
