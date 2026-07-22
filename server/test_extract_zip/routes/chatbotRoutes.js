const express = require("express");

const { sendChatbotMessage } = require("../controllers/chatbotController");

const router = express.Router();

router.post("/message", sendChatbotMessage);

module.exports = router;
