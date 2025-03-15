import React, { useState } from "react";

const TranslationPage = () => {
  const [targetLang, setTargetLang] = useState("es"); // Default: Spanish
  const [originalText, setOriginalText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Available languages
  const languages = [
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "hi", name: "Hindi" },
  ];

  const handleTranslate = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetLang }),
      });

      const data = await response.json();

      if (response.ok) {
        setOriginalText(data.original);
        setTranslatedText(data.translated);
      } else {
        setError(data.error || "Translation failed.");
      }
    } catch (err) {
      setError("Server error. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div>
      <h2>Translate Summary</h2>
      <label>Select Language: </label>
      <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
      <button onClick={handleTranslate} disabled={loading}>
        {loading ? "Translating..." : "Translate"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {originalText && translatedText && (
        <div>
          <h3>Original Summary:</h3>
          <p>{originalText}</p>
          <h3>Translated Summary ({targetLang.toUpperCase()}):</h3>
          <p>{translatedText}</p>
        </div>
      )}
    </div>
  );
};

export default TranslationPage;
