/**
 * =========================================================================================
 * DEV SANSKRITI VISHWAVIDYALAYA (DSVV) - HARIDWAR
 * DEPARTMENT OF COMPUTER SCIENCE
 * CS403NOD: Node.js Lab Practical Demonstrations
 * =========================================================================================
 * 
 * Main server handling web routes, lab modules, and student capstone APIs.
 * Written with native Node.js core modules (http, url, path, fs).
 * 
 * Run locally:
 *   node server.js
 *   URL: http://localhost:3000
 * =========================================================================================
 */

const http = require('http');
const url = require('url');
const path = require('path');
const fs = require('fs');
const fsp = fs.promises;
const { execFile } = require('child_process');
const slugify = require('slugify');

// Application modules
const { logger, LOG_FILE } = require('./modules/logger');
const { getStudents, getNotes, addNote } = require('./modules/storage');

// Port configuration (compatible with Render cloud and local machine)
const PORT = process.env.PORT || 3000;
const startedAt = Date.now();
const LOGO_PATH = path.join(__dirname, 'public', 'logo.png');

// Catalog of student laboratory exercises
const labs = [
  {
    id: '01',
    title: 'Simple HTTP Server',
    topic: 'http module, request routing, status codes',
    type: 'server',
    file: path.join(__dirname, 'NodeJS-Lab', 'Lab-01-Simple-Server', 'server.js'),
    description: 'Creates a basic HTTP server routing requests for root (/) and about (/about) with HTTP status codes.',
    learningObjectives: [
      'Create an HTTP server with http.createServer()',
      'Read request URLs and route requests',
      'Set response status codes and headers with res.writeHead()',
      'Send responses with res.end()'
    ],
    cliCommand: 'node NodeJS-Lab/Lab-01-Simple-Server/server.js',
    endpoints: [
      { label: 'Root (/)', path: '/labs/01/app/' },
      { label: 'About (/about)', path: '/labs/01/app/about' },
      { label: '404 Route (/invalid)', path: '/labs/01/app/invalid' }
    ]
  },
  {
    id: '02',
    title: 'Student Directory API',
    topic: 'JSON headers, query parameters',
    type: 'server',
    file: path.join(__dirname, 'NodeJS-Lab', 'Lab-02-Student-Directory', 'server.js'),
    description: 'REST-style JSON endpoint returning student records with query parameter filtering (?course=BCA).',
    learningObjectives: [
      'Parse query strings with url.parse()',
      'Set application/json Content-Type headers',
      'Filter data arrays based on user query parameters',
      'Send structured JSON responses'
    ],
    cliCommand: 'node NodeJS-Lab/Lab-02-Student-Directory/server.js',
    endpoints: [
      { label: 'All Students', path: '/labs/02/app/students' },
      { label: 'Course: BCA', path: '/labs/02/app/students?course=BCA' },
      { label: 'Course: BSc IT', path: '/labs/02/app/students?course=BSc%20IT' }
    ]
  },
  {
    id: '03',
    title: 'Async Food Delivery Simulation',
    topic: 'Promises, async/await, Promise.all',
    type: 'script',
    file: path.join(__dirname, 'NodeJS-Lab', 'Lab-03-Async-Food-Delivery', 'food.js'),
    description: 'Simulates concurrent order preparation and courier assignment running in parallel using Promise.all.',
    learningObjectives: [
      'Understand asynchronous execution in Node.js',
      'Wrap setTimeout inside custom Promises',
      'Run parallel operations with Promise.all()',
      'Use async/await syntax cleanly'
    ],
    cliCommand: 'node NodeJS-Lab/Lab-03-Async-Food-Delivery/food.js'
  },
  {
    id: '04',
    title: 'Modules and npm Packages',
    topic: 'require(), package.json, slugify',
    type: 'script',
    file: path.join(__dirname, 'NodeJS-Lab', 'Lab-04-Modules-npm', 'app.js'),
    description: 'Demonstrates module imports and third-party npm package integration using the slugify library.',
    learningObjectives: [
      'Initialize package.json with npm init',
      'Install dependencies with npm install',
      'Import packages with require()',
      'Generate clean URL slugs from strings'
    ],
    cliCommand: 'node NodeJS-Lab/Lab-04-Modules-npm/app.js'
  },
  {
    id: '06',
    title: 'File System Operations (fs)',
    topic: 'fs module, writing and reading files',
    type: 'script',
    file: path.join(__dirname, 'NodeJS-Lab', 'Lab-06-File-System', 'fs-demo.js'),
    description: 'Writes, appends, and reads files on disk using the native Node.js fs module.',
    learningObjectives: [
      'Import the native fs and path modules',
      'Create and overwrite files with fs.writeFileSync()',
      'Add data to existing files with fs.appendFileSync()',
      'Read file contents with fs.readFileSync()'
    ],
    cliCommand: 'node NodeJS-Lab/Lab-06-File-System/fs-demo.js'
  },
  {
    id: '07',
    title: 'EventEmitter',
    topic: 'events module, observer pattern',
    type: 'script',
    file: path.join(__dirname, 'NodeJS-Lab', 'Lab-07-EventEmitter', 'emitter.js'),
    description: 'Registers event listeners (.on) and emits custom events (.emit) with data arguments.',
    learningObjectives: [
      'Understand event-driven programming in Node.js',
      'Instantiate EventEmitter objects',
      'Attach listeners using .on()',
      'Dispatch custom events using .emit()'
    ],
    cliCommand: 'node NodeJS-Lab/Lab-07-EventEmitter/emitter.js'
  }
];

// Helper: Standardized HTTP response sender
function send(res, status, data, contentType) {
  const isObj = typeof data === 'object' && !(data instanceof Buffer);
  const type = contentType || (isObj ? 'application/json' : 'text/html; charset=utf-8');
  res.writeHead(status, {
    'Content-Type': type,
    'Access-Control-Allow-Origin': '*'
  });
  res.end(isObj ? JSON.stringify(data, null, 2) : data);
}

// Helper: Execute student scripts in child process
function runScript(filePath) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    execFile(process.execPath, [filePath], { cwd: path.dirname(filePath), timeout: 5000 }, (err, stdout, stderr) => {
      resolve({
        ok: !err,
        durationMs: Date.now() - t0,
        output: (stdout || '').trim(),
        error: (stderr || (err && err.message) || '').trim()
      });
    });
  });
}

