import { useState } from "react";
import ChatInterface from "./components/ChatInterface";
import OutputDisplay from "./components/OutputDisplay";
import Popup from "./components/Popup";
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
  
      // Check if summarization is supported for the detected language
      const summarizerCapabilities = await self.ai.summarizer.capabilities();
      const result = summarizerCapabilities.languageSupported(detectedLanguage);
  
      if (result === "no") {
        setError("Summarization is not supported for the detected language.");
      } else if (result === "readily") {
        // Summarize the last user input
        const summary = await self.ai.summarizer.summarize(lastUserInput);
        setMessages((prevMessages) => [
          ...prevMessages,
          { text: summary, type: "ai" }, // AI messages are marked as "ai"
        ]);
      } else if (result === "after-download") {
        // Handle the case where models need to be downloaded
        const summarizer = await self.ai.summarizer.create({
          sourceLanguage: detectedLanguage,
          monitor(m) {
            m.addEventListener("downloadprogress", (e) => {
              console.log(`Downloaded ${e.loaded} of ${e.total} bytes.`);
            });
          },
        });
  
        // Summarize the last user input after the download is complete
        const summary = await summarizer.summarize(lastUserInput);
        setMessages((prevMessages) => [
          ...prevMessages,
          { text: summary, type: "ai" }, // AI messages are marked as "ai"
        ]);
      }
    } catch (error) {
      setError("Summarization failed. Please try again.");
    }
  };

  const handleTranslate = async (targetLanguage) => {
    try {
      if (!("ai" in self && "translator" in self.ai)) {
        throw new Error("Translation API is not supported.");
      }

      // Check if the language pair is supported
      const translatorCapabilities = await self.ai.translator.capabilities();
      const result = translatorCapabilities.languagePairAvailable(
        detectedLanguage, // Use detected language as the source
        targetLanguage
      );

      if (result === "no") {
        setError("Translation is not supported for the selected language pair.");
      } else if (result === "readily") {
        // Create a translator for the detected language to the target language
        const translator = await self.ai.translator.create({
          sourceLanguage: detectedLanguage,
          targetLanguage: targetLanguage,
        });

        // Translate the last user input
        const translation = await translator.translate(lastUserInput);
        setMessages((prevMessages) => [
          ...prevMessages,
          { text: translation, type: "ai" }, // AI messages are marked as "ai"
        ]);
      } else if (result === "after-download") {
        // Handle the case where models need to be downloaded
        const translator = await self.ai.translator.create({
          sourceLanguage: detectedLanguage,
          targetLanguage: targetLanguage,
          monitor(m) {
            m.addEventListener("downloadprogress", (e) => {
              console.log(`Downloaded ${e.loaded} of ${e.total} bytes.`);
            });
          },
        });

        // Translate the last user input after the download is complete
        const translation = await translator.translate(lastUserInput);
        setMessages((prevMessages) => [
          ...prevMessages,
          { text: translation, type: "ai" }, // AI messages are marked as "ai"
        ]);
      }
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