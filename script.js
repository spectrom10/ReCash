
const chatForm = document.querySelector("#chat-form");
const chatInput = document.querySelector("#chat-input");
const sendButton = document.querySelector("#send-button");
const chatMessages = document.querySelector("#chat-messages");
const chatStatus = document.querySelector("#chat-status");
const chatHelp = document.querySelector("#chat-help");

const history = [];
let isLoading = false;

chatInput.disabled = false;
chatInput.maxLength = 1000;
chatInput.required = true;
chatInput.placeholder = "Ask ReCash AI about financial markets...";

chatStatus.textContent = "ReCash AI • Financial education";
chatHelp.textContent =
  "Ask about stocks, forex, ETFs, economics, or financial news.";

chatMessages.replaceChildren();

addMessage(
  "ReCash AI",
  "Welcome to ReCash AI! Ask me about financial markets, " +
    "stocks, currencies, ETFs, or economic concepts.",
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
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function updateSendButton() {
  sendButton.disabled =
    isLoading || chatInput.value.trim().length === 0;
}

chatInput.addEventListener("input", updateSendButton);

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (isLoading) return;

  const question = chatInput.value.trim();
  if (!question) return;

  const previousHistory = history.slice(-6);

  addMessage("You", question, "user");
  chatInput.value = "";

  isLoading = true;
  updateSendButton();
  chatStatus.textContent = "ReCash AI is thinking...";

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: question,
        history: previousHistory
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "The AI service is unavailable."
      );
    }

    if (typeof data.reply !== "string") {
      throw new Error("The AI returned an invalid response.");
    }

    addMessage("ReCash AI", data.reply, "assistant");

    history.push(
      { role: "user", content: question },
      { role: "assistant", content: data.reply }
    );

    if (history.length > 6) {
      history.splice(0, history.length - 6);
    }

    chatStatus.textContent = "ReCash AI • Financial education";
  } catch (error) {
    addMessage(
      "ReCash AI",
      error.message || "Something went wrong. Please try again.",
      "assistant"
    );

    chatStatus.textContent = "ReCash AI • Temporarily unavailable";
  } finally {
    isLoading = false;
    updateSendButton();
    chatInput.focus();
  }
});

updateSendButton();
