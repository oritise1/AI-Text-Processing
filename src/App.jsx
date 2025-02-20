import React, { useState, useRef, useEffect } from 'react';
import { IoSend } from 'react-icons/io5';
import { IoSettingsSharp } from 'react-icons/io5';
import classNames from 'classnames';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'es', name: 'Spanish' },
  { code: 'ru', name: 'Russian' },
  { code: 'tr', name: 'Turkish' },
  { code: 'fr', name: 'French' }
];

function Message({ text, detectedLanguage, onTranslate, onSummarize, translatedText, summarizedText, error, isProcessing }) {
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const shouldShowSummarize = text.length > 150;

  return (
    <div className="bg-white rounded-lg p-4 mb-4 shadow-md">
      <p className="text-gray-800 mb-2">{text}</p>
      {detectedLanguage && (
        <p className="text-sm text-gray-500 mb-2">
          Detected Language: {detectedLanguage}
        </p>
      )}
      <div className="flex flex-wrap gap-2 mt-2">
        {shouldShowSummarize && (
          <button
            onClick={onSummarize}
            disabled={isProcessing}
            className={`${isProcessing ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'} text-white px-4 py-2 rounded transition-colors`}
            aria-label="Summarize text"
          >
            {isProcessing ? 'Processing...' : 'Summarize'}
          </button>
        )}
        <div className="flex gap-2">
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="border rounded px-2 py-2"
            aria-label="Select language for translation"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => onTranslate(selectedLanguage)}
            disabled={isProcessing}
            className={`${isProcessing ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'} text-white px-4 py-2 rounded transition-colors`}
            aria-label="Translate text"
          >
            {isProcessing ? 'Processing...' : 'Translate'}
          </button>
        </div>
      </div>
      {error && (
        <p className="text-red-500 mt-2">{error}</p>
      )}
      {summarizedText && (
        <div className="mt-4 p-3 bg-gray-50 rounded">
          <p className="font-semibold">Summary:</p>
          <p>{summarizedText}</p>
        </div>
      )}
      {translatedText && (
        <div className="mt-4 p-3 bg-gray-50 rounded">
          <p className="font-semibold">Translation:</p>
          <p>{translatedText}</p>
        </div>
      )}
    </div>
  );
}

