import express from "express";
import translate from "google-translate-api-x";

const router = express.Router();

router.post("/", async (req, res) => {
  const { targetLang } = req.body;

  // Get summarized text from app memory
  const summarizedText = req.app.locals.fullSummary;

  if (!summarizedText) {
    return res.status(400).json({ error: "No summarized text available." });
  }

  if (!targetLang) {
    return res.status(400).json({ error: "Missing target language." });
  }

  try {
    console.log(`[INFO] Translating summarized text to ${targetLang}...`);
    const translated = await translate(summarizedText, { to: targetLang });

    res.json({ 
      original: summarizedText, 
      translated: translated.text 
    });
  } catch (error) {
    console.error("[ERROR] Translation failed:", error);
    res.status(500).json({ error: "Translation failed." });
  }
});

export default router;
