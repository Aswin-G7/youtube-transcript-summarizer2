import express from "express";
import { pipeline } from "@xenova/transformers";

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

// Helper function to split transcript into chunks
const splitTextIntoChunks = (text, chunkSize = 216) => {
  const words = text.split(" ");
  const chunks = [];
  while (words.length) {
    const chunk = words.splice(0, chunkSize).join(" ");
    chunks.push(chunk);
    console.log("Chunk length:", chunk.split(" ").length); // Log chunk size
  }
  return chunks;
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
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Send initial message to the client (optional)
    res.write('data: {"status": "summarizing started"}\n\n');

    // Split the transcript into chunks
    const chunks = splitTextIntoChunks(transcript);
    console.log("Chunks to process:", chunks);

    // Process each chunk and summarize it
    for (let chunk of chunks) {
      try {
        // Summarize each chunk
        const summary = await summarizer(chunk, {
          max_length: 200,
          min_length: 80,
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
