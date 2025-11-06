
document.addEventListener("DOMContentLoaded", function () {
  const input = document.getElementById("chatbot-input");
  const messages = document.getElementById("chatbot-messages");

  input.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      const userMessage = input.value;
      if (userMessage.trim() !== "") {
        const messageElement = document.createElement("div");
        messageElement.textContent = "Uživatel: " + userMessage;
        messages.appendChild(messageElement);
        input.value = "";

        // Simulovaná odpověď chatbotu
        const botReply = document.createElement("div");
        botReply.textContent = "Chatbot: Děkuji za zprávu!";
        messages.appendChild(botReply);
      }
    }
  });
});
