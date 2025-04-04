import * as ort from "onnxruntime-node"; // Use onnxruntime-node instead of onnxruntime-web

// Suppress ONNX logs
if (ort.env) {
  ort.env.logLevel = "error";
} else {
  console.warn("ONNXRuntime environment not found. Log level not set.");
}


import express from "express";  
import cors from "cors";  
import dotenv from "dotenv";  
import transcriptRoutes from "./routes/transcriptRoutes.js"; //get transcript
import summarizeRoute from "./routes/summarize.js"; // New summarization route
import youtubeSummarizeRoutes from "./routes/youtubeSummarize.js"; //youtube transcript summarizer route
import translationRoutes from "./routes/translation.js";

console.log("[INFO] Translation route loaded:", !!translationRoutes);

dotenv.config(); // Load environment variables  

const app = express();  
app.use(cors());  
app.use(express.json());  

app.use("/api/transcript", transcriptRoutes);
app.use("/api/summarize", summarizeRoute);
app.use("/api/youtube-summarize", youtubeSummarizeRoutes);
app.use("/api/translate", translationRoutes);

app.get("/", (req, res) => {  
  res.send("Backend is running with ES Modules! 🚀");
});  

console.log("[INFO] Routes registered:");
console.log(app._router.stack.map((r) => r.route?.path).filter(Boolean));
 

const PORT = process.env.PORT || 5000;  
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));  