// Clean, human-designed stylesheet with Node.js colors
const SHARED_CSS = `
  :root {
    --node-green: #539e43;
    --node-green-hover: #417e35;
    --node-green-light: #f0fdf4;
    --node-dark: #1b2126;
    --bg-page: #f8fafc;
    --card-bg: #ffffff;
    --text-main: #1e293b;
    --text-muted: #64748b;
    --border-color: #e2e8f0;
    --terminal-bg: #1e293b;
    --terminal-text: #f1f5f9;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background-color: var(--bg-page);
    color: var(--text-main);
    line-height: 1.5;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .top-accent {
    height: 4px;
    background-color: var(--node-green);
    width: 100%;
  }

  .container {
    max-width: 1140px;
    margin: 0 auto;
    padding: 0 20px;
    width: 100%;
  }

  /* Academic Header */
  header {
    background-color: var(--node-dark);
    color: #ffffff;
    padding: 20px 0;
  }

  .header-content {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
  }

  .header-brand {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .header-logo {
    height: 46px;
    max-width: 180px;
    object-fit: contain;
  }

  .header-titles h1 {
    font-size: 1.35rem;
    font-weight: 700;
    color: #ffffff;
    line-height: 1.2;
  }

  .header-titles p {
    color: #94a3b8;
    font-size: 0.85rem;
    margin-top: 2px;
  }

  .header-tag {
    font-size: 0.8rem;
    color: #cbd5e1;
    font-weight: 500;
  }

  /* Navigation Bar */
  .nav-section {
    background: #ffffff;
    border-bottom: 1px solid var(--border-color);
    padding: 10px 0;
  }
  .nav-bar {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
  }
  .nav-btn {
    padding: 6px 14px;
    border-radius: 6px;
    background: transparent;
    border: 1px solid transparent;
    color: var(--text-muted);
    font-family: inherit;
    font-weight: 600;
    font-size: 0.85rem;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.15s ease;
  }
  .nav-btn:hover {
    background: var(--node-green-light);
    color: var(--node-green);
  }
  .nav-btn.active {
    background: var(--node-green);
    color: #ffffff;
  }

  main {
    flex: 1;
    padding: 30px 0 50px;
  }

  .section-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--node-dark);
    margin-bottom: 4px;
  }
  .section-desc {
    font-size: 0.88rem;
    color: var(--text-muted);
    margin-bottom: 20px;
  }

  /* Grid Layout */
  .labs-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 20px;
    margin-bottom: 44px;
  }

  .card {
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-top: 3px solid var(--node-green);
    border-radius: 8px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  }

  .card-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }
  .lab-badge {
    font-size: 0.74rem;
    font-weight: 700;
    color: var(--node-green);
    background: var(--node-green-light);
    padding: 2px 8px;
    border-radius: 4px;
    text-transform: uppercase;
  }
  .lab-type {
    font-size: 0.72rem;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
  }

  .card h3 {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text-main);
    margin-bottom: 4px;
  }
  .card-topic {
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--node-green);
    margin-bottom: 10px;
  }
  .card-desc {
    font-size: 0.85rem;
    color: var(--text-muted);
    margin-bottom: 18px;
    flex-grow: 1;
  }

  .btn-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 7px 13px;
    border-radius: 6px;
    font-family: inherit;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.15s ease;
    border: 1px solid transparent;
  }
  .btn-primary {
    background: var(--node-green);
    color: #ffffff;
  }
  .btn-primary:hover {
    background: var(--node-green-hover);
  }
  .btn-secondary {
    background: #ffffff;
    color: var(--text-main);
    border-color: var(--border-color);
  }
  .btn-secondary:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
  }
  .btn-sm {
    padding: 5px 10px;
    font-size: 0.78rem;
  }

  /* Capstone Layout */
  .capstone-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 20px;
  }

  .capstone-card {
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-top: 3px solid var(--node-green);
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  }
  .capstone-card h3 {
    font-size: 1.05rem;
    font-weight: 700;
    margin-bottom: 4px;
  }
  .capstone-desc {
    font-size: 0.82rem;
    color: var(--text-muted);
    margin-bottom: 14px;
  }

  .stats-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-bottom: 16px;
  }
  .stat-box {
    background: #f8fafc;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 10px;
    text-align: center;
  }
  .stat-val {
    font-size: 1.4rem;
    font-weight: 700;
    color: var(--node-green);
  }
  .stat-lbl {
    font-size: 0.7rem;
    color: var(--text-muted);
    font-weight: 600;
    text-transform: uppercase;
    margin-top: 2px;
  }

  .form-group {
    display: flex;
    gap: 8px;
    margin-top: 10px;
  }
  .input-field {
    flex: 1;
    background: #ffffff;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 7px 10px;
    font-family: inherit;
    font-size: 0.85rem;
    outline: none;
  }
  .input-field:focus {
    border-color: var(--node-green);
  }

  .notes-list {
    margin-top: 12px;
    max-height: 180px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .note-item {
    background: #f8fafc;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 8px 10px;
    font-size: 0.82rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .terminal-box {
    background: var(--terminal-bg);
    border-radius: 6px;
    padding: 12px;
    font-family: 'JetBrains Mono', Consolas, monospace;
    font-size: 0.78rem;
    color: var(--terminal-text);
    white-space: pre-wrap;
    max-height: 360px;
    overflow-y: auto;
  }

  /* Modals */
  .modal-overlay {
    display: none;
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(15, 23, 42, 0.6);
    z-index: 1000;
    padding: 20px;
    align-items: center;
    justify-content: center;
  }
  .modal-overlay.open { display: flex; }

  .modal-card {
    background: #ffffff;
    border-radius: 8px;
    max-width: 780px;
    width: 100%;
    max-height: 88vh;
    overflow-y: auto;
    padding: 22px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.15);
  }
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--border-color);
  }
  .modal-header h3 { font-size: 1.15rem; color: var(--node-dark); font-weight: 700; }
  .modal-close {
    background: transparent;
    border: none;
    font-size: 1.4rem;
    cursor: pointer;
    color: var(--text-muted);
    line-height: 1;
  }
  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 14px;
    padding-top: 10px;
    border-top: 1px solid var(--border-color);
  }

  /* Academic Clean Footer */
  footer {
    background: #ffffff;
    border-top: 1px solid var(--border-color);
    padding: 22px 0;
    margin-top: auto;
    font-size: 0.82rem;
    color: var(--text-muted);
  }
  .footer-content {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 14px;
  }
  .footer-brand {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .footer-logo {
    height: 34px;
    max-width: 140px;
    object-fit: contain;
  }
  footer a {
    color: var(--node-green);
    text-decoration: none;
  }
  footer a:hover {
    text-decoration: underline;
  }

  @media (max-width: 768px) {
    .header-content { flex-direction: column; align-items: flex-start; }
    .footer-content { flex-direction: column; align-items: flex-start; }
  }
`;

