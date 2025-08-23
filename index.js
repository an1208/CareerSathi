// index.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const HF_API_KEY = process.env.HF_API_KEY;

// Health check
app.get('/', (req, res) => {
  res.send('CareerSathi API is running 🚀');
});

// Helper function to call HuggingFace GPT-2
async function hfGenerate(prompt) {
  try {
    const { data } = await axios.post(
      'https://api-inference.huggingface.co/models/gpt2',
      { inputs: prompt, options: { wait_for_model: true } },
      {
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    );

    // GPT-2 inference usually returns [{ generated_text: "..." }]
    if (Array.isArray(data) && data[0]?.generated_text) {
      return data[0].generated_text;
    }

    if (data?.error) return `⚠️ HF error: ${data.error}`;
    return '⚠️ No response from model.';
  } catch (err) {
    console.error(err?.response?.data || err.message);
    return '⚠️ AI request failed.';
  }
}

// Resume generator endpoint
app.post('/api/resume', async (req, res) => {
  try {
    const { fullName, role, skills, experience } = req.body;

    const prompt = `Write a short resume summary for ${fullName}, a ${role}. Skills: ${skills.join(", ")}. Experience: ${experience}.`;


    const text = await hfGenerate(prompt);

    res.json({ ok: true, text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Start server on port 3001
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
 