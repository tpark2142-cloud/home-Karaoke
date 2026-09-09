const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const files = {'/': ['index.html', 'text/html'], '/index.html': ['index.html', 'text/html'], '/app.js': ['app.js', 'text/javascript'], '/i18n.js': ['i18n.js', 'text/javascript'], '/styles.css': ['styles.css', 'text/css']};
const server = http.createServer((req, res) => {
  const entry = files[new URL(req.url, 'http://localhost').pathname];
  if (!entry) { res.writeHead(404); return res.end('Not found'); }
  res.writeHead(200, {'Content-Type': entry[1] + '; charset=utf-8', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'Cache-Control': 'no-cache'});
  fs.createReadStream(path.join(__dirname, entry[0])).pipe(res);
});
let port = Number(process.env.PORT) || 4310;
server.on('error', error => { if (error.code === 'EADDRINUSE' && port < 4340) server.listen(++port, '127.0.0.1'); else { console.error(error); process.exit(1); } });
server.listen(port, '127.0.0.1', () => console.log(`Home Karaoke: http://127.0.0.1:${port}`));
