(function () {
  "use strict";
  const currentScript = document.currentScript;
  const scriptUrl = currentScript ? currentScript.src : "";
  const scriptBase = scriptUrl ? scriptUrl.slice(0, scriptUrl.lastIndexOf("/") + 1) : "";
  const config = window.ProChatbotConfig || {};
  const endpoint = config.endpoint || (scriptBase + "../api/chat.php");
  const title = config.title || "Website assistant";
  const subtitle = config.subtitle || "Here to help · Usually replies instantly";
  const accent = config.accent || "#635bff";
  const greeting = config.greeting || "I’m your AI assistant. Ask me a question and I’ll do my best to help.";
  const instructions = config.instructions || "";
  const suggestions = config.suggestions || [
    "What can you help me with?",
    "Tell me about your services",
    "How can I get in touch?"
  ];
  if (document.querySelector(".pcw-root")) return;

  const root = document.createElement("div");
  root.className = "pcw-root";
  root.style.setProperty("--pcw-accent", accent);
  root.style.setProperty("--pcw-accent-dark", config.accentDark || accent);
  root.innerHTML = `
    <section class="pcw-panel" role="dialog" aria-label="${escapeHtml(title)}" aria-modal="false">
      <header class="pcw-header">
        <div class="pcw-avatar" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3.5l1.8 5.2L19 10.5l-5.2 1.8L12 17.5l-1.8-5.2L5 10.5l5.2-1.8L12 3.5Z"/><path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z"/></svg></div>
        <div class="pcw-heading"><div class="pcw-title">${escapeHtml(title)}</div><div class="pcw-status"><span class="pcw-status-dot"></span>${escapeHtml(subtitle)}</div></div>
        <button class="pcw-icon-btn pcw-close" type="button" aria-label="Close chat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 6 12 12M18 6 6 18"/></svg></button>
      </header>
      <main class="pcw-body" aria-live="polite">
        <div class="pcw-welcome"><div class="pcw-eyebrow">AI ASSISTANT</div><h3>How can I help<br>you today?</h3><p>${escapeHtml(greeting)}</p></div>
        <div class="pcw-suggestions"></div><div class="pcw-thread"></div>
      </main>
      <footer class="pcw-footer">
        <form class="pcw-composer"><textarea class="pcw-input" rows="1" maxlength="4000" aria-label="Your message" placeholder="Write your message…"></textarea><button class="pcw-send" type="submit" aria-label="Send message"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg></button></form>
        <div class="pcw-error" role="alert" hidden></div><div class="pcw-footnote">AI can make mistakes. Please verify important details.</div>
      </footer>
    </section>
    <button class="pcw-launcher" type="button" aria-label="Open chat" aria-expanded="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H5l-2 2v-9.5A7.5 7.5 0 0 1 10.5 4H12a8 8 0 0 1 8 7.5Z"/><path d="M8 11h8M8 14h5"/></svg></button>`;
  document.body.appendChild(root);

  const panel = root.querySelector(".pcw-panel");
  const launcher = root.querySelector(".pcw-launcher");
  const closeBtn = root.querySelector(".pcw-close");
  const body = root.querySelector(".pcw-body");
  const thread = root.querySelector(".pcw-thread");
  const suggestionsEl = root.querySelector(".pcw-suggestions");
  const form = root.querySelector(".pcw-composer");
  const input = root.querySelector(".pcw-input");
  const send = root.querySelector(".pcw-send");
  const error = root.querySelector(".pcw-error");
  const welcome = root.querySelector(".pcw-welcome");
  let messages = [];
  let busy = false;

  suggestionsEl.innerHTML = suggestions.slice(0, 4).map(s =>
    `<button type="button" class="pcw-suggestion"><span>${escapeHtml(s)}</span><span aria-hidden="true">↗</span></button>`
  ).join("");
  suggestionsEl.querySelectorAll(".pcw-suggestion").forEach((button, i) => {
    button.addEventListener("click", () => { input.value = suggestions[i]; submitMessage(); });
  });

  function toggle(open) {
    panel.classList.toggle("pcw-open", open);
    launcher.setAttribute("aria-expanded", String(open));
    launcher.setAttribute("aria-label", open ? "Chat open" : "Open chat");
    if (open) setTimeout(() => input.focus(), 120);
  }
  launcher.addEventListener("click", () => toggle(!panel.classList.contains("pcw-open")));
  closeBtn.addEventListener("click", () => toggle(false));
  document.addEventListener("keydown", e => { if (e.key === "Escape" && panel.classList.contains("pcw-open")) toggle(false); });

  function addMessage(role, content) {
    const row = document.createElement("div");
    row.className = "pcw-message " + (role === "user" ? "pcw-user" : "pcw-assistant");
    const bubble = document.createElement("div");
    bubble.className = "pcw-bubble";
    bubble.textContent = content;
    row.appendChild(bubble);
    thread.appendChild(row);
    scrollBottom();
    return row;
  }
  function addTyping() {
    const row = document.createElement("div");
    row.className = "pcw-message pcw-assistant";
    row.innerHTML = '<div class="pcw-typing" aria-label="Assistant is typing"><span></span><span></span><span></span></div>';
    thread.appendChild(row); scrollBottom(); return row;
  }
  function scrollBottom() { body.scrollTop = body.scrollHeight; }
  function showError(message) { error.textContent = message; error.hidden = !message; }
  function setBusy(value) { busy = value; send.disabled = value; input.disabled = value; }
  async function submitMessage() {
    const text = input.value.trim();
    if (!text || busy) return;
    input.value = ""; input.style.height = "auto";
    welcome.hidden = true; suggestionsEl.hidden = true; showError("");
    messages.push({ role: "user", content: text });
    addMessage("user", text);
    setBusy(true);
    const typing = addTyping();
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: messages.slice(-20), instructions: instructions })
      });
      let data;
      try { data = await response.json(); } catch (_) { throw new Error("The server returned an invalid response."); }
      if (!response.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      if (!data.reply) throw new Error("The assistant returned an empty response.");
      typing.remove();
      messages.push({ role: "assistant", content: data.reply });
      addMessage("assistant", data.reply);
    } catch (err) {
      typing.remove();
      showError(err.message || "Unable to connect. Please try again.");
      messages.pop();
    } finally {
      setBusy(false); input.focus();
    }
  }
  form.addEventListener("submit", e => { e.preventDefault(); submitMessage(); });
  input.addEventListener("input", () => { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 100) + "px"; });
  input.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitMessage(); } });

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  }
})();