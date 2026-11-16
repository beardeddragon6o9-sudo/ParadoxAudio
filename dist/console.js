const consoleDialog = document.querySelector(".console");
const tabs = [...consoleDialog.querySelectorAll('[role="tab"]')];
const messages = consoleDialog.querySelector(".messages");
const composer = consoleDialog.querySelector(".composer");
const questionInput = composer.elements.question;
const touchscreen = document.querySelector(".touchscreen");
const screenReply = touchscreen.querySelector(".screen-reply");
const screenReplyText = screenReply.querySelector(".screen-reply-text");

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

  for (const tab of tabs) {
    const selected = tab === activeTab;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
    document.getElementById(tab.getAttribute("aria-controls")).hidden = !selected;
  }

  if (!consoleDialog.open) consoleDialog.showModal();
  activeTab.focus();
  return true;
}

function appendMessage(role, content) {
  const message = document.createElement("p");
  message.classList.add("message", role);
  message.textContent = content;
  messages.append(message);
  messages.scrollTop = messages.scrollHeight;
}

function showReply(reply) {
  if (typeof reply !== "string" || !reply.trim()) return false;

  const content = reply.trim();
  appendMessage("assistant", content);
  screenReplyText.textContent = content;
  screenReply.hidden = false;
  touchscreen.setAttribute("aria-describedby", screenReply.id);
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
      "This preview has sample answers for the three questions above. Try one to see how a reply appears on the console.");
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

consoleDialog.querySelectorAll("[data-question]").forEach((button) => {
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
  questionInput.focus();
});

consoleDialog.addEventListener("click", (event) => {
  if (event.target !== consoleDialog) return;
  const bounds = consoleDialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right ||
      event.clientY < bounds.top || event.clientY > bounds.bottom) {
    consoleDialog.close();
  }
});

window.paradoxConsole = Object.freeze({
  showView,
  showReply,
});
