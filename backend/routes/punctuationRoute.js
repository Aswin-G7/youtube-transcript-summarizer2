import express from "express";
import axios from "axios"; // For sending transcript to the punctuation API

const router = express.Router();
const PUNCTUATION_API_URL = "https://25ed-35-221-238-103.ngrok-free.app/punctuate"; // Update if needed

router.post("/", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "No text provided for punctuation." });
    }

    // Send text to punctuation API
    const punctuationResponse = await axios.post(PUNCTUATION_API_URL, { text });

    if (!punctuationResponse.data || !punctuationResponse.data.punctuated_text) {
      return res.status(500).json({ error: "Failed to punctuate text." });
    }

    // Return the punctuated text
    res.json({ punctuatedText: punctuationResponse.data.punctuated_text });
  } catch (error) {
    console.error("Error processing punctuation:", error);
    res.status(500).json({ error: "Could not process punctuation." });
  }
});

export default router;
