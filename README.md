# CS403NOD: Node.js Lab Practical Demonstrations

Dev Sanskriti Vishwavidyalaya (DSVV) - Haridwar  
Department of Computer Science

A comprehensive, interactive demonstration server and laboratory exercise suite built with native Node.js core modules.

---

## 🚀 Features & Lab Exercises

- **Lab 01: Simple HTTP Server** — `http` module, routing (`/`, `/about`, 404), HTTP headers, and status codes.
- **Lab 02: Student Directory API** — REST-style JSON endpoints with query parameter filtering (`?course=BCA`).
- **Lab 03: Async Food Delivery Simulation** — Asynchronous programming with Promises, `async`/`await`, and concurrent parallel execution using `Promise.all`.
- **Lab 04: Modules & npm Packages** — CommonJS modularity (`require`), `package.json`, and third-party libraries (`slugify`).
- **Lab 06: File System Operations** — Native `fs` and `fs.promises` file operations (read, write, append, directory management).
- **Lab 07: EventEmitter** — Event-driven architecture with Node.js `EventEmitter`.
- **Lab 08: Capstone Portal** — Interactive web dashboard with real-time lab execution, source code inspection, and persistent student notes.

---

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm

### Installation
```bash
# Clone the repository
git clone https://github.com/hemantsinghdsvv/NodeJS-Lab.git

# Navigate into project directory
cd NodeJS-Lab

# Install dependencies
npm install
```

### Running the Application
```bash
# Start the central interactive lab portal
npm start
# or
node server.js
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 📁 Project Structure

```
├── NodeJS-Lab/               # Individual standalone laboratory tasks
│   ├── Lab-01-Simple-Server/
│   ├── Lab-02-Student-Directory/
│   ├── Lab-03-Async-Food-Delivery/
│   ├── Lab-04-Modules-npm/
│   ├── Lab-06-File-System/
│   ├── Lab-07-EventEmitter/
│   └── Lab-08/
├── modules/                  # Helper modules (logger, storage)
├── public/                   # Static assets, styles, screenshots
├── data/                     # Data stores
├── server.js                 # Central HTTP server & interactive web portal
├── package.json
└── README.md
```

---

## 📜 License
ISC License
