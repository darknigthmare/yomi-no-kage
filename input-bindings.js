(function defineKageInput(global) {
  "use strict";

  /*
   * Liaisons clavier et manette (P2.2).
   *
   * Module pur : les entrées sont décrites une fois ici, `game.js` les
   * consomme. Les déplacements restent sur WASD/flèches et le stick gauche ;
   * les actions sont remappables et persistées dans `localStorage`.
   *
   * Manette standard (W3C) :
   *   0 A/×, 1 B/○, 2 X/□, 3 Y/△, 4 LB, 5 RB, 6 LT, 7 RT, 8 Back, 9 Start,
   *   12-15 croix directionnelle, axes 0/1 stick gauche, 2/3 stick droit.
   */

  const STORAGE_KEY = "yomi-no-kage-bindings-v1";
  const VERSION = 1;
  const DEADZONE = 0.25;
  const ACTIONS = Object.freeze([
    "attack",
    "heavy",
    "guard",
    "dodge",
    "ranged",
    "interact",
    "switch",
    "pause",
    "campaign",
    "loadout",
  ]);
  const ACTION_LABELS = Object.freeze({
    attack: "Attaque légère",
    heavy: "Attaque lourde",
    guard: "Garde",
    dodge: "Esquive",
    ranged: "Tir",
    interact: "Interagir",
    switch: "Basculer 2D/FPS",
    pause: "Pause",
    campaign: "Refuge",
    loadout: "Arsenal",
  });
  const DEFAULTS = Object.freeze({
    attack: Object.freeze({ key: "j", button: 2 }),
    heavy: Object.freeze({ key: "l", button: 3 }),
    guard: Object.freeze({ key: "u", button: 4 }),
    dodge: Object.freeze({ key: "h", button: 0 }),
    ranged: Object.freeze({ key: "k", button: 5 }),
    interact: Object.freeze({ key: "e", button: 1 }),
    switch: Object.freeze({ key: "v", button: 8 }),
    pause: Object.freeze({ key: "p", button: 9 }),
    campaign: Object.freeze({ key: "c", button: 6 }),
    loadout: Object.freeze({ key: "i", button: 7 }),
  });
  const CONFIRM_BUTTON = 0;
  const BACK_BUTTON = 1;
  const DPAD = Object.freeze({ up: 12, down: 13, left: 14, right: 15 });

  function storageOf(candidate) {
    if (candidate && typeof candidate.getItem === "function") return candidate;
    try {
      return global.localStorage || null;
    } catch (_) {
      return null;
    }
  }

  function validKey(value) {
    return typeof value === "string" && value.length >= 1 && value.length <= 12 && !/\s/.test(value);
  }

  function validButton(value) {
    const index = Number(value);
    return Number.isInteger(index) && index >= 0 && index <= 31;
  }

  function normalize(value) {
    const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
    const keyboard = {};
    const gamepad = {};
    const usedKeys = new Set();
    const usedButtons = new Set();
    for (const action of ACTIONS) {
      const fallback = DEFAULTS[action];
      const requestedKey = source.keyboard?.[action];
      const key = validKey(requestedKey) && !usedKeys.has(requestedKey.toLowerCase())
        ? requestedKey.toLowerCase()
        : fallback.key;
      keyboard[action] = usedKeys.has(key) ? fallback.key : key;
      usedKeys.add(keyboard[action]);
      const requestedButton = source.gamepad?.[action];
      const button = validButton(requestedButton) && !usedButtons.has(Number(requestedButton))
        ? Number(requestedButton)
        : fallback.button;
      gamepad[action] = usedButtons.has(button) ? fallback.button : button;
      usedButtons.add(gamepad[action]);
    }
    return { version: VERSION, keyboard, gamepad };
  }

  function load(storage = null) {
    const store = storageOf(storage);
    if (!store) return normalize(null);
    try {
      const raw = store.getItem(STORAGE_KEY);
      return normalize(raw ? JSON.parse(raw) : null);
    } catch (_) {
      return normalize(null);
    }
  }

  function save(bindings, storage = null) {
    const normalized = normalize(bindings);
    const store = storageOf(storage);
    if (store) {
      try {
        store.setItem(STORAGE_KEY, JSON.stringify(normalized));
      } catch (_) { /* stockage refusé : les liaisons restent en mémoire */ }
    }
    return normalized;
  }

  function reset(storage = null) {
    return save(normalize(null), storage);
  }

  function setKeyboard(bindings, action, key) {
    if (!ACTIONS.includes(action) || !validKey(key)) return normalize(bindings);
    const next = normalize(bindings);
    next.keyboard[action] = key.toLowerCase();
    return normalize(next);
  }

  function setGamepad(bindings, action, button) {
    if (!ACTIONS.includes(action) || !validButton(button)) return normalize(bindings);
    const next = normalize(bindings);
    next.gamepad[action] = Number(button);
    return normalize(next);
  }

  function actionForKey(bindings, key) {
    if (!validKey(key)) return null;
    const normalized = normalize(bindings);
    const lowered = key.toLowerCase();
    for (const action of ACTIONS) {
      if (normalized.keyboard[action] === lowered) return action;
    }
    return null;
  }

  function bindingFor(bindings, action) {
    const normalized = normalize(bindings);
    if (!ACTIONS.includes(action)) return null;
    return { key: normalized.keyboard[action], button: normalized.gamepad[action] };
  }

  function buttonValue(button) {
    if (!button) return 0;
    if (typeof button === "number") return button;
    if (typeof button.pressed === "boolean") return button.pressed ? 1 : 0;
    return Number(button.value) || 0;
  }

  function axisValue(axes, index) {
    const value = Number(axes?.[index]);
    return Number.isFinite(value) ? value : 0;
  }

  function withDeadzone(value, deadzone = DEADZONE) {
    if (Math.abs(value) < deadzone) return 0;
    const sign = value < 0 ? -1 : 1;
    return sign * Math.min(1, (Math.abs(value) - deadzone) / (1 - deadzone));
  }

  function createPadState() {
    return { buttons: [], axes: [0, 0, 0, 0], connected: false };
  }

  function pollPad(state, pad, bindings, options = {}) {
    const deadzone = Number(options.deadzone) || DEADZONE;
    const normalized = normalize(bindings);
    const padState = state && typeof state === "object" ? state : createPadState();
    const buttons = pad?.buttons || [];
    const axes = pad?.axes || [];
    const count = Math.max(buttons.length, 16);
    const previous = padState.buttons || [];
    const pressed = [];
    const released = [];
    const held = [];
    const actionButtons = new Map(
      ACTIONS.map((action) => [normalized.gamepad[action], action]),
    );
    for (let index = 0; index < count; index += 1) {
      const value = buttonValue(buttons[index]);
      const down = value > 0.5;
      const wasDown = Boolean(previous[index]);
      const action = actionButtons.get(index);
      if (down && !wasDown && action) pressed.push(action);
      if (!down && wasDown && action) released.push(action);
      if (down && action) held.push(action);
    }
    padState.buttons = Array.from({ length: count }, (_, index) => buttonValue(buttons[index]) > 0.5);

    const x = withDeadzone(axisValue(axes, 0), deadzone);
    const y = withDeadzone(axisValue(axes, 1), deadzone);
    const lookX = withDeadzone(axisValue(axes, 2), deadzone);
    const lookY = withDeadzone(axisValue(axes, 3), deadzone);
    padState.axes = [x, y, lookX, lookY];

    const dpad = {
      up: buttonValue(buttons[DPAD.up]) > 0.5,
      down: buttonValue(buttons[DPAD.down]) > 0.5,
      left: buttonValue(buttons[DPAD.left]) > 0.5,
      right: buttonValue(buttons[DPAD.right]) > 0.5,
    };
    const previousDpad = padState.dpad || {};
    const nav = {
      up: (dpad.up && !previousDpad.up) || (y < -0.6 && !(padState.previousAxes?.[1] < -0.6)),
      down: (dpad.down && !previousDpad.down) || (y > 0.6 && !(padState.previousAxes?.[1] > 0.6)),
      left: (dpad.left && !previousDpad.left) || (x < -0.6 && !(padState.previousAxes?.[0] < -0.6)),
      right: (dpad.right && !previousDpad.right) || (x > 0.6 && !(padState.previousAxes?.[0] > 0.6)),
      confirm: buttonValue(buttons[CONFIRM_BUTTON]) > 0.5
        && !(previous[CONFIRM_BUTTON]),
      back: buttonValue(buttons[BACK_BUTTON]) > 0.5 && !(previous[BACK_BUTTON]),
    };
    padState.dpad = dpad;
    padState.previousAxes = [x, y];
    padState.connected = true;

    return {
      pressed,
      released,
      held,
      axes: {
        x,
        y: y === 0 ? 0 : -y,
        lookX,
        lookY: lookY === 0 ? 0 : -lookY,
      },
      dpad,
      nav,
      connected: true,
    };
  }

  const BUTTON_LABELS = [
    "A / ×", "B / ○", "X / □", "Y / △", "LB", "RB", "LT", "RT", "Back", "Start",
    "Stick L", "Stick R", "Croix ↑", "Croix ↓", "Croix ←", "Croix →",
  ];

  let capturing = null;

  function bindingsList() {
    return global.document?.getElementById?.("settings-binding-list") || null;
  }

  function renderBindingsPanel() {
    const list = bindingsList();
    if (!list) return false;
    const bindings = load();
    list.innerHTML = ACTIONS.map((action) => `
      <div class="binding-row">
        <span>${ACTION_LABELS[action]}</span>
        <button class="binding-key" type="button" data-binding-action="${action}"
          aria-label="Touche de ${ACTION_LABELS[action]} : ${bindings.keyboard[action]}">
          ${bindings.keyboard[action].toUpperCase()}
        </button>
        <output>${BUTTON_LABELS[bindings.gamepad[action]] || `Bouton ${bindings.gamepad[action]}`}</output>
      </div>
    `).join("");
    return true;
  }

  /* Panneau « Commandes » des paramètres : on clique une touche, la prochaine
   * frappe la remplace. La capture intercepte la touche avant le jeu. */
  function mountBindingsPanel() {
    const list = bindingsList();
    if (!list) return false;
    if (list.dataset.bound === "true") return renderBindingsPanel();
    list.dataset.bound = "true";
    list.addEventListener("click", (event) => {
      const button = event.target?.closest?.("[data-binding-action]");
      if (!button) return;
      capturing = button.dataset.bindingAction;
      button.dataset.capturing = "true";
      button.textContent = "…";
      button.focus?.();
    });
    global.addEventListener("keydown", (event) => {
      if (!capturing) return;
      event.preventDefault?.();
      event.stopImmediatePropagation?.();
      if (event.key === "Escape") {
        capturing = null;
        renderBindingsPanel();
        return;
      }
      if (!validKey(event.key)) return;
      const action = capturing;
      capturing = null;
      save(setKeyboard(load(), action, event.key));
      renderBindingsPanel();
      global.dispatchEvent?.(new global.CustomEvent("yomi:bindings-updated", {
        detail: { action, key: event.key.toLowerCase() },
      }));
    }, true);
    global.document.getElementById("settings-bindings-reset")?.addEventListener("click", () => {
      capturing = null;
      reset();
      renderBindingsPanel();
      global.dispatchEvent?.(new global.CustomEvent("yomi:bindings-updated", { detail: { reset: true } }));
    });
    return renderBindingsPanel();
  }

  if (typeof global.document !== "undefined" && global.document.getElementById) {
    if (global.document.readyState === "loading") {
      global.document.addEventListener("DOMContentLoaded", mountBindingsPanel, { once: true });
    } else {
      mountBindingsPanel();
    }
  }

  function describeAction(action) {
    if (!ACTIONS.includes(action)) return null;
    return {
      action,
      label: ACTION_LABELS[action],
      key: DEFAULTS[action].key,
      button: DEFAULTS[action].button,
    };
  }

  global.KageInput = Object.freeze({
    version: VERSION,
    storageKey: STORAGE_KEY,
    actions: ACTIONS,
    labels: ACTION_LABELS,
    defaults: DEFAULTS,
    deadzone: DEADZONE,
    normalize,
    load,
    save,
    reset,
    setKeyboard,
    setGamepad,
    actionForKey,
    bindingFor,
    describeAction,
    createPadState,
    pollPad,
    mountBindingsPanel,
    renderBindingsPanel,
  });
})(typeof window !== "undefined" ? window : globalThis);
