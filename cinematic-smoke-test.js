"use strict";

const assert = require("node:assert/strict");

class FakeClassList {
  constructor(...classes) {
    this.values = new Set(classes);
  }

  add(...classes) {
    classes.forEach((value) => this.values.add(value));
  }

  remove(...classes) {
    classes.forEach((value) => this.values.delete(value));
  }

  contains(value) {
    return this.values.has(value);
  }

  toggle(value, force) {
    const shouldAdd = force === undefined ? !this.values.has(value) : Boolean(force);
    if (shouldAdd) this.values.add(value);
    else this.values.delete(value);
    return shouldAdd;
  }
}

class FakeElement {
  constructor(id, ...classes) {
    this.id = id;
    this.classList = new FakeClassList(...classes);
    this.attributes = new Map();
    this.children = [];
    this.dataset = {};
    this.hidden = false;
    this.inert = false;
    this.textContent = "";
    this.firstChild = { textContent: "" };
    this.listeners = new Map();
    this.style = { setProperty: (name, value) => { this.style[name] = value; } };
    this.complete = true;
    this.naturalWidth = 1672;
    this.offsetWidth = 640;
  }

  addEventListener(type, listener, options = {}) {
    const listeners = this.listeners.get(type) || [];
    listeners.push({ listener, capture: options === true || Boolean(options.capture) });
    this.listeners.set(type, listeners);
  }

  appendChild(child) {
    this.children.push(child);
    return child;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
    if (name === "inert") this.inert = true;
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  removeAttribute(name) {
    this.attributes.delete(name);
    if (name === "inert") this.inert = false;
  }

  focus() {
    this.focused = true;
  }

  closest(selector) {
    return selector.split(",").some((part) => part.trim() === `#${this.id}`) ? this : null;
  }

  async decode() {
    return undefined;
  }

  click() {
    const event = {
      target: this,
      defaultPrevented: false,
      immediateStopped: false,
      preventDefault() { this.defaultPrevented = true; },
      stopImmediatePropagation() { this.immediateStopped = true; },
      stopPropagation() {},
    };
    const listeners = this.listeners.get("click") || [];
    for (const phase of [true, false]) {
      for (const entry of listeners.filter((item) => item.capture === phase)) {
        if (event.immediateStopped) return;
        entry.listener(event);
      }
    }
  }
}

class FakeImage extends FakeElement {
  constructor() {
    super("preload-image");
    this.decoding = "async";
    this.src = "";
  }
}

const ids = [
  "prologue-screen",
  "start-button",
  "title-screen",
  "game-screen",
  "briefing-start-button",
  "prologue-skip",
  "prologue-next",
  "prologue-image",
  "prologue-counter",
  "prologue-kicker",
  "prologue-location",
  "prologue-narration",
  "prologue-dialogue",
  "prologue-speaker",
  "prologue-line",
  "prologue-progress",
];
const elements = Object.fromEntries(ids.map((id) => [id, new FakeElement(id)]));
elements["title-screen"].classList.add("active");
elements["prologue-next"].firstChild.textContent = "PLAN SUIVANT ";

global.Element = FakeElement;
global.Image = FakeImage;
global.document = {
  body: { dataset: { state: "title" } },
  getElementById: (id) => elements[id] || null,
  createElement: (tag) => new FakeElement(tag),
};

let timerId = 0;
const windowListeners = new Map();
global.window = {
  location: { search: "" },
  setTimeout: (callback, delay) => {
    timerId += 1;
    if (delay < 1000) queueMicrotask(callback);
    return timerId;
  },
  clearTimeout: () => {},
  addEventListener: (type, listener) => {
    const listeners = windowListeners.get(type) || [];
    listeners.push(listener);
    windowListeners.set(type, listeners);
  },
};

let briefingCalls = 0;
elements["start-button"].addEventListener("click", () => {
  briefingCalls += 1;
  document.body.dataset.state = "briefing";
});

require("./cinematic.js");

async function flush() {
  await new Promise((resolve) => setImmediate(resolve));
}

(async () => {
  assert.ok(window.KageCinematic, "L'API cinématique doit être initialisée");
  elements["start-button"].click();
  await flush();

  assert.equal(briefingCalls, 0, "Le clic titre doit d'abord ouvrir le prologue");
  assert.equal(document.body.dataset.state, "cinematic");
  assert.equal(elements["prologue-screen"].classList.contains("active"), true);
  assert.equal(elements["title-screen"].getAttribute("aria-hidden"), "true");
  assert.equal(elements["title-screen"].inert, true);
  assert.equal(elements["game-screen"].inert, true);
  assert.equal(elements["prologue-counter"].textContent, "PLAN 1 / 6");
  assert.equal(elements["prologue-progress"].getAttribute("aria-valuenow"), "1");

  window.KageCinematic.next();
  await flush();
  assert.equal(elements["prologue-counter"].textContent, "PLAN 2 / 6");
  assert.equal(elements["prologue-progress"].getAttribute("aria-valuenow"), "2");

  window.KageCinematic.skip();
  assert.equal(briefingCalls, 1, "Passer doit reprendre le flux natif du briefing");
  assert.equal(document.body.dataset.state, "briefing");
  assert.equal(elements["prologue-screen"].classList.contains("active"), false);
  assert.equal(elements["title-screen"].inert, false);
  assert.equal(elements["game-screen"].inert, false);
  assert.equal(elements["briefing-start-button"].focused, true);

  console.log("Cinematic smoke test OK — lancement, progression, skip et focus");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
