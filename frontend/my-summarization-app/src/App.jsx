import React from 'react';
import SummarizePage from './SummarizePage';
import YoutubeSummarizePage from './YoutubeSummarizePage';
import TranslationPage from "./TranslationPage";


function App() {
  return (
    <div className="App">
      <SummarizePage />
      <hr />
      <YoutubeSummarizePage />
      <hr />
      <TranslationPage />
    </div>
  );
}

export default App;
