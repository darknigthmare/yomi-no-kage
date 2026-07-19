(function defineKageCampaignUi(global) {
  "use strict";

  const screen = document.getElementById("campaign-screen");
  const game = global.KageGame;
  if (!screen || !game?.campaignSnapshot) {
    global.KageCampaignUI = Object.freeze({ render: () => false });
    return;
  }

  const FALLBACK_ACTS = [
    "La forêt qui murmure",
    "Les lames de Shigure",
    "La moisson noire",
    "Kurokawa, ville des cendres",
    "Le trône du Yomi",
    "Tokyo, année zéro",
    "Les ombres de Neo-Tokyo",
  ];
  const residentLabels = {
    "chiyo-apothicaire": "Chiyo, apothicaire",
    "masanori-forgeron": "Masanori, forgeron",
    "suzu-eclaireuse": "Suzu, éclaireuse",
    "rei-archiviste": "Rei, archiviste temporelle",
  };
  const statusLabels = {
    available: "DISPONIBLE",
    active: "EN COURS",
    ready: "RÉCOMPENSE PRÊTE",
    completed: "ACCOMPLI",
  };
  const dom = {
    actLabel: document.getElementById("campaign-act-label"),
    zoneLabel: document.getElementById("campaign-zone-label"),
    actList: document.getElementById("campaign-act-list"),
    objectiveList: document.getElementById("campaign-objective-list"),
    questList: document.getElementById("campaign-quest-list"),
    facilityList: document.getElementById("campaign-facility-list"),
    residents: document.getElementById("campaign-residents"),
    hubLevel: document.getElementById("campaign-hub-level"),
    mon: document.getElementById("campaign-mon"),
    tamahagane: document.getElementById("campaign-tamahagane"),
    yomiAsh: document.getElementById("campaign-yomi-ash"),
    supplies: document.getElementById("campaign-supplies"),
    contamination: document.getElementById("campaign-contamination"),
    activeWeapon: document.getElementById("campaign-active-weapon"),
    weaponRank: document.getElementById("campaign-weapon-rank"),
    saveIndicator: document.getElementById("campaign-save-indicator"),
    saveLabel: document.getElementById("campaign-save-label"),
    status: document.getElementById("campaign-status"),
    rest: screen.querySelector('[data-campaign-action="rest"]'),
    weaponUpgrade: screen.querySelector('[data-campaign-action="upgrade-weapon"]'),
  };

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function roman(value) {
    return ["I", "II", "III", "IV", "V", "VI", "VII"][Number(value) - 1]
      || String(value || 1);
  }

  function currentActs(snapshot) {
    if (snapshot.acts?.length) return snapshot.acts;
    return FALLBACK_ACTS.map((label, index) => ({
      id: `act-0${index + 1}`,
      order: index + 1,
      label: `Acte ${roman(index + 1)} — ${label}`,
      unlocked: index === 0,
      completed: false,
      areaIds: [],
    }));
  }

  function renderActs(snapshot) {
    const currentActId = snapshot.campaign?.currentActId;
    const currentOrder = Number(snapshot.area?.actOrder || snapshot.campaign?.currentActOrder || 1);
    const acts = currentActs(snapshot);
    dom.actList.innerHTML = acts.map((act) => {
      const active = act.id === currentActId || Number(act.order) === currentOrder;
      const state = act.completed ? "completed" : (act.unlocked || active ? "unlocked" : "locked");
      const zoneCount = Array.isArray(act.areaIds) && act.areaIds.length ? act.areaIds.length : 4;
      return `
        <li class="${state}${active ? " active" : ""}" aria-current="${active ? "step" : "false"}">
          <span>${roman(act.order)}</span>
          <p>
            <b>${escapeHtml(String(act.label || act.id).replace(/^Acte\\s+[IVX]+\\s*[—-]\\s*/i, ""))}</b>
            <small>${act.completed ? "ACTE ACCOMPLI" : `${zoneCount} ZONE${zoneCount > 1 ? "S" : ""}`}</small>
          </p>
          <i aria-hidden="true">${act.completed ? "✓" : (state === "locked" ? "鎖" : "•")}</i>
        </li>
      `;
    }).join("");
  }

  function renderObjectives(snapshot) {
    if (!snapshot.objectives?.length) {
      dom.objectiveList.innerHTML = `
        <article class="campaign-objective current">
          <span aria-hidden="true">命</span>
          <p><b>${escapeHtml(snapshot.area?.label || "Zone actuelle")}</b><small>Suivez l’ordre affiché dans le HUD et sécurisez le prochain foyer.</small></p>
        </article>
      `;
      return;
    }
    dom.objectiveList.innerHTML = snapshot.objectives.map((objective) => `
      <article class="campaign-objective${objective.completed ? " completed" : " current"}">
        <span aria-hidden="true">${objective.completed ? "✓" : "命"}</span>
        <p>
          <b>${escapeHtml(objective.label || objective.id)}</b>
          <small>${objective.completed ? "OBJECTIF ACCOMPLI" : escapeHtml(String(objective.type || "mission").toUpperCase())}</small>
        </p>
      </article>
    `).join("");
  }

  function rewardLabel(reward = {}) {
    const parts = [];
    if (reward.mon) parts.push(`${reward.mon} mon`);
    if (reward.tamahagane) parts.push(`${reward.tamahagane} tamahagane`);
    if (reward.yomiAsh) parts.push(`${reward.yomiAsh} cendres`);
    if (reward.supplies) parts.push(`${reward.supplies} provisions`);
    if (reward.unlockWeapon) parts.push("arme");
    return parts.join(" · ") || "réputation";
  }

  function renderQuests(snapshot) {
    dom.questList.innerHTML = snapshot.quests.map((quest) => {
      const state = quest.state || {};
      const status = state.status || "available";
      const target = Math.max(1, Number(state.target || quest.target) || 1);
      const progress = Math.min(target, Math.max(0, Number(state.progress) || 0));
      let action = "";
      if (status === "available") {
        action = `<button class="pixel-button compact" data-campaign-action="accept-quest" data-campaign-id="${escapeHtml(quest.id)}" type="button">ACCEPTER</button>`;
      } else if (status === "ready") {
        action = `<button class="pixel-button primary compact" data-campaign-action="claim-quest" data-campaign-id="${escapeHtml(quest.id)}" type="button">RÉCUPÉRER</button>`;
      }
      return `
        <article class="campaign-quest" data-status="${escapeHtml(status)}">
          <header><b>${escapeHtml(quest.title)}</b><span>${escapeHtml(statusLabels[status] || status)}</span></header>
          <p>${escapeHtml(quest.description)}</p>
          <div class="campaign-quest-progress" role="progressbar" aria-label="${escapeHtml(quest.title)}" aria-valuemin="0" aria-valuemax="${target}" aria-valuenow="${progress}">
            <i style="width:${progress / target * 100}%"></i>
          </div>
          <footer><small>${progress}/${target} · ${escapeHtml(rewardLabel(quest.reward))}</small>${action}</footer>
        </article>
      `;
    }).join("");
  }

  function renderFacilities(snapshot) {
    const definitions = game.hubFacilities?.() || {};
    dom.facilityList.innerHTML = Object.entries(definitions).map(([id, facility]) => {
      const state = snapshot.hub?.facilities?.[id] || { level: 1 };
      const level = Number(state.level) || 1;
      const maxed = level >= 5;
      const cost = facility.baseCost * level;
      return `
        <article class="campaign-facility">
          <p><b>${escapeHtml(facility.label)}</b><small>${escapeHtml(facility.description)}</small></p>
          <span>NIV. ${level}</span>
          <button
            class="pixel-button compact"
            data-campaign-action="upgrade-facility"
            data-campaign-id="${escapeHtml(id)}"
            type="button"
            ${maxed || !snapshot.refugeServicesAvailable ? "disabled" : ""}
          >${maxed ? "MAX" : `${cost} ${escapeHtml(facility.currencyId).toUpperCase()}`}</button>
        </article>
      `;
    }).join("");
  }

  function setStatus(message, tone = "neutral") {
    dom.status.textContent = message;
    dom.status.dataset.tone = tone;
  }

  function render(snapshot = game.campaignSnapshot()) {
    if (!snapshot) return false;
    dom.actLabel.textContent = `ACTE ${roman(snapshot.area?.actOrder || 1)}`;
    dom.zoneLabel.textContent = snapshot.area?.label || snapshot.area?.zoneId || "Route de Kai";
    dom.mon.textContent = Number(snapshot.currencies?.mon) || 0;
    dom.tamahagane.textContent = Number(snapshot.currencies?.tamahagane) || 0;
    dom.yomiAsh.textContent = Number(snapshot.currencies?.yomiAsh) || 0;
    dom.supplies.textContent = Number(snapshot.hub?.supplies) || 0;
    dom.contamination.textContent = `${Math.round(Number(snapshot.contamination) || 0)} %`;
    dom.hubLevel.textContent = Number(snapshot.hub?.level) || 1;
    dom.residents.textContent = (snapshot.hub?.residents || [])
      .map((id) => residentLabels[id] || id)
      .join(" · ");
    dom.activeWeapon.textContent = snapshot.activeWeapon?.name || snapshot.activeWeapon?.id || "Kurokage";
    dom.weaponRank.textContent = `RANG +${Number(snapshot.activeWeapon?.upgradeLevel) || 0}`;
    if (dom.rest) dom.rest.disabled = !snapshot.refugeServicesAvailable;
    if (dom.weaponUpgrade) dom.weaponUpgrade.disabled = !snapshot.refugeServicesAvailable;
    dom.saveIndicator.dataset.state = snapshot.save?.persistent ? "persistent" : "memory";
    dom.saveLabel.textContent = snapshot.save?.recoverySource === "backup"
      ? "Copie de secours restaurée"
      : (snapshot.save?.persistent ? "Sauvegarde locale principale + secours" : "Session mémoire uniquement");
    renderActs(snapshot);
    renderObjectives(snapshot);
    renderQuests(snapshot);
    renderFacilities(snapshot);
    return true;
  }

  function resultMessage(action, result) {
    if (result?.ok) {
      if (action === "rest") return "Akio est soigné. La souillure recule et une provision a été consommée.";
      if (action === "upgrade-weapon") return `Arme renforcée au rang +${result.level}. Les dégâts et la posture progressent.`;
      if (action === "upgrade-facility") return "Le refuge s’agrandit. Le service amélioré est actif immédiatement.";
      if (action === "accept-quest") return "Contrat accepté et ajouté au journal actif.";
      if (action === "claim-quest") return "Récompense versée au refuge et déblocage appliqué.";
      return "Chronique mise à jour.";
    }
    const reasons = {
      supplies: "Il manque une provision pour se reposer.",
      funds: "Ressources insuffisantes pour cette amélioration.",
      forge: "Améliorez d’abord la forge pour dépasser ce rang.",
      max: "Cette amélioration a atteint son rang maximal.",
      state: "Cette action n’est pas disponible dans l’état actuel du contrat.",
      storage: "La sauvegarde persistante est indisponible ; aucune ressource n’a été consommée.",
      combat: "Les services du refuge sont disponibles après avoir sécurisé un foyer, hors combat.",
    };
    return reasons[result?.reason] || "Action impossible pour le moment.";
  }

  screen.addEventListener("click", (event) => {
    const button = event.target.closest("[data-campaign-action]");
    if (!button || button.disabled) return;
    const action = button.dataset.campaignAction;
    const id = button.dataset.campaignId || "";
    const result = game.campaignAction(action, id);
    setStatus(resultMessage(action, result), result?.ok ? "success" : "error");
  });

  screen.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    const focusable = [...screen.querySelectorAll(
      'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    )].filter((element) => !element.hidden);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  global.addEventListener("yomi:campaign-updated", (event) => {
    render(event.detail?.snapshot);
  });
  global.addEventListener("yomi:save-updated", () => {
    if (screen.classList.contains("active")) render();
  });

  global.KageCampaignUI = Object.freeze({
    render,
    snapshot: () => game.campaignSnapshot(),
  });
})(window);
