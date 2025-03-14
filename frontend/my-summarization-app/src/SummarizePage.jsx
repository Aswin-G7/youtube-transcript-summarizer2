import React, { useState } from 'react';

const SummarizePage = () => {
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState([]);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [eventSource, setEventSource] = useState(null); // Track EventSource object

  const handleInputChange = (event) => {
    setTranscript(event.target.value);
  };

  const handleSummarize = async () => {
    setSummary([]); // Clear previous summary
    setIsSummarizing(true);

    // Send the transcript to the backend via POST
    try {
      await fetch('/api/summarize', {
        method: 'POST',
        body: JSON.stringify({ transcript }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Once transcript is sent, open SSE connection to stream summaries
      if (!eventSource) { // Ensure only one EventSource is active
        const newEventSource = new EventSource('/api/summarize/stream');
        setEventSource(newEventSource);

        newEventSource.onmessage = function (event) {
          const data = JSON.parse(event.data);

          // If the summary is completed
          if (data.summary === '[DONE]') {
            setIsSummarizing(false);
            newEventSource.close();
            setEventSource(null); // Reset EventSource state
            return;
          }

          // Append the current chunk of summary to the state
          setSummary((prevSummary) => [...prevSummary, data.summary]);
        };

        newEventSource.onerror = function (error) {
          console.error('Error in SSE:', error);
          console.log('EventSource error details:', newEventSource);
          setIsSummarizing(false);
          newEventSource.close();
          setEventSource(null); // Reset EventSource state
        };
      }
    } catch (error) {
      console.error('Error posting transcript:', error);
      setIsSummarizing(false);
    }
  };

  return (
    <div>
      <h1>Real-time Transcript Summarization</h1>
      <textarea
        rows="10"
        cols="50"
        value={transcript}
        onChange={handleInputChange}
        placeholder="Paste your transcript here..."
      ></textarea>
      <br />
      <button onClick={handleSummarize} disabled={isSummarizing}>
        {isSummarizing ? 'Summarizing...' : 'Summarize'}
      </button>
      <div>
        <h3>Summary:</h3>
        {summary.map((chunk, index) => (
          <p key={index}>{chunk}</p>
        ))}
      </div>
    </div>
  );
};

export default SummarizePage;
