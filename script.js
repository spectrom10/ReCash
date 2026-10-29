const chatForm = document.querySelector("#chat-form");
const chatInput = document.querySelector("#chat-input");
const sendButton = document.querySelector("#send-button");
const chatMessages = document.querySelector("#chat-messages");
const chatStatus = document.querySelector("#chat-status");
const chatHelp = document.querySelector("#chat-help");

// Local demo only. No API connections or API keys.
chatInput.disabled = false;
chatInput.maxLength = 1000;
chatInput.required = true;

chatStatus.textContent = "Local demo • No AI service connected.";

chatHelp.textContent =
  "Try asking about forex, currency pairs, or pips. Replies are preset.";

chatInput.placeholder = "What is a currency pair?";

chatMessages.replaceChildren();

addMessage(
  "ReCash Demo",
  "Welcome! This demo has preset explanations of forex, currency pairs, " +
    "and pips. It does not access live markets or an AI service.",
  "assistant"
);

function addMessage(author, text, role) {
  const message = document.createElement("div");

  message.classList.add(
    "msg",
    role === "user" ? "msg--user" : "msg--bot"
  );

  const authorLabel = document.createElement("p");
  authorLabel.className = "msg-label";
  authorLabel.textContent = author;

  const content = document.createElement("p");
  content.textContent = text;

  message.append(authorLabel, content);
  chatMessages.append(message);

  // Keep the most recent reply visible inside the chat panel.
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function getDemoReply(question) {
  const text = question.toLowerCase();

  if (/\b(pip|pips)\b/.test(text)) {
    return (
      "A pip is a conventional unit of price movement in forex. " +
      "For many pairs, one pip is 0.0001. For many Japanese yen pairs, " +
      "it is 0.01. Check the instrument’s quotation convention."
    );
  }

  if (/\b(pair|pairs|eur\/usd)\b/.test(text)) {
    return (
      "A currency pair expresses one currency’s value in another. " +
      "In EUR/USD, EUR is the base currency and USD is the quote currency. " +
      "A hypothetical price of 1.1000 means one euro costs 1.10 US dollars."
    );
  }

  if (/\b(forex|fx|foreign exchange)\b/.test(text)) {
    return (
      "Forex means foreign exchange: exchanging one currency for another. " +
      "Currencies are quoted in pairs, such as EUR/USD. " +
      "Trading involves risk, and leverage can magnify losses."
    );
  }

  if (/\b(hello|hi|hey)\b/.test(text)) {
    return (
      "Hello! Try “What is forex?”, “What is a currency pair?”, " +
      "or “What is a pip?”"
    );
  }

  return (
    "This local demo only has preset replies about forex, currency pairs, " +
    "and pips. It cannot analyze markets or answer other questions yet."
  );
}

function updateSendButton() {
  sendButton.disabled = chatInput.value.trim().length === 0;
}

chatInput.addEventListener("input", updateSendButton);

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const question = chatInput.value.trim();

  if (!question) return;

  addMessage("You", question, "user");
  addMessage("ReCash Demo", getDemoReply(question), "assistant");

  chatInput.value = "";
  updateSendButton();
  chatInput.focus();
});

updateSendButton();