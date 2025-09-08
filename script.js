const chatBox = document.getElementById("chat-box");
const inputField = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

function appendMessage(text, cls) {
  const div = document.createElement("div");
  div.className = cls;
  div.textContent = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
  return div;
}

function appendTyping() {
  const div = document.createElement("div");
  div.className = "bot-message";
  div.innerHTML = `<div class="typing"><span>.</span><span>.</span><span>.</span></div>`;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
  return div;
}

async function sendMessage() {
  const userText = inputField.value.trim();
  if (!userText) return;

  // Add user message
  appendMessage(userText, "user-message");
  inputField.value = "";

  // Add typing animation
  const typingDiv = appendTyping();

  try {
    const resp = await fetch("http://localhost:3000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: userText })
    });

    if (!resp.ok || !resp.body) {
      typingDiv.textContent = "Error: " + (await resp.text());
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let botText = "";
    let firstChunk = true;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      botText += chunk;

      if (firstChunk) {
        typingDiv.textContent = ""; // remove dots on first reply
        firstChunk = false;
      }

      typingDiv.textContent = botText;
    }
  } catch (err) {
    typingDiv.textContent = "Network error: " + err.message;
  }
}

// Send button & Enter key bindings
sendBtn.addEventListener("click", sendMessage);
inputField.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    sendMessage();
  }
});
