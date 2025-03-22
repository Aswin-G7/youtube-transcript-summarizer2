import React, { useState } from "react";
import "./YoutubeSummarizePage.css";

const YoutubeSummarizePage = () => {
  const [url, setUrl] = useState("");
  const [summary, setSummary] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (event) => {
    setUrl(event.target.value);
  };

  const handleSummarize = async () => {
    setSummary([]);
    setIsLoading(true);

    try {
      // Step 1: Send POST request to store transcript
      const response = await fetch("/api/youtube-summarize/", {
        method: "POST",
        body: JSON.stringify({ url }),
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error("Failed to summarize the video.");

      // Step 2: Open SSE connection for real-time summary
      const eventSource = new EventSource("/api/youtube-summarize/stream");

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.summary) {
          setSummary((prevSummary) => [...prevSummary, data.summary]);
        } else if (data.status === "done") {
          setIsLoading(false);
          eventSource.close();
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        setIsLoading(false);
      };
    } catch (error) {
      console.error("Error:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="youtube-summarization-container">
      <h1>YouTube Video Summarization</h1>
      <input
        type="text"
        className="youtube-url-input"
        value={url}
        onChange={handleInputChange}
        placeholder="Enter YouTube video URL"
      />
      <br />
      <button
        className="youtube-summarization-button"
        onClick={handleSummarize}
        disabled={isLoading}
      >
        {isLoading ? "Summarizing..." : "Summarize"}
      </button>
      <div className="youtube-summarization-summary">
        <h3>Summary:</h3>
        <p>{summary.join(" ")}</p>
      </div>
    </div>
  );
};

export default YoutubeSummarizePage;
