/* Confirmed local attraction photographs, shared by guides and itinerary results.
   Missing entries intentionally render as text, never as another place's photograph. */
(function () {
  'use strict';
  window.RoamAttractionPhotos = Object.freeze({
    ...Object.fromEntries([
      ['dali-longkan','龙龛码头与湖岸'],['dali-panxi','磻溪村S湾'],['dali-wase','挖色镇'],['dali-xiaoputuo','小普陀'],['dali-wenbi','文笔村'],['dali-ideal','理想邦旅游度假小镇'],['dali-fengyangyi','凤阳邑'],['dali-jizhao','寂照庵'],['dali-canger','苍洱大道']
    ].map(([id,name])=>[id,Object.freeze({id,name,subject:name,src:'assets/dali-references/'+id+'.webp',author:'用户提供的攻略配图',license:'原摄影署名与授权待补',source:'/assets/dali-references/CREDITS.md',record:'/assets/dali-references/CREDITS.md',cropNote:'从用户提供的对应地点攻略照片裁切，去除周围文字；未作AI生成或调色。',downloadedAt:'2026-11-18'})])),
    'dali-wuhua':Object.freeze({id:'dali-wuhua',name:'五华楼',subject:'大理五华楼',src:'assets/dali-references/dali-wuhua.webp',author:'David Stanley',license:'CC BY 2.0',licenseUrl:'https://creativecommons.org/licenses/by/2.0/',source:'https://commons.wikimedia.org/wiki/File:Wuhua_Tower_(48570460141).jpg',record:'/assets/dali-references/CREDITS.md',cropNote:'裁切为3:2并转换WebP，未调色。'}),
    ...window.DaliAttractionPhotos,
    ...window.AdditionalAttractionPhotos,
    'lijiang-old-city': Object.freeze({
      id:'lijiang-old-city', name:'丽江古城', src:'assets/oldtown.webp',
      author:'chensiyuan', license:'CC BY-SA 4.0',
      licenseUrl:'https://creativecommons.org/licenses/by-sa/4.0/',
      source:'https://commons.wikimedia.org/wiki/File:1_lijiang_old_town_2012.jpg',
      processedDimensions:[1920,630],
      cropNote:'复用项目已有宽幅版本；卡片以 cover 取景，放大可查看整幅照片。',
      record:'/PHOTO-CREDITS.md'
    })
  });
})();
