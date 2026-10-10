const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const STUDENTS = path.join(DATA_DIR, 'students.json');
const NOTES = path.join(DATA_DIR, 'notes.json');

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

module.exports = { getStudents, getNotes, addNote };
