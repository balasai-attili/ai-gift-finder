import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const OPENAI_API_KEY = "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";

app.post("/api/gifts", async (req, res) => {
  try {
    const userPrompt = req.body.prompt;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a gift recommendation AI. Return ONLY JSON array of 6 gifts with emoji, name, why, price, tags."
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();
    const text = data.choices[0].message.content;

    res.json({ result: text });

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
