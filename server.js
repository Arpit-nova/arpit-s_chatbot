const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/chat", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).send("Missing prompt");

    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama2",  // change if you want mistral etc.
        prompt,
        stream: true
      })
    });

    if (!response.ok) {
      return res.status(500).send("Ollama error: " + (await response.text()));
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true }).trim();
      const lines = chunk.split("\n").filter(l => l.trim() !== "");

      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          if (data.response) {
            res.write(data.response); // only send text part
          }
        } catch {
          // ignore
        }
      }
    }

    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).send(err.toString());
  }
});

app.listen(3000, () =>
  console.log("✅ Chatbot server running at http://localhost:3000")
);
