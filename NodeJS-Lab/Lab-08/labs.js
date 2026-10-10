// One entry per old lab. Edit folder / file names to match YOUR repository.
// type 'script' = a file that prints output   |   type 'server' = a lab server that exports its handler
module.exports = [
  { id: '01', title: 'Simple HTTP Server',        topic: 'http module, routing',        type: 'server', file: '../Lab-01-Simple-Server/server.js',      try: '/' },
  { id: '02', title: 'Student Directory API',     topic: 'JSON, query parameters',      type: 'server', file: '../Lab-02-Student-Directory/server.js',  try: '/students?course=BCA' },
  { id: '03', title: 'Async JS Food Delivery',    topic: 'Promise, async/await',        type: 'script', file: '../Lab-03-Async-Food-Delivery/food.js' },
  { id: '04', title: 'Modules and npm',           topic: 'require, package.json, npm',  type: 'script', file: '../Lab-04-Modules-npm/app.js' },
  { id: '06', title: 'File System',               topic: 'fs module',                   type: 'script', file: '../Lab-06-File-System/fs-demo.js' },
  { id: '07', title: 'EventEmitter',              topic: 'events, observer pattern',    type: 'script', file: '../Lab-07-EventEmitter/emitter.js' }
];
