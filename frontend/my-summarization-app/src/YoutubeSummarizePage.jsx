import React, { useState } from "react";
import YouTubeVideoPlayer from "./YouTubeVideoPlayer.jsx"; // Video player component
import TranscriptDisplay from "./TranscriptDisplay.jsx"; // Transcript display component
import "./YoutubeSummarizePage.css";
import axios from "axios"; 

const YoutubeSummarizePage = () => {
  const [url, setUrl] = useState("");
  const [summary, setSummary] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  // ✅ Handle input change & update video display
  const handleInputChange = (event) => {
    const newUrl = event.target.value;
    setUrl(newUrl);

    // Check if the input contains a valid YouTube link
    const isValidYouTubeUrl = /(?:youtube\.com|youtu\.be)/.test(newUrl);
    setShowVideo(isValidYouTubeUrl);
    setShowTranscript(isValidYouTubeUrl);
  };

  // ✅ Handle summarization
  const handleSummarize = async () => {
    setSummary([]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/youtube-summarize/", {
        method: "POST",
        body: JSON.stringify({ url }),
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error("Failed to summarize the video.");

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

      {/* ✅ Show video using the YouTubeVideoPlayer component */}
      {showVideo && <YouTubeVideoPlayer videoUrl={url} />}

      {/* ✅ Show transcript display only when a valid URL is present */}
      {showTranscript && <TranscriptDisplay youtubeUrl={url} />}

      <button
        className="youtube-summarization-button"
        onClick={handleSummarize}
        disabled={isLoading}
      >
        {isLoading ? "Summarizing..." : "Summarize"}
      </button>

      {/* ✅ Render summary div only if there is content */}
      {summary.length > 0 && (
        <div className="youtube-summarization-summary">
          <h3>Summary:</h3>
          <div className="typewriter-container">
            {summary.map((chunk, index) => (
              <p key={index} className="typewriter">{chunk}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default YoutubeSummarizePage;
