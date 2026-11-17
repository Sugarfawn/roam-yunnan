/* Confirmed local attraction photographs, shared by guides and itinerary results.
   Missing entries intentionally render as text, never as another place's photograph. */
(function () {
  'use strict';
  window.RoamAttractionPhotos = Object.freeze({
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
