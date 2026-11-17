/* Region presentation only. Geometry comes from the local GeoJSON, destinations join by adcode. */
window.RoamAtlasConfig=Object.freeze({
  provinceURL:'/data/yunnan-province.geojson',
  regionsURL:'/data/yunnan-prefectures.geojson',
  projection:Object.freeze({width:900,height:760,padding:45}),
  regions:Object.freeze([
    {adcode:530100,shortName:'昆明'}, {adcode:530300,shortName:'曲靖'},
    {adcode:530400,shortName:'玉溪'}, {adcode:530500,shortName:'保山'},
    {adcode:530600,shortName:'昭通'}, {adcode:530700,shortName:'丽江',labelOffset:[29,23]},
    {adcode:530800,shortName:'普洱'}, {adcode:530900,shortName:'临沧'},
    {adcode:532300,shortName:'楚雄'}, {adcode:532500,shortName:'红河'},
    {adcode:532600,shortName:'文山'}, {adcode:532800,shortName:'西双版纳',labelOffset:[-28,-25]},
    {adcode:532900,shortName:'大理',labelOffset:[-28,34]}, {adcode:533100,shortName:'德宏'},
    {adcode:533300,shortName:'怒江',labelOffset:[-10,0]}, {adcode:533400,shortName:'迪庆',labelOffset:[-10,0]}
  ].map(region=>Object.freeze(region)))
});
