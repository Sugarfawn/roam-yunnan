(function(root){
  'use strict';
  let pending;
  function load(){
    if(pending)return pending;
    const config=root.RoamMapConfig;
    if(!config?.key||!config?.securityJsCode)return Promise.reject(new Error('地图尚未配置，请在本地配置文件中填写高德 JS API 凭证。'));
    root._AMapSecurityConfig={securityJsCode:config.securityJsCode};
    pending=new Promise((resolve,reject)=>{
      const start=()=>root.AMapLoader.load({key:config.key,version:'2.0',plugins:['AMap.PlaceSearch','AMap.Geocoder']}).then(resolve,()=>reject(new Error('地图加载失败，请检查 JS API 服务、域名配置或网络后重试。')));
      if(root.AMapLoader){start();return;}
      const script=document.createElement('script');script.src='https://webapi.amap.com/loader.js';script.async=true;script.onload=start;script.onerror=()=>{script.remove();reject(new Error('地图服务暂时无法连接，请检查网络后重试。'));};document.head.append(script);
    });
    let timer;
    pending=Promise.race([pending,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('地图加载超时，请检查网络后重试。')),25000);})]).finally(()=>clearTimeout(timer)).catch(error=>{pending=null;throw error;});
    return pending;
  }
  const cityFor=area=>({erhai:'大理市',yulong:'丽江市',meili:'德钦县',shangri:'香格里拉市',banna:'西双版纳傣族自治州'})[area]||'云南省';
  function poi(value){
    const location=value?.location;
    const coordinates=location&&typeof location.getLng==='function'?[location.getLng(),location.getLat()]:null;
    const adcode=String(value?.adcode||'');
    if(!value?.id||!value?.name||!coordinates?.every(Number.isFinite))return null;
    return{provider:'amap',poiId:String(value.id),name:String(value.name),address:typeof value.address==='string'?value.address:'',city:typeof value.cityname==='string'?value.cityname:'',adcode,coordinates,coordinateSystem:'GCJ-02'};
  }
  async function search(keyword,area,kind){
    const AMap=await load();
    const types={hotel:'100000',restaurant:'050000',other:''};
    const searcher=new AMap.PlaceSearch({city:cityFor(area),citylimit:true,pageSize:8,extensions:'base',type:types[kind]||''});
    return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(new Error('地点查询超时，请重试。')),18000);
      searcher.search(keyword,(status,result)=>{clearTimeout(timer);if(status==='no_data'){resolve([]);return;}if(status!=='complete'){reject(new Error('地点搜索失败，请检查地图服务权限或网络后重试。'));return;}resolve((result?.poiList?.pois||[]).map(poi).filter(Boolean));});
    });
  }
  async function resolve(candidate){
    const AMap=await load();
    return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(new Error('地点所在地区确认超时，请重试。')),15000);
      new AMap.Geocoder({extensions:'base'}).getAddress(candidate.coordinates,(status,result)=>{
        clearTimeout(timer);
        const component=result?.regeocode?.addressComponent;
        if(status!=='complete'||!component?.adcode){reject(new Error('暂时无法确认地点所属地区，请重新选择。'));return;}
        if(!String(component.adcode).startsWith('53')){reject(new Error('这个地点不在云南省内，请调整关键词后重新选择。'));return;}
        resolve({...candidate,adcode:String(component.adcode),city:typeof component.city==='string'?component.city:component.district||'',address:candidate.address||result.regeocode.formattedAddress||''});
      });
    });
  }
  root.RoamAMap=Object.freeze({load,search,resolve,cityFor});
})(window);
