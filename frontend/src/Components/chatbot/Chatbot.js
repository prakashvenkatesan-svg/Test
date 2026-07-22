import { useEffect, useRef, useState } from "react";

import ChatForm from "./ChatForm";
import ChatMessage from "./ChatMessage";
import chatbotImage from "../../assets/chatbotimg.png";
import { askChatbot } from "../../services/chatbotService";
import "./chatbot.css";

const initialBotMessage = {
  role: "bot",
  text: "Hello! How can I help you today?",
};

const Chatbot = () => {
  const [chatHistory, setChatHistory] = useState([initialBotMessage]);
  const [showChatbot, setShowChatbot] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const chatBodyRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTo({
        top: chatBodyRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [chatHistory]);

  useEffect(() => {
    if (showChatbot && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showChatbot]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const message = inputValue.trim();

    if (!message || isLoading) {
      return;
    }

    setInputValue("");
    setIsLoading(true);
    setChatHistory((prev) => [...prev, { role: "user", text: message }]);

    const answer = await askChatbot(message);

    setChatHistory((prev) => [...prev, { role: "bot", text: answer }]);
    setIsLoading(false);
  };

  return (
    <div
      className={`chatbot-wrapper ${showChatbot ? "chatbot-wrapper-open" : ""}`}
    >
      <button
        onClick={() => setShowChatbot((prev) => !prev)}
        className='chatbot-toggler'
        type='button'
        aria-label='Toggle AEON Advisor'
      >
        {showChatbot ? (
          <span className='chatbot-toggler-close' aria-hidden='true'>
            <span className='chatbot-toggler-close-disc'>
              <span className='chatbot-toggler-close-text'>x</span>
            </span>
          </span>
        ) : (
          <img
            src={chatbotImage}
            alt=''
            className='chatbot-toggler-icon'
            aria-hidden='true'
          />
        )}
      </button>

      <div className='chatbot-popup'>
        <div className='chatbot-header'>
          <div className='chatbot-header-info'>
            <img
              src={chatbotImage}
              alt='AEON Advisor'
              className='chatbot-avatar'
            />
            <h2 className='chatbot-logo-text'>AEON Advisor</h2>
          </div>

          <button
            onClick={() => setShowChatbot(false)}
            className='chatbot-close-btn'
            type='button'
            aria-label='Close AEON Advisor'
          >
            x
          </button>
        </div>

        <div ref={chatBodyRef} className='chatbot-body'>
          {chatHistory.map((chat, index) => (
            <ChatMessage key={`${chat.role}-${index}`} chat={chat} />
          ))}

          {isLoading ? (
            <div className='chatbot-message chatbot-message-bot'>
              <p className='chatbot-message-text'>Thinking...</p>
            </div>
          ) : null}
        </div>

        <div className='chatbot-footer'>
          <ChatForm
            inputValue={inputValue}
            onInputChange={(event) => setInputValue(event.target.value)}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            inputRef={inputRef}
          />
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
