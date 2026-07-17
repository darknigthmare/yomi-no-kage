(function createAssetGallery() {
  "use strict";

  const grid = document.getElementById("asset-grid");
  const filters = document.getElementById("filters");
  const resultCount = document.getElementById("result-count");
  const emptyState = document.getElementById("empty-state");
  const stats = document.getElementById("collection-stats");
  const dialog = document.getElementById("asset-dialog");
  let catalog = [];
  let catalogCounts = {};
  let activeType = "all";

  const labels = {
    all: "TOUT",
    character: "PERSONNAGES",
    weapon: "ARMES",
    enemy: "ENNEMIS",
    player: "JOUEUR",
    legacy: "ENNEMIS ORIGINAUX",
    regular: "ENNEMIS",
    special: "SPÉCIAUX",
    miniboss: "SOUS-BOSS",
    boss: "BOSS",
    giant: "BOSS GÉANTS",
    environment: "DÉCORS",
    "environment-layer": "FONDS PARALLAXE",
    platform: "PLATEFORMES",
    prop: "ACCESSOIRES",
  };

  const animationLabels = {
    idle: "REPOS",
    move: "DÉPLACEMENT",
    attack: "ATTAQUE",
    hurt: "DÉGÂTS",
    death: "MORT",
  };

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function typeLabel(type) {
    return labels[type] || type.toUpperCase();
  }

  function renderFilters() {
    const types = ["all", ...new Set(catalog.map((asset) => asset.type))];
    filters.innerHTML = types.map((type) => `
      <button class="filter" type="button" data-filter="${escapeHtml(type)}"
        aria-pressed="${type === activeType}">${escapeHtml(typeLabel(type))}</button>
    `).join("");
    filters.querySelectorAll("[data-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        activeType = button.dataset.filter;
        renderFilters();
        renderGrid();
      });
    });
  }

  function renderStats() {
    const characters = catalogCounts.characters ?? catalog.filter((asset) =>
      ["player", "legacy", "regular", "special", "miniboss", "boss", "giant"].includes(asset.type)).length;
    const sheets = catalogCounts.animationSheets ?? characters * 5;
    const frames = catalogCounts.framePngs ?? sheets * 6;
    const weapons = catalogCounts.weapons ?? catalog.filter((asset) => asset.type === "weapon").length;
    const decor = catalogCounts.environmentSprites ?? catalog.filter((asset) =>
      ["environment-layer", "platform", "prop"].includes(asset.type)).length;
    stats.innerHTML = `
      <span><b>${characters}</b><small>PERSONNAGES</small></span>
      <span><b>${sheets}</b><small>PLANCHES</small></span>
      <span><b>${frames}</b><small>FRAMES PNG</small></span>
      <span><b>${weapons}</b><small>ARMES</small></span>
      <span><b>${decor}</b><small>SPRITES DÉCOR</small></span>
    `;
  }

  function renderGrid() {
    const visible = activeType === "all" ? catalog : catalog.filter((asset) => asset.type === activeType);
    resultCount.textContent = `${visible.length} ASSET${visible.length > 1 ? "S" : ""}`;
    emptyState.hidden = visible.length !== 0;
    grid.innerHTML = visible.map((asset, index) => `
      <article class="asset-card" data-id="${escapeHtml(asset.id)}" data-type="${escapeHtml(asset.type)}"
        tabindex="0" role="button" aria-label="Voir ${escapeHtml(asset.name)}">
        <div class="asset-visual">
          <span class="asset-index">${String(index + 1).padStart(2, "0")}</span>
          <img src="${escapeHtml(asset.file)}" alt="${escapeHtml(asset.name)}" loading="lazy" />
        </div>
        <div class="asset-copy">
          <p class="eyebrow">${escapeHtml(typeLabel(asset.type))}</p>
          <h2>${escapeHtml(asset.name)}</h2>
          <p class="subtitle">${escapeHtml(asset.subtitle || "")}</p>
          <p>${escapeHtml(asset.lore || "")}</p>
        </div>
      </article>
    `).join("");

    grid.querySelectorAll(".asset-card").forEach((card) => {
      card.addEventListener("click", () => openAsset(card.dataset.id));
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openAsset(card.dataset.id);
        }
      });
    });
  }

  function openAsset(id) {
    const asset = catalog.find((entry) => entry.id === id);
    if (!asset) return;
    const dialogImage = document.getElementById("dialog-image");
    const animationPicker = document.getElementById("dialog-animations");
    const framePicker = document.getElementById("dialog-frames");
    dialogImage.src = asset.file;
    dialogImage.alt = asset.name;
    document.getElementById("dialog-type").textContent = typeLabel(asset.type);
    document.getElementById("dialog-title").textContent = asset.name;
    document.getElementById("dialog-subtitle").textContent = asset.subtitle || "";
    document.getElementById("dialog-lore").textContent = asset.lore || "";
    document.getElementById("dialog-gameplay").textContent = asset.gameplay || "Référence visuelle";
    const weaponLabel = document.getElementById("dialog-weapon-label");
    const weaponValue = document.getElementById("dialog-weapon");
    if (asset.type === "weapon") {
      weaponLabel.textContent = "POINT DE PRISE";
      weaponValue.textContent = Array.isArray(asset.anchor)
        ? `${asset.anchor[0].toFixed(2)} × ${asset.anchor[1].toFixed(2)} · ${asset.family || "arsenal modulaire"}`
        : "Ancrage indépendant";
    } else if (asset.animations) {
      weaponLabel.textContent = "ARME SÉPARÉE";
      weaponValue.textContent = asset.weaponId || "Aucune arme fusionnée au corps";
    } else {
      weaponLabel.textContent = "MODULARITÉ";
      weaponValue.textContent = "Sprite autonome et repositionnable";
    }
    document.getElementById("dialog-generation").textContent = asset.generationTool || "OpenAI ImageGen built-in";
    document.getElementById("dialog-file").textContent = asset.file;
    const animations = Object.entries(asset.animations || {});
    animationPicker.hidden = animations.length === 0;
    framePicker.hidden = true;
    framePicker.innerHTML = "";
    const renderFrames = (animation) => {
      const frames = asset.frames?.[animation] || [];
      framePicker.hidden = frames.length === 0;
      framePicker.innerHTML = frames.map((frame, index) => `
        <button type="button" data-frame="${escapeHtml(frame)}" aria-label="Frame ${index + 1}">
          <img src="${escapeHtml(frame)}" alt="" loading="lazy" />
          <span>${String(index + 1).padStart(2, "0")}</span>
        </button>
      `).join("");
      framePicker.querySelectorAll("[data-frame]").forEach((button) => {
        button.addEventListener("click", () => {
          dialogImage.src = button.dataset.frame;
          dialogImage.alt = `${asset.name} — ${animationLabels[animation] || animation}`;
        });
      });
    };
    animationPicker.innerHTML = animations.map(([animation]) => `
      <button type="button" data-animation="${escapeHtml(animation)}">${escapeHtml(animationLabels[animation] || animation)}</button>
    `).join("");
    animationPicker.querySelectorAll("[data-animation]").forEach((button) => {
      button.addEventListener("click", () => {
        dialogImage.src = asset.animations[button.dataset.animation];
        dialogImage.alt = `${asset.name} — ${animationLabels[button.dataset.animation] || button.dataset.animation}`;
        animationPicker.querySelectorAll("button").forEach((entry) =>
          entry.setAttribute("aria-pressed", String(entry === button)));
        renderFrames(button.dataset.animation);
      });
    });
    dialog.showModal();
  }

  document.getElementById("dialog-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  fetch("assets/modular/catalog.json?v=20260717-3")
    .then((response) => {
      if (!response.ok) throw new Error(`Catalogue indisponible (${response.status})`);
      return response.json();
    })
    .then((data) => {
      catalog = Array.isArray(data.assets) ? data.assets : [];
      catalogCounts = data.counts || {};
      renderStats();
      renderFilters();
      renderGrid();
    })
    .catch((error) => {
      grid.innerHTML = `<p class="empty-state">${escapeHtml(error.message)}</p>`;
    });
})();
