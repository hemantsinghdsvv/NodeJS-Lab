const EventEmitter = require('events');
const e = new EventEmitter();
e.on('order', (item) => console.log('Order received:', item));
e.emit('order', 'Burger');
