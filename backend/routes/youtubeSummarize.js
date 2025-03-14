import express from "express";
import { YoutubeTranscript } from "youtube-transcript";
import { pipeline } from "@xenova/transformers";
import he from "he"; // For decoding HTML entities

const router = express.Router();

// Load summarization model once at startup
let summarizer;
(async () => {
  try {
    console.log("[INFO] Loading summarization model...");
    summarizer = await pipeline("summarization", "Xenova/bart-large-cnn");
    console.log("[INFO] Summarization model loaded successfully.");
  } catch (error) {
    console.error("[ERROR] Failed to load summarization model:", error);
  }
})();

// Function to decode HTML entities
const decodeEntities = (text) => {
  let decoded = he.decode(text);
  while (decoded !== he.decode(decoded)) {
    decoded = he.decode(decoded);
  }
  return decoded;
};

// Function to split text into chunks
const splitTextIntoChunks = (text, chunkSize = 216) => {
  const words = text.split(" ");
  const chunks = [];
  while (words.length) {
    chunks.push(words.splice(0, chunkSize).join(" "));
  }
  return chunks;
};

// Route to store the transcript and trigger summarization
router.post("/", async (req, res) => {
  try {
    console.log("[INFO] Received request to summarize YouTube video.");

    const { url } = req.body;
    if (!url) {
      console.warn("[WARNING] No YouTube URL provided.");
      return res.status(400).json({ error: "No YouTube URL provided." });
    }

    // Extract video ID
    console.log(`[INFO] Extracting video ID from URL: ${url}`);
    const videoIdMatch = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*\/|watch\?v=))([^?&]+)/i
    );
    const videoId = videoIdMatch ? videoIdMatch[1] : null;

    if (!videoId) {
      console.warn("[WARNING] Invalid YouTube URL.");
      return res.status(400).json({ error: "Invalid YouTube URL." });
    }
    console.log(`[INFO] Extracted video ID: ${videoId}`);

    // Fetch transcript
    console.log(`[INFO] Fetching transcript for video ID: ${videoId}`);
    const transcriptData = await YoutubeTranscript.fetchTranscript(videoId);

    if (!transcriptData || transcriptData.length === 0) {
      console.warn("[WARNING] No transcript available for this video.");
      return res.status(404).json({ error: "No transcript available for this video." });
    }

    console.log(`[INFO] Transcript fetched successfully. Total segments: ${transcriptData.length}`);

    // Convert transcript to text and decode HTML entities
    const rawTranscript = transcriptData.map((item) => item.text).join(" ");
    const cleanTranscript = decodeEntities(rawTranscript);
    console.log(`[INFO] Transcript processed. Length: ${cleanTranscript.length} characters`);

    // Store transcript in app memory for streaming
    req.app.locals.youtubeTranscript = cleanTranscript;

    // Send immediate response to client
    res.status(200).json({ message: "Transcript received, starting summarization." });
  } catch (error) {
    console.error("[ERROR] Failed to process YouTube video:", error);
    res.status(500).json({ error: "Could not process the video." });
  }
});

// Route to stream summarization results using SSE
router.get("/stream", async (req, res) => {
  try {
    const { youtubeTranscript } = req.app.locals;
    
    if (!youtubeTranscript) {
      return res.status(400).json({ error: "No transcript available." });
    }

    // Set response headers for SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Send initial message to client
    res.write('data: {"status": "summarizing started"}\n\n');

    // Split the transcript into chunks
    const chunks = splitTextIntoChunks(youtubeTranscript);
    console.log(`[INFO] Splitting transcript into ${chunks.length} chunks`);

    // Process each chunk and send the summary to the frontend in real-time
    for (let i = 0; i < chunks.length; i++) {
      try {
        console.log(`[INFO] Summarizing chunk ${i + 1}/${chunks.length}...`);
        const summary = await summarizer(chunks[i], {
          max_length: 200,
          min_length: 80,
        });

        // Send summary chunk to client
        res.write(`data: ${JSON.stringify({ summary: summary[0].summary_text })}\n\n`);
        
        // Simulate real-time delay
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`[ERROR] Error summarizing chunk ${i + 1}:`, error);
        res.write('data: {"error": "Error summarizing chunk"}\n\n');
      }
    }

    // End the stream
    res.write('data: {"status": "done"}\n\n');
    res.end();
  } catch (error) {
    console.error("[ERROR] Streaming error:", error);
    res.status(500).json({ error: "Could not process streaming." });
  }
});

export default router;
