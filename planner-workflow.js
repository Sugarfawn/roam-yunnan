/* Choose places first; existing form controls retain their state and event handlers. */
(function(){
  'use strict';
  if(!document.body.matches('.planner-page.editorial-route'))return;
  document.body.classList.add('planner-workspace');
  const $=s=>document.querySelector(s),make=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
  const form=$('#travel-form'),[dates,preferences,spots,personal]=[...form.querySelectorAll('.form-section')],aside=$('.planning-aside');
  const hero=make('section','planner-hero planner-banner');hero.setAttribute('aria-label','当前目的地摄影');
  const photo=aside.querySelector('figure');photo.classList.add('planner-banner-photo');
  const image=photo.querySelector('img');image.fetchPriority='high';
  const caption=photo.querySelector('figcaption');caption.prepend(make('span','planner-banner-kicker','THE YUNNAN JOURNAL / PLAN YOUR JOURNEY'));
  const english=caption.querySelector('small');english.id='planner-banner-english';
  const credit=make('a','planner-banner-credit');credit.target='_blank';credit.rel='noopener noreferrer';
  hero.append(photo,credit);$('.travel-main').before(hero);
  function syncBanner(){
    const place=window.RoamDestinations.items.find(item=>'/'+item.background===image.getAttribute('src'));
    if(!place)return;
    hero.style.setProperty('--planner-banner-position',place.journal.plannerPhotoPosition||place.position||'50% 50%');
    document.body.style.setProperty('--planner-page-photo','url("/'+place.background+'")');
    english.textContent=place.english;credit.textContent='摄影 / '+place.author+' ↗';credit.href=place.source;
    hero.setAttribute('aria-label',place.shortName+' · 目的地摄影');
  }
  new MutationObserver(syncBanner).observe(image,{attributes:true,attributeFilter:['src']});syncBanner();
  const placeStep=make('section','planner-step-pane');placeStep.id='choose-places-step';
  const arrangeStep=make('section','planner-step-pane');arrangeStep.id='arrange-trip-step';arrangeStep.hidden=true;
  const personalStep=make('section','planner-step-pane');personalStep.id='stay-food-step';personalStep.hidden=true;
  const destination=$('#plan-area').closest('.planner-field');destination.classList.add('planner-destination-field');
  const intro=make('div','place-step-heading');intro.append(destination);
  const quick=make('button','quick-pick-spots','选入常见地点');quick.type='button';quick.id='quick-pick-spots';intro.append(quick);
  spots.querySelector('h2').textContent='想去哪些地方？';spots.querySelector('.form-small-note').textContent='点选加入，★ 标记最想去的景点。路线在下一步自动分天。';
  personal.querySelector('h2').textContent='酒店与餐厅';personal.querySelector('.form-small-note').textContent='有订好的酒店、想吃的餐厅，可以一起加入。也可以稍后再补。';
  dates.querySelector('h2').textContent='玩几天，怎么出发';preferences.querySelector('h2').textContent='按你的喜好安排';
  for(const section of [dates,preferences,spots,personal])section.querySelector('.form-section-title>span')?.remove();
  const advanced=make('details','planner-advanced');advanced.id='planner-advanced';advanced.append(make('summary','','抵离时间、住宿片区与跨地区设置'));
  const advancedBody=make('div','planner-advanced-body');advancedBody.append($('#start-location').closest('.planner-field'),$('.end-location-field'),$('.more-regions-field'),$('#arrival-window').closest('fieldset'));advanced.append(advancedBody);dates.append(advanced);
  const next=make('button','gold-button planner-next','下一步 · 安排行程 →');next.type='button';next.id='continue-to-arrange';
  const nextNote=make('p','selection-empty-hint','先选择至少一个景点或地点，再让 AI 为你安排。');nextNote.id='selection-empty-hint';
  const modeTabs=make('div','place-mode-tabs');modeTabs.setAttribute('role','tablist');modeTabs.setAttribute('aria-label','选择地点方式');
  const recommendationPanel=make('section','place-mode-panel');recommendationPanel.id='recommended-spots-panel';recommendationPanel.setAttribute('role','tabpanel');
  const searchPanel=make('section','place-mode-panel');searchPanel.id='free-search-panel';searchPanel.hidden=true;searchPanel.setAttribute('role','tabpanel');
  const searchForm=make('div','spot-search-form');searchForm.id='spot-search-form';
  const searchInput=make('input');searchInput.type='search';searchInput.id='spot-search-keyword';searchInput.placeholder='搜索想去的景点或地点';searchInput.maxLength=100;searchInput.setAttribute('aria-label','搜索想去的景点或地点');
  const searchButton=make('button','gold-button','搜索地点 ↗');searchButton.type='button';searchForm.append(searchInput,searchButton);
  const searchHint=make('p','free-search-intro','搜索当前目的地的真实地点，确认位置后加入。酒店与餐厅放在下一步。');
  searchPanel.append(searchHint,searchForm);
  recommendationPanel.append(spots);
  [['recommend','推荐景点',recommendationPanel],['search','自由搜索',searchPanel]].forEach(([id,label,panel],index)=>{const button=make('button',index===0?'is-current':'',label);button.type='button';button.id='place-mode-'+id;button.setAttribute('role','tab');button.setAttribute('aria-selected',String(index===0));button.setAttribute('aria-controls',panel.id);button.addEventListener('click',()=>showPlaceMode(id));modeTabs.append(button);});
  const placeBody=make('div','wizard-scroll');placeBody.append(recommendationPanel,searchPanel);
  const placeFooter=make('div','wizard-footer');next.textContent='下一步 · 酒店与餐厅 →';placeFooter.append(nextNote,next);
  placeStep.append(intro,modeTabs,placeBody,placeFooter);
  const personalBody=make('div','wizard-scroll');personalBody.append(personal);
  const personalFooter=make('div','wizard-footer'),personalBack=make('button','planner-step-back','← 返回选择景点'),personalNext=make('button','gold-button','下一步 · 规划设置 →');personalBack.type=personalNext.type='button';personalBack.id='back-to-spots';personalNext.id='continue-to-settings';personalFooter.append(personalBack,personalNext);personalStep.append(personalBody,personalFooter);
  const back=make('button','planner-step-back','← 返回调整地点');back.type='button';back.id='back-to-places';
  const submit=make('div','planner-submit-bar');submit.append($('.generation-note'),$('#generate-plan'));
  const settingsBody=make('div','wizard-scroll settings-grid');settingsBody.append(dates,preferences,$('.ai-expectation'));
  back.textContent='← 返回酒店与餐厅';submit.classList.add('wizard-footer');submit.prepend(back);
  arrangeStep.append(settingsBody,submit);form.replaceChildren(placeStep,personalStep,arrangeStep);
  const nav=make('nav','planner-step-nav');nav.setAttribute('aria-label','规划步骤');
  const buttons=[['01','选择景点'],['02','酒店与餐厅'],['03','规划设置'],['04','生成路线']].map(([num,label],i)=>{const b=make('button','');b.type='button';b.append(make('span','',num),document.createTextNode(label));if(i<3)b.addEventListener('click',()=>showStep(i+1));else b.disabled=true;nav.append(b);return b;});
  $('.planning-heading').before(nav);$('.planning-heading .eyebrow').textContent='YOUR YUNNAN JOURNEY';$('.planning-heading p:not(.eyebrow)').textContent='先选你真正想去的地方，剩下的交给安排。';
  $('.demo-buttons')?.remove();$('.rule-explanation')?.remove();
  const heading=make('div','selection-summary-heading');heading.append(make('span','','我的地点清单'),make('strong','','0'));
  const ledger=make('div','selection-ledger');ledger.id='selection-ledger';aside.prepend(heading);aside.append(ledger,make('p','selection-summary-footnote','地点会保留在当前浏览器，调整后可以重新安排。'));
  function update(){
    const ids=[...form.querySelectorAll('input[name=spot]:checked')].map(n=>n.value),custom=window.RoamPlannerPersonal.context().places;
    heading.querySelector('strong').textContent=String(ids.length+custom.length);ledger.replaceChildren();
    if(!ids.length&&!custom.length)ledger.append(make('p','selection-ledger-empty','还没有想去的地方。可以从左侧景点开始选，也可以搜索自己的酒店和餐厅。'));
    for(const id of ids){const spot=window.RoamAttractions.get(id),row=make('div','selection-ledger-row'),remove=make('button','','×');remove.type='button';remove.setAttribute('aria-label','从清单移除'+spot.name);remove.addEventListener('click',()=>{const input=form.querySelector('input[name=spot][value="'+id+'"]');input.checked=false;input.dispatchEvent(new Event('change',{bubbles:true}));});row.append(make('span','',spot.name),remove);ledger.append(row);}
    for(const p of custom){const row=make('div','selection-ledger-row'),remove=make('button','','×');remove.type='button';remove.setAttribute('aria-label','从清单移除'+p.name);remove.addEventListener('click',()=>window.RoamPlannerPersonal.remove(p.id));row.append(make('span','',p.name),make('small','',p.kind==='hotel'?'住宿':p.kind==='restaurant'?'用餐':'自选'),remove);ledger.append(row);}
    next.disabled=!ids.length&&!custom.length;$('#selection-empty-hint').hidden=!next.disabled;buttons[1].disabled=buttons[2].disabled=next.disabled;
    form.querySelectorAll('input[name=spot]').forEach(input=>input.closest('.planner-choice-row').classList.toggle('is-selected',input.checked));
  }
  function showPlaceMode(mode){
    const recommendation=mode==='recommend';recommendationPanel.hidden=!recommendation;searchPanel.hidden=recommendation;
    modeTabs.querySelectorAll('button').forEach(button=>{const active=button.id==='place-mode-'+mode;button.classList.toggle('is-current',active);button.setAttribute('aria-selected',String(active));});
  }
  function showStep(step){
    update();if((step===2||step===3)&&next.disabled)return;
    placeStep.hidden=step!==1;personalStep.hidden=step!==2;arrangeStep.hidden=step!==3;document.body.dataset.plannerStep=String(step);
    buttons.forEach((b,i)=>{b.classList.toggle('is-current',i+1===step);if(i+1===step)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
    const titles={1:['先选地点，再出发。','从推荐景点中挑选，也可以搜索自己想去的地方。'],2:['安顿住处，也安排好每一餐。','添加酒店与餐厅；还没决定，可以跳过这一步。'],3:['按你的节奏，安排这一程。','选择天数、旅行偏好和出行方式，再生成路线。']};
    $('#planning-title').textContent=titles[step][0];$('.planning-heading p:not(.eyebrow)').textContent=titles[step][1];
    if(document.body.dataset.plannerView==='edit'){const qs=new URLSearchParams(location.search);qs.set('step',String(step));const selected=[...form.querySelectorAll('input[name=spot]:checked')].map(input=>input.value),must=[...form.querySelectorAll('input[name=must]:checked')].map(input=>input.value);if(selected.length)qs.set('spots',selected.join(','));else qs.delete('spots');if(must.length)qs.set('must',must.join(','));else qs.delete('must');history.replaceState(null,'',location.pathname+'?'+qs);}
    if($('#arrival-window').value!=='full'||$('#departure-window').value!=='full'||$('#arrival-time').value||$('#departure-time').value||!$('#same-end').checked||$('#additional-areas input:checked'))advanced.open=true;
  }
  next.addEventListener('click',()=>showStep(2));back.addEventListener('click',()=>showStep(2));personalBack.addEventListener('click',()=>showStep(1));personalNext.addEventListener('click',()=>showStep(3));
  form.addEventListener('change',update);new MutationObserver(update).observe($('#personal-places-list'),{childList:true,subtree:true});new MutationObserver(update).observe($('#planner-spot-choices'),{childList:true,subtree:true});$('#plan-area').addEventListener('change',()=>showStep(1));
  function searchPlaces(){if(searchInput.value.trim().length<2){searchHint.textContent='请输入至少两个字，再搜索你想去的地方。';searchInput.focus();return;}window.RoamPlaceSearch.open('other',null,null,searchInput.value.trim());}
  searchButton.addEventListener('click',searchPlaces);searchInput.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();event.stopPropagation();searchPlaces();}});
  quick.addEventListener('click',()=>{const draft=window.RoamRules.generate(window.RoamPlannerPersonal.settings());for(const id of draft.days.flatMap(d=>d.stops)){const input=form.querySelector('input[name=spot][value="'+id+'"]');if(input&&!input.checked){input.checked=true;input.dispatchEvent(new Event('change',{bubbles:true}));}}update();});
  const references=make('details','result-references');references.id='result-references';references.append(make('summary','','出发前要确认的事'));
  const referenceBody=make('div','result-reference-body');referenceBody.append($('#result-photo-note'),$('#template-reason'),$('#plan-warnings'));references.append(referenceBody);$('.travel-result-layout').after(references);
  const aiPanel=$('#ai-result-summary'),aiDetails=make('details','ai-result-summary');aiDetails.id=aiPanel.id;aiDetails.hidden=aiPanel.hidden;aiDetails.append(make('summary','','为什么这样安排？'));while(aiPanel.firstChild)aiDetails.append(aiPanel.firstChild);aiPanel.replaceWith(aiDetails);
  const refreshWarnings=()=>{const count=$('#plan-warnings').querySelectorAll('p').length;references.querySelector('summary').textContent='出发前要确认的事'+(count?' · '+count+' 条':'');if($('#plan-warnings .critical-warning'))references.open=true;};new MutationObserver(refreshWarnings).observe($('#plan-warnings'),{childList:true,subtree:true});refreshWarnings();
  $('#edit-plan').textContent='调整地点';$('#regenerate-plan').textContent='重新安排';$('#save-plan').firstChild.textContent='保存行程 ';
  const waitDialog=make('dialog','wizard-generation-dialog');waitDialog.id='wizard-generation-dialog';waitDialog.setAttribute('aria-labelledby','wizard-generation-title');
  const waitVisual=make('div','generation-orbit');waitVisual.setAttribute('aria-hidden','true');
  const waitKicker=make('p','step-kicker','04 / YOUR JOURNEY IS TAKING SHAPE'),waitTitle=make('h2','','正在安排，你的云南之旅');waitTitle.id='wizard-generation-title';
  const waitCopy=make('p','generation-description','DeepSeek 正在结合你选的地点与旅行偏好编排。生成后还会核验道路交通。');
  const progress=$('#ai-generation-progress'),dismissWait=make('button','wizard-dismiss','返回调整');dismissWait.id='dismiss-generation';dismissWait.type='button';dismissWait.hidden=true;dismissWait.addEventListener('click',()=>endGeneration());
  waitDialog.append(waitKicker,waitVisual,waitTitle,waitCopy,progress,dismissWait);document.body.append(waitDialog);
  waitDialog.addEventListener('cancel',event=>{event.preventDefault();if(waitDialog.dataset.state==='loading')$('#cancel-ai-generation').click();else endGeneration();});
  function beginGeneration(){waitDialog.dataset.state='loading';waitTitle.textContent='正在安排，你的云南之旅';waitCopy.textContent='DeepSeek 正在结合你选的地点与旅行偏好编排。生成后还会核验道路交通。';dismissWait.hidden=true;progress.hidden=false;if(!waitDialog.open)waitDialog.showModal();buttons[3].classList.add('is-current');}
  function generationFailed(cancelled){waitDialog.dataset.state='error';waitTitle.textContent=cancelled?'已暂停这次安排':'这次安排还未完成';waitCopy.textContent='你选的地点与设置都已保留，可以重试或返回调整。';dismissWait.hidden=false;}
  function endGeneration(){waitDialog.close();buttons[3].classList.remove('is-current');}
  window.RoamPlannerUI=Object.freeze({showStep,update,showPlaceMode,beginGeneration,generationFailed,endGeneration});
  const initialStep=Number(new URLSearchParams(location.search).get('step'));showStep([1,2,3].includes(initialStep)&&!next.disabled?initialStep:1);showPlaceMode('recommend');
})();
