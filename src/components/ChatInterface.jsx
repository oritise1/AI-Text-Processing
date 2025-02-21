import { useState } from "react";
import { FaPaperPlane } from "react-icons/fa";

const ChatInterface = ({ onSend }) => {
  const [inputText, setInputText] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSend(inputText);
      setInputText("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="chat-interface">
      <textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Type or paste your text here..."
        aria-label="Text input"
      />
      <button type="submit" aria-label="Send">
        <FaPaperPlane />
      </button>
    </form>
  );
};

export default ChatInterface;