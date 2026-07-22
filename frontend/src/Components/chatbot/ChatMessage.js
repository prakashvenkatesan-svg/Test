const ChatMessage = ({ chat }) => {
  return (
    <div
      className={`chatbot-message ${
        chat.role === "bot" ? "chatbot-message-bot" : "chatbot-message-user"
      }`}
    >
      <p className='chatbot-message-text'>{chat.text}</p>
    </div>
  );
};

export default ChatMessage;
