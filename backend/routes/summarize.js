import express from "express";
import { pipeline } from "@xenova/transformers";
import compromise from "compromise";
import he from "he";

const router = express.Router();

// Load summarization model once at startup
let summarizer;
(async () => {
  try {
    summarizer = await pipeline("summarization", "Xenova/bart-large-cnn");
  } catch (error) {
    console.error("Error loading model:", error);
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

// AI-Based Sentence Splitting using `compromise`
const splitIntoSentences = (text) => {
  return compromise(text).sentences().out("array");
};

// Function to chunk sentences into groups of N sentences
const chunkSentences = (sentences, chunkSize = 5) => {
  const chunks = [];
  for (let i = 0; i < sentences.length; i += chunkSize) {
    chunks.push(sentences.slice(i, i + chunkSize).join(" "));
  }
  return chunks;
};

// Function to determine summary length based on chunk size
const getSummaryLength = (wordCount) => {
  if (wordCount >= 100) return { min: 50, max: 60 };
  if (wordCount >= 80) return { min: 40, max: 50 };
  if (wordCount >= 50) return { min: 25, max: 35 };
  return { min: 15, max: 20 }; // For very small chunks
};

// Route to handle the transcript POST request
router.post("/", async (req, res) => {
  try {
    const { transcript } = req.body;
    console.log("Received transcript:", transcript);

    if (!transcript) {
      return res.status(400).json({ error: "No transcript provided." });
    }

    // Save the transcript to a session or database to use in the streaming route
    req.app.locals.transcript = transcript;

    res.status(200).json({ message: "Transcript received, starting summarization." });
  } catch (error) {
    console.error("Error processing transcript:", error);
    res.status(500).json({ error: "Could not generate summary." });
  }
});

// Route to handle the SSE stream
router.get("/stream", async (req, res) => {
  try {
    const { transcript } = req.app.locals;

    if (!transcript) {
      return res.status(400).json({ error: "No transcript available." });
    }

    // Set the response headers for SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Send initial message to the client (optional)
    res.write('data: {"status": "summarizing started"}\n\n');

    console.log("\nSplitting transcript into sentences...");
    const sentences = splitIntoSentences(decodeEntities(transcript));

    console.log("\nChunking sentences into groups of 5...");
    const chunks = chunkSentences(sentences, 5);
    console.log("Chunks to process:", chunks.length);

    // Process each chunk and summarize it
    for (let chunk of chunks) {
      try {
        const wordCount = chunk.split(/\s+/).length; // Count words in the chunk
        const { min, max } = getSummaryLength(wordCount); // Get dynamic summary length

        const summary = await summarizer(chunk, {
          max_length: max,
          min_length: min,
          do_sample: false
        });

        // Send the summary as an SSE message
        res.write(`data: ${JSON.stringify({ summary: summary[0].summary_text })}\n\n`);

        // Wait a bit before sending the next chunk (to simulate real-time streaming)
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error("Error summarizing chunk:", error);
        res.write(`data: {"error": "Error summarizing chunk"}\n\n`);
      }
    }

    // End the SSE connection
    res.write('data: {"status": "done"}\n\n');
    res.end();
  } catch (error) {
    console.error("Error processing transcript:", error);
    res.status(500).json({ error: "Could not generate summary." });
  }
});

export default router;
