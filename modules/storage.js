const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const STUDENTS = path.join(DATA_DIR, 'students.json');
const NOTES = path.join(DATA_DIR, 'notes.json');
const DEPLOYMENTS = path.join(DATA_DIR, 'deployments.json');

async function readJSON(file) {
  const raw = await fs.readFile(file, 'utf8');
  return JSON.parse(raw);
}

async function getStudents() { return readJSON(STUDENTS); }

async function getNotes() {
  try { return await readJSON(NOTES); }
  catch (e) { if (e.code === 'ENOENT') return []; throw e; }
}

async function addNote(text) {
  const notes = await getNotes();
  const note = { id: notes.length + 1, text, createdAt: new Date().toISOString() };
  notes.push(note);
  await fs.writeFile(NOTES, JSON.stringify(notes, null, 2));
  return note;
}

async function getDeployments() {
  try { return await readJSON(DEPLOYMENTS); }
  catch (e) {
    if (e.code === 'ENOENT') {
      await fs.writeFile(DEPLOYMENTS, JSON.stringify([], null, 2));
      return [];
    }
    throw e;
  }
}

async function addDeployment(data) {
  const deployments = await getDeployments();
  const item = {
    id: deployments.length + 1,
    studentName: (data.studentName || '').trim(),
    rollNo: (data.rollNo || '').trim(),
    semester: 'BCA VII',
    liveUrl: (data.liveUrl || '').trim(),
    localIp: (data.localIp || '').trim(),
    remarks: (data.remarks || '').trim(),
    clientIp: data.clientIp || '',
    createdAt: new Date().toISOString()
  };
  deployments.push(item);
  await fs.writeFile(DEPLOYMENTS, JSON.stringify(deployments, null, 2));
  return item;
}

module.exports = { getStudents, getNotes, addNote, getDeployments, addDeployment };

