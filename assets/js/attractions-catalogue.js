/* Adapt the shared verified catalogue to the selection UI. No generated ticket or traffic data. */
(function(){
 const A=window.RoamAttractions,D=window.RoamDestinations,photos=window.RoamAttractionPhotos;
 const labels={nature:'自然',town:'古镇',culture:'人文',photo:'摄影',food:'美食',highland:'高海拔',hike:'徒步',dedicated:'独立游玩日'};
 window.RoamPickCatalogue=Object.freeze(Object.fromEntries(D.items.map(p=>[p.id,Object.freeze({
 id:p.id,name:p.shortName,en:p.english,city:p.city,prefecture:p.region,kicker:p.english,intro:p.introduction,photo:p.background,author:p.author,
 items:A.byRegion[p.id].map(spot=>Object.freeze({
 id:spot.id,name:spot.name,area:spot.zone,duration:spot.estimate?spot.estimate.min+'–'+spot.estimate.max+' 分钟（编辑估算，不含交通）':'游览时长待确认',
 tags:spot.kind.map(k=>labels[k]).filter(Boolean),note:spot.intro+(spot.caution?' '+spot.caution:''),
 source:spot.source,photo:photos[spot.id]||null
 }))
 })])));
})();
