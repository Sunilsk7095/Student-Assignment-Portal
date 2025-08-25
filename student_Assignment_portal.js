// Student Assignment Portal (Full Stack, Single File)
// Tech: Node.js + Express + SQLite + HTML/JS

const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const app = express();
const db = new sqlite3.Database("db.sqlite");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Tables
db.run("CREATE TABLE IF NOT EXISTS assignment(id INTEGER PRIMARY KEY, title TEXT, desc TEXT)");
db.run("CREATE TABLE IF NOT EXISTS submission(id INTEGER PRIMARY KEY, aid INTEGER, name TEXT, content TEXT, grade TEXT)");

// Serve Frontend (all HTML here)
app.get("/", (req, res) => {
  res.send(`<!DOCTYPE html>
  <html>
  <head>
    <title>Student Assignment Portal</title>
    <style>
      body { font-family: Arial; margin: 20px; }
      input, textarea { width: 100%; margin: 5px 0; padding: 8px; }
      button { padding: 8px 12px; margin-top: 5px; }
      .card { border:1px solid #ccc; padding:10px; margin:10px 0; }
    </style>
  </head>
  <body>
    <h1>📘 Student Assignment Portal</h1>

    <h2>Create Assignment (Teacher)</h2>
    <form id="newAssignment">
      <input name="title" placeholder="Title" required>
      <textarea name="desc" placeholder="Description"></textarea>
      <button>Add</button>
    </form>

    <h2>Assignments</h2>
    <div id="assignments"></div>

    <h2>Submit Work (Student)</h2>
    <form id="newSubmission">
      <input name="aid" placeholder="Assignment ID" required>
      <input name="name" placeholder="Your Name" required>
      <textarea name="content" placeholder="Solution"></textarea>
      <button>Submit</button>
    </form>

    <h2>Submissions & Grades (Teacher View)</h2>
    <div id="submissions"></div>

    <script>
      async function loadData(){
        let a = await fetch("/api/assignments").then(r=>r.json());
        document.getElementById("assignments").innerHTML = a.map(x=>\`<div class='card'>#\${x.id} <b>\${x.title}</b> - \${x.desc}</div>\`).join("");

        let s = await fetch("/api/submissions").then(r=>r.json());
        document.getElementById("submissions").innerHTML = s.map(x=>\`
          <div class='card'>
            <b>\${x.name}</b> → \${x.title}<br>
            <i>\${x.content}</i><br>
            Grade: \${x.grade||"Pending"}
            <form onsubmit="grade(\${x.id},this.grade.value);return false;">
              <input name="grade" placeholder="Grade">
              <button>Save</button>
            </form>
          </div>\`).join("");
      }

      document.getElementById("newAssignment").onsubmit = async e=>{
        e.preventDefault();
        let f=new FormData(e.target);
        await fetch("/api/assignments",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(Object.fromEntries(f))});
        e.target.reset(); loadData();
      };

      document.getElementById("newSubmission").onsubmit = async e=>{
        e.preventDefault();
        let f=new FormData(e.target);
        await fetch("/api/submit",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(Object.fromEntries(f))});
        e.target.reset(); loadData();
      };

      async function grade(id,grade){
        await fetch("/api/grade",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,grade})});
        loadData();
      }

      loadData();
    </script>
  </body>
  </html>`);
});

// APIs
app.get("/api/assignments", (req, res) => {
  db.all("SELECT * FROM assignment", [], (err, rows) => res.json(rows));
});

app.post("/api/assignments", (req, res) => {
  db.run("INSERT INTO assignment(title,desc) VALUES(?,?)", [req.body.title, req.body.desc], function () {
    res.json({ id: this.lastID });
  });
});

app.post("/api/submit", (req, res) => {
  db.run("INSERT INTO submission(aid,name,content) VALUES(?,?,?)", [req.body.aid, req.body.name, req.body.content], function () {
    res.json({ id: this.lastID });
  });
});

app.get("/api/submissions", (req, res) => {
  db.all("SELECT s.id,s.name,s.content,s.grade,a.title FROM submission s JOIN assignment a ON s.aid=a.id", [], (err, rows) => res.json(rows));
});

app.post("/api/grade", (req, res) => {
  db.run("UPDATE submission SET grade=? WHERE id=?", [req.body.grade, req.body.id], () => res.json({ ok: true }));
});

app.listen(3000, () => console.log("✅ Student Assignment Portal running at http://localhost:3000"));
