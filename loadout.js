(function defineKageLoadout(global) {
  "use strict";

  const arsenal = global.KageArsenal;
  const save = global.KageSave;
  const screen = document.getElementById("dojo-screen");

  if (!arsenal || !save || !screen) {
    global.KageLoadout = Object.freeze({
      open: () => false,
      close: () => false,
      render: () => false,
      getPending: () => null,
    });
    return;
  }

  const dom = {
    panel: screen.querySelector(".dojo-panel"),
    close: document.getElementById("dojo-close"),
    cancel: document.getElementById("dojo-cancel"),
    confirm: document.getElementById("dojo-confirm"),
    slots: document.getElementById("dojo-slots"),
    categories: document.getElementById("dojo-categories"),
    weapons: document.getElementById("dojo-weapons"),
    resultCount: document.getElementById("dojo-result-count"),
    status: document.getElementById("dojo-status"),
    preview: document.getElementById("dojo-preview"),
    previewFallback: document.getElementById("dojo-preview-fallback"),
    weaponName: document.getElementById("dojo-weapon-name"),
    weaponSubtitle: document.getElementById("dojo-weapon-subtitle"),
    weaponFamily: document.getElementById("dojo-weapon-family"),
    rarity: document.getElementById("dojo-rarity"),
    gameplay: document.getElementById("dojo-gameplay"),
    lore: document.getElementById("dojo-lore"),
    passiveName: document.getElementById("dojo-passive-name"),
    passiveDescription: document.getElementById("dojo-passive-description"),
    unlock: document.getElementById("dojo-unlock"),
    stats: document.getElementById("dojo-stats"),
    unlockedCount: document.getElementById("dojo-unlocked-count"),
    totalCount: document.getElementById("dojo-total-count"),
    hudWeapon: document.getElementById("hud-weapon"),
    hudWeaponIcon: document.getElementById("hud-weapon-icon"),
    hudWeaponName: document.getElementById("hud-weapon-name"),
    hudWeaponSlot: document.getElementById("hud-weapon-slot"),
  };

  let active = false;
  let previousBodyState = "briefing";
  let previousFocus = null;
  let sourceContext = "briefing";
  let requestedContextHint = null;
  let profile = save.load();
  let pendingLoadout = clone(profile.loadout);
  let selectedSlot = "primary";
  let selectedCategory = "all";
  let selectedWeaponId = pendingLoadout.primary;

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function categoryById(id) {
    return arsenal.categories.find((entry) => entry.id === id) || arsenal.categories[0];
  }

  function slotById(id) {
    return arsenal.slots.find((entry) => entry.id === id) || arsenal.slots[0];
  }

  function selectedWeapon() {
    return arsenal.weaponById(selectedWeaponId)
      || arsenal.weaponById(pendingLoadout[selectedSlot])
      || arsenal.weaponById(arsenal.defaultLoadout[selectedSlot]);
  }

  function isUnlocked(weaponId) {
    return profile.unlocks.weapons.includes(String(weaponId || ""));
  }

  function setStatus(message, tone = "neutral") {
    if (!dom.status) return;
    dom.status.textContent = message || "";
    dom.status.dataset.tone = tone;
  }

  function compatibleWeapons() {
    return arsenal.weaponsForSlot(selectedSlot);
  }

  function visibleWeapons() {
    return compatibleWeapons().filter((entry) =>
      selectedCategory === "all" || entry.category === selectedCategory);
  }

  function renderSlots() {
    if (!dom.slots) return;
    dom.slots.innerHTML = arsenal.slots.map((slot) => {
      const entry = arsenal.weaponById(pendingLoadout[slot.id]);
      const selected = slot.id === selectedSlot;
      return `
        <button
          class="loadout-slot${selected ? " selected" : ""}"
          type="button"
          role="tab"
          data-loadout-slot="${escapeHtml(slot.id)}"
          aria-selected="${selected}"
        >
          <span>${escapeHtml(slot.shortLabel)}</span>
          <b>${escapeHtml(entry?.name || "EMPLACEMENT VIDE")}</b>
          <small>${escapeHtml(entry?.rarityLabel || "AUCUNE ARME")}</small>
        </button>
      `;
    }).join("");
  }

  function renderCategories() {
    if (!dom.categories) return;
    const available = compatibleWeapons();
    dom.categories.innerHTML = arsenal.categories.map((category) => {
      const count = category.id === "all"
        ? available.length
        : available.filter((entry) => entry.category === category.id).length;
      const selected = selectedCategory === category.id;
      return `
        <button
          type="button"
          data-loadout-category="${escapeHtml(category.id)}"
          aria-pressed="${selected}"
          ${count ? "" : "disabled"}
        >
          ${escapeHtml(category.label)} <span>${count}</span>
        </button>
      `;
    }).join("");
  }

  function renderWeapons() {
    if (!dom.weapons) return;
    const entries = visibleWeapons();
    if (dom.resultCount) {
      dom.resultCount.textContent = `${entries.length} ARME${entries.length > 1 ? "S" : ""} COMPATIBLE${entries.length > 1 ? "S" : ""}`;
    }
    dom.weapons.innerHTML = entries.map((entry) => {
      const unlocked = isUnlocked(entry.id);
      const equipped = pendingLoadout[selectedSlot] === entry.id;
      const selected = selectedWeaponId === entry.id;
      return `
        <button
          class="dojo-weapon-card${equipped ? " equipped" : ""}${selected ? " selected" : ""}${unlocked ? "" : " locked"}"
          type="button"
          data-loadout-weapon="${escapeHtml(entry.id)}"
          aria-pressed="${equipped}"
          aria-label="${escapeHtml(entry.name)}${unlocked ? "" : ", verrouillée"}"
        >
          <span class="dojo-card-visual">
            <img src="${escapeHtml(entry.sprites.preview)}" alt="" loading="lazy" />
            <i aria-hidden="true">${unlocked ? "" : "封"}</i>
          </span>
          <span class="dojo-card-copy">
            <small>${escapeHtml(entry.rarityLabel)}</small>
            <b>${escapeHtml(entry.name)}</b>
            <em>${escapeHtml(categoryById(entry.category).label)}</em>
          </span>
        </button>
      `;
    }).join("");

    dom.weapons.querySelectorAll("img").forEach((image) => {
      image.addEventListener("error", () => {
        image.hidden = true;
        image.closest(".dojo-card-visual")?.classList.add("missing");
      }, { once: true });
    });
  }

  function statDelta(entry, comparison, stat) {
    if (!comparison || comparison.id === entry.id) return "";
    const delta = Number(entry.stats[stat.id]) - Number(comparison.stats[stat.id]);
    if (!delta) return "±0";
    const beneficial = stat.higherIsBetter ? delta > 0 : delta < 0;
    const sign = delta > 0 ? "+" : "";
    return `<span class="${beneficial ? "better" : "worse"}">${sign}${delta}</span>`;
  }

  function renderDetail() {
    const entry = selectedWeapon();
    if (!entry) return;
    const comparison = arsenal.weaponById(pendingLoadout[selectedSlot]);
    const unlocked = isUnlocked(entry.id);

    if (dom.preview) {
      dom.preview.hidden = false;
      dom.preview.src = entry.sprites.preview;
      dom.preview.alt = entry.name;
      dom.preview.onerror = () => {
        dom.preview.hidden = true;
        if (dom.previewFallback) dom.previewFallback.hidden = false;
      };
      if (dom.previewFallback) dom.previewFallback.hidden = true;
    }
    if (dom.weaponName) dom.weaponName.textContent = entry.name;
    if (dom.weaponSubtitle) dom.weaponSubtitle.textContent = entry.subtitle;
    if (dom.weaponFamily) {
      dom.weaponFamily.textContent = `${categoryById(entry.category).label} · ${slotById(selectedSlot).shortLabel}`;
    }
    if (dom.rarity) {
      dom.rarity.textContent = entry.rarityLabel;
      dom.rarity.dataset.rarity = entry.rarity;
    }
    if (dom.gameplay) dom.gameplay.textContent = entry.gameplay;
    if (dom.lore) dom.lore.textContent = entry.lore;
    if (dom.passiveName) dom.passiveName.textContent = entry.passive.name;
    if (dom.passiveDescription) dom.passiveDescription.textContent = entry.passive.description;
    if (dom.unlock) {
      dom.unlock.textContent = unlocked ? "ARME DÉBLOQUÉE" : entry.unlock.label;
      dom.unlock.dataset.unlocked = String(unlocked);
    }
    if (dom.stats) {
      dom.stats.innerHTML = arsenal.stats.map((stat) => `
        <div class="dojo-stat">
          <span>${escapeHtml(stat.label)}</span>
          <div><i style="width:${Math.max(2, Math.min(100, entry.stats[stat.id]))}%"></i></div>
          <b>${entry.stats[stat.id]}</b>
          <em>${statDelta(entry, comparison, stat)}</em>
        </div>
      `).join("");
    }
  }

  function renderCollectionStatus() {
    const unlocked = arsenal.weapons.filter((entry) => isUnlocked(entry.id)).length;
    if (dom.unlockedCount) dom.unlockedCount.textContent = String(unlocked);
    if (dom.totalCount) dom.totalCount.textContent = String(arsenal.weapons.length);
  }

  function render() {
    renderSlots();
    renderCategories();
    renderWeapons();
    renderDetail();
    renderCollectionStatus();
    return true;
  }

  function normalizePending(currentLoadout) {
    const saved = save.getLoadout();
    const source = currentLoadout && typeof currentLoadout === "object"
      ? { ...saved, ...currentLoadout }
      : saved;
    const weaponSlots = arsenal.normalizeLoadout(source);
    return { ...source, ...weaponSlots };
  }

  function open(currentLoadout, options = {}) {
    if (active) return false;
    profile = save.load();
    pendingLoadout = normalizePending(currentLoadout);
    previousBodyState = document.body.dataset.state || "briefing";
    sourceContext = String(
      options.source
      || options.context
      || requestedContextHint
      || "engine",
    );
    selectedSlot = arsenal.slots.some((slot) => slot.id === options.slot)
      ? options.slot
      : "primary";
    selectedCategory = "all";
    selectedWeaponId = pendingLoadout[selectedSlot];
    previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    active = true;

    document.body.dataset.state = "loadout";
    document.body.classList.add("dojo-open");
    screen.classList.add("active");
    screen.setAttribute("aria-hidden", "false");
    setStatus("Choisissez un emplacement, puis une arme. La configuration n’est appliquée qu’après validation.");
    render();
    requestAnimationFrame(() => {
      dom.slots?.querySelector(`[data-loadout-slot="${selectedSlot}"]`)?.focus({ preventScroll: true });
    });
    global.dispatchEvent(new CustomEvent("yomi:loadout-opened", {
      detail: {
        context: sourceContext,
        loadout: clone(pendingLoadout),
      },
    }));
    return true;
  }

  function close(options = {}) {
    if (!active) return false;
    const context = sourceContext;
    active = false;
    screen.classList.remove("active");
    screen.setAttribute("aria-hidden", "true");
    document.body.classList.remove("dojo-open");
    document.body.dataset.state = previousBodyState;
    if (options.restoreFocus !== false) {
      previousFocus?.focus?.({ preventScroll: true });
    }
    if (options.applied !== true) {
      global.dispatchEvent(new CustomEvent("yomi:loadout-closed", {
        detail: {
          context,
          applied: false,
        },
      }));
    }
    return true;
  }

  function validatePending() {
    for (const slot of arsenal.slots) {
      const weaponId = pendingLoadout[slot.id];
      if (!arsenal.isWeaponCompatibleWithSlot(weaponId, slot.id)) {
        return { valid: false, message: `${slot.label} : arme incompatible.` };
      }
      if (!isUnlocked(weaponId)) {
        return { valid: false, message: `${slot.label} : cette arme n’est pas débloquée.` };
      }
    }
    return { valid: true };
  }

  function applyPending() {
    const validation = validatePending();
    if (!validation.valid) {
      setStatus(validation.message, "error");
      return false;
    }

    const appliedLoadout = save.setLoadout(pendingLoadout);
    const context = sourceContext;
    updateHud(appliedLoadout, appliedLoadout.primary, "primary");
    close({ restoreFocus: false, applied: true });
    global.dispatchEvent(new CustomEvent("yomi:loadout-applied", {
      detail: {
        loadout: clone(appliedLoadout),
        context,
      },
    }));
    return true;
  }

  function selectSlot(slotId) {
    if (!arsenal.slots.some((slot) => slot.id === slotId)) return false;
    selectedSlot = slotId;
    selectedCategory = "all";
    selectedWeaponId = pendingLoadout[selectedSlot];
    setStatus(`${slotById(selectedSlot).label} sélectionnée.`);
    render();
    return true;
  }

  function selectCategory(categoryId) {
    const available = compatibleWeapons();
    const hasEntries = categoryId === "all"
      || available.some((entry) => entry.category === categoryId);
    if (!hasEntries) return false;
    selectedCategory = categoryId;
    const entries = visibleWeapons();
    if (!entries.some((entry) => entry.id === selectedWeaponId)) {
      selectedWeaponId = entries[0]?.id || pendingLoadout[selectedSlot];
    }
    render();
    return true;
  }

  function selectWeapon(weaponId) {
    const entry = arsenal.weaponById(weaponId);
    if (!entry || !entry.slots.includes(selectedSlot)) return false;
    selectedWeaponId = entry.id;
    if (isUnlocked(entry.id)) {
      pendingLoadout[selectedSlot] = entry.id;
      setStatus(`${entry.name} préparée comme ${slotById(selectedSlot).shortLabel.toLowerCase()}.`, "success");
    } else {
      setStatus(`VERROUILLÉE — ${entry.unlock.label}`, "locked");
    }
    render();
    return true;
  }

  function updateHud(loadout = save.getLoadout(), activeWeaponId = null, activeSlot = "primary") {
    const normalized = arsenal.normalizeLoadout(loadout);
    const weaponId = arsenal.weaponById(activeWeaponId)
      ? activeWeaponId
      : normalized[activeSlot] || normalized.primary;
    const entry = arsenal.weaponById(weaponId);
    const slot = slotById(activeSlot);
    if (!entry) return false;

    if (dom.hudWeaponName) dom.hudWeaponName.textContent = entry.name.toUpperCase();
    if (dom.hudWeaponSlot) dom.hudWeaponSlot.textContent = slot.shortLabel;
    if (dom.hudWeapon) dom.hudWeapon.dataset.weapon = entry.id;
    if (dom.hudWeaponIcon) {
      dom.hudWeaponIcon.hidden = false;
      dom.hudWeaponIcon.src = entry.sprites.preview;
      dom.hudWeaponIcon.alt = "";
      dom.hudWeaponIcon.onerror = () => { dom.hudWeaponIcon.hidden = true; };
    }
    return true;
  }

  dom.slots?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-loadout-slot]");
    if (button) selectSlot(button.dataset.loadoutSlot);
  });
  dom.categories?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-loadout-category]");
    if (button && !button.disabled) selectCategory(button.dataset.loadoutCategory);
  });
  dom.weapons?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-loadout-weapon]");
    if (button) selectWeapon(button.dataset.loadoutWeapon);
  });
  dom.close?.addEventListener("click", () => close());
  dom.cancel?.addEventListener("click", () => close());
  dom.confirm?.addEventListener("click", applyPending);

  document.querySelectorAll("[data-loadout-open]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const context = button.dataset.loadoutOpen || "manual";
      if (typeof global.KageGame?.openLoadout === "function") {
        requestedContextHint = context;
        try {
          global.KageGame.openLoadout(context);
        } finally {
          requestedContextHint = null;
        }
      } else {
        open(null, { source: context });
      }
    });
  });

  global.addEventListener("keydown", (event) => {
    if (!active) return;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopImmediatePropagation();
      close();
    }
  }, { capture: true });

  global.addEventListener("yomi:loadout-request", (event) => {
    open(event.detail?.loadout, {
      source: event.detail?.context || "engine",
      slot: event.detail?.slot,
    });
  });
  global.addEventListener("yomi:weapon-changed", (event) => {
    updateHud(
      event.detail?.loadout || save.getLoadout(),
      event.detail?.weaponId,
      event.detail?.slot || "primary",
    );
  });
  global.addEventListener("yomi:save-updated", () => {
    if (!active) return;
    profile = save.load();
    render();
  });

  updateHud();

  global.KageLoadout = Object.freeze({
    open,
    close,
    render,
    apply: applyPending,
    selectSlot,
    selectCategory,
    selectWeapon,
    updateHud,
    isOpen: () => active,
    getPending: () => clone(pendingLoadout),
    getCurrentLoadout: () => clone(save.getLoadout()),
  });
})(window);
