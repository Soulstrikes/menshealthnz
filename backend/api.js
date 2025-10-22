import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import fs from "fs";
import * as pdfParse from "pdf-parse";
import mammoth from "mammoth";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

if (!process.env.OPENAI_API_KEY) {
  console.error("Missing OpenAI API key in environment!");
  process.exit(1);
}

// ES modules fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve frontend files
app.use(express.static(path.resolve(__dirname, "../")));
app.get("/", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../index.html"));
});

// ------------------------
// Load PDFs and Word docs from backend/docs
// ------------------------
let docTexts = [];

async function loadDocs(folderPath = path.join(__dirname, "docs")) {
  const files = fs.readdirSync(folderPath).filter(f => f.endsWith(".pdf") || f.endsWith(".docx"));
  const texts = [];

  for (const file of files) {
    const filePath = path.join(folderPath, file);

    if (file.endsWith(".pdf")) {
      const buffer = fs.readFileSync(filePath);
      const data = await pdfParse(buffer);
      texts.push(data.text);
    } else if (file.endsWith(".docx")) {
      const buffer = fs.readFileSync(filePath);
      const { value } = await mammoth.extractRawText({ buffer });
      texts.push(value);
    }
  }

  return texts;
}

// Load docs at server start
(async () => {
  try {
    docTexts = await loadDocs();
    console.log(`Loaded ${docTexts.length} documents (PDFs + Word)`);
  } catch (err) {
    console.error("Error loading documents:", err);
  }
})();

// ------------------------
// Helper: split large context into smaller chunks
// ------------------------
function chunkText(text, chunkSize = 1000) {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
}

// ------------------------
// AI endpoint
// ------------------------
app.post("/ask", async (req, res) => {
  const { question } = req.body;
  if (!question) return res.status(400).json({ error: "Question is required" });

  console.log("Received question:", question);

  // Combine doc texts and chunk
  const combinedText = docTexts.join("\n");
  const chunks = chunkText(combinedText, 1500); // 1500 chars per chunk
  const context = chunks.join("\n---\n");

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
You are a helpful prostate cancer info assistant. Follow these instructions:

- Use the uploaded documents to answer questions.
- Give clear, friendly, and easy-to-read answers.
- Use short sentences.
- Use bullet points with proper line breaks.
- Use empty lines between sections.
- Remind users this is general information, not medical advice.
- Encourage users to check with healthcare professionals.
- Focus on New Zealand relevance.
- Use the context from the documents when available, but you may answer based on general knowledge if the context doesn't provide enough information.
`
          },
          {
            role: "user",
            content: `Question: ${question}\nContext:\n${context}`
          }
        ],
        max_tokens: 500
      }),
    });

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error("Fetch error:", error);
    res.status(500).json({ error: "Something went wrong in backend" });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
