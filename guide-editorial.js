(function(){
  'use strict';
  if(!document.documentElement.classList.contains('guide-editorial-preview'))return;
  const $=selector=>document.querySelector(selector);
  const area=new URLSearchParams(location.search).get('id'),place=window.RoamDestinations.get(area);
  if(!place){
    document.documentElement.classList.add('guide-unavailable');
    const action=$('#site-header .planner-entry');
    if(action){action.href='/explore/yunnan/';action.textContent='返回地图 ↗';action.removeAttribute('data-start-plan');}
    return;
  }
  const journal=place.journal;
  const main=$('#detail-main'),layout=$('#detail-layout'),visual=$('.detail-visual'),content=$('.detail-content');
  if(!layout||!visual||!content)return;
  const make=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;};

  const hero=make('section','editorial-hero');hero.setAttribute('aria-labelledby','detail-name');
  hero.style.setProperty('--guide-photo-position',journal.photoPosition);
  const backdrop=make('div','editorial-hero-backdrop');backdrop.append(visual);
  const heroCopy=make('div','editorial-hero-copy');
  const kicker=make('p','editorial-hero-kicker','YUNNAN DESTINATION JOURNAL / '+place.number);
  if(journal.displayName)$('#detail-name').textContent=journal.displayName;
  heroCopy.append(kicker,$('#detail-name'),$('#detail-english'),$('#detail-lead'));
  const heroBottom=make('div','editorial-hero-bottom');
  heroBottom.append(make('span','',journal.region),make('span','','一程山海，一点留白。'));
  hero.append(backdrop,heroCopy,heroBottom);
  main.before(hero);

  const breadcrumbs=make('div','editorial-breadcrumbs');
  const home=make('a','','首页');home.href='/';const map=make('a','','云南探索');map.href='/explore/yunnan/';
  breadcrumbs.append(home,make('span','','/'),map,make('span','','/'),make('strong','',journal.displayName||place.shortName),$('#back-to-map'));

  const overview=make('section','editorial-overview');overview.id='destination-overview';
  const overviewCopy=make('div','editorial-overview-copy');
  if(journal.overviewText)$('#detail-story').textContent=journal.overviewText;
  overviewCopy.append(make('p','editorial-section-kicker','01 / THE PLACE'),make('h2','',journal.overviewTitle),$('#detail-story'));
  const highlights=make('div','editorial-highlights');highlights.append(make('span','editorial-small-heading','把时间留给'),$('#detail-highlights'));
  overviewCopy.append(highlights);
  const planningCard=$('#guide-toolbar');planningCard.classList.add('editorial-planning-card');
  planningCard.prepend(make('p','editorial-section-kicker','YOUR LITTLE WISHLIST'));
  $('#guide-area-label').textContent='你的'+place.city+'心愿单';
  const planningNote=make('p','editorial-planning-note','先挑选喜欢的地方，再按自己的节奏安排。');
  planningCard.insertBefore(planningNote,planningCard.querySelector('[data-start-plan]'));
  overview.append(overviewCopy,planningCard);

  const reference=make('details','editorial-reference');reference.id='editorial-reference';
  reference.append(make('summary','','出发前要确认的信息与资料'),$('#detail-facts'),$('.practical-note'),$('#detail-credit'));
  const referenceActions=make('div','editorial-reference-actions');referenceActions.append($('#detail-map-link'));reference.append(referenceActions);

  const catalogue=$('#attraction-catalog');
  $('#catalog-heading').textContent=journal.catalogueTitle;
  $('.catalog-heading .eyebrow').textContent='02 / PLACES TO KEEP';
  $('.catalog-heading p:not(.eyebrow)').textContent=journal.catalogueIntro;
  const duplicateNote=$('.catalog-image-note');
  const missing=window.RoamAttractions.byRegion[area].filter(spot=>!window.RoamAttractionPhotos?.[spot.id]);
  duplicateNote.textContent='配图对应各处实景，点击可放大并查看拍摄内容与来源。'+(missing.length?'尚待补图：'+missing.map(spot=>spot.name).join('、')+'。':'');
  if(journal.riskNote){
    const caution=make('aside','editorial-region-caution');caution.setAttribute('aria-label','本地区出行提醒');
    caution.append(make('strong','',journal.riskTitle),make('p','',journal.riskNote));
    $('#guide-spots').before(caution);
  }
  document.querySelectorAll('#guide-spots .guide-spot-image').forEach(node=>node.remove());
  const photos=window.RoamAttractionPhotos||{};
  const viewer=document.createElement('dialog');viewer.className='sources-dialog editorial-image-viewer';viewer.id='attraction-photo-viewer';viewer.setAttribute('aria-labelledby','attraction-photo-title');
  const close=make('button','editorial-viewer-close','×');close.type='button';close.setAttribute('aria-label','关闭景点照片');
  const viewerFigure=make('figure'),viewerImage=make('img'),viewerCaption=make('figcaption');
  const viewerTitle=make('h2');viewerTitle.id='attraction-photo-title';
  const viewerAuthor=make('p'),viewerLinks=make('div','editorial-viewer-links');
  viewerCaption.append(viewerTitle,viewerAuthor,viewerLinks);viewerFigure.append(viewerImage,viewerCaption);viewer.append(close,viewerFigure);document.body.append(viewer);
  close.addEventListener('click',()=>viewer.close());
  viewer.addEventListener('click',event=>{if(event.target===viewer)viewer.close();});
  function photoLinks(photo){
    const source=make('a','','原图与作者 ↗');source.href=photo.source;source.target='_blank';source.rel='noopener noreferrer';
    const license=make('a','',photo.license+' ↗');license.href=photo.licenseUrl||'https://commons.wikimedia.org/wiki/Commons:Licensing';license.target='_blank';license.rel='noopener noreferrer';
    return[source,license];
  }
  function showPhoto(photo,name){
    viewerImage.src='/'+photo.src;viewerImage.alt=photo.subject||name+'实景照片';[viewerImage.width,viewerImage.height]=photo.processedDimensions||[900,600];
    viewerTitle.textContent=name;viewerAuthor.textContent=(photo.subject?photo.subject+'。':'')+'摄影：'+photo.author+' · '+(photo.cropNote||'图片已裁切为 3:2，保留原授权。');viewerLinks.replaceChildren(...photoLinks(photo));viewer.showModal();
  }
  document.querySelectorAll('#guide-spots .guide-spot').forEach((node,index)=>{
    const id=node.querySelector('[data-select-spot]').dataset.selectSpot,name=node.querySelector('h3').textContent,photo=photos[id];
    const figure=make('figure','editorial-attraction-photo');
    figure.append(make('span','editorial-spot-number',String(index+1).padStart(2,'0')));
    if(photo){
      const open=make('button','editorial-photo-open');open.type='button';open.setAttribute('aria-label','放大'+name+'实景照片');
      const image=make('img');image.src='/'+photo.src;image.alt=(photo.subject||name+'实景')+'；摄影：'+photo.author;[image.width,image.height]=photo.processedDimensions||[900,600];image.loading='lazy';image.decoding='async';
      open.append(image,make('span','editorial-photo-expand','↗'));open.addEventListener('click',()=>showPhoto(photo,name));
      const caption=make('figcaption');caption.textContent=photo.author+' · '+photo.license;figure.append(open,caption);
      if(photo.subject){const subject=make('span','editorial-photo-subject',photo.subject);caption.prepend(subject);}
      const details=node.querySelector('.spot-notes');const credit=make('p','editorial-spot-credit','配图摄影：'+photo.author+'。');credit.append(...photoLinks(photo));details.append(credit);
      node.classList.add('has-actual-photo');
    }else{
      const pending=make('div','editorial-photo-pending');pending.append(make('span','','实景照片待补'),make('small','','暂未找到地点与授权均可确认的图片'));figure.append(pending);node.classList.add('awaiting-photo');
    }
    node.prepend(figure);
    const spot=window.RoamAttractions.get(id);
    if(area!=='erhai'&&spot.caution){
      const caution=make('p','editorial-spot-caution',spot.caution);
      node.querySelector('.spot-select').before(caution);
      // Display a specific risk once, directly alongside the choice it affects.
      node.querySelector('.spot-notes .spot-caution')?.remove();
    }
  });
  const bottom=make('div','editorial-bottom');bottom.append(make('a','','回到云南探索地图 ←'),$('#next-destination'));
  bottom.firstElementChild.href=place.mapUrl;

  // Move existing elements rather than recreating selection controls: events, IDs and persistence remain intact.
  layout.remove();
  main.replaceChildren(breadcrumbs,overview,catalogue,reference,bottom);
  // Keep one return path and the useful wishlist. Repeated generic inspiration copy is unnecessary here.
  main.querySelector('.editorial-highlights')?.remove();
  main.querySelector('#guide-map-link')?.remove();
  bottom.firstElementChild.remove();
})();