// Helper: Academic Header
function getHeaderHTML(breadcrumb) {
  return `
    <div class="top-accent"></div>
    <header>
      <div class="container">
        <div class="header-content">
          <div class="header-brand">
            <a href="/" style="display:inline-block;line-height:0;">
              <img src="/logo.png" alt="Dev Sanskriti Vishwavidyalaya" class="header-logo" onerror="this.style.display='none'">
            </a>
            <div class="header-titles">
              <h1>Dev Sanskriti Vishwavidyalaya</h1>
              <p>Department of Computer Science &bull; Node.js Laboratory ${breadcrumb ? ' &bull; ' + breadcrumb : ''}</p>
            </div>
          </div>
          <div class="header-tag">
            Course: CS403NOD
          </div>
        </div>
      </div>
    </header>
  `;
}

// Helper: Clean Academic Footer (Removed "CS403NOD Node.js Runtime Portal")
function getFooterHTML() {
  return `
    <footer>
      <div class="container">
        <div class="footer-content">
          <div class="footer-brand">
            <img src="/logo.png" alt="DSVV Logo" class="footer-logo" onerror="this.style.display='none'">
            <div>
              <b>Dev Sanskriti Vishwavidyalaya</b> &bull; Department of Computer Science<br>
              <span style="font-size:0.75rem;">Haridwar, Uttarakhand, India</span>
            </div>
          </div>
          <div>
            API Routes: 
            <a href="/api/students" target="_blank">/api/students</a> &bull; 
            <a href="/api/notes" target="_blank">/api/notes</a> &bull; 
            <a href="/api/dashboard" target="_blank">/api/dashboard</a> &bull; 
            <a href="/health" target="_blank">/health</a>
          </div>
        </div>
      </div>
    </footer>
  `;
}

