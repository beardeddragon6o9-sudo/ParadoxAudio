const cockpit = document.querySelector(".cockpit");
const touchscreen = document.querySelector(".touchscreen");
const zoomButton = touchscreen.querySelector(".screen-zoom");
const tabs = [...touchscreen.querySelectorAll('[role="tab"]')];
const chatHistory = touchscreen.querySelector(".chat-history");
const messages = touchscreen.querySelector(".messages");
const composer = touchscreen.querySelector(".composer");
const questionInput = composer.elements.question;

const sampleReplies = new Map([
  [
    "what does a dsp do",
    "A digital signal processor gives you per-channel control over settings such as crossovers, levels, delay and EQ. Those controls help you tune how the system sounds from your seat.",
  ],
  [
    "what is time alignment",
    "Speakers sit at different distances from you. Time alignment can delay the channels that arrive earlier so the sound from those speakers reaches your seat closer to the same time.",
  ],
  [
    "what should i bring",
    "Have your vehicle year and model, a list of your audio equipment, and a few tracks you know well. It also helps to describe what you'd like to change about the sound.",
  ],
]);

function showView(view) {
  const activeTab = tabs.find((tab) => tab.getAttribute("aria-controls") === view);
  if (!activeTab) return false;

  const changed = activeTab.getAttribute("aria-selected") !== "true";
  for (const tab of tabs) {
    const selected = tab === activeTab;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
    document.getElementById(tab.getAttribute("aria-controls")).hidden = !selected;
  }

  activeTab.focus({ preventScroll: true });
  touchscreen.scrollIntoView({ block: "nearest" });
  if (changed && view === "questions") scrollToLatestMessage();
  return true;
}

function scrollToLatestMessage() {
  const latest = messages.lastElementChild;
  if (latest && !chatHistory.closest("[hidden]")) {
    chatHistory.scrollTop = latest.offsetTop - 4;
  }
}

function appendMessage(role, content) {
  const message = document.createElement("p");
  message.classList.add("message", role);
  message.textContent = content;
  messages.append(message);
  scrollToLatestMessage();
}

function showReply(reply) {
  if (typeof reply !== "string" || !reply.trim()) return false;

  appendMessage("assistant", reply.trim());
  return true;
}

function submitQuestion(value) {
  const question = value.trim();
  if (!question) return;

  appendMessage("visitor", question);
  const useSampleReply = window.dispatchEvent(new CustomEvent("paradox:question", {
    cancelable: true,
    detail: { question },
  }));
  if (useSampleReply) {
    const key = question.toLowerCase().replace(/[?.!]+$/, "");
    showReply(sampleReplies.get(key) ??
      "I can answer the sample questions in this demo. Scroll up to try one.");
  }
}

document.querySelectorAll("[data-open]").forEach((button) => {
  button.addEventListener("click", () => showView(button.dataset.open));
});

tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => showView(tab.getAttribute("aria-controls")));
  tab.addEventListener("keydown", (event) => {
    const directions = {
      ArrowLeft: (index - 1 + tabs.length) % tabs.length,
      ArrowRight: (index + 1) % tabs.length,
      Home: 0,
      End: tabs.length - 1,
    };
    if (!Object.hasOwn(directions, event.key)) return;
    event.preventDefault();
    showView(tabs[directions[event.key]].getAttribute("aria-controls"));
  });
});

touchscreen.querySelectorAll("[data-question]").forEach((button) => {
  button.addEventListener("click", () => submitQuestion(button.dataset.question));
});

composer.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!questionInput.value.trim()) {
    questionInput.focus();
    return;
  }
  submitQuestion(questionInput.value);
  composer.reset();
  questionInput.focus({ preventScroll: true });
});

function setZoom(zoomed) {
  cockpit.toggleAttribute("data-zoomed", zoomed);
  const label = zoomed ? "Return to full cockpit" : "Zoom touchscreen";
  zoomButton.setAttribute("aria-pressed", String(zoomed));
  zoomButton.setAttribute("aria-label", label);
  zoomButton.title = label;
}

zoomButton.addEventListener("click", () => setZoom(!cockpit.hasAttribute("data-zoomed")));
touchscreen.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || !cockpit.hasAttribute("data-zoomed") || !zoomButton.offsetWidth) return;
  setZoom(false);
  zoomButton.focus({ preventScroll: true });
});

window.paradoxConsole = Object.freeze({
  showView,
  showReply,
});
