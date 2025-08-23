const Database = require("better-sqlite3");

// Create or open the SQLite database
const db = new Database("careerSathi.db");

// Create the interview_history table if it doesn't exist
db.prepare(`
  CREATE TABLE IF NOT EXISTS interview_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT,
    answer TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

console.log("✅ Database and table ready!");

