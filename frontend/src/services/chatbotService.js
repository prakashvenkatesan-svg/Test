import api from "./api";

export const askChatbot = async (message) => {
  try {
    const response = await api.post("/chatbot/message", {
      message,
    });

    return (
      response?.data?.data?.answer ||
      response?.data?.answer ||
      "Sorry, I could not understand your question."
    );
  } catch (error) {
    console.error("Chatbot service error:", error.response?.data || error.message);
    return "Server error. Please try again later.";
  }
};
