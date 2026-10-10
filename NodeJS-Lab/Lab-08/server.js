const http = require('http');
const url = require('url');
const path = require('path');
const fs = require('fs');
const fsp = fs.promises;
const { execFile } = require('child_process');
const slugify = require('slugify');
const labs = require('./labs');
const { logger, LOG_FILE } = require('./modules/logger');

const PORT = process.env.PORT || 3000;
const ENV = process.env.RENDER ? 'live (Render)' : 'local';
const SHOTS = path.join(__dirname, 'public', 'screenshots');
const startedAt = Date.now();
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif' };

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const abs = (lab) => path.join(__dirname, lab.file);

function send(res, status, data) {
  const isObj = typeof data === 'object';
  res.writeHead(status, { 'Content-Type': isObj ? 'application/json' : 'text/html; charset=utf-8' });
  res.end(isObj ? JSON.stringify(data, null, 2) : data);
}
const page = (title, body) => `<!doctype html><meta charset="utf-8"><title>${title}</title>
<body style="font-family:Arial;max-width:900px;margin:30px auto;padding:0 16px">${body}</body>`;

function runScript(lab) {
  return new Promise((resolve) => {
    execFile(process.execPath, [abs(lab)], { cwd: path.dirname(abs(lab)), timeout: 5000 }, (err, stdout, stderr) => {
      resolve({ ok: !err, output: stdout, error: stderr || (err && err.message) || '' });
    });
  });
}

function shots(lab) {
  return fs.existsSync(SHOTS)
    ? fs.readdirSync(SHOTS).filter(f => f.startsWith('lab' + lab.id))
    : [];
}

const server = http.createServer(async (req, res) => {
  const { pathname, query } = url.parse(req.url, true);
  logger.emit('request', req.method, req.url);
  try {
    if (pathname === '/') {
      const rows = labs.map(l => `<li><b>Lab ${l.id}</b> – ${l.title} (${l.topic}) — <a href="/labs/${l.id}">details</a></li>`).join('');
      return send(res, 200, page('Lab Portal', `<h1>Node.js Lab Portal</h1><p>Environment: <b>${ENV}</b></p><ul>${rows}</ul><p><a href="/api/dashboard">Dashboard</a> · <a href="/health">Health</a> · <a href="/about">About</a></p>`));
    }
    if (pathname === '/about') {
      return send(res, 200, { project: 'CS403NOD Lab 08 – Integrated Server', author: process.env.STUDENT_NAME || 'Your Name', labs: labs.length });
    }
    if (pathname === '/health') {
      return send(res, 200, { status: 'ok', environment: ENV, uptimeSeconds: Math.round((Date.now() - startedAt) / 1000) });
    }
    if (pathname === '/labs') {
      return send(res, 200, labs.map(({ id, title, topic, type }) => ({ id, title, topic, type, slug: slugify(title, { lower: true }) })));
    }
    if (pathname === '/api/dashboard') {
      const [log, files] = await Promise.all([fsp.readFile(LOG_FILE, 'utf8').catch(() => ''), fsp.readdir(SHOTS).catch(() => [])]);
      return send(res, 200, { labs: labs.length, screenshots: files.length, requestsLogged: log.split('\n').filter(Boolean).length });
    }
    if (pathname.startsWith('/screenshots/')) {
      const file = path.join(SHOTS, path.basename(pathname));
      const type = MIME[path.extname(file).toLowerCase()];
      if (!type || !fs.existsSync(file)) return send(res, 404, { error: 'Screenshot not found' });
      res.writeHead(200, { 'Content-Type': type });
      return fs.createReadStream(file).pipe(res);
    }
    if (pathname.startsWith('/labs/')) {
      const parts = pathname.split('/');            // ['', 'labs', '01', 'run' | 'app', ...]
      const lab = labs.find(l => l.id === parts[2]);
      if (!lab) return send(res, 404, { error: 'Lab not found' });

      if (parts[3] === 'run') {
        if (lab.type !== 'script') return send(res, 400, { error: 'This is a server lab. Use /labs/' + lab.id + '/app' + (lab.try || '/') });
        return send(res, 200, await runScript(lab));
      }
      if (parts[3] === 'app') {
        if (lab.type !== 'server') return send(res, 400, { error: 'This is a script lab. Use /labs/' + lab.id + '/run' });
        req.url = '/' + parts.slice(4).join('/') + (req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '');
        return require(abs(lab))(req, res);
      }
      const code = await fsp.readFile(abs(lab), 'utf8');
      const action = lab.type === 'script'
        ? `<p><a href="/labs/${lab.id}/run">▶ Run this lab and see output</a></p>`
        : `<p><a href="/labs/${lab.id}/app${lab.try || '/'}">▶ Open this lab's server</a></p>`;
      const imgs = shots(lab).map(f => `<p>${f}<br><img src="/screenshots/${f}" style="max-width:100%;border:1px solid #999"></p>`).join('') || '<p><i>No screenshots added yet.</i></p>';
      return send(res, 200, page('Lab ' + lab.id, `<p><a href="/">← Portal</a></p><h2>Lab ${lab.id} – ${lab.title}</h2><p>Topic: ${lab.topic}</p>${action}<h3>Source code</h3><pre style="background:#f4f4f4;padding:12px;overflow:auto">${esc(code)}</pre><h3>Screenshots</h3>${imgs}`));
    }
    send(res, 404, { error: 'Route not found', path: pathname });
  } catch (err) {
    console.error(err);
    if (!res.headersSent) send(res, 500, { error: 'Internal Server Error' });
  }
});

server.listen(PORT, '0.0.0.0', () => console.log(`Lab 08 server running on port ${PORT} [${ENV}]`));
