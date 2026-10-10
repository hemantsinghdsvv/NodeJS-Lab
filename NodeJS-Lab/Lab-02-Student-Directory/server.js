const http = require('http');
const url = require('url');

// Student directory data
const students = [
  { id: 23145001, name: 'Aditya Soni', course: 'BCA' },
  { id: 23145004, name: 'Ayush Ram Tripathi', course: 'BCA' },
  { id: 23145005, name: 'Bhaskar Mall', course: 'BCA' },
  { id: 23145006, name: 'Gouri', course: 'BCA' },
  { id: 23145009, name: 'Kanak Sharma', course: 'BCA' },
  { id: 23145012, name: 'Nisha Bharti', course: 'BCA' },
  { id: 23145013, name: 'Pragya Gupta', course: 'BCA' },
  { id: 23145018, name: 'Rishabh Khatiwada', course: 'BCA' },
  { id: 23145021, name: 'Sayon Koley', course: 'BCA' },
  { id: 23145022, name: 'Shreya Singh', course: 'BSc IT' },
  { id: 23145024, name: 'Sudhanshu Belwal', course: 'BCA' },
  { id: 23145026, name: 'Yadev Singh Nishad', course: 'BSc IT' },
  { id: 23145027, name: 'Mikki Jaiswal', course: 'BSc IT' },
  { id: 23145028, name: 'Shreya Kashyap', course: 'BSc IT' }
];

function handler(req, res) {
  const { pathname, query } = url.parse(req.url, true);
  res.setHeader('Content-Type', 'application/json');
  if (pathname === '/students') {
    const list = query.course ? students.filter(s => s.course === query.course) : students;
    return res.end(JSON.stringify(list, null, 2));
  }
  res.statusCode = 404;
  res.end(JSON.stringify({ error: 'Not found' }));
}

module.exports = handler;
if (require.main === module) http.createServer(handler).listen(3001, () => console.log('Lab 02 on 3001'));
