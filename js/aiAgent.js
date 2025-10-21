document.addEventListener("DOMContentLoaded", () => {
  const chatbox = document.getElementById("chatbox");
  const chatToggle = document.getElementById("chatToggle");
  const closeChat = document.getElementById("closeChat");
  const sendBtn = document.getElementById("sendBtn");
  const userInput = document.getElementById("userInput");
  const chatMessages = document.getElementById("chatMessages");

  // Hide chat by default
  chatbox.classList.add("hidden");

  // Toggle chat visibility
  chatToggle.addEventListener("click", () => {
    chatbox.classList.toggle("hidden");
    chatToggle.classList.toggle("hidden");
  });

  closeChat.addEventListener("click", () => {
    chatbox.classList.add("hidden");
    chatToggle.classList.remove("hidden");
  });

  // Send message when user presses send or Enter
  async function handleSend() {
    const question = userInput.value.trim();
    if (!question) return;

    // Add user message (right side)
    appendMessage("user", question);
    userInput.value = "";

    // Add temporary "Thinking..." (left side)
    const thinkingMsg = appendMessage("ai", "Thinking...");

    try {
      const res = await fetch("/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();

      const aiResponse =
        data.choices?.[0]?.message?.content ||
        data.error?.message ||
        "Sorry, something went wrong.";

      // Replace the "Thinking..." message with the actual AI response
      updateMessage(thinkingMsg, aiResponse);
    } catch (err) {
      console.error(err);
      updateMessage(thinkingMsg, "Sorry, something went wrong.");
    }
  }

  sendBtn.addEventListener("click", handleSend);
  userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleSend();
  });

  // ==============================
  // Helpers for message formatting
  // ==============================

  function appendMessage(sender, text) {
    // Create row for alignment
    const row = document.createElement("div");
    row.classList.add("message-row", sender);

    // Create message bubble
    const message = document.createElement("div");
    message.classList.add("message", sender);
    message.textContent = text;

    // Add bubble into row, then row into chat area
    row.appendChild(message);
    chatMessages.appendChild(row);

    // Auto-scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return message; // return element for updates (e.g., replace "Thinking...")
  }

  function updateMessage(element, newText) {
    element.textContent = newText;
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
});