// Portal Homepage HTML
function getPortalHTML() {
  const labCardsHTML = labs.map(lab => {
    let actionMarkup = '';
    if (lab.type === 'script') {
      actionMarkup = `
        <div class="btn-row" style="margin-bottom:8px;">
          <a class="btn btn-primary btn-sm" href="/labs/${lab.id}">Open Lab Workspace</a>
        </div>
        <div class="btn-row">
          <button class="btn btn-secondary btn-sm" onclick="openTerminalModal('${lab.id}', '${lab.title}')">Run Script</button>
          <button class="btn btn-secondary btn-sm" onclick="openCodeModal('${lab.id}', '${lab.title}')">View Code</button>
        </div>
      `;
    } else {
      const endpointButtons = (lab.endpoints || []).map(ep => 
        `<button class="btn btn-secondary btn-sm" onclick="openEndpointModal('${ep.path}', '${lab.title}: ${ep.label}')">${ep.label}</button>`
      ).join('');
      actionMarkup = `
        <div class="btn-row" style="margin-bottom:8px;">
          <a class="btn btn-primary btn-sm" href="/labs/${lab.id}">Open Lab Workspace</a>
        </div>
        <div class="btn-row" style="margin-bottom:8px;">${endpointButtons}</div>
        <div class="btn-row">
          <a class="btn btn-secondary btn-sm" href="${lab.endpoints[0].path}" target="_blank">Raw Endpoint</a>
          <button class="btn btn-secondary btn-sm" onclick="openCodeModal('${lab.id}', '${lab.title}')">View Code</button>
        </div>
      `;
    }

    return `
      <div class="card" data-type="${lab.type}">
        <div class="card-top">
          <span class="lab-badge">LAB ${lab.id}</span>
          <span class="lab-type">${lab.type}</span>
        </div>
        <h3>${lab.title}</h3>
        <div class="card-topic">${lab.topic}</div>
        <div class="card-desc">${lab.description}</div>
        <div class="actions">
          ${actionMarkup}
        </div>
      </div>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Node.js Lab Practical Demonstrations • Dev Sanskriti Vishwavidyalaya</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    ${SHARED_CSS}
  </style>
</head>
<body>
  ${getHeaderHTML('')}

  <!-- Navigation Filters -->
  <div class="nav-section">
    <div class="container">
      <div class="nav-bar">
        <button class="nav-btn active" onclick="filterCards('all', this)">All Labs</button>
        <button class="nav-btn" onclick="filterCards('script', this)">Script Labs</button>
        <button class="nav-btn" onclick="filterCards('server', this)">Server Labs</button>
        <a href="#capstone-panel" class="nav-btn">Capstone Demo</a>
        <button class="nav-btn" onclick="openModal('setup-modal')" style="margin-left:auto;">Student Setup Guide</button>
      </div>
    </div>
  </div>

  <main>
    <div class="container">

      <h2 class="section-title">Laboratory Exercises</h2>
      <p class="section-desc">Select any laboratory exercise below to run it live, view code, or open its workspace.</p>

      <!-- Labs Cards Grid -->
      <div class="labs-grid" id="labs-grid">
        ${labCardsHTML}
      </div>

      <!-- Capstone Section -->
      <h2 class="section-title" id="capstone-panel">Capstone Project Demo</h2>
      <p class="section-desc">Demonstration of data storage, student directory query, and event logging.</p>

      <div class="capstone-grid">
        
        <!-- Metrics -->
        <div class="capstone-card">
          <h3>Server Statistics</h3>
          <p class="capstone-desc">Values retrieved from /api/dashboard.</p>
          
          <div class="stats-row">
            <div class="stat-box">
              <div class="stat-val" id="stat-students">-</div>
              <div class="stat-lbl">Students</div>
            </div>
            <div class="stat-box">
              <div class="stat-val" id="stat-notes">-</div>
              <div class="stat-lbl">Notes</div>
            </div>
            <div class="stat-box">
              <div class="stat-val" id="stat-requests">-</div>
              <div class="stat-lbl">Requests</div>
            </div>
          </div>

          <div class="btn-row">
            <button class="btn btn-secondary btn-sm" onclick="fetchDashboard()">Refresh Stats</button>
            <a class="btn btn-secondary btn-sm" href="/health" target="_blank">Health Endpoint</a>
            <a class="btn btn-secondary btn-sm" href="/about" target="_blank">About Endpoint</a>
          </div>
        </div>

        <!-- Student Directory Query -->
        <div class="capstone-card">
          <h3>Student Directory (/api/students)</h3>
          <p class="capstone-desc">Filter records by course or semester.</p>
          
          <div class="btn-row" style="margin-bottom: 10px;">
            <button class="btn btn-secondary btn-sm" onclick="fetchStudents('')">All</button>
            <button class="btn btn-secondary btn-sm" onclick="fetchStudents('?course=BCA')">Course: BCA</button>
            <button class="btn btn-secondary btn-sm" onclick="fetchStudents('?course=BSc%20IT')">Course: BSc IT</button>
            <button class="btn btn-secondary btn-sm" onclick="fetchStudents('?semester=5')">Semester 5</button>
          </div>

          <div id="students-terminal" class="terminal-box" style="max-height:120px;">
            Select a filter to query students...
          </div>
        </div>

        <!-- Notes Persistence -->
        <div class="capstone-card">
          <h3>Notes Storage (data/notes.json)</h3>
          <p class="capstone-desc">Add a note to write to disk using fs.promises.</p>
          
          <div class="form-group">
            <input type="text" id="note-input" class="input-field" placeholder="Enter note text...">
            <button class="btn btn-primary btn-sm" onclick="submitNote()">Save</button>
          </div>

          <div class="notes-list" id="notes-container">
            <div style="font-size:0.8rem;color:var(--text-muted);padding:6px;">Loading notes...</div>
          </div>
        </div>

      </div>

    </div>
  </main>

  <!-- Modals -->
  <!-- 1. Code Viewer Modal -->
  <div class="modal-overlay" id="code-modal" onclick="if(event.target===this)closeModal('code-modal')">
    <div class="modal-card">
      <div class="modal-header">
        <div>
          <h3 id="code-modal-title">Source Code</h3>
          <p id="code-modal-subtitle" style="font-size:0.82rem;color:var(--text-muted);"></p>
        </div>
        <button class="modal-close" onclick="closeModal('code-modal')">&times;</button>
      </div>
      <pre class="terminal-box" id="code-modal-body" style="max-height:50vh;background:#0f172a;"></pre>
      <div class="modal-actions">
        <button class="btn btn-secondary btn-sm" onclick="copyContent('code-modal-body', this)">Copy Code</button>
        <button class="btn btn-primary btn-sm" onclick="closeModal('code-modal')">Close</button>
      </div>
    </div>
  </div>

  <!-- 2. Terminal Script Runner Modal -->
  <div class="modal-overlay" id="terminal-modal" onclick="if(event.target===this)closeModal('terminal-modal')">
    <div class="modal-card">
      <div class="modal-header">
        <div>
          <h3 id="terminal-modal-title">Terminal Output</h3>
          <p id="terminal-modal-subtitle" style="font-size:0.82rem;color:var(--text-muted);"></p>
        </div>
        <button class="modal-close" onclick="closeModal('terminal-modal')">&times;</button>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:0.8rem;margin-bottom:8px;color:var(--text-muted);">
        <span id="terminal-modal-status">Running...</span>
        <span id="terminal-modal-duration">0 ms</span>
      </div>
      <pre class="terminal-box" id="terminal-modal-body" style="max-height:45vh;"></pre>
      <div class="modal-actions">
        <button class="btn btn-secondary btn-sm" onclick="rerunCurrentScript()">Re-run</button>
        <button class="btn btn-secondary btn-sm" onclick="copyContent('terminal-modal-body', this)">Copy Output</button>
        <button class="btn btn-primary btn-sm" onclick="closeModal('terminal-modal')">Close</button>
      </div>
    </div>
  </div>

  <!-- 3. API Response Inspector Modal -->
  <div class="modal-overlay" id="endpoint-modal" onclick="if(event.target===this)closeModal('endpoint-modal')">
    <div class="modal-card">
      <div class="modal-header">
        <div>
          <h3 id="endpoint-modal-title">API Response</h3>
          <p id="endpoint-modal-url" style="font-family:monospace;color:var(--node-green);font-size:0.82rem;"></p>
        </div>
        <button class="modal-close" onclick="closeModal('endpoint-modal')">&times;</button>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:0.8rem;margin-bottom:8px;color:var(--text-muted);">
        <span>Response Body</span>
        <span id="endpoint-modal-status" style="font-weight:700;color:var(--node-green);">200 OK</span>
      </div>
      <pre class="terminal-box" id="endpoint-modal-body" style="max-height:45vh;"></pre>
      <div class="modal-actions">
        <a class="btn btn-secondary btn-sm" id="endpoint-tab-link" href="#" target="_blank">Open in Tab</a>
        <button class="btn btn-secondary btn-sm" onclick="copyContent('endpoint-modal-body', this)">Copy Response</button>
        <button class="btn btn-primary btn-sm" onclick="closeModal('endpoint-modal')">Close</button>
      </div>
    </div>
  </div>

  <!-- 4. Setup Guide Modal -->
  <div class="modal-overlay" id="setup-modal" onclick="if(event.target===this)closeModal('setup-modal')">
    <div class="modal-card">
      <div class="modal-header">
        <div>
          <h3>Running Exercises Locally</h3>
          <p style="font-size:0.82rem;color:var(--text-muted);">Commands to test and run in your terminal</p>
        </div>
        <button class="modal-close" onclick="closeModal('setup-modal')">&times;</button>
      </div>
      <div style="font-size:0.88rem;line-height:1.6;">
        <p><b>1. Verify Node.js version:</b></p>
        <pre class="terminal-box" style="margin:8px 0 14px;">node -v\nnpm -v</pre>

        <p><b>2. Run individual exercises:</b></p>
        <pre class="terminal-box" style="margin:8px 0 14px;"># Lab 01 (Simple HTTP Server)\nnode NodeJS-Lab/Lab-01-Simple-Server/server.js\n\n# Lab 03 (Async Delivery)\nnode NodeJS-Lab/Lab-03-Async-Food-Delivery/food.js\n\n# Lab 06 (File System)\nnode NodeJS-Lab/Lab-06-File-System/fs-demo.js</pre>

        <p><b>3. Run the main server:</b></p>
        <pre class="terminal-box" style="margin:8px 0 14px;">node server.js\n# Browser: http://localhost:3000</pre>
      </div>
      <div class="modal-actions">
        <button class="btn btn-primary btn-sm" onclick="closeModal('setup-modal')">Close</button>
      </div>
    </div>
  </div>

  ${getFooterHTML()}

  <script>
    let activeScriptId = null;

    function filterCards(type, btn) {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.card').forEach(c => {
        if (type === 'all' || c.dataset.type === type) {
          c.style.display = 'flex';
        } else {
          c.style.display = 'none';
        }
      });
    }

    function openModal(id) {
      document.getElementById(id).classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function closeModal(id) {
      document.getElementById(id).classList.remove('open');
      document.body.style.overflow = '';
    }
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
        document.body.style.overflow = '';
      }
    });

    async function openCodeModal(labId, labTitle) {
      document.getElementById('code-modal-title').textContent = 'Lab ' + labId + ': ' + labTitle;
      document.getElementById('code-modal-subtitle').textContent = 'Source code from repository';
      const body = document.getElementById('code-modal-body');
      body.textContent = 'Loading...';
      openModal('code-modal');

      try {
        const res = await fetch('/labs/' + labId + '/code');
        const data = await res.json();
        body.textContent = data.code || 'Code not available';
      } catch (e) {
        body.textContent = 'Failed to load: ' + e.message;
      }
    }

    async function openTerminalModal(labId, labTitle) {
      activeScriptId = labId;
      document.getElementById('terminal-modal-title').textContent = 'Lab ' + labId + ': ' + labTitle;
      document.getElementById('terminal-modal-subtitle').textContent = 'Executing with Node.js child process';
      const body = document.getElementById('terminal-modal-body');
      const status = document.getElementById('terminal-modal-status');
      const duration = document.getElementById('terminal-modal-duration');
      
      status.textContent = 'Running...';
      duration.textContent = '...';
      body.textContent = 'Starting process...';
      openModal('terminal-modal');

      try {
        const res = await fetch('/labs/' + labId + '/run');
        const data = await res.json();
        duration.textContent = (data.durationMs || 0) + ' ms';
        if (data.ok) {
          status.textContent = 'Exit code: 0';
          body.textContent = data.output || '(No output)';
        } else {
          status.textContent = 'Error';
          body.textContent = (data.output ? data.output + '\\n' : '') + data.error;
        }
      } catch (err) {
        status.textContent = 'Failed';
        body.textContent = 'Execution failed: ' + err.message;
      }
    }

    function rerunCurrentScript() {
      if (activeScriptId) {
        const lab = ${JSON.stringify(labs)}.find(l => l.id === activeScriptId);
        openTerminalModal(activeScriptId, lab ? lab.title : 'Lab ' + activeScriptId);
      }
    }

    async function openEndpointModal(url, title) {
      document.getElementById('endpoint-modal-title').textContent = title;
      document.getElementById('endpoint-modal-url').textContent = 'GET ' + url;
      document.getElementById('endpoint-tab-link').href = url;
      const statusBadge = document.getElementById('endpoint-modal-status');
      const body = document.getElementById('endpoint-modal-body');

      statusBadge.textContent = 'Fetching...';
      body.textContent = 'Sending request...';
      openModal('endpoint-modal');

      try {
        const res = await fetch(url);
        statusBadge.textContent = res.status + ' ' + (res.status === 200 ? 'OK' : 'Response');
        const text = await res.text();
        try {
          body.textContent = JSON.stringify(JSON.parse(text), null, 2);
        } catch {
          body.textContent = text;
        }
      } catch (e) {
        statusBadge.textContent = 'Error';
        body.textContent = 'Request failed: ' + e.message;
      }
    }

    function copyContent(elementId, btn) {
      const text = document.getElementById(elementId).textContent;
      navigator.clipboard.writeText(text);
      const orig = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => btn.textContent = orig, 1800);
    }

    async function fetchDashboard() {
      try {
        const res = await fetch('/api/dashboard');
        const data = await res.json();
        document.getElementById('stat-students').textContent = data.students ?? '-';
        document.getElementById('stat-notes').textContent = data.notes ?? '-';
        document.getElementById('stat-requests').textContent = data.requestsLogged ?? '-';
      } catch (e) {
        console.error(e);
      }
    }

    async function fetchStudents(params) {
      const box = document.getElementById('students-terminal');
      box.textContent = 'Fetching /api/students' + params + '...';
      try {
        const res = await fetch('/api/students' + params);
        const data = await res.json();
        box.textContent = JSON.stringify(data, null, 2);
      } catch (e) {
        box.textContent = 'Error: ' + e.message;
      }
    }

    async function loadNotes() {
      try {
        const res = await fetch('/api/notes');
        const notes = await res.json();
        const container = document.getElementById('notes-container');
        if (!notes.length) {
          container.innerHTML = '<div style="font-size:0.8rem;color:var(--text-muted);padding:6px;">No notes recorded yet.</div>';
          return;
        }
        container.innerHTML = notes.slice(-5).reverse().map(n => 
          '<div class="note-item"><span><b>#' + n.id + '</b> ' + n.text + '</span><span style="font-size:0.72rem;color:var(--text-muted);font-family:monospace;">' + (n.createdAt ? new Date(n.createdAt).toLocaleTimeString() : '') + '</span></div>'
        ).join('');
      } catch (e) {
        console.error(e);
      }
    }

    async function submitNote() {
      const input = document.getElementById('note-input');
      const text = input.value.trim();
      if (!text) return alert('Enter note text');
      try {
        await fetch('/api/notes/add?text=' + encodeURIComponent(text));
        input.value = '';
        await loadNotes();
        await fetchDashboard();
      } catch (e) {
        alert('Error: ' + e.message);
      }
    }

    fetchDashboard();
    fetchStudents('');
    loadNotes();
  </script>
</body>
</html>`;
}

// Dedicated Inside Page for each Lab Module
function getLabDetailHTML(lab, code) {
  let interactiveWorkspaceHTML = '';

  if (lab.id === '01') {
    interactiveWorkspaceHTML = `
      <div style="background:#ffffff;border:1px solid var(--border-color);border-radius:8px;padding:20px;margin-bottom:24px;">
        <h3 style="margin-bottom:6px;font-size:1.1rem;">HTTP Request Tester</h3>
        <p style="font-size:0.86rem;color:var(--text-muted);margin-bottom:14px;">Test route handling and status codes on this server.</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;">
          <button class="btn btn-primary btn-sm" onclick="sendLabRequest('/labs/01/app/')">GET /</button>
          <button class="btn btn-secondary btn-sm" onclick="sendLabRequest('/labs/01/app/about')">GET /about</button>
          <button class="btn btn-secondary btn-sm" onclick="sendLabRequest('/labs/01/app/invalid')">GET /invalid (404)</button>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;background:#f1f5f9;padding:8px 12px;border-radius:6px;font-family:monospace;font-size:0.8rem;margin-bottom:8px;">
          <span>Path: <b id="lab01-url">/labs/01/app/</b></span>
          <span id="lab01-status" style="font-weight:700;color:var(--node-green);">200 OK</span>
        </div>
        <div id="lab01-output" class="terminal-box" style="max-height:160px;">Welcome to Lab 01 server</div>
      </div>
      <script>
        async function sendLabRequest(url) {
          document.getElementById('lab01-url').textContent = url;
          const out = document.getElementById('lab01-output');
          const statusBadge = document.getElementById('lab01-status');
          out.textContent = 'Sending request...';
          try {
            const res = await fetch(url);
            statusBadge.textContent = res.status + ' ' + (res.status === 200 ? 'OK' : 'Not Found');
            statusBadge.style.color = res.status === 200 ? 'var(--node-green)' : '#dc2626';
            const text = await res.text();
            out.textContent = text;
          } catch(e) {
            out.textContent = 'Error: ' + e.message;
          }
        }
      </script>
    `;
  } else if (lab.id === '02') {
    interactiveWorkspaceHTML = `
      <div style="background:#ffffff;border:1px solid var(--border-color);border-radius:8px;padding:20px;margin-bottom:24px;">
        <h3 style="margin-bottom:6px;font-size:1.1rem;">Student Query Tester</h3>
        <p style="font-size:0.86rem;color:var(--text-muted);margin-bottom:14px;">Filter records using query parameters.</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;">
          <button class="btn btn-secondary btn-sm" onclick="queryStudents('')">All</button>
          <button class="btn btn-secondary btn-sm" onclick="queryStudents('?course=BCA')">Course: BCA</button>
          <button class="btn btn-secondary btn-sm" onclick="queryStudents('?course=BSc%20IT')">Course: BSc IT</button>
        </div>
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;font-size:0.86rem;text-align:left;">
            <thead>
              <tr style="background:#f1f5f9;border-bottom:2px solid var(--border-color);">
                <th style="padding:8px 12px;">ID</th>
                <th style="padding:8px 12px;">Name</th>
                <th style="padding:8px 12px;">Course</th>
              </tr>
            </thead>
            <tbody id="student-table-body">
              <tr><td colspan="3" style="padding:12px;text-align:center;color:var(--text-muted);">Loading students...</td></tr>
            </tbody>
          </table>
        </div>
        <div style="margin-top:12px;">
          <div style="font-size:0.78rem;font-weight:600;color:var(--text-muted);margin-bottom:4px;">JSON RESPONSE:</div>
          <pre id="student-raw-json" class="terminal-box" style="max-height:140px;"></pre>
        </div>
      </div>
      <script>
        async function queryStudents(query) {
          const tbody = document.getElementById('student-table-body');
          const rawBox = document.getElementById('student-raw-json');
          try {
            const res = await fetch('/labs/02/app/students' + query);
            const data = await res.json();
            rawBox.textContent = JSON.stringify(data, null, 2);
            tbody.innerHTML = data.map(s => 
              '<tr style="border-bottom:1px solid var(--border-color);"><td style="padding:8px 12px;font-family:monospace;font-weight:700;">#' + s.id + '</td><td style="padding:8px 12px;font-weight:600;">' + s.name + '</td><td style="padding:8px 12px;">' + s.course + '</td></tr>'
            ).join('');
          } catch(e) {
            tbody.innerHTML = '<tr><td colspan="3" style="padding:12px;color:#dc2626;">Error: ' + e.message + '</td></tr>';
          }
        }
        queryStudents('');
      </script>
    `;
  } else if (lab.id === '03') {
    interactiveWorkspaceHTML = `
      <div style="background:#ffffff;border:1px solid var(--border-color);border-radius:8px;padding:20px;margin-bottom:24px;">
        <h3 style="margin-bottom:6px;font-size:1.1rem;">Async Execution Demo</h3>
        <p style="font-size:0.86rem;color:var(--text-muted);margin-bottom:14px;">Runs food.js child process executing tasks concurrently with Promise.all.</p>
        
        <div style="margin-bottom:14px;">
          <button class="btn btn-primary btn-sm" id="btn-run-delivery" onclick="simulateDelivery()">Run food.js</button>
        </div>

        <div style="font-size:0.78rem;font-weight:600;color:var(--text-muted);margin-bottom:4px;">OUTPUT:</div>
        <pre id="delivery-console" class="terminal-box">Click "Run food.js" to execute.</pre>
      </div>
      <script>
        async function simulateDelivery() {
          const btn = document.getElementById('btn-run-delivery');
          const con = document.getElementById('delivery-console');
          btn.disabled = true;
          con.textContent = 'Running node food.js...';
          try {
            const res = await fetch('/labs/03/run');
            const data = await res.json();
            con.textContent = data.output + '\\n\\n(Executed in ' + data.durationMs + ' ms)';
          } catch(e) {
            con.textContent = 'Error: ' + e.message;
          } finally {
            btn.disabled = false;
          }
        }
      </script>
    `;
  } else if (lab.id === '04') {
    interactiveWorkspaceHTML = `
      <div style="background:#ffffff;border:1px solid var(--border-color);border-radius:8px;padding:20px;margin-bottom:24px;">
        <h3 style="margin-bottom:6px;font-size:1.1rem;">Slugify Package Demo</h3>
        <p style="font-size:0.86rem;color:var(--text-muted);margin-bottom:14px;">Convert strings to URL slugs using the npm slugify package.</p>
        
        <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">
          <input type="text" id="slug-input" class="input-field" value="Dev Sanskriti Vishwavidyalaya CS403NOD" style="flex:2;min-width:240px;">
          <button class="btn btn-primary btn-sm" onclick="generateSlug()">Compute Slug</button>
          <button class="btn btn-secondary btn-sm" onclick="runScriptLive('04')">Run app.js</button>
        </div>

        <div style="background:#f1f5f9;border:1px solid var(--border-color);border-radius:6px;padding:10px 12px;font-family:monospace;font-size:0.84rem;margin-bottom:12px;">
          <span style="color:var(--text-muted);">Slug:</span> <b id="slug-result" style="color:var(--node-green);">dev-sanskriti-vishwavidyalaya-cs403nod</b>
        </div>

        <div style="font-size:0.78rem;font-weight:600;color:var(--text-muted);margin-bottom:4px;">SCRIPT OUTPUT:</div>
        <pre id="script-out-04" class="terminal-box">Ready.</pre>
      </div>
      <script>
        function generateSlug() {
          const val = document.getElementById('slug-input').value;
          const slug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
          document.getElementById('slug-result').textContent = slug;
        }
        async function runScriptLive(id) {
          const con = document.getElementById('script-out-' + id);
          con.textContent = 'Running node app.js...';
          try {
            const res = await fetch('/labs/' + id + '/run');
            const data = await res.json();
            con.textContent = data.output + '\\n\\n(Executed in ' + data.durationMs + ' ms)';
          } catch(e) {
            con.textContent = 'Error: ' + e.message;
          }
        }
      </script>
    `;
  } else if (lab.id === '06') {
    interactiveWorkspaceHTML = `
      <div style="background:#ffffff;border:1px solid var(--border-color);border-radius:8px;padding:20px;margin-bottom:24px;">
        <h3 style="margin-bottom:6px;font-size:1.1rem;">File System Operations</h3>
        <p style="font-size:0.86rem;color:var(--text-muted);margin-bottom:14px;">Runs fs-demo.js demonstrating write, append, and read.</p>
        
        <div style="margin-bottom:14px;">
          <button class="btn btn-primary btn-sm" onclick="runScriptLive('06')">Run fs-demo.js</button>
        </div>

        <div style="font-size:0.78rem;font-weight:600;color:var(--text-muted);margin-bottom:4px;">OUTPUT:</div>
        <pre id="script-out-06" class="terminal-box">Ready to execute.</pre>
      </div>
      <script>
        async function runScriptLive(id) {
          const con = document.getElementById('script-out-' + id);
          con.textContent = 'Running node fs-demo.js...';
          try {
            const res = await fetch('/labs/' + id + '/run');
            const data = await res.json();
            con.textContent = data.output + '\\n\\n(Completed in ' + data.durationMs + ' ms)';
          } catch(e) {
            con.textContent = 'Error: ' + e.message;
          }
        }
      </script>
    `;
  } else if (lab.id === '07') {
    interactiveWorkspaceHTML = `
      <div style="background:#ffffff;border:1px solid var(--border-color);border-radius:8px;padding:20px;margin-bottom:24px;">
        <h3 style="margin-bottom:6px;font-size:1.1rem;">EventEmitter Demo</h3>
        <p style="font-size:0.86rem;color:var(--text-muted);margin-bottom:14px;">Emits custom events to test listener callbacks.</p>
        
        <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">
          <input type="text" id="event-payload" class="input-field" value="Kadhi Chawal" style="flex:2;min-width:200px;" placeholder="Item name...">
          <button class="btn btn-primary btn-sm" onclick="triggerClientEvent()">Emit 'order' Event</button>
          <button class="btn btn-secondary btn-sm" onclick="runScriptLive('07')">Run emitter.js</button>
        </div>

        <div style="font-size:0.78rem;font-weight:600;color:var(--text-muted);margin-bottom:4px;">EVENT LOG:</div>
        <pre id="script-out-07" class="terminal-box">Listening for events...</pre>
      </div>
      <script>
        function triggerClientEvent() {
          const val = document.getElementById('event-payload').value.trim() || 'Item';
          const con = document.getElementById('script-out-07');
          con.textContent += '\\n[' + new Date().toLocaleTimeString() + '] Emitted "order" -> Listener received: ' + val;
          con.scrollTop = con.scrollHeight;
        }
        async function runScriptLive(id) {
          const con = document.getElementById('script-out-' + id);
          try {
            const res = await fetch('/labs/' + id + '/run');
            const data = await res.json();
            con.textContent += '\\n[' + new Date().toLocaleTimeString() + '] node emitter.js:\\n' + data.output;
            con.scrollTop = con.scrollHeight;
          } catch(e) {
            con.textContent += '\\nError: ' + e.message;
          }
        }
      </script>
    `;
  }

  const objectivesList = (lab.learningObjectives || []).map(obj => 
    `<li style="margin-bottom:4px;">${obj}</li>`
  ).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lab ${lab.id}: ${lab.title} • Dev Sanskriti Vishwavidyalaya</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    ${SHARED_CSS}

    .breadcrumb-nav {
      background: #ffffff;
      border-bottom: 1px solid var(--border-color);
      padding: 10px 0;
      font-size: 0.85rem;
    }
    .breadcrumb-nav a {
      color: var(--node-green);
      text-decoration: none;
      font-weight: 600;
    }

    .detail-hero {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-top: 3px solid var(--node-green);
      border-radius: 8px;
      padding: 22px;
      margin-bottom: 22px;
    }
    .detail-hero h2 {
      font-size: 1.35rem;
      color: var(--node-dark);
      margin-bottom: 4px;
    }
    .detail-topic {
      font-size: 0.84rem;
      font-weight: 600;
      color: var(--node-green);
      margin-bottom: 10px;
    }
    .detail-desc {
      font-size: 0.88rem;
      color: var(--text-muted);
      line-height: 1.5;
    }

    .two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 22px;
    }
    @media (max-width: 820px) {
      .two-col { grid-template-columns: 1fr; }
    }

    .info-card {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 18px;
    }
    .info-card h3 {
      font-size: 1.05rem;
      margin-bottom: 10px;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 6px;
    }
  </style>
</head>
<body>
  ${getHeaderHTML('Lab ' + lab.id)}

  <div class="breadcrumb-nav">
    <div class="container">
      <a href="/">&larr; Return to All Labs</a>
    </div>
  </div>

  <main>
    <div class="container">

      <!-- Module Hero -->
      <div class="detail-hero">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <span class="lab-badge">LAB ${lab.id}</span>
          <span class="lab-type">${lab.type.toUpperCase()}</span>
        </div>
        <h2>${lab.title}</h2>
        <div class="detail-topic">Topics: ${lab.topic}</div>
        <p class="detail-desc">${lab.description}</p>
      </div>

      <!-- Interactive Playground -->
      ${interactiveWorkspaceHTML}

      <!-- Educational Walkthrough -->
      <div class="two-col">
        
        <div class="info-card">
          <h3>Learning Objectives</h3>
          <ul style="padding-left:18px;font-size:0.85rem;line-height:1.6;">
            ${objectivesList}
          </ul>
        </div>

        <div class="info-card">
          <h3>Run Locally in Terminal</h3>
          <p style="font-size:0.84rem;color:var(--text-muted);margin-bottom:8px;">Command to test this lab standalone:</p>
          <pre class="terminal-box" style="margin-top:0;">${lab.cliCommand}</pre>
        </div>

      </div>

      <!-- Source Code -->
      <div class="info-card" style="margin-bottom:24px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <h3 style="margin-bottom:0;border-bottom:none;padding-bottom:0;">Source Code</h3>
          <button class="btn btn-secondary btn-sm" onclick="navigator.clipboard.writeText(document.getElementById('raw-code').textContent);this.textContent='Copied!';setTimeout(()=>this.textContent='Copy',2000)">Copy</button>
        </div>
        <pre class="terminal-box" id="raw-code" style="margin-top:0;background:#0f172a;">${code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
      </div>

    </div>
  </main>

  ${getFooterHTML()}
</body>
</html>`;
}

// HTTP Server Request Router
const server = http.createServer(async (req, res) => {
  const { pathname, query } = url.parse(req.url, true);

  // Log incoming request
  logger.emit('request', req.method, req.url);

  try {
    // 1. Static University Logo
    if (pathname === '/logo.png') {
      try {
        const logoData = await fsp.readFile(LOGO_PATH);
        return send(res, 200, logoData, 'image/png');
      } catch (err) {
        return send(res, 404, 'Logo not found', 'text/plain');
      }
    }

    // 2. Main Portal Homepage
    if (pathname === '/') {
      return send(res, 200, getPortalHTML());
    }

    // 3. Health Endpoint
    if (pathname === '/health') {
      return send(res, 200, {
        status: 'ok',
        institution: 'Dev Sanskriti Vishwavidyalaya',
        department: 'Department of Computer Science',
        uptimeSeconds: Math.round((Date.now() - startedAt) / 1000)
      });
    }

    // 4. About Endpoint
    if (pathname === '/about') {
      return send(res, 200, {
        project: 'CS403NOD Node.js Lab Demos',
        institution: 'Dev Sanskriti Vishwavidyalaya',
        department: 'Department of Computer Science',
        author: process.env.STUDENT_NAME || 'Hemant Singh',
        labsCount: labs.length
      });
    }

    // 5. Inside Lab Workspace: /labs/:id
    const labDetailMatch = pathname.match(/^\/labs\/(\d+)$/);
    if (labDetailMatch) {
      const id = labDetailMatch[1];
      const lab = labs.find(l => l.id === id);
      if (!lab) return send(res, 404, '<h1>404: Lab Not Found</h1>', 'text/html');
      const code = await fsp.readFile(lab.file, 'utf8').catch(() => '// Source code could not be loaded');
      return send(res, 200, getLabDetailHTML(lab, code));
    }

    // 6. Lab Script Runner Endpoint: /labs/:id/run
    const runMatch = pathname.match(/^\/labs\/(\d+)\/run$/);
    if (runMatch) {
      const id = runMatch[1];
      const lab = labs.find(l => l.id === id);
      if (!lab) return send(res, 404, { error: 'Lab not found' });
      if (lab.type !== 'script') return send(res, 400, { error: 'Lab is a server' });
      const result = await runScript(lab.file);
      return send(res, 200, result);
    }

    // 7. Lab Source Code Endpoint: /labs/:id/code
    const codeMatch = pathname.match(/^\/labs\/(\d+)\/code$/);
    if (codeMatch) {
      const id = codeMatch[1];
      const lab = labs.find(l => l.id === id);
      if (!lab) return send(res, 404, { error: 'Lab not found' });
      try {
        const code = await fsp.readFile(lab.file, 'utf8');
        return send(res, 200, { id: lab.id, title: lab.title, code });
      } catch (e) {
        return send(res, 500, { error: 'Could not read file: ' + e.message });
      }
    }

    // 8. Sub-Server Handlers: /labs/01/app/..., /labs/02/app/...
    if (pathname.startsWith('/labs/')) {
      const parts = pathname.split('/');
      const labId = parts[2];
      const subAction = parts[3];
      const lab = labs.find(l => l.id === labId);

      if (lab && subAction === 'app' && lab.type === 'server') {
        const restPath = '/' + parts.slice(4).join('/');
        const queryString = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
        req.url = restPath + queryString;
        try {
          const handler = require(lab.file);
          return handler(req, res);
        } catch (err) {
          return send(res, 500, { error: 'Handler execution failed: ' + err.message });
        }
      }
    }

    // 9. Capstone Students API
    if (pathname === '/api/students') {
      let students = await getStudents();
      if (query.course) students = students.filter(s => s.course.toLowerCase() === query.course.toLowerCase());
      if (query.semester) students = students.filter(s => s.semester === Number(query.semester));
      return send(res, 200, { count: students.length, students });
    }

    if (pathname.startsWith('/api/students/')) {
      const id = Number(pathname.split('/')[3]);
      const student = (await getStudents()).find(s => s.id === id);
      if (!student) return send(res, 404, { error: 'Student not found' });
      return send(res, 200, { ...student, slug: slugify(student.name, { lower: true }) });
    }

    // 10. Capstone Notes API
    if (pathname === '/api/notes') {
      return send(res, 200, await getNotes());
    }

    if (pathname === '/api/notes/add') {
      if (!query.text) return send(res, 400, { error: 'text query parameter is required' });
      return send(res, 201, await addNote(query.text));
    }

    // 11. Capstone Dashboard Telemetry API
    if (pathname === '/api/dashboard') {
      const [students, notes, log] = await Promise.all([
        getStudents(),
        getNotes(),
        fsp.readFile(LOG_FILE, 'utf8').catch(() => '')
      ]);
      return send(res, 200, {
        students: students.length,
        notes: notes.length,
        requestsLogged: log.split('\n').filter(Boolean).length
      });
    }

    send(res, 404, '<h1>404: Not Found</h1><p>' + pathname + '</p>', 'text/html');
  } catch (err) {
    console.error('Server Error:', err);
    if (!res.headersSent) {
      send(res, 500, { error: 'Internal Server Error' });
    }
  }
});

// Server Listen
server.listen(PORT, '0.0.0.0', () => {
  console.log(`DSVV CS403NOD Node.js Server listening on port ${PORT}`);
  console.log(`Local URL: http://localhost:${PORT}`);
});
