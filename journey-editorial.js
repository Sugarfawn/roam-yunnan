/* Stage two presentation. Existing form nodes, events, rules and storage are retained. */
(function () {
  'use strict';
  if (!document.body.matches('.planner-page.editorial-route')) return;
  const $ = selector => document.querySelector(selector);
  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const main = $('.travel-main'), aside = $('.planning-aside');
  const hero = make('section', 'planner-hero');
  hero.setAttribute('aria-label', '目的地旅行手记');
  const photo = aside.querySelector('figure');
  photo.querySelector('figcaption').prepend(make('span', 'planner-hero-kicker', 'THE YUNNAN JOURNAL / YOUR OWN WAY'));
  hero.append(photo);
  const credit = make('a', 'planner-hero-credit');
  credit.target = '_blank';credit.rel = 'noopener noreferrer';
  function syncCredit() {
    const place = window.RoamDestinations.items.find(item => photo.querySelector('img').getAttribute('src') === '/' + item.background);
    if (!place) return;
    credit.href = place.source;credit.textContent = '摄影 / ' + place.author + ' ↗';
  }
  syncCredit();
  // The form select can still hold its default when a saved result is restored.
  // Track the actual displayed photograph, including programmatic region changes.
  new MutationObserver(syncCredit).observe(photo.querySelector('img'), { attributes: true, attributeFilter: ['src'] });
  hero.append(credit);
  main.before(hero);

  const form = $('#travel-form');
  const steps = make('nav', 'planning-steps');
  steps.setAttribute('aria-label', '规划表单章节');
  const labels = ['旅行目的地', '旅行节奏', '心愿景点', '酒店与餐厅'];
  form.querySelectorAll('.form-section').forEach((section, index) => {
    section.id = 'planning-step-' + (index + 1);
    const link = make('a', '', String(index + 1).padStart(2, '0') + ' / ' + labels[index]);
    link.href = '#' + section.id;
    steps.append(link);
  });
  form.prepend(steps);
  const photoSources=make('a','planner-photo-sources','景点图片来源与授权 ↗');
  photoSources.href='/assets/attractions/CREDITS.md';photoSources.target='_blank';photoSources.rel='noopener noreferrer';
  $('#planner-spot-choices').after(photoSources);

  // Keep the simplest choices visible; optional settings remain in the same form.
  const advanced = make('details', 'planner-advanced');
  advanced.id = 'planner-advanced';
  advanced.append(make('summary', '', '抵离时间与跨地区设置'));
  const advancedBody = make('div', 'planner-advanced-body');
  advancedBody.append(make('p', 'form-small-note', '默认从推荐片区出发并返回，抵离日按完整游玩日安排。需要时再展开调整。'));
  const first = $('#planning-step-1');
  advancedBody.append($('#start-location').closest('.planner-field'), $('.end-location-field'), $('.more-regions-field'), $('#arrival-window').closest('fieldset'));
  advanced.append(advancedBody);
  first.append(advanced);
  // Imported half-day / multi-region choices must not be concealed.
  function revealNonDefaultSettings() {
    if ($('#arrival-window').value !== 'full' || $('#departure-window').value !== 'full' ||
        $('#arrival-time').value || $('#departure-time').value || !$('#same-end').checked ||
        $('#additional-areas input:checked')) advanced.open = true;
  }
  revealNonDefaultSettings();
  $('#edit-plan').addEventListener('click', revealNonDefaultSettings);
  $('#plan-area').addEventListener('change', revealNonDefaultSettings);

  const help = make('details', 'planner-demos');
  help.append(make('summary', '', '先体验一份参考计划'));
  const demos = $('.demo-buttons');
  if (demos) help.append(demos);
  aside.append(help);

  // Reference material is available on demand, leaving the daily route in focus.
  const references = make('details', 'result-references');
  references.id = 'result-references';
  references.append(make('summary', '', '出行提醒与参考依据'));
  const referenceBody = make('div', 'result-reference-body');
  referenceBody.append($('#result-photo-note'), $('#template-reason'), $('#plan-warnings'));
  references.append(referenceBody);
  $('.travel-result-layout').before(references);
  const warningState = () => {
    const warnings = $('#plan-warnings');
    const count = warnings.querySelectorAll('p').length;
    references.querySelector('summary').textContent = count ? `出行提醒与参考依据 · ${count} 条待确认` : '出行提醒与参考依据';
    if (warnings.querySelector('.critical-warning')) references.open = true;
  };
  new MutationObserver(warningState).observe($('#plan-warnings'), { childList: true, subtree: true });
  warningState();
})();
