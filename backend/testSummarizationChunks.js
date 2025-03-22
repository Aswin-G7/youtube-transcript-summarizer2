import { pipeline } from '@xenova/transformers';
import compromise from 'compromise';
import he from 'he';

// Simulated large YouTube transcript (without punctuation)
const transcript = `
  An unnamed young boy lives with his parents on Miguel Street in Trinidad. His parents help poor and homeless people in their neighborhood. 
  One day, a “tidily dressed” man comes to the house and asks to look at the bees that live in the property’s palm trees. The boy’s mother agrees on the provision that the boy keeps a close eye on the stranger. 
  While they watch the bees, the stranger and boy talk. The stranger introduces himself as B. Wordsworth. The B stands for “Black”, and he has a brother named White Wordsworth. 
  He is a poet who loves to observe the natural world. Wordsworth offers to sell the boy “the greatest poem about mothers” for a low cost. 
  The boy asks his mother, and she declines the offer. Wordsworth admits that not a single person has bought one of his poems, but he continues to try to sell them on his travels. 
  Wordsworth believes that the boy is also a poet. A week later, the boy meets Wordsworth on the street. Wordsworth invites the boy to come to his home and eat mangoes. 
  The boy goes to Wordsworth’s wild garden and eats six ripe, juicy mangoes. When the boy returns home, his mother beats him because he spilled the fruit’s juice on his shirt. 
  He runs back to Wordsworth’s house, and the poet takes him for a walk to the nearby racecourse. They lay on the grass and look up at the night sky. 
  The boy begins to feel better, and Wordsworth teaches him about the constellations.
`;

// Function to decode HTML entities (if needed)
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

// Main summarization function
async function summarizeChunks() {
  console.log("Loading model... Please wait.");
  const summarizer = await pipeline('summarization', 'Xenova/bart-large-cnn');

  console.log("\nSplitting transcript into sentences...");
  const sentences = splitIntoSentences(decodeEntities(transcript));

  console.log("\nChunking sentences into groups of 5...");
  const chunks = chunkSentences(sentences, 5);

  console.log("\nSummarizing each chunk...");
  const summaries = [];

  for (const chunk of chunks) {
    const wordCount = chunk.split(/\s+/).length; // Count words in the chunk
    const { min, max } = getSummaryLength(wordCount); // Get dynamic summary length

    const summary = await summarizer(chunk, {
      max_length: max,
      min_length: min,
      do_sample: false
    });

    summaries.push(summary[0].summary_text);
  }

  console.log("\n=== Summary Output ===");
  summaries.forEach((summary, index) => {
    console.log(`\nChunk ${index + 1}:`);
    console.log(summary);
  });
}

// Run summarization
summarizeChunks().catch(console.error);
