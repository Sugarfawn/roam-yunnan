(function () {
  'use strict';
  const current = document.body.dataset.page;
  const header = document.getElementById('site-header');
  header.innerHTML = `
    <a class="route-brand" href="/" aria-label="漫游云南首页"><svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="17.5"/><path d="m26.5 13.5-4.4 8.6-8.6 4.4 4.4-8.6z"/><circle cx="20" cy="20" r="1"/></svg><span>漫游<small>ROAM / YUNNAN</small></span></a>
    <nav aria-label="主导航"><a href="/">首页</a><a href="/explore/yunnan/" ${current === 'explore' ? 'aria-current="page"' : ''}>风景灵感<span></span></a><button type="button" id="open-sources">关于影像 <span aria-hidden="true">↗</span></button></nav>
    <a class="back-home" href="/">← <span>返回首页</span></a>`;
  if(current==='detail'||current==='planner'){
    const params=new URLSearchParams(location.search),region=window.RoamDestinations.get(params.get(current==='detail'?'id':'place'));
    const area=region?.id||'erhai',action=header.querySelector('.back-home');
    action.className='planner-entry';
    if(current==='detail'){
      action.href='/explore/yunnan/planner/?place='+area+'&view=edit';action.textContent='开始规划 ↗';action.dataset.startPlan='';
    }else{action.href='/explore/yunnan/?place='+area;action.textContent='返回地图 ↗';}
  }
  const dialog = document.createElement('dialog');
  dialog.className = 'sources-dialog';
  dialog.setAttribute('aria-labelledby', 'sources-title');
  dialog.innerHTML = `<button class="close-dialog" aria-label="关闭来源信息" type="button">×</button><span class="eyebrow">THROUGH THEIR LENS</span><h2 id="sources-title">风景背后的镜头</h2><p>继续沿用你选定的五张实景摄影作品。</p><div class="source-items"></div><div class="source-map-note"><strong>地图与地点</strong><p>云南省界及州、市行政区边界来自阿里云 DataV GeoJSON，均存入本地。省域探索标记采用区域参考位置，不代表景区入口或照片拍摄点。</p><a href="/data/SOURCES.md" target="_blank" rel="noopener">查看地图数据与地点来源 ↗</a></div>`;
  document.body.appendChild(dialog);
  for (const place of window.RoamDestinations.items) {
    const row = document.createElement('div');
    row.className = 'source-row';
    const image = document.createElement('img'); image.src = '/' + place.card; image.alt = ''; image.loading = 'lazy';
    const copy = document.createElement('div');
    const title = document.createElement('strong'); title.textContent = place.shortName;
    const author = document.createElement('p'); author.textContent = place.author + ' · ' + place.license;
    const link = document.createElement('a'); link.href = place.source; link.textContent = '原图与作者 ↗'; link.target = '_blank'; link.rel = 'noopener noreferrer';
    copy.append(title, author, link); row.append(image, copy); dialog.querySelector('.source-items').append(row);
  }
  header.querySelector('#open-sources').addEventListener('click', () => dialog.showModal());
  dialog.querySelector('.close-dialog').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
})();
