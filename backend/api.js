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
  console.error("❌ Missing OpenAI API key in environment!");
  process.exit(1);
}

// ES modules fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ------------------------------------------------------
// Paths setup
// ------------------------------------------------------
const projectRoot = path.resolve(__dirname, "../"); // MensHealthNZ folder
const docsFolder = path.join(__dirname, "doc"); // backend/doc folder
const srcFolder = path.join(projectRoot, "src"); // src folder
const stagesFolder = path.join(srcFolder, "Stages"); // src/Stages folder

// Serve static files (frontend)
app.use(express.static(projectRoot));
app.get("/", (req, res) => {
  res.sendFile(path.join(projectRoot, "index.html"));
});

// ------------------------------------------------------
// Function to load all PDF, DOCX, and HTML files
// ------------------------------------------------------
let docTexts = [];

async function loadDocs() {
  const texts = [];

  // --- 1️⃣ Load PDFs & DOCXs from backend/doc ---
  if (fs.existsSync(docsFolder)) {
    const docFiles = fs.readdirSync(docsFolder).filter(f => f.endsWith(".pdf") || f.endsWith(".docx"));

    for (const file of docFiles) {
      const filePath = path.join(docsFolder, file);

      if (file.endsWith(".pdf")) {
        const buffer = fs.readFileSync(filePath);
        const data = await pdfParse(buffer);
        texts.push(data.text);
        console.log(`✅ Loaded PDF: ${file}`);
      } else if (file.endsWith(".docx")) {
        const buffer = fs.readFileSync(filePath);
        const { value } = await mammoth.extractRawText({ buffer });
        texts.push(value);
        console.log(`✅ Loaded DOCX: ${file}`);
      }
    }
  }

  // --- 2️⃣ Helper to extract text from HTML files ---
  function extractTextFromHTML(filePath) {
    const html = fs.readFileSync(filePath, "utf8");
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<\/?[^>]+(>|$)/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  // --- 3️⃣ Load index.html ---
  const indexPath = path.join(projectRoot, "index.html");
  if (fs.existsSync(indexPath)) {
    texts.push(extractTextFromHTML(indexPath));
    console.log("✅ Loaded HTML: index.html");
  }

  // --- 4️⃣ Load src/*.html ---
  if (fs.existsSync(srcFolder)) {
    const htmlFiles = fs.readdirSync(srcFolder).filter(f => f.endsWith(".html"));
    for (const file of htmlFiles) {
      const filePath = path.join(srcFolder, file);
      texts.push(extractTextFromHTML(filePath));
      console.log(`✅ Loaded HTML: src/${file}`);
    }
  }

  // --- 5️⃣ Load src/Stages/*.html ---
  if (fs.existsSync(stagesFolder)) {
    const stageFiles = fs.readdirSync(stagesFolder).filter(f => f.endsWith(".html"));
    for (const file of stageFiles) {
      const filePath = path.join(stagesFolder, file);
      texts.push(extractTextFromHTML(filePath));
      console.log(`✅ Loaded HTML: src/Stages/${file}`);
    }
  }

  console.log(`📘 Total text sources loaded: ${texts.length}`);
  return texts;
}

// ------------------------------------------------------
// Load all docs and HTML at startup
// ------------------------------------------------------
(async () => {
  try {
    docTexts = await loadDocs();
  } catch (err) {
    console.error("❌ Error loading documents:", err);
  }
})();

// ------------------------------------------------------
// Helper: Split large text into smaller chunks
// ------------------------------------------------------
function chunkText(text, chunkSize = 1500) {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
}

// ------------------------------------------------------
// AI endpoint
// ------------------------------------------------------
app.post("/ask", async (req, res) => {
  const { question } = req.body;
  if (!question) return res.status(400).json({ error: "Question is required" });

  console.log("🧠 Received question:", question);

  const combinedText = docTexts.join("\n");
  const chunks = chunkText(combinedText, 1500);
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
You are a helpful AI assistant for the MensHealthNZ website.
Use the provided documents and website pages as your reference.
When answering:
- Be factual, friendly, and concise.
- Use bullet points and short sentences.
- Focus on prostate cancer and men's health in New Zealand.
- Always remind users this is general information, not medical advice.
- Encourage users to consult healthcare professionals.
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
    console.error("❌ Error calling OpenAI API:", error);
    res.status(500).json({ error: "Something went wrong in backend" });
  }
});

// ------------------------------------------------------
// Start server
// ------------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
