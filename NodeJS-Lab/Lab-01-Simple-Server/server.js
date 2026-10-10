const http = require('http');

function handler(req, res) {
  if (req.url === '/') { res.writeHead(200); res.end('Welcome to Lab 01 server'); }
  else if (req.url === '/about') { res.writeHead(200); res.end('About page'); }
  else { res.writeHead(404); res.end('Page Not Found'); }
}

module.exports = handler;

if (require.main === module) {
  http.createServer(handler).listen(3000, () => console.log('Lab 01 running on 3000'));
}
