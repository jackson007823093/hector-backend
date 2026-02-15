import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

// ✅ FIX: Allow GitHub Pages / any origin for demo + handle preflight
app.use(cors({
  origin: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.options("*", cors());

app.get("/", (req, res) => {
  res.send("Hector backend is running ✅");
});

app.post("/api/hector", async (req, res) => {
  try {
    const message = (req.body?.message || "").toString().trim();
    if (!message) return res.status(400).json({ reply: "Ask me a garden question!" });

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) return res.status(500).json({ reply: "Server missing GROQ_API_KEY." });

    const systemPrompt =
      "You are Hector Nectar, a friendly hummingbird garden center assistant for a Home Depot-style garden guide. " +
      "Answer clearly, briefly, and helpfully. Give practical tips about plants, sun/shade, watering, soil, mulch, fertilizer, and DIY garden projects.";

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        temperature: 0.5,
        max_tokens: 250
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(500).json({ reply: "AI error: " + errText.slice(0, 200) });
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content?.trim() || "I’m not sure — try asking a different way.";
    return res.json({ reply });

  } catch (err) {
    return res.status(500).json({ reply: "Server error. Check Render logs + GROQ_API_KEY." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port", PORT));
