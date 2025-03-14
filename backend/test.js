import { pipeline } from "@xenova/transformers";

(async () => {
  try {
    console.log("Loading model...");
    const summarizer = await pipeline("summarization", "Xenova/bart-large-cnn");
    console.log("Model loaded successfully!");

    const summary = await summarizer("This is a test text that should be summarized.");
    console.log("Summary:", summary);
  } catch (error) {
    console.error("Error loading model:", error);
  }
})();
