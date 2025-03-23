import React from "react";
import PropTypes from "prop-types";
import "./YouTubeVideoPlayer.css"; // We will add styling here

const YouTubeVideoPlayer = ({ videoUrl }) => {
  // Function to extract the YouTube Video ID from a full URL
  const getYouTubeVideoID = (url) => {
    const match = url.match(
      /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/ ]{11})/
    );
    return match ? match[1] : null;
  };

  const videoID = getYouTubeVideoID(videoUrl);

  if (!videoID) return <p className="error-message">Invalid YouTube URL</p>;

  return (
    <div className="youtube-video-container">
      <iframe
        width="100%"
        height="315"
        src={`https://www.youtube.com/embed/${videoID}`}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  );
};

// Props validation
YouTubeVideoPlayer.propTypes = {
  videoUrl: PropTypes.string.isRequired,
};

export default YouTubeVideoPlayer;
