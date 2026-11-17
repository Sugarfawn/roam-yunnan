(function () {
  'use strict';
  const data = window.RoamDestinations;
  const id = new URLSearchParams(location.search).get('id');
  const place = data.get(id);
  const $ = selector => document.querySelector(selector);
  if (!place) {
    $('#detail-layout').hidden = true;
    const notice = document.createElement('section'); notice.className = 'detail-not-found';
    const title = document.createElement('h1'); title.textContent = '这处风景，还没有被收录。';
    const text = document.createElement('p'); text.textContent = '从云南探索地图重新选择一处目的地。';
    const link = document.createElement('a'); link.href = '/explore/yunnan/'; link.textContent = '返回探索地图 →';
    notice.append(title, text, link); $('#detail-main').append(notice);
    document.title = '目的地未找到 · ROAM YUNNAN'; return;
  }
  document.title = place.shortName + ' · 目的地手记 · ROAM YUNNAN';
  document.querySelector('meta[name="description"]').content = place.introduction;
  const image = $('#detail-image'); image.src = '/' + place.background; image.alt = place.author + ' 摄影：' + place.place; image.style.objectPosition = place.position;
  for (const [selector, content] of [
    ['#detail-number', place.number], ['#detail-category', place.category], ['#detail-author', place.author],
    ['#detail-english', place.english], ['#detail-name', place.shortName], ['#detail-lead', place.lead],
    ['#detail-story', place.story], ['#detail-practical', place.practical]
  ]) $(selector).textContent = content;
  const factData = [['所在区域', place.county], ['风景类型', place.category], ['地图标记', place.coordinateLabel + ' · ' + place.coordinatePrecision], ['地理位置参考', place.coordinates[0].toFixed(3) + '° E / ' + place.coordinates[1].toFixed(3) + '° N']];
  factData.forEach(([title, content], index) => {
    const group = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd');
    dt.textContent = title; dd.textContent = content; if (index === 3) dd.className = 'fact-coordinates';
    group.append(dt, dd); $('#detail-facts').append(group);
  });
  place.highlights.forEach((text, index) => {
    const li = document.createElement('li'), number = document.createElement('span');
    number.textContent = String(index + 1).padStart(2, '0'); li.append(number, document.createTextNode(text)); $('#detail-highlights').append(li);
  });
  $('#back-to-map').href = place.mapUrl; $('#detail-map-link').href = place.mapUrl;
  const next = data.items[(data.items.indexOf(place) + 1) % data.items.length];
  $('#next-destination').href = next.detailUrl; $('#next-destination').textContent = '下一处 · ' + next.shortName + ' →';
  const credit = $('#detail-credit');
  credit.append(document.createTextNode('摄影：' + place.author + ' · ' + place.license + '　'));
  const link = document.createElement('a'); link.href = place.source; link.textContent = '查看原始摄影作品 ↗'; link.target = '_blank'; link.rel = 'noopener noreferrer'; credit.append(link);
})();
