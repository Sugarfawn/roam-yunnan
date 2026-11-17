/* Local static preview for the cover and province atlas. No external APIs. */
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=__dirname;
function createServer(){return http.createServer(async(req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
  let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);res.end();return;}
  const parts=pathname.split(/[\\/]/);
  if(pathname.includes('\0')||parts.some(part=>part.startsWith('.'))||/\.(?:cjs|cmd|env)$/i.test(pathname)){res.writeHead(404);res.end();return;}
  const relative=pathname==='/'?'/index.html':pathname;let file=path.resolve(root,'.'+relative);
  if(!file.startsWith(root+path.sep)){res.writeHead(404);res.end();return;}
  try{let stat=await fs.promises.stat(file);if(stat.isDirectory()){file=path.join(file,'index.html');stat=await fs.promises.stat(file);}if(!stat.isFile())throw Error('not-file');
    const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.geojson':'application/geo+json; charset=utf-8','.md':'text/plain; charset=utf-8','.webp':'image/webp','.png':'image/png'};
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Content-Length':stat.size,'Cache-Control':'no-cache'});
    if(req.method==='HEAD')res.end();else{const stream=fs.createReadStream(file);stream.on('error',()=>res.destroy());stream.pipe(res);}
  }catch{res.writeHead(404);res.end('Page not found');}
});}
if(require.main===module){const server=createServer();server.on('error',error=>{console.error(error.code==='EADDRINUSE'?'Port is in use. Set PORT or close the old cover preview.':error.message);process.exitCode=1;});server.listen(Number(process.env.PORT)||4175,'127.0.0.1',()=>console.log('Cover preview: http://127.0.0.1:'+(Number(process.env.PORT)||4175)+'/'));}
module.exports={createServer};