function Settings({ apiKey, onSave, onClose }) {
  const [key, setKey] = useState(apiKey || '');

  const handleSave = () => {
    onSave(key);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">API Settings</h2>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="apiKey">
            OpenAI API Key
          </label>
          <input
            id="apiKey"
            type="password"
            className="w-full border rounded p-2"
            placeholder="sk-..."
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">
            Your API key is stored locally in your browser. We never send it to our servers.
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Load API key from storage
    chrome.storage.sync.get(['openaiApiKey'], (result) => {
      if (result.openaiApiKey) {
        setApiKey(result.openaiApiKey);
      } else {
        setShowSettings(true); // Show settings on first run
      }
    });
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const saveApiKey = (key) => {
    chrome.storage.sync.set({ openaiApiKey: key }, () => {
      setApiKey(key);
      setShowSettings(false);
    });
  };

  const detectLanguage = async (text) => {
    if (!apiKey) {
      return { error: 'API key is missing. Please configure in settings.' };
    }
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a language detection tool. Identify the language of the provided text. Respond with only the language name in English.'
            },
            { role: 'user', content: text }
          ],
          max_tokens: 10
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to detect language');
      }
      
      const data = await response.json();
      const detectedLanguage = data.choices[0].message.content.trim();
      return { detectedLanguage };
    } catch (error) {
      return { error: 'Error detecting language: ' + error.message };
    }
  };

  const translateText = async (text, targetLanguage) => {
    if (!apiKey) {
      return { error: 'API key is missing. Please configure in settings.' };
    }
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are a translator. Translate the following text to ${LANGUAGES.find(l => l.code === targetLanguage)?.name || 'English'}.`
            },
            { role: 'user', content: text }
          ],
          max_tokens: 1000
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to translate text');
      }
      
      const data = await response.json();
      const translatedText = data.choices[0].message.content.trim();
      return { translatedText };
    } catch (error) {
      return { error: 'Error translating text: ' + error.message };
    }
  };

  const summarizeText = async (text) => {
    if (!apiKey) {
      return { error: 'API key is missing. Please configure in settings.' };
    }
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'Summarize the following text in a concise manner, preserving key information:'
            },
            { role: 'user', content: text }
          ],
          max_tokens: 300
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to summarize text');
      }
      
      const data = await response.json();
      const summary = data.choices[0].message.content.trim();
      return { summary };
    } catch (error) {
      return { error: 'Error summarizing text: ' + error.message };
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    
    if (!apiKey) {
      setShowSettings(true);
      return;
    }

    const newMessage = {
      text: inputText,
      detectedLanguage: null,
      translatedText: null,
      summarizedText: null,
      error: null,
      isProcessing: true
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    setIsProcessing(true);

    try {
      const result = await detectLanguage(inputText);
      
      const updatedMessage = {
        ...newMessage,
        isProcessing: false
      };
      
      if (result.error) {
        updatedMessage.error = result.error;
      } else {
        updatedMessage.detectedLanguage = result.detectedLanguage;
      }
      
      setMessages(prev => [...prev.slice(0, -1), updatedMessage]);
    } catch (error) {
      setMessages(prev => [...prev.slice(0, -1), {
        ...newMessage,
        error: 'Error detecting language. Please try again.',
        isProcessing: false
      }]);
    }
    
    setIsProcessing(false);
  };

  const handleTranslate = async (messageIndex, targetLanguage) => {
    const message = messages[messageIndex];
    
    // Update state to show processing
    const updatedMessages = [...messages];
    updatedMessages[messageIndex] = {
      ...message,
      isProcessing: true
    };
    setMessages(updatedMessages);
    
    try {
      const result = await translateText(message.text, targetLanguage);
      
      const newUpdatedMessages = [...messages];
      if (result.error) {
        newUpdatedMessages[messageIndex] = {
          ...message,
          error: result.error,
          isProcessing: false
        };
      } else {
        newUpdatedMessages[messageIndex] = {
          ...message,
          translatedText: result.translatedText,
          error: null,
          isProcessing: false
        };
      }
      
      setMessages(newUpdatedMessages);
    } catch (error) {
      const newUpdatedMessages = [...messages];
      newUpdatedMessages[messageIndex] = {
        ...message,
        error: 'Error translating text. Please try again.',
        isProcessing: false
      };
      setMessages(newUpdatedMessages);
    }
  };

  const handleSummarize = async (messageIndex) => {
    const message = messages[messageIndex];
    
    // Update state to show processing
    const updatedMessages = [...messages];
    updatedMessages[messageIndex] = {
      ...message,
      isProcessing: true
    };
    setMessages(updatedMessages);
    
    try {
      const result = await summarizeText(message.text);
      
      const newUpdatedMessages = [...messages];
      if (result.error) {
        newUpdatedMessages[messageIndex] = {
          ...message,
          error: result.error,
          isProcessing: false
        };
      } else {
        newUpdatedMessages[messageIndex] = {
          ...message,
          summarizedText: result.summary,
          error: null,
          isProcessing: false
        };
      }
      
      setMessages(newUpdatedMessages);
    } catch (error) {
      const newUpdatedMessages = [...messages];
      newUpdatedMessages[messageIndex] = {
        ...message,
        error: 'Error summarizing text. Please try again.',
        isProcessing: false
      };
      setMessages(newUpdatedMessages);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {showSettings && (
        <Settings 
          apiKey={apiKey} 
          onSave={saveApiKey} 
          onClose={() => setShowSettings(false)} 
        />
      )}
      
      <header className="bg-white border-b p-3 flex justify-between items-center">
        <h1 className="text-lg font-bold">AI Text Processing</h1>
        <button 
          onClick={() => setShowSettings(true)}
          className="p-2 rounded-full hover:bg-gray-100"
          aria-label="Settings"
        >
          <IoSettingsSharp size={20} />
        </button>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-8">
              <p>Enter text to detect language, translate, or summarize</p>
            </div>
          )}
          
          {messages.map((message, index) => (
            <Message
              key={index}
              {...message}
              onTranslate={(targetLanguage) => handleTranslate(index, targetLanguage)}
              onSummarize={() => handleSummarize(index)}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>
      <div className="border-t bg-white p-4">
        <div className="max-w-3xl mx-auto flex gap-2">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 resize-none border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type your message..."
            rows="3"
            aria-label="Input text"
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isProcessing}
            className={classNames(
              "p-4 rounded-full",
              "transition-colors duration-200",
              {
                "bg-blue-500 hover:bg-blue-600 text-white": inputText.trim() && !isProcessing,
                "bg-gray-200 text-gray-400 cursor-not-allowed": !inputText.trim() || isProcessing
              }
            )}
            aria-label="Send message"
          >
            <IoSend size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;