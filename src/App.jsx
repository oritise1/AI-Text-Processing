import { useState } from "react";
import ChatInterface from "./components/ChatInterface";
import OutputDisplay from "./components/OutputDisplay";
import Popup from "./components/popup";
import "./App.css";

const App = () => {
  const [messages, setMessages] = useState([]); // Store chat messages
  const [error, setError] = useState(null);
  const [detectedLanguage, setDetectedLanguage] = useState("");
  const [lastUserInput, setLastUserInput] = useState(""); // Store the last user input

  const handleSend = async (text) => {
    if (!text.trim()) {
      setError("Input text cannot be empty.");
      return;
    }
    // Add user message to the chat
    setMessages((prevMessages) => [
      ...prevMessages,
      { text, type: "user" }, // User messages are marked as "user"
    ]);
    setLastUserInput(text); // Store the last user input

    // Detect language of the input text
    try {
      if (!("ai" in self && "languageDetector" in self.ai)) {
        throw new Error("Language detection API is not supported.");
      }
      const detectionResult = await self.ai.languageDetector.detect(text);
      setDetectedLanguage(detectionResult.language);
    } catch (error) {
      setError("Language detection failed. Please try again.");
    }
  };

  const handleSummarize = async () => {
    try {
      if (!("ai" in self && "summarizer" in self.ai)) {
        throw new Error("Summarization API is not supported.");
      }
      const summary = await self.ai.summarizer.summarize(lastUserInput);
      // Add AI summary to the chat
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: summary, type: "ai" }, // AI messages are marked as "ai"
      ]);
    } catch (error) {
      setError("Summarization failed. Please try again.");
    }
  };

  const handleTranslate = async (targetLanguage) => {
    try {
      if (!("ai" in self && "translator" in self.ai)) {
        throw new Error("Translation API is not supported.");
      }
      const translation = await self.ai.translator.translate(lastUserInput, {
        targetLanguage: targetLanguage,
      });
      // Add AI translation to the chat
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: translation, type: "ai" }, // AI messages are marked as "ai"
      ]);
    } catch (error) {
      setError("Translation failed. Please try again.");
    }
  };

  const closePopup = () => {
    setError(null);
  };

  // Check if the last user input has more than 150 words
  const isSummarizeEnabled = lastUserInput.split(/\s+/).length > 150;

  return (
    <div className="app">
      <h1>AI-Powered Text Processing</h1>
      <div className="chatbox">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message ${message.type === "user" ? "user-message" : "ai-message"}`}
          >
            {message.text}
          </div>
        ))}
        {detectedLanguage && (
          <div className="ai-message">
            Detected Language: {detectedLanguage}
          </div>
        )}
      </div>
      <OutputDisplay
        onSummarize={handleSummarize}
        onTranslate={handleTranslate}
        isSummarizeEnabled={isSummarizeEnabled}
      />
      <ChatInterface onSend={handleSend} />
      {error && <Popup message={error} onClose={closePopup} />}
    </div>
  );
};

export default App;