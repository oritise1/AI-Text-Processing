import { useState } from "react";

const OutputDisplay = ({ onSummarize, onTranslate, isSummarizeEnabled }) => {
  const [selectedLanguage, setSelectedLanguage] = useState("en");

  return (
    <div className="action-buttons">
      {isSummarizeEnabled && (
        <button onClick={onSummarize}>Summarize</button>
      )}
      <select
        value={selectedLanguage}
        onChange={(e) => setSelectedLanguage(e.target.value)}
        aria-label="Select language"
      >
        <option value="en">English</option>
        <option value="pt">Portuguese</option>
        <option value="es">Spanish</option>
        <option value="ru">Russian</option>
        <option value="tr">Turkish</option>
        <option value="fr">French</option>
      </select>
      <button onClick={() => onTranslate(selectedLanguage)}>Translate</button>
    </div>
  );
};

export default OutputDisplay;