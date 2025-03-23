import express from "express";
import { YoutubeTranscript } from "youtube-transcript";
import he from "he"; // Import HTML entity decoder
import axios from "axios"; // For sending transcript to the punctuation API

const router = express.Router();
const PUNCTUATION_API_URL = "https://25ed-35-221-238-103.ngrok-free.app/punctuate"; // Update if needed

// Function to decode multiple times (handles deeply nested encoding)
const decodeEntities = (text) => {
  let decoded = he.decode(text);
  while (decoded !== he.decode(decoded)) {
    decoded = he.decode(decoded);
  }
  return decoded;
};

router.post("/", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "No YouTube URL provided." });
    }

    // Extract video ID from "youtube.com" and "youtu.be" URLs
    const videoIdMatch = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*\/|watch\?v=))([^?&]+)/i
    );
    const videoId = videoIdMatch ? videoIdMatch[1] : null;

    if (!videoId) {
      return res.status(400).json({ error: "Invalid YouTube URL." });
    }

    // Fetch transcript
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);

    if (!transcript || transcript.length === 0) {
      return res.status(404).json({ error: "No transcript available for this video." });
    }

    // Convert transcript to text and decode HTML entities properly
    const rawTranscript = transcript.map((item) => item.text).join(" ");
    const cleanTranscript = decodeEntities(rawTranscript);

    // Send transcript to punctuation API
    const punctuationResponse = await axios.post(PUNCTUATION_API_URL, { text: cleanTranscript });

    if (!punctuationResponse.data || !punctuationResponse.data.punctuated_text) {
      return res.status(500).json({ error: "Failed to punctuate text." });
    }

    // Return the punctuated transcript
    res.json({ punctuatedTranscript: punctuationResponse.data.punctuated_text });
  } catch (error) {
    console.error("Error fetching YouTube transcript:", error);
    res.status(500).json({ error: "Could not fetch transcript. The video might not have subtitles." });
  }
});

export default router;
