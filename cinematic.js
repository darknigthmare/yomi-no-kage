(() => {
  "use strict";

  const shots = [
    {
      image: "assets/generated/cinematics/prologue-01-peste.png",
      alt: "Sous la pluie, un villageois s'effondre tandis que des silhouettes se relèvent derrière les maisons de Kurokawa.",
      kicker: "JAPON — ÈRE KAN'EI, 1638",
      location: "PROLOGUE — LA PESTE DES MORTS",
      narration: "Elle n'est pas venue de la guerre. Elle a marché avec les morts.",
      duration: 7200,
      motion: "push",
    },
    {
      image: "assets/generated/cinematics/prologue-02-cloche.png",
      alt: "Dans une ruelle de Kurokawa, un mort se relève devant une mère et son enfant alors que sonne la dernière cloche.",
      kicker: "KUROKAWA — PROVINCE DE KAI",
      location: "LA DERNIÈRE CLOCHE",
      narration: "Avant la troisième veille, la fièvre avait appris aux cadavres à marcher.",
      speaker: "UNE ENFANT",
      dialogue: "Père… pourquoi te relèves-tu ?",
      duration: 9600,
      motion: "left",
    },
    {
      image: "assets/generated/cinematics/prologue-03-foyers.png",
      alt: "Le torii profané, le village et le château du daimyo sont reliés par une brume rouge surnaturelle.",
      kicker: "DEUX FOYERS NOURRISSENT LE MAL",
      location: "LE TORII · LE DONJON",
      narration: "Le torii fut souillé. Puis le donjon du daimyō cessa de répondre.",
      duration: 9000,
      motion: "right",
    },
    {
      image: "assets/generated/cinematics/prologue-04-ordre.png",
      alt: "Akio s'agenouille devant le shogun et sa cour dans la grande salle obscure du château d'Edo.",
      kicker: "CHÂTEAU D'EDO — TROISIÈME VEILLE",
      location: "L'ORDRE DU SHOGUN",
      narration: "Une armée aurait offert mille nouveaux corps à la peste.",
      speaker: "TOKUGAWA IEMITSU · DIALOGUE FICTIONNEL",
      dialogue: "Une armée nourrirait la peste. Akio ira seul.",
      duration: 10500,
      motion: "push",
    },
    {
      image: "assets/generated/cinematics/prologue-05-serment.png",
      alt: "Sous les avant-toits du château, Akio dégaine légèrement son katana et prête serment.",
      kicker: "DIALOGUE FICTIONNEL — « N'ÉPARGNEZ QUE LES VIVANTS. »",
      location: "LE SERMENT DE L'OMBRE",
      narration: "Le shogun ne lui confia ni armée, ni prêtre. Seulement un ordre scellé.",
      speaker: "AKIO KAGEYAMA",
      dialogue: "Alors je rendrai les morts au silence.",
      duration: 9000,
      motion: "left",
    },
    {
      image: "assets/generated/cinematics/prologue-06-kurokawa.png",
      alt: "Après trois jours de voyage, Akio atteint le col noyé de Kai ; au-delà de la forêt, la fumée de Kurokawa assombrit l'horizon.",
      kicker: "TROIS JOURS PLUS TARD — PROVINCE DE KAI",
      location: "COL FORESTIER DE KAI",
      narration: "Trois jours de pluie menèrent Akio aux marches de la province. Entre lui et Kurokawa : la forêt noyée, la bambouseraie de Shigure et les rizières de Tsuru.",
      speaker: "AKIO KAGEYAMA",
      dialogue: "Je suivrai la fumée jusqu'à sa source.",
      duration: 11000,
      motion: "right",
    },
  ];

  const previewMatch = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("preview")?.match(/^prologue-([1-6])$/)
    : null;
  const previewShotIndex = previewMatch ? Number(previewMatch[1]) - 1 : null;
  const reducedMotionMedia = window.matchMedia?.("(prefers-reduced-motion: reduce)") || null;
  const settingsStorageKey = "yomi-no-kage-ui-settings-v1";
  const focusableSelector = [
    "button:not([disabled])",
    "[href]",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
  ].join(",");

  const screen = document.getElementById("prologue-screen");
  const startButton = document.getElementById("start-button");
  const continueButton = document.getElementById("continue-button");
  const continueNote = document.getElementById("continue-note");
  const titleScreen = document.getElementById("title-screen");
  const gameScreen = document.getElementById("game-screen");
  const briefingStartButton = document.getElementById("briefing-start-button");
  const skipButton = document.getElementById("prologue-skip");
  const pauseButton = document.getElementById("prologue-pause");
  const previousButton = document.getElementById("prologue-prev");
  const nextButton = document.getElementById("prologue-next");
  const image = document.getElementById("prologue-image");
  const counter = document.getElementById("prologue-counter");
  const kicker = document.getElementById("prologue-kicker");
  const locationHeading = document.getElementById("prologue-location");
  const narration = document.getElementById("prologue-narration");
  const dialogue = document.getElementById("prologue-dialogue");
  const speaker = document.getElementById("prologue-speaker");
  const line = document.getElementById("prologue-line");
  const progress = document.getElementById("prologue-progress");
  const prologueHelp = document.getElementById("prologue-help");
  const gameStatus = document.getElementById("game-status");

  const newGameConfirmScreen = document.getElementById("new-game-confirm-screen");
  const newGameConfirmCancel = document.getElementById("new-game-confirm-cancel");
  const newGameConfirmAccept = document.getElementById("new-game-confirm-accept");
  const settingsScreen = document.getElementById("settings-screen");
  const settingsButton = document.getElementById("settings-button");
  const pauseSettingsButton = document.getElementById("pause-settings-button");
  const settingsClose = document.getElementById("settings-close");
  const settingsDone = document.getElementById("settings-done");
  const settingsStatus = document.getElementById("settings-status");
  const settingsMaster = document.getElementById("settings-master-volume");
  const settingsMusic = document.getElementById("settings-music-volume");
  const settingsSfx = document.getElementById("settings-sfx-volume");
  const settingsMuted = document.getElementById("settings-muted");
  const settingsReducedMotion = document.getElementById("settings-reduced-motion");
  const settingsScreenShake = document.getElementById("settings-screen-shake");
  const settingsHighContrast = document.getElementById("settings-high-contrast");
  const settingsTextScale = document.getElementById("settings-text-scale");

  if (!screen || !startButton || !image || !progress) return;

  let active = false;
  let paused = false;
  let shotIndex = 0;
  let shotTimer = 0;
  let transitionTimer = 0;
  let shotDeadline = 0;
  let remainingDuration = 0;
  let renderToken = 0;
  let allowOriginalStart = false;
  let settingsReturnFocus = null;
  let settingsSourceOverlay = null;
  let newGameConfirmReturnFocus = null;
  let newGameStartApproved = false;
  let statusTimer = 0;
  let lastStatusText = "";
  const preloadedShots = new Map();

  function readSettings() {
    const defaults = {
      master: 85,
      music: 55,
      sfx: 85,
      muted: false,
      reducedMotion: false,
      screenShake: true,
      highContrast: false,
      textScale: "normal",
    };
    try {
      const value = JSON.parse(window.localStorage?.getItem(settingsStorageKey) || "null");
      if (!value || typeof value !== "object") return defaults;
      const master = Number(value.master);
      const music = Number(value.music);
      const sfx = Number(value.sfx);
      return {
        master: Number.isFinite(master) ? Math.max(0, Math.min(100, master)) : defaults.master,
        music: Number.isFinite(music) ? Math.max(0, Math.min(100, music)) : defaults.music,
        sfx: Number.isFinite(sfx) ? Math.max(0, Math.min(100, sfx)) : defaults.sfx,
        muted: Boolean(value.muted),
        reducedMotion: Boolean(value.reducedMotion),
        screenShake: value.screenShake !== false,
        highContrast: Boolean(value.highContrast),
        textScale: value.textScale === "large" ? "large" : "normal",
      };
    } catch (_) {
      return defaults;
    }
  }

  let preferences = readSettings();
  try {
    if (!window.localStorage?.getItem(settingsStorageKey) && typeof window.gameAudio?.isMuted === "function") {
      preferences.muted = Boolean(window.gameAudio.isMuted());
    }
  } catch (_) { /* Le stockage privé peut être indisponible. */ }

  function writeSettings() {
    try {
      window.localStorage?.setItem(settingsStorageKey, JSON.stringify(preferences));
      return true;
    } catch (_) {
      return false;
    }
  }

  function outputFor(input) {
    return input ? document.getElementById(`${input.id.replace("-volume", "-output")}`) : null;
  }

  function setRange(input, value) {
    if (!input) return;
    input.value = String(value);
    const output = outputFor(input);
    if (output) output.textContent = `${value} %`;
  }

  function effectiveReducedMotion() {
    return Boolean(reducedMotionMedia?.matches || preferences.reducedMotion);
  }

  function clearShotTimer() {
    window.clearTimeout(shotTimer);
    shotTimer = 0;
    shotDeadline = 0;
  }

  function clearTimers() {
    clearShotTimer();
    window.clearTimeout(transitionTimer);
    transitionTimer = 0;
  }

  function scheduleAdvance(shot, delay = shot?.duration || 0) {
    clearShotTimer();
    if (previewShotIndex !== null || paused || effectiveReducedMotion() || !active || !shot) return;
    remainingDuration = Math.max(350, delay);
    shotDeadline = performance.now() + remainingDuration;
    shotTimer = window.setTimeout(() => advance(1), remainingDuration);
  }

  function syncMotionPreference() {
    const reduced = effectiveReducedMotion();
    document.body.classList?.toggle("reduce-motion", reduced);
    try {
      const savedReduced = Boolean(window.KageSave?.load?.()?.settings?.reducedMotion);
      if (savedReduced !== reduced) {
        window.KageSave?.setSetting?.("reducedMotion", reduced);
      }
    } catch (_) { /* La préférence reste active pour cette session. */ }
    if (settingsReducedMotion) {
      settingsReducedMotion.checked = reduced;
      settingsReducedMotion.disabled = Boolean(reducedMotionMedia?.matches);
      settingsReducedMotion.title = reducedMotionMedia?.matches
        ? "La préférence de mouvement du système est active."
        : "";
    }
    if (prologueHelp) {
      prologueHelp.textContent = reduced
        ? "DÉFILEMENT MANUEL · ESPACE OU ENTRÉE POUR CONTINUER"
        : "CLIC · ESPACE · ENTRÉE POUR CONTINUER";
    }
    if (!active) return;
    if (reduced) clearShotTimer();
    else if (!paused && !shotTimer) scheduleAdvance(shots[shotIndex], remainingDuration || shots[shotIndex]?.duration);
  }

  function applyPreferences({ announce = false } = {}) {
    document.body.classList?.toggle("high-contrast", preferences.highContrast);
    if (document.documentElement?.dataset) document.documentElement.dataset.uiScale = preferences.textScale;
    setRange(settingsMaster, preferences.master);
    setRange(settingsMusic, preferences.music);
    setRange(settingsSfx, preferences.sfx);
    if (settingsMuted) settingsMuted.checked = preferences.muted;
    if (settingsScreenShake) settingsScreenShake.checked = preferences.screenShake;
    if (settingsHighContrast) settingsHighContrast.checked = preferences.highContrast;
    if (settingsTextScale) settingsTextScale.value = preferences.textScale;
    syncMotionPreference();

    const audio = window.gameAudio;
    audio?.setMasterVolume?.(preferences.master / 100);
    audio?.setMusicVolume?.(preferences.music / 100);
    audio?.setSfxVolume?.(preferences.sfx / 100);
    audio?.setMuted?.(preferences.muted);
    const audioButton = document.getElementById("audio-button");
    audioButton?.setAttribute("aria-pressed", String(preferences.muted));
    audioButton?.setAttribute("aria-label", preferences.muted ? "Rétablir le son" : "Couper le son");
    try {
      const savedSettings = window.KageSave?.load?.()?.settings || {};
      if (Boolean(savedSettings.reducedMotion) !== effectiveReducedMotion()) {
        window.KageSave?.setSetting?.("reducedMotion", effectiveReducedMotion());
      }
      if ((savedSettings.screenShake !== false) !== preferences.screenShake) {
        window.KageSave?.setSetting?.("screenShake", preferences.screenShake);
      }
    } catch (_) { /* Les réglages restent actifs pour cette session. */ }
    window.dispatchEvent?.(new CustomEvent("yomi:settings-updated", {
      detail: {
        reducedMotion: effectiveReducedMotion(),
        screenShake: preferences.screenShake,
      },
    }));

    if (announce && settingsStatus) {
      settingsStatus.textContent = writeSettings()
        ? "Paramètres enregistrés."
        : "Paramètres appliqués pour cette session.";
    }
  }

  function updateContinueState() {
    if (!continueButton || !continueNote) return;
    let hasSave = false;
    let progress = null;
    try {
      hasSave = Boolean(window.KageSave?.hasContinue?.());
      progress = window.KageSave?.getProgress?.() || window.KageSave?.load?.()?.progress;
    } catch (_) { /* sauvegarde facultative */ }
    continueButton.dataset.saveAvailable = String(hasSave);
    continueButton.disabled = !hasSave;
    continueButton.setAttribute("aria-disabled", String(!hasSave));
    continueNote.textContent = hasSave
      ? `Chronique sauvegardée — chapitre ${Math.max(1, Number(progress?.chapter || 0) + 1)}, dernier foyer disponible.`
      : "Aucune chronique sauvegardée.";
  }

  function trapFocus(container, event) {
    if (event.key !== "Tab" || !container) return false;
    const focusable = [...container.querySelectorAll(focusableSelector)]
      .filter((element) => !element.hidden && element.getClientRects().length > 0);
    if (!focusable.length) {
      event.preventDefault();
      container.focus({ preventScroll: true });
      return true;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus({ preventScroll: true });
      return true;
    }
    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus({ preventScroll: true });
      return true;
    }
    return false;
  }

  function hasContinuableChronicle() {
    try {
      return Boolean(window.KageSave?.hasContinue?.());
    } catch (_) {
      return false;
    }
  }

  function openNewGameConfirm() {
    if (!newGameConfirmScreen || newGameConfirmScreen.classList.contains("active")) return;
    newGameConfirmReturnFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : startButton;
    titleScreen?.setAttribute("aria-hidden", "true");
    if (titleScreen) titleScreen.inert = true;
    newGameConfirmScreen.classList.add("active");
    newGameConfirmScreen.setAttribute("aria-hidden", "false");
    newGameConfirmScreen.focus({ preventScroll: true });
    newGameConfirmCancel?.focus({ preventScroll: true });
  }

  function closeNewGameConfirm({ restoreFocus = true } = {}) {
    if (!newGameConfirmScreen?.classList.contains("active")) return;
    newGameConfirmScreen.classList.remove("active");
    newGameConfirmScreen.setAttribute("aria-hidden", "true");
    titleScreen?.setAttribute("aria-hidden", "false");
    if (titleScreen) titleScreen.inert = false;
    if (restoreFocus) {
      const target = newGameConfirmReturnFocus?.isConnected ? newGameConfirmReturnFocus : startButton;
      target?.focus({ preventScroll: true });
    }
    newGameConfirmReturnFocus = null;
  }

  function openSettings() {
    if (!settingsScreen || settingsScreen.classList.contains("active")) return;
    settingsReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : settingsButton;
    settingsSourceOverlay = settingsReturnFocus?.closest?.(".screen-overlay.active")
      || (titleScreen?.classList.contains("active") ? titleScreen : null);
    applyPreferences();
    if (settingsSourceOverlay) {
      settingsSourceOverlay.setAttribute("aria-hidden", "true");
      settingsSourceOverlay.inert = true;
    }
    settingsScreen.classList.add("active");
    settingsScreen.setAttribute("aria-hidden", "false");
    settingsScreen.focus({ preventScroll: true });
    settingsClose?.focus({ preventScroll: true });
  }

  function closeSettings() {
    if (!settingsScreen?.classList.contains("active")) return;
    settingsScreen.classList.remove("active");
    settingsScreen.setAttribute("aria-hidden", "true");
    if (settingsSourceOverlay?.isConnected) {
      settingsSourceOverlay.setAttribute("aria-hidden", "false");
      settingsSourceOverlay.inert = false;
    }
    const target = settingsReturnFocus?.isConnected ? settingsReturnFocus : settingsButton;
    target?.focus({ preventScroll: true });
    settingsSourceOverlay = null;
  }

  settingsButton?.addEventListener("click", openSettings);
  pauseSettingsButton?.addEventListener("click", openSettings);
  settingsClose?.addEventListener("click", closeSettings);
  settingsDone?.addEventListener("click", () => {
    applyPreferences({ announce: true });
    window.setTimeout(closeSettings, 180);
  });

  newGameConfirmCancel?.addEventListener("click", () => {
    newGameStartApproved = false;
    closeNewGameConfirm();
  });
  newGameConfirmAccept?.addEventListener("click", () => {
    newGameStartApproved = true;
    closeNewGameConfirm({ restoreFocus: false });
    startButton.click();
  });

  [settingsMaster, settingsMusic, settingsSfx].forEach((input) => {
    input?.addEventListener("input", () => {
      const key = input === settingsMaster ? "master" : (input === settingsMusic ? "music" : "sfx");
      preferences[key] = Number(input.value);
      applyPreferences();
      writeSettings();
    });
  });
  settingsMuted?.addEventListener("change", () => {
    preferences.muted = settingsMuted.checked;
    applyPreferences({ announce: true });
  });
  settingsReducedMotion?.addEventListener("change", () => {
    preferences.reducedMotion = settingsReducedMotion.checked;
    applyPreferences({ announce: true });
  });
  settingsScreenShake?.addEventListener("change", () => {
    preferences.screenShake = settingsScreenShake.checked;
    applyPreferences({ announce: true });
  });
  settingsHighContrast?.addEventListener("change", () => {
    preferences.highContrast = settingsHighContrast.checked;
    applyPreferences({ announce: true });
  });
  settingsTextScale?.addEventListener("change", () => {
    preferences.textScale = settingsTextScale.value === "large" ? "large" : "normal";
    applyPreferences({ announce: true });
  });

  document.getElementById("audio-button")?.addEventListener("click", () => {
    window.setTimeout(() => {
      if (typeof window.gameAudio?.isMuted !== "function") return;
      preferences.muted = Boolean(window.gameAudio.isMuted());
      if (settingsMuted) settingsMuted.checked = preferences.muted;
      writeSettings();
    }, 0);
  });

  reducedMotionMedia?.addEventListener?.("change", syncMotionPreference);
  applyPreferences();
  updateContinueState();
  window.addEventListener("yomi:save-updated", updateContinueState);

  const progressDots = shots.map((_, index) => {
    const dot = document.createElement("span");
    dot.setAttribute("aria-hidden", "true");
    progress.appendChild(dot);
    return dot;
  });

  function preloadShot(index) {
    if (index < 0 || index >= shots.length) return null;
    if (preloadedShots.has(index)) return preloadedShots.get(index);
    const loader = new Image();
    loader.decoding = "async";
    loader.src = shots[index].image;
    const ready = typeof loader.decode === "function"
      ? loader.decode().catch(() => undefined)
      : new Promise((resolve) => {
          loader.addEventListener("load", resolve, { once: true });
          loader.addEventListener("error", resolve, { once: true });
        });
    const preload = { loader, ready };
    preloadedShots.set(index, preload);
    return preload;
  }

  preloadShot(0);

  async function applyShot(index, token) {
    const shot = shots[index];
    const preload = preloadShot(index);
    await preload?.ready;
    if (!active || token !== renderToken) return;

    image.src = shot.image;
    try { await image.decode(); } catch (_) { /* Le texte reste lisible si une image échoue. */ }
    if (!active || token !== renderToken) return;

    screen.dataset.motion = shot.motion;
    screen.style.setProperty("--shot-image", `url("${shot.image}")`);
    screen.style.setProperty("--shot-duration", `${shot.duration + 900}ms`);
    image.alt = shot.alt;
    counter.textContent = `PLAN ${index + 1} / ${shots.length}`;
    kicker.textContent = shot.kicker;
    locationHeading.textContent = shot.location;
    narration.textContent = shot.narration;
    progress.setAttribute("aria-valuemax", String(shots.length));
    progress.setAttribute("aria-valuenow", String(index + 1));

    const hasDialogue = Boolean(shot.dialogue);
    dialogue.hidden = !hasDialogue;
    speaker.textContent = hasDialogue ? shot.speaker : "";
    line.textContent = hasDialogue ? shot.dialogue : "";
    nextButton.firstChild.textContent = index === shots.length - 1
      ? "OUVRIR LE BRIEFING "
      : "PLAN SUIVANT ";
    if (previousButton) previousButton.disabled = index === 0;

    progressDots.forEach((dot, dotIndex) => {
      dot.classList.toggle("active", dotIndex === index);
      dot.classList.toggle("seen", dotIndex < index);
    });

    screen.classList.remove("is-playing-shot");
    void image.offsetWidth;
    screen.classList.add("is-playing-shot");
    screen.classList.remove("is-changing");
    preloadShot(index + 1);
    remainingDuration = shot.duration;
    scheduleAdvance(shot, remainingDuration);
  }

  function renderShot(index, instant = false) {
    clearTimers();
    const token = ++renderToken;
    shotIndex = Math.max(0, Math.min(shots.length - 1, index));
    screen.classList.add("is-changing");
    if (instant) {
      void applyShot(shotIndex, token);
      return;
    }
    transitionTimer = window.setTimeout(() => void applyShot(shotIndex, token), 260);
  }

  function setPaused(shouldPause) {
    if (!active || paused === shouldPause) return;
    if (shouldPause && shotTimer) {
      remainingDuration = Math.max(350, shotDeadline - performance.now());
      clearShotTimer();
    }
    paused = shouldPause;
    screen.classList.toggle("is-paused", paused);
    pauseButton?.setAttribute("aria-pressed", String(paused));
    if (pauseButton) pauseButton.firstChild.textContent = paused ? "REPRENDRE " : "PAUSE ";
    if (!paused) scheduleAdvance(shots[shotIndex], remainingDuration || shots[shotIndex]?.duration);
  }

  function begin(event) {
    if (allowOriginalStart) return;
    event?.preventDefault();
    event?.stopImmediatePropagation();
    if (active) return;
    if (previewShotIndex === null && !newGameStartApproved && hasContinuableChronicle()) {
      openNewGameConfirm();
      return;
    }
    newGameStartApproved = false;

    closeSettings();
    active = true;
    paused = false;
    shotIndex = 0;
    window.gameAudio?.setMusicState?.("prologue", { intensity: 0.25 });
    document.body.dataset.state = "cinematic";
    [titleScreen, gameScreen].forEach((layer) => {
      if (!layer) return;
      layer.setAttribute("aria-hidden", "true");
      layer.inert = true;
    });
    screen.classList.add("active");
    screen.classList.remove("is-paused");
    screen.setAttribute("aria-hidden", "false");
    pauseButton?.setAttribute("aria-pressed", "false");
    renderShot(0, true);
    screen.focus({ preventScroll: true });
  }

  function finish() {
    if (!active) return;
    clearTimers();
    renderToken += 1;
    active = false;
    paused = false;
    screen.classList.remove("active", "is-changing", "is-playing-shot", "is-paused");
    screen.setAttribute("aria-hidden", "true");
    [titleScreen, gameScreen].forEach((layer) => {
      if (!layer) return;
      layer.removeAttribute("aria-hidden");
      layer.inert = false;
    });

    allowOriginalStart = true;
    startButton.click();
    allowOriginalStart = false;
    briefingStartButton?.focus({ preventScroll: true });
  }

  function advance(direction = 1) {
    if (!active) return;
    const nextIndex = shotIndex + direction;
    if (nextIndex >= shots.length) {
      finish();
      return;
    }
    renderShot(Math.max(0, nextIndex));
  }

  function onKeyDown(event) {
    if (newGameConfirmScreen?.classList.contains("active")) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        newGameStartApproved = false;
        closeNewGameConfirm();
        return;
      }
      trapFocus(newGameConfirmScreen, event);
      return;
    }
    if (settingsScreen?.classList.contains("active")) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        closeSettings();
        return;
      }
      trapFocus(settingsScreen, event);
      return;
    }
    if (!active) {
      const dialog = managedOverlays?.find((overlay) =>
        ["pause-screen", "end-screen"].includes(overlay.id)
        && overlay.classList.contains("active"));
      if (dialog) trapFocus(dialog, event);
      return;
    }
    if (trapFocus(screen, event)) return;

    const shouldAdvance = event.key === " " || event.key === "Enter" || event.key === "ArrowRight";
    const shouldReturn = event.key === "ArrowLeft";
    const shouldSkip = event.key === "Escape";
    const shouldPause = event.key.toLowerCase() === "p";
    if (!shouldAdvance && !shouldReturn && !shouldSkip && !shouldPause) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    if (event.repeat) return;
    if (
      (event.key === " " || event.key === "Enter")
      && typeof HTMLButtonElement !== "undefined"
      && event.target instanceof HTMLButtonElement
      && screen.contains(event.target)
    ) {
      event.target.click();
      return;
    }
    if (shouldSkip) finish();
    else if (shouldPause) setPaused(!paused);
    else advance(shouldReturn ? -1 : 1);
  }

  startButton.addEventListener("click", begin, { capture: true });
  window.addEventListener("keydown", onKeyDown, { capture: true });

  skipButton?.addEventListener("click", (event) => {
    event.stopPropagation();
    finish();
  });
  pauseButton?.addEventListener("click", (event) => {
    event.stopPropagation();
    setPaused(!paused);
  });
  previousButton?.addEventListener("click", (event) => {
    event.stopPropagation();
    advance(-1);
  });
  nextButton?.addEventListener("click", (event) => {
    event.stopPropagation();
    advance(1);
  });
  screen.addEventListener("click", (event) => {
    if (event.target.closest("button")) return;
    advance(1);
  });

  function publishStatus(text) {
    const normalized = String(text || "").trim();
    if (!normalized || normalized === lastStatusText || !gameStatus) return;
    lastStatusText = normalized;
    window.clearTimeout(statusTimer);
    statusTimer = window.setTimeout(() => {
      gameStatus.textContent = "";
      window.requestAnimationFrame(() => { gameStatus.textContent = normalized; });
    }, 90);
  }

  const objective = document.getElementById("hud-objective");
  const modeLabel = document.getElementById("view-mode-label");
  function refreshGameStatus() {
    if (!document.body.dataset.state?.startsWith("play") && document.body.dataset.state !== "paused") return;
    const objectiveText = objective?.textContent?.trim();
    const modeText = modeLabel?.textContent?.trim();
    publishStatus([objectiveText && `Objectif : ${objectiveText}`, modeText && `Mode : ${modeText}`].filter(Boolean).join(". "));
  }
  window.setInterval?.(refreshGameStatus, 750);

  const managedOverlays = [
    titleScreen,
    document.getElementById("briefing-screen"),
    document.getElementById("dojo-screen"),
    document.getElementById("pause-screen"),
    document.getElementById("end-screen"),
  ].filter(Boolean);
  let lastFocusedDialog = null;

  function syncOverlayAccessibility() {
    managedOverlays.forEach((overlay) => {
      const isVisible = overlay.classList.contains("active");
      overlay.setAttribute("aria-hidden", String(!isVisible));
      if (!isVisible || !["pause-screen", "end-screen"].includes(overlay.id) || lastFocusedDialog === overlay) return;
      lastFocusedDialog = overlay;
      window.requestAnimationFrame(() => overlay.querySelector(focusableSelector)?.focus({ preventScroll: true }));
    });
    const hasVisibleOverlay = managedOverlays.some((overlay) => overlay.classList.contains("active"));
    if (gameScreen) {
      gameScreen.inert = hasVisibleOverlay;
      if (hasVisibleOverlay) gameScreen.setAttribute("aria-hidden", "true");
      else gameScreen.removeAttribute("aria-hidden");
    }
    if (!managedOverlays.some((overlay) => overlay.classList.contains("active"))) lastFocusedDialog = null;
  }

  if (typeof MutationObserver !== "undefined") {
    const overlayObserver = new MutationObserver(syncOverlayAccessibility);
    managedOverlays.forEach((overlay) => overlayObserver.observe(overlay, { attributes: true, attributeFilter: ["class"] }));
  }
  syncOverlayAccessibility();

  window.KageCinematic = {
    start: () => begin(),
    next: () => advance(1),
    previous: () => advance(-1),
    pause: () => setPaused(true),
    resume: () => setPaused(false),
    skip: finish,
    openSettings,
    getState: () => ({
      active,
      paused,
      autoAdvance: !effectiveReducedMotion(),
      shot: shotIndex + 1,
      total: shots.length,
      image: shots[shotIndex]?.image || "",
    }),
  };

  if (previewShotIndex !== null) {
    begin();
    renderShot(previewShotIndex, true);
  }
})();
