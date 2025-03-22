import express from "express";
import { YoutubeTranscript } from "youtube-transcript";
import { pipeline } from "@xenova/transformers";
import he from "he"; // For decoding HTML entities
import axios from "axios"; // For sending transcript to the punctuation API

const router = express.Router();

const PUNCTUATION_API_URL = "https://5cd7-34-86-31-254.ngrok-free.app/punctuate"; // Update if needed

// Load summarization model once at startup
let summarizer;
(async () => {
  try {
    console.log("[INFO] Loading summarization model...");
    summarizer = await pipeline("summarization", "Xenova/bart-large-cnn", {
      device: "webgpu", // Use WebGPU for performance
    });
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

// Function to split punctuated text into sentences
const splitIntoSentences = (text) => {
  return text.split(/(?<=[.?!:;])\s+/);
};

// Function to split sentences into chunks for summarization
const splitTextIntoChunks = (sentences, chunkSize = 216) => {
  const chunks = [];
  let currentChunk = "";

  sentences.forEach((sentence) => {
    if ((currentChunk + sentence).split(" ").length > chunkSize) {
      chunks.push(currentChunk);
      currentChunk = sentence;
    } else {
      currentChunk += " " + sentence;
    }
  });

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
};

// Route to process YouTube transcript and punctuate it
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

    // Send transcript to punctuation API
    console.log("[INFO] Sending transcript to punctuation API...");
    const punctuationResponse = await axios.post(PUNCTUATION_API_URL, { text: cleanTranscript });

    if (!punctuationResponse.data || !punctuationResponse.data.punctuated_text) {
      console.error("[ERROR] Invalid response from punctuation API.");
      return res.status(500).json({ error: "Failed to punctuate text." });
    }

    const punctuatedText = punctuationResponse.data.punctuated_text;
    console.log(`[INFO] Punctuated transcript received. Length: ${punctuatedText.length} characters`);

    // Split punctuated text into sentences
    const sentences = splitIntoSentences(punctuatedText);
    console.log(`[INFO] Split transcript into ${sentences.length} sentences`);

    // Store sentences in app memory for summarization
    req.app.locals.sentences = sentences;

    // Send immediate response to client
    res.status(200).json({ message: "Punctuated transcript received, starting summarization." });
  } catch (error) {
    console.error("[ERROR] Failed to process YouTube video:", error);
    res.status(500).json({ error: "Could not process the video." });
  }
});

// Route to stream summarization results using SSE
router.get("/stream", async (req, res) => {
  try {
    const { sentences } = req.app.locals;
    
    if (!sentences || sentences.length === 0) {
      return res.status(400).json({ error: "No sentences available for summarization." });
    }

    // Set response headers for SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Send initial message to client
    res.write('data: {"status": "summarizing started"}\n\n');

    // Split sentences into chunks
    const chunks = splitTextIntoChunks(sentences);
    console.log(`[INFO] Splitting sentences into ${chunks.length} chunks`);

    // Store summarized text for translation
    req.app.locals.summarizedText = [];

    // Process each chunk and send the summary to the frontend in real-time
    for (let i = 0; i < chunks.length; i++) {
      try {
        const chunkWordCount = chunks[i].split(" ").length;
        const min_length = Math.max(20, Math.floor(chunkWordCount / 3));
        const max_length = chunkWordCount - 10;

        console.log(`[INFO] Summarizing chunk ${i + 1}/${chunks.length}... (min: ${min_length}, max: ${max_length})`);
        
        const summary = await summarizer(chunks[i], {
          max_length: max_length,
          min_length: min_length,
        });

        // Store summary chunk
        req.app.locals.summarizedText.push(summary[0].summary_text);

        // Send summary chunk to client
        res.write(`data: ${JSON.stringify({ summary: summary[0].summary_text })}\n\n`);
        
        // Simulate real-time delay
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`[ERROR] Error summarizing chunk ${i + 1}:`, error);
        res.write('data: {"error": "Error summarizing chunk"}\n\n');
      }
    }

    // Store complete summarized text for translation
    req.app.locals.fullSummary = req.app.locals.summarizedText.join(" ");
    console.log(`[INFO] Full summary stored for translation: ${req.app.locals.fullSummary.length} characters`);

    // End the stream
    res.write('data: {"status": "done"}\n\n');
    res.end();
  } catch (error) {
    console.error("[ERROR] Streaming error:", error);
    res.status(500).json({ error: "Could not process streaming." });
  }
});

export default router;
