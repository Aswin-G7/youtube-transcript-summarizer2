import React, { useState } from "react";
import PropTypes from "prop-types";
import "./TranscriptDisplay.css"; // Import the new CSS file

const TranscriptDisplay = ({ youtubeUrl }) => {
  const [transcript, setTranscript] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchTranscript = async () => {
    if (!youtubeUrl) {
      setError("Please provide a valid YouTube URL.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: youtubeUrl }),
      });

      const data = await response.json();
      if (response.ok) {
        setTranscript(data.punctuatedTranscript || "No transcript available.");
      } else {
        setError(data.error || "Failed to fetch transcript.");
      }
    } catch (err) {
      setError("An error occurred while fetching the transcript.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="transcript-container">
      <button
        className={`show-transcript-btn ${isVisible ? "active" : ""}`}
        onClick={() => {
          if (!isVisible) fetchTranscript();
          setIsVisible(!isVisible);
        }}
      >
        {isVisible ? "Hide Transcript" : "Show Transcript"}
      </button>

      {loading && <p className="loading">Loading transcript...</p>}
      {error && <p className="error">{error}</p>}

      {isVisible && !loading && transcript && (
        <div className="transcript-content">
          <p>{transcript}</p>
        </div>
      )}
    </div>
  );
};

TranscriptDisplay.propTypes = {
  youtubeUrl: PropTypes.string.isRequired,
};

export default TranscriptDisplay;
