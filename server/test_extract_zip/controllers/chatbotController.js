const { findChatbotAnswer } = require("../services/chatbotService");

const sendChatbotMessage = async (req, res) => {
  try {
    const { message } = req.body || {};

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    const answer = findChatbotAnswer(message);

    return res.status(200).json({
      success: true,
      message: "Chatbot response generated successfully",
      data: {
        answer,
      },
    });
  } catch (error) {
    console.error("Chatbot controller error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while generating chatbot response",
      error: error.message,
    });
  }
};

module.exports = {
  sendChatbotMessage,
};
