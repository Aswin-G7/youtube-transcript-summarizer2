import natural from "natural";
import compromise from "compromise"; // NLP library to detect sentence structure
import he from "he";

// Simulated large YouTube transcript (without punctuation)
const transcript = `
  today we are going to talk about artificial intelligence and its impact on modern society
  ai is transforming industries from healthcare to finance autonomous vehicles are one of the most exciting applications
  but many ethical questions arise with ai should machines make decisions for us
  we need regulations to ensure ai is used responsibly governments and tech companies are working together on this issue
  and that's all for today's discussion thanks for watching
`;

// Function to decode HTML entities (if needed)
const decodeEntities = (text) => {
  let decoded = he.decode(text);
  while (decoded !== he.decode(decoded)) {
    decoded = he.decode(decoded);
  }
  return decoded;
};

// 1️⃣ **Regex-Based Sentence Splitting (Fails without periods)**
const regexSentenceSplitter = (text) => {
  return text.match(/[^.!?]+[.!?]*/g) || [text];
};

// 2️⃣ **NLP-Based Heuristic Splitting**
const heuristicSentenceSplitter = (text) => {
  const tokenizer = new natural.SentenceTokenizer();
  return tokenizer.tokenize(text);
};

// 3️⃣ **AI-Based Splitting using `compromise` NLP**
const aiSentenceSplitter = (text) => {
  return compromise(text).sentences().out("array");
};

// Running tests
console.log("\n=== Original Transcript ===\n");
console.log(transcript);

console.log("\n=== Regex-Based Splitting (Fails if no punctuation) ===\n");
console.log(regexSentenceSplitter(transcript));

console.log("\n=== Heuristic NLP-Based Splitting ===\n");
console.log(heuristicSentenceSplitter(transcript));

console.log("\n=== AI-Based NLP Splitting (Works Best) ===\n");
console.log(aiSentenceSplitter(transcript));
