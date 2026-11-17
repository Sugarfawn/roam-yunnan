(function(){
  'use strict';
  const slides=[
    {id:'yulong',city:'丽江',region:'丽江 / LIJIANG',name:'玉龙雪山',english:'THE SNOW MOUNTAIN',title:['去有雪山的地方，','把日子过慢一点。'],description:['抬头是玉龙雪山，转身是古城街巷。','从丽江开始，遇见云南的另一种日常。'],author:'CEphoto, Uwe Aranas',license:'CC BY-SA 3.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/3.0/',source:'https://commons.wikimedia.org/wiki/File:Lijiang_Yunnan_China_Jade-Dragon-Snow-Mountain-01.jpg',position:'54% 50%'},
    {id:'erhai',city:'大理',region:'大理 / DALI',name:'大理洱海',english:'A LAKESIDE DAYDREAM',title:['把时间留给洱海，','让风替你赶路。'],description:['看云落在水面，沿村路随意走走。','在大理，给旅程留一点没有安排的空白。'],author:'Nishino Asuka',license:'CC BY-SA 4.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/4.0/',source:'https://commons.wikimedia.org/wiki/File:Erhai_Lake_in_2023.jpg',position:'50% 64%'},
    {id:'oldtown',city:'丽江',region:'丽江 / LIJIANG',name:'丽江古城',english:'STORIES IN THE OLD TOWN',title:['走进古城的日常，','听见另一种节奏。'],description:['一层层青瓦，一条条通向远方的小巷。','不必急着打卡，故事就在转角。'],author:'chensiyuan',license:'CC BY-SA 4.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/4.0/',source:'https://commons.wikimedia.org/wiki/File:1_lijiang_old_town_2012.jpg',position:'53% 55%'},
    {id:'dianchi',city:'昆明',region:'昆明 / KUNMING',name:'昆明滇池',english:'SLOW DAYS IN SPRING CITY',title:['沿着滇池的风，','遇见春城的温柔。'],description:['去湖边散步，也去老街找一顿喜欢的饭。','从昆明出发，让旅行回到舒服的速度。'],author:'Ngguls（祝鱼贵）',license:'CC BY-SA 4.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/4.0/',source:'https://commons.wikimedia.org/wiki/File:20260222_Kunming_Dianchi_Lake_PANO.jpg',position:'40% 50%'}
  ];
  const $=s=>document.querySelector(s),cover=$('#travel-cover'),cards=$('#cover-cards'),layers=[...document.querySelectorAll('.cover-backdrop')];
  let active=0,visibleLayer=0,timer=null,paused=false,hovered=false,focused=false,version=0;
  const reduced=window.matchMedia?window.matchMedia('(prefers-reduced-motion: reduce)'):null;
  if(reduced&&reduced.matches)paused=true;
  cards.innerHTML=slides.map((s,i)=>`<button class="cover-card ${i===0?'selected':''}" data-slide="${i}" aria-label="查看${s.name}照片" aria-pressed="${i===0}"><img src="assets/${s.id}-card.webp" alt="${s.name}实景" loading="eager" style="object-position:${s.position}"><span class="cover-card-shade"></span><span class="cover-card-copy"><small>${String(i+1).padStart(2,'0')} / ${s.city}</small><strong>${s.name}</strong><i>${s.english}</i></span><span class="cover-card-check">↗</span></button>`).join('');
  function syncTimer(){clearInterval(timer);timer=null;if(!paused&&!hovered&&!focused&&!document.hidden)timer=setInterval(()=>select((active+1)%slides.length,false),6500)}
  function updatePause(){const b=$('#cover-pause');b.textContent=paused?'▷':'Ⅱ';b.setAttribute('aria-pressed',String(paused));b.setAttribute('aria-label',paused?'开始自动轮播':'暂停自动轮播')}
  function select(index,manual=true){
    active=(index+slides.length)%slides.length;const s=slides[active],token=++version;
    $('#cover-region').textContent=s.region;
    $('#cover-title').replaceChildren(...s.title.flatMap((t,i)=>i?[document.createElement('br'),document.createTextNode(t)]:[document.createTextNode(t)]));
    $('#cover-description').replaceChildren(...s.description.flatMap((t,i)=>i?[document.createElement('br'),document.createTextNode(t)]:[document.createTextNode(t)]));
    $('#cover-cta-label').textContent=`规划${s.city}行程`;$('#cover-location').textContent=`实景摄影 · ${s.name}`;$('#cover-index').textContent=String(active+1).padStart(2,'0');
    [...cards.children].forEach((c,i)=>{c.classList.toggle('selected',i===active);c.setAttribute('aria-pressed',String(i===active))});
    const selected=cards.children[active];
    if(cards.scrollTo&&selected&&(selected.offsetLeft<cards.scrollLeft||selected.offsetLeft+selected.offsetWidth>cards.scrollLeft+cards.clientWidth))cards.scrollTo({left:Math.max(0,selected.offsetLeft-cards.offsetLeft-4),behavior:reduced&&reduced.matches?'instant':'smooth'});
    const incoming=layers[1-visibleLayer];
    incoming.onload=()=>{if(token!==version)return;incoming.classList.add('current');layers[visibleLayer].classList.remove('current');visibleLayer=1-visibleLayer;incoming.onload=null};
    incoming.onerror=()=>{if(token!==version)return;incoming.onload=null;cover.dataset.photoError='true'};
    incoming.style.objectPosition=s.position;incoming.src=`assets/${s.id}.webp`;
    if(manual){$('#cover-announcement').textContent=`第 ${active+1} 张，共 ${slides.length} 张：${s.name}`;syncTimer()}
  }
  [...cards.children].forEach(b=>b.addEventListener('click',()=>select(Number(b.dataset.slide))));
  $('#cover-prev').addEventListener('click',()=>select(active-1));$('#cover-next').addEventListener('click',()=>select(active+1));
  $('#cover-pause').addEventListener('click',()=>{paused=!paused;updatePause();syncTimer()});
  cover.addEventListener('mouseenter',()=>{hovered=true;syncTimer()});cover.addEventListener('mouseleave',()=>{hovered=false;syncTimer()});
  cover.addEventListener('focusin',()=>{focused=true;syncTimer()});cover.addEventListener('focusout',e=>{if(!cover.contains(e.relatedTarget)){focused=false;syncTimer()}});
  document.addEventListener('visibilitychange',syncTimer);
  cover.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();select(active+(e.key==='ArrowRight'?1:-1))}});
  let touchStart=null;
  cover.addEventListener('touchstart',e=>{touchStart=e.target.closest('.cover-cards')?null:{x:e.touches[0].clientX,y:e.touches[0].clientY}},{passive:true});
  cover.addEventListener('touchend',e=>{if(!touchStart)return;const dx=e.changedTouches[0].clientX-touchStart.x,dy=e.changedTouches[0].clientY-touchStart.y;if(Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.5)select(active+(dx<0?1:-1));touchStart=null},{passive:true});
  $('#cover-plan').addEventListener('click',()=>{const city=$('#city');city.value=slides[active].city;city.dispatchEvent(new Event('change',{bubbles:true}));$('#trip-workspace').scrollIntoView({behavior:reduced&&reduced.matches?'instant':'smooth',block:'start'});city.focus({preventScroll:true})});
  $('#credits-list').innerHTML=slides.map(s=>`<article class="photo-credit"><img src="assets/${s.id}-card.webp" alt=""><div><h3>${s.name}</h3><p>摄影：${s.author}</p><a href="${s.source}" target="_blank" rel="noopener noreferrer">查看原图与作者 ↗</a><a href="${s.licenseUrl}" target="_blank" rel="noopener noreferrer">${s.license} ↗</a></div></article>`).join('');
  $('#photo-credits').addEventListener('click',()=>$('#credits-dialog').showModal());
  layers[0].style.objectPosition=slides[0].position;
  updatePause();syncTimer();
})();
