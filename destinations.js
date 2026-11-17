(function () {
  'use strict';

  // The map points identify destinations, not the exact camera positions of the photographs.
  const places = {
    meili: {
      shortName: '梅里雪山', region: '迪庆 · 德钦', county: '迪庆藏族自治州德钦县', prefectureAdcode:533400,
      coordinates: [98.869, 28.436], coordinateLabel: '飞来寺观景区域', coordinatePrecision: '区域代表点',
      category: '雪山与晨光', english: 'MEILI SNOW MOUNTAINS',
      lead: '把第一缕光，留给雪山。',
      introduction: '在德钦，群峰沿着高原天际线展开。从观景区域望向梅里，让山的轮廓和光线替旅程写下开场。',
      story: '梅里雪山位于云南西北部。这里的风景不只有雪峰，也有云层、峡谷与藏地村落。与其追赶一张标准照片，不如留足时间，等待属于当天的光。',
      highlights: ['在观景区域等待山峰显露', '观察云层与雪线的变化', '用相机记录高原天际线'],
      practical: '高原地区天气变化快。观景前核实天气和当地道路状况，量力安排活动；本页不提供登山或徒步线路。',
      labelOffset: [-180, -32],
      source: 'https://baike.baidu.com/item/梅里雪山/251340'
    },
    erhai: {
      shortName: '大理洱海', region: '大理 · 洱海', county: '大理白族自治州大理市', prefectureAdcode:532900,
      coordinates: [100.197, 25.779], coordinateLabel: '洱海中部水域', coordinatePrecision: '湖区代表点',
      category: '湖泊与夕光', english: 'ERHAI LAKE',
      lead: '看一场日落，慢慢认识大理。',
      introduction: '苍山与洱海之间，村落、小路和水面的光共同构成大理。把行程放慢，让一段沿湖的漫步成为目的本身。',
      story: '洱海是大理山水景观的重要组成部分。不同湖岸有不同的生活节奏：有开阔的水面，也有安静的村落。照片里的夕光是一种邀请，实际行程则从选择一段合适的湖岸开始。',
      highlights: ['沿开放的湖岸步道散步', '观察水面与远山的光影', '走进湖边村落与街巷'],
      practical: '图中标记位于湖区中部，用于省域定位，并非上车点或游览入口。请按实际选择的岸线核实交通与开放范围。',
      labelOffset: [42, 15],
      source: 'https://baike.baidu.com/item/洱海'
    },
    yulong: {
      shortName: '玉龙雪山', region: '丽江 · 玉龙', county: '丽江市玉龙纳西族自治县', prefectureAdcode:530700,
      coordinates: [100.176, 27.100], coordinateLabel: '玉龙雪山山体', coordinatePrecision: '山体代表点',
      category: '雪峰与倒影', english: 'JADE DRAGON SNOW MOUNTAIN',
      lead: '往山的方向，遇见更开阔的自己。',
      introduction: '雪线映着高原长空，山峰的倒影留在水面。玉龙雪山让丽江的旅行多了一种尺度：从街巷走向群峰。',
      story: '玉龙雪山位于丽江北侧。晴天、云雾、晨光，会让同一片山体呈现完全不同的表情。选一处合适的观景位置，给这份开阔留一点时间。',
      highlights: ['远望雪峰与高原天际线', '记录晨光中的山体色彩', '感受丽江山地景观的层次'],
      practical: '山体标记不是景区检票口。索道、景区预约及天气限制请以官方实时信息为准，高海拔活动应考虑个人身体状况。',
      labelOffset: [-175, 8],
      source: 'https://baike.baidu.com/item/玉龙雪山'
    },
    shangri: {
      shortName: '阿布吉措', region: '香格里拉 · 小中甸', county: '迪庆藏族自治州香格里拉市小中甸镇', prefectureAdcode:533400,
      coordinates: [99.907616, 27.668792], coordinateLabel: '阿布吉措湖区', coordinatePrecision: '地点 POI',
      category: '高山湖泊与草坡', english: 'ABUJI CUO · SHANGRI-LA',
      lead: '在群山之间，遇见一抹湖光。',
      introduction: '群山围拢着绿松石色的湖水，草坡延向远处。阿布吉措的安静，属于愿意慢下来观察的人。',
      story: '阿布吉措位于香格里拉小中甸镇的山地环境中，与普达措是不同地点。这里的高山湖泊、岩壁和草坡构成层次鲜明的风景，也需要对自然条件保持尊重。',
      highlights: ['欣赏湖水与山体的色彩对比', '观察草甸、岩壁与雪线层次', '在合适条件下记录高山湖景'],
      practical: '高山野外环境对天气、体能和向导条件有要求。请出发前核实当地管理要求；本页是目的地介绍，不是徒步导航或安全路线。',
      labelOffset: [43, -24],
      source: 'https://www.poi86.com/poi/amap/71096.html'
    },
    banna: {
      shortName: '西双版纳雨林', region: '西双版纳 · 勐仑', county: '西双版纳傣族自治州勐腊县勐仑镇', prefectureAdcode:532800,
      coordinates: [101.252, 21.929], coordinateLabel: '勐仑热带植物园区域', coordinatePrecision: '雨林体验区域代表点',
      category: '热带森林与植物', english: 'TROPICAL XISHUANGBANNA',
      lead: '走进绿色，让感官重新出发。',
      introduction: '热带叶片、层叠树影与湿润空气，让云南的南端呈现另一种风景。在西双版纳，慢下来认识植物与森林。',
      story: '西双版纳的热带森林分布于多个区域，并非一个单独景点。地图以勐仑热带植物园区域作为探索入口，展示雨林体验的地理位置，不代表 Jack Wu 这张照片的精确拍摄位置。',
      highlights: ['在开放的游览区域认识热带植物', '观察叶片、藤本与林下层次', '用照片收集森林里的绿色'],
      practical: '此标记为区域代表点。选择实际游览地点后，再核实开放时间、园区预约及交通；请留在允许进入的游览范围内。',
      labelOffset: [43, 12],
      source: 'https://www.xtbg.ac.cn/'
    }
  };

  // Presentation copy stays beside destination data; itinerary facts remain in attractions.js.
  const items=Object.entries(places).map(([id,place],index)=>{
    const photo=window.HomePhotos.find(item=>item.id===id);
    return Object.freeze({...photo,...place,id,source:photo.source,locationSource:place.source,number:String(index+1).padStart(2,'0'),mapUrl:'/explore/yunnan/?place='+id});
  });
  window.RoamDestinations=Object.freeze({items:Object.freeze(items),get(id){return items.find(item=>item.id===id)||null;}});
})();
