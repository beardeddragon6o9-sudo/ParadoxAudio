const cockpit = document.querySelector(".cockpit");
const touchscreen = document.querySelector(".touchscreen");
const screenInterface = touchscreen.querySelector(".screen-interface");
const screenBoot = touchscreen.querySelector(".screen-boot");
const welcome = touchscreen.querySelector(".welcome");
const zoomButton = touchscreen.querySelector(".screen-zoom");
const tabs = [...touchscreen.querySelectorAll('[role="tab"]')];
const chatHistory = touchscreen.querySelector(".chat-history");
const messages = touchscreen.querySelector(".messages");
const composer = touchscreen.querySelector(".composer");
const questionInput = composer.elements.question;
const statusLabel = touchscreen.querySelector(".demo-label");
const ping = document.querySelector("ping-hologram");
let pendingReplies = 0;

function finishAnimation(element, name) {
  const animation = element?.getAnimations?.().find(item => item.animationName === name);
  return animation?.finished.catch(() => {});
}

async function startCockpit() {
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  if (!motion.matches) {
    screenInterface.inert = true;
    await finishAnimation(screenBoot, "screen-boot");
    screenInterface.inert = false;

    // Give the artwork time to decode without holding up the chat if it fails to load.
    const canProject = ping?.ready && await Promise.race([
      ping.ready.then(() => true, () => false),
      new Promise(resolve => setTimeout(resolve, 650, false)),
    ]);
    if (canProject && !motion.matches) {
      cockpit.dataset.startup = "projection";
      await finishAnimation(ping, "pengu-project");
    }
  }
  delete cockpit.dataset.startup;

  const greeting = document.createElement("p");
  greeting.className = "message assistant";
  greeting.textContent = "Hey, I’m Pengu. Welcome to Paradox Audio! We offer car audio tuning, including in-person and remote DSP tuning. I’m here to help with any questions. Let’s get your audio system dialed!";
  welcome.append(greeting);
  if (!motion.matches && !messages.childElementCount && ping?.state === "idle") {
    ping.setState("responding");
  }
}

const sampleReplies = new Map([
  [
    "what does a dsp do",
    "A digital signal processor gives our tuner control over each speaker’s level, crossover, delay and EQ. Those adjustments shape what you hear from your seat.",
  ],
  [
    "what is time alignment",
    "Your speakers sit at different distances from the driver’s seat. As part of a tune, our tuner can adjust each channel’s delay so the sound from each speaker reaches you at about the same time.",
  ],
  [
    "what should i bring",
    "Have your vehicle year, make and model, plus a list of your audio gear. For a tuning inquiry, it helps to tell our tuner what you’d like to change about the sound. Bring a few familiar tracks when you come in.",
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

function appendMessage(role, content, after) {
  const message = document.createElement("p");
  message.classList.add("message", role);
  message.textContent = content;
  if (after) after.after(message);
  else messages.append(message);
  scrollToLatestMessage();
  return message;
}

function showReply(reply, questionMessage) {
  if (typeof reply !== "string" || !reply.trim()) return false;

  appendMessage("assistant", reply.trim(), questionMessage);
  pendingReplies = Math.max(0, pendingReplies - 1);
  ping?.setState?.("responding");
  return true;
}

function showSampleReply(question, questionMessage) {
  statusLabel.textContent = "Demo";
  const key = question.toLowerCase().replace(/[?.!]+$/, "");
  showReply(sampleReplies.get(key) ??
    "I can answer the sample questions in this demo. Scroll up to try one.", questionMessage);
}

async function requestAssistant(question, questionMessage) {
  try {
    const response = await fetch("/api/tune", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
      signal: AbortSignal.timeout(22_000),
    });
    if (response.status === 404) {
      showSampleReply(question, questionMessage);
      return;
    }
    if (!response.ok) throw new Error("Tuning request failed");

    const result = await response.json();
    if (!showReply(result?.reply, questionMessage)) throw new Error("Empty tuning reply");
    statusLabel.textContent = "Live";
  } catch {
    showReply("I couldn’t answer that right now. Please try again in a moment.", questionMessage);
  }
}

function submitQuestion(value) {
  const question = value.trim();
  if (!question) return;

  const questionMessage = appendMessage("visitor", question);
  pendingReplies += 1;
  ping?.setState?.("thinking");
  const useBuiltInAssistant = window.dispatchEvent(new CustomEvent("paradox:question", {
    cancelable: true,
    detail: { question },
  }));
  if (!useBuiltInAssistant) return;

  if (window.location.protocol === "file:") showSampleReply(question, questionMessage);
  else requestAssistant(question, questionMessage);
}

ping?.addEventListener("pingstatechange", ({ detail }) => {
  if (detail.state === "idle" && pendingReplies > 0) ping.setState("thinking");
});

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
  showReply: reply => showReply(reply),
});

startCockpit();
