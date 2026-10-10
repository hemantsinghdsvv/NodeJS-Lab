const fs = require('fs');
const path = require('path');
const f = path.join(__dirname, 'demo.txt');
fs.writeFileSync(f, 'Hello from Lab 06\n');
fs.appendFileSync(f, 'Second line\n');
console.log(fs.readFileSync(f, 'utf8'));
