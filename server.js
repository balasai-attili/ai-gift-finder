const express = require("express");
const cors = require("cors");
const axios = require("axios");

const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();
app.use(cors());
app.use(express.json());


const HF_API_KEY = "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";
const SERP_API_KEY = "89510dfa6a9ea8164dcca12bda4b827c8ebdbcede57f4b2071defec34b9a3061";

// 🔍 Search real products
async function searchProducts(query) {
  const res = await axios.get("https://serpapi.com/search.json", {
    params: {
      engine: "google_shopping",
      q: query,
      api_key: SERP_API_KEY,
      gl: "in", // India
      hl: "en"
    }
  });

  return res.data.shopping_results?.slice(0, 6) || [];
}

// 🤖 Convert prompt → search keyword
async function generateSearchQuery(prompt) {
  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs: `Convert this into a short shopping search query (max 5 words): ${prompt}`
        })
      }
    );

    // 🔥 READ RAW FIRST (not .json)
    const raw = await response.text();
    console.log("HF RAW RESPONSE:", raw);

    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      console.log("HF returned HTML or invalid JSON");
      return prompt; // fallback
    }

    let text = Array.isArray(data)
      ? data[0]?.generated_text
      : data.generated_text;

    return text?.replace(prompt, "").trim() || prompt;

  } catch (err) {
    console.log("HF ERROR:", err);
    return prompt; // fallback
  }
}

// ✅ ADD HERE
app.get("/test", (req, res) => {
  res.json({ message: "Server working ✅" });
});

// 🚀 MAIN API
app.post("/api/gifts", async (req, res) => {
  try {
    console.log("REQUEST RECEIVED");

    const { prompt } = req.body;
    console.log("Prompt:", prompt);

    // 🤖 STEP 1: AI generates keyword
    const keyword = await generateSearchQuery(prompt);
    console.log("Keyword:", keyword);

    // 🔍 STEP 2: Search real products
    const products = await searchProducts(keyword);
    console.log("Products:", products.length);

    if (!products.length) {
      return res.status(500).json({ error: "No products found" });
    }

    // 🎁 STEP 3: Format result
    const result = products.map(p => ({
      emoji: "🎁",
      name: p.title,
      why: "Perfect match for your request",
      price: p.price || "Check online",
      image: p.thumbnail,
      link: p.link
    }));

    res.json({ result });

  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => {
  console.log("✅ Server running: http://localhost:3000");
});