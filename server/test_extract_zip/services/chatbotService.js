const chatbotData = [
  {
    keywords: ["hi", "hello", "hey"],
    answer: "Hello! How can I help you today?",
  },
  {
    keywords: ["minimum investment", "minimum amount", "start with", "$600", "$800"],
    answer:
      "We recommend starting with a minimum of $600 to $800 per month for US equity investments. Consistency matters more than size and regular monthly investing is the key to building a strong portfolio over time.",
  },
  {
    keywords: ["subscription cost", "subscription price", "how much does subscription cost", "$300 per annum", "aed 1155"],
    answer:
      "Our subscription is priced at $300 per annum (approximately AED 1,155). We also offer discounted pricing on 2-year and 3-year plans. Please connect with one of our Relationship Managers for details.",
  },
  {
    keywords: ["trial period", "free trial", "discount for smaller investors", "small investors discount"],
    answer:
      "We currently do not offer a trial period. However, we do offer attractive discounts on 2-year and 3-year subscription plans. Please reach out to our Relationship Managers to explore the best plan for you.",
  },
  {
    keywords: ["worth it", "invest $600", "invest $800", "us market from india"],
    answer:
      "Even at $600 to $800 per month, investing in the US market gives you currency appreciation potential and exposure to the world's largest and most liquid equity market. Small, consistent investments compounded over time can build meaningful wealth.",
  },
  {
    keywords: ["expected returns", "returns can i expect", "what returns can i expect"],
    answer:
      "Our goal is to consistently outperform our benchmark, the S&P 500 Equal Weight Index. We cannot predict or guarantee specific returns, but our portfolio construction and stock selection process is designed to deliver superior risk-adjusted returns over a 3-year-plus horizon.",
  },
  {
    keywords: ["xirr", "how is xirr calculated", "why xirr"],
    answer:
      "XIRR accounts for the time value of money and is designed for investments made in varying amounts at different times. It gives a precise annualized picture of how your portfolio has performed based on when each amount was invested.",
  },
  {
    keywords: ["how many stocks", "stocks per month", "recommend each month"],
    answer:
      "We typically recommend 4 to 6 stocks per month, carefully selected through our multi-layered research process.",
  },
  {
    keywords: ["monthly recommendations", "weekly recommendations", "how frequently are recommendations sent"],
    answer:
      "Recommendations are shared on a monthly basis, not weekly. This is intentional because quality research takes time and we believe in giving each recommendation the thoroughness it deserves.",
  },
  {
    keywords: ["how do you pick stocks", "research process", "recommend stocks"],
    answer:
      "Our research team screens US-listed companies using quantitative and qualitative metrics, benchmarks them against sector peers, and then performs detailed fundamental analysis and internal review before any recommendation is issued.",
  },
  {
    keywords: ["how should i allocate", "allocate capital", "equal allocation"],
    answer:
      "We recommend allocating equally across all recommended stocks from your designated monthly investment amount. This helps maintain balanced exposure and avoid concentration in any single name.",
  },
  {
    keywords: ["when should i exit", "exit a stock", "profit booking", "exit call"],
    answer:
      "We issue two types of exit guidance: Profit Booking Calls when upside may be saturated or near-term downside risk is rising, and Exit Calls when a company no longer meets our investment philosophy or the original business case changes materially.",
  },
  {
    keywords: ["why invest in us market", "benefits of investing in us market", "us market compared to india"],
    answer:
      "The US market offers access to world-class companies, capital diversification, potential currency appreciation from USD exposure, deep liquidity, and strong regulatory transparency.",
  },
  {
    keywords: ["demat account"],
    answer:
      "A Demat account stores shares and securities in electronic form.",
  },
  {
    keywords: ["trading account"],
    answer:
      "A trading account is used to buy and sell stocks in the market.",
  },
  {
    keywords: ["mutual fund"],
    answer:
      "A mutual fund pools money from investors and invests it in assets like stocks, bonds, or other securities.",
  },
  {
    keywords: ["sip"],
    answer:
      "SIP means Systematic Investment Plan, where you invest a fixed amount regularly.",
  },
  {
    keywords: ["stop loss"],
    answer:
      "Stop loss is an order placed to limit losses in trading.",
  },
  {
    keywords: ["contact", "customer support", "support"],
    answer:
      "For support, you can use the Contact Us page on the website or reach out to the Aionion Capital team directly through the listed support and grievance channels.",
  },
];

const normalizeMessage = (message) => String(message || "").toLowerCase().trim();

const findChatbotAnswer = (message) => {
  const normalizedMessage = normalizeMessage(message);

  if (!normalizedMessage) {
    return "Message is required";
  }

  const matchedItem = chatbotData.find((item) =>
    item.keywords.some((keyword) => normalizedMessage.includes(keyword)),
  );

  return matchedItem?.answer || "Sorry, I could not understand your question.";
};

module.exports = {
  findChatbotAnswer,
};
