// server.js (CommonJS)

import 'dotenv/config';
import express from "express";
import cors from "cors";
import Database from "better-sqlite3";
import axios from "axios";

const app = express();
const PORT = process.env.PORT || 5000;
const HF_API_KEY = process.env.HF_API_KEY;


// --- DB setup ---
const db = new Database("careerSathi.db");

// Ensure table exists (safe to run every startup)
db.prepare(`
  CREATE TABLE IF NOT EXISTS interview_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT,
    answer TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

app.use(cors());
app.use(express.json());

// Root health check (fixes "Cannot GET /")
app.get("/", (req, res) => {
  res.send("🚀 CareerSathi Backend is running!");
});

// --- Helper: call HuggingFace Inference API ---
async function hfGenerate(modelId, prompt) {
  try {
    const { data } = await axios.post(
      `https://api-inference.huggingface.co/models/${modelId}`,
      {
        inputs: prompt,
        parameters: {
          max_new_tokens: 256,
          temperature: 0.7
        }
      },
      {
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 60000
      }
    );

    // Typical text generation response: [{ generated_text: "..." }]
    if (Array.isArray(data) && data[0]?.generated_text) {
      return data[0].generated_text;
    }

    // Sometimes returns a plain string or different shape
    if (typeof data === "string") return data;
    if (data?.error) return `⚠️ HF error: ${data.error}`;

    return "⚠️ No response from model.";
  } catch (err) {
    // Model cold start returns 503 with estimated_time
    const maybe = err?.response?.data;
    if (err?.response?.status === 503 && maybe?.estimated_time) {
      return `⏳ Model is loading on HuggingFace (ETA ~${Math.ceil(
        maybe.estimated_time
      )}s). Please try again shortly.`;
    }
    console.error("HF call failed:", err?.response?.status, maybe || err.message);
    return "⚠️ AI request failed.";
  }
}

// --- API: create a Q&A using HF and save it ---
app.post("/api/interview", async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: "Missing 'question'." });

    // Lightweight/free model. You can later upgrade to a bigger one.
    const MODEL_ID = "google/flan-t5-base";

    const answer = await hfGenerate(
      MODEL_ID,
      `You are a helpful interview assistant. Answer clearly and concisely:\n\nQ: ${question}\nA:`
    );

    db.prepare(
      "INSERT INTO interview_history (question, answer) VALUES (?, ?)"
    ).run(question, answer);

    res.json({ success: true, question, answer });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error while creating interview entry." });
  }
});

// --- API: read history ---
app.get("/api/interview", (req, res) => {
  const rows = db
    .prepare("SELECT * FROM interview_history ORDER BY created_at DESC")
    .all();
  res.json(rows);
});

app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);

