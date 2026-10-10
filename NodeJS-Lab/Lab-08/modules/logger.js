const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '..', 'logs', 'server.log');
fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });

class Logger extends EventEmitter {}
const logger = new Logger();

logger.on('request', (method, url) => {
  const line = `${new Date().toISOString()} ${method} ${url}\n`;
  console.log(line.trim());
  fs.appendFile(LOG_FILE, line, (err) => { if (err) console.error('Log write failed:', err.message); });
});
logger.on('error', (err) => console.error('Logger error:', err.message));

module.exports = { logger, LOG_FILE };
