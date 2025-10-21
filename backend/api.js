import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors()); // optional: needed if frontend and backend are on different origins

// Ensure API key exists
if (!process.env.OPENAI_API_KEY) {
  console.error("Missing OpenAI API key in environment!");
  process.exit(1);
}

// ES modules fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve frontend files
app.use(express.static(path.resolve(__dirname, "../")));

// Serve index.html explicitly on /
app.get("/", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../index.html"));
});

// AI endpoint
app.post("/ask", async (req, res) => {
  const { question } = req.body;
  if (!question) return res.status(400).json({ error: "Question is required" });

  console.log("Received question:", question);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful assistant for MensHealthNZ." },
          { role: "user", content: question },
        ],
      }),
    });

    // Parse JSON directly
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
