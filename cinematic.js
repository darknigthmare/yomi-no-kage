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
      speaker: "TOKUGAWA IEMITSU",
      dialogue: "Une armée nourrirait la peste. Akio ira seul.",
      duration: 10500,
      motion: "push",
    },
    {
      image: "assets/generated/cinematics/prologue-05-serment.png",
      alt: "Sous les avant-toits du château, Akio dégaine légèrement son katana et prête serment.",
      kicker: "« N'ÉPARGNEZ QUE LES VIVANTS. »",
      location: "LE SERMENT DE L'OMBRE",
      narration: "Le shogun ne lui confia ni armée, ni prêtre. Seulement un ordre scellé.",
      speaker: "AKIO KAGEYAMA",
      dialogue: "Alors je rendrai les morts au silence.",
      duration: 9000,
      motion: "left",
    },
    {
      image: "assets/generated/cinematics/prologue-06-kurokawa.png",
      alt: "À l'aube, Akio fait face au village en flammes par-delà un grand torii ouvert sur la route.",
      kicker: "KUROKAWA — LE VILLAGE DES CENDRES",
      location: "AU SEUIL DE YOMI",
      narration: "À l'aube, Kurokawa brûlait encore.",
      speaker: "AKIO KAGEYAMA",
      dialogue: "Que vos noms survivent à cette nuit.",
      duration: 11000,
      motion: "right",
    },
  ];
  const previewMatch = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("preview")?.match(/^prologue-([1-6])$/)
    : null;
  const previewShotIndex = previewMatch ? Number(previewMatch[1]) - 1 : null;

  const screen = document.getElementById("prologue-screen");
  const startButton = document.getElementById("start-button");
  const titleScreen = document.getElementById("title-screen");
  const gameScreen = document.getElementById("game-screen");
  const briefingStartButton = document.getElementById("briefing-start-button");
  const skipButton = document.getElementById("prologue-skip");
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

  if (!screen || !startButton || !image) return;

  let active = false;
  let shotIndex = 0;
  let shotTimer = 0;
  let transitionTimer = 0;
  let renderToken = 0;
  let allowOriginalStart = false;
  const preloadedShots = new Map();

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

  function clearTimers() {
    window.clearTimeout(shotTimer);
    window.clearTimeout(transitionTimer);
    shotTimer = 0;
    transitionTimer = 0;
  }

  function scheduleAdvance(shot) {
    if (previewShotIndex !== null) return;
    shotTimer = window.setTimeout(() => advance(1), shot.duration);
  }

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
    progress.setAttribute("aria-valuenow", String(index + 1));

    const hasDialogue = Boolean(shot.dialogue);
    dialogue.hidden = !hasDialogue;
    speaker.textContent = hasDialogue ? shot.speaker : "";
    line.textContent = hasDialogue ? shot.dialogue : "";
    nextButton.firstChild.textContent = index === shots.length - 1
      ? "RECEVOIR L'ORDRE "
      : "PLAN SUIVANT ";

    progressDots.forEach((dot, dotIndex) => {
      dot.classList.toggle("active", dotIndex === index);
      dot.classList.toggle("seen", dotIndex < index);
    });

    screen.classList.remove("is-playing-shot");
    void image.offsetWidth;
    screen.classList.add("is-playing-shot");
    screen.classList.remove("is-changing");
    preloadShot(index + 1);
    scheduleAdvance(shot);
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

  function begin(event) {
    if (allowOriginalStart) return;
    event?.preventDefault();
    event?.stopImmediatePropagation();
    if (active) return;

    active = true;
    shotIndex = 0;
    document.body.dataset.state = "cinematic";
    [titleScreen, gameScreen].forEach((layer) => {
      if (!layer) return;
      layer.setAttribute("aria-hidden", "true");
      layer.inert = true;
    });
    screen.classList.add("active");
    screen.setAttribute("aria-hidden", "false");
    renderShot(0, true);
    screen.focus({ preventScroll: true });
  }

  function finish() {
    if (!active) return;
    clearTimers();
    renderToken += 1;
    active = false;
    screen.classList.remove("active", "is-changing", "is-playing-shot");
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
    if (!active) return;
    const shouldAdvance = event.key === " " || event.key === "Enter" || event.key === "ArrowRight";
    const shouldReturn = event.key === "ArrowLeft";
    const shouldSkip = event.key === "Escape";
    if (!shouldAdvance && !shouldReturn && !shouldSkip) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    if (event.repeat) return;
    if (
      (event.key === " " || event.key === "Enter")
      && event.target instanceof Element
      && event.target.closest("#prologue-skip, #prologue-next")
    ) {
      event.target.click();
      return;
    }
    if (shouldSkip) finish();
    else advance(shouldReturn ? -1 : 1);
  }

  startButton.addEventListener("click", begin, { capture: true });
  window.addEventListener("keydown", onKeyDown, { capture: true });

  skipButton.addEventListener("click", (event) => {
    event.stopPropagation();
    finish();
  });

  nextButton.addEventListener("click", (event) => {
    event.stopPropagation();
    advance(1);
  });

  screen.addEventListener("click", (event) => {
    if (event.target.closest("button")) return;
    advance(1);
  });

  window.KageCinematic = {
    start: () => begin(),
    next: () => advance(1),
    skip: finish,
    getState: () => ({
      active,
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
