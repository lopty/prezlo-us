import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';

const root = resolve('dist');
const hosted = process.argv.includes('--hosted');
const host = hosted ? '0.0.0.0' : '127.0.0.1';
const port = Number(hosted
  ? process.env.PORT || process.env.PREZLO_PREVIEW_PORT || 3000
  : process.env.PREZLO_PREVIEW_PORT || 4173);
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.jpg':'image/jpeg','.xml':'application/xml; charset=utf-8','.txt':'text/plain; charset=utf-8','.json':'application/json; charset=utf-8'};
createServer(async (request,response) => {
  let status = 200;
  let path;
  let body;
  try {
    const url = new URL(request.url,'http://localhost');
    const pathname = decodeURIComponent(url.pathname);
    path = resolve(root,'.'+pathname);
    if (path !== root && !path.startsWith(root+sep)) throw new Error('Invalid path.');
    if ((await stat(path)).isDirectory()) {
      if (!url.pathname.endsWith('/')) {
        response.writeHead(308,{Location:url.pathname+'/'+url.search});
        response.end();
        return;
      }
      path = resolve(path,'index.html');
    }
    body = await readFile(path);
  } catch {
    status = 404;
    path = resolve(root,'404.html');
    body = await readFile(path).catch(() => 'Page not found');
  }
  response.writeHead(status,{'Content-Type':types[extname(path)] || 'application/octet-stream'});
  response.end(request.method === 'HEAD' ? undefined : body);
}).listen(port,host,() => console.log('Local: http://127.0.0.1:'+port+'/'));
