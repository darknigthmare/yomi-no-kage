/**
 * Audio procédural pour le jeu : aucun fichier sonore externe n'est requis.
 *
 * API rapide (singleton global) :
 *   await gameAudio.unlock();       // à appeler depuis un clic/touche
 *   gameAudio.startMusic();
 *   gameAudio.play("katana");
 *   gameAudio.playTransition("fps");
 *   gameAudio.toggleMute();
 *
 * La classe FeudalHorrorAudio est aussi exposée globalement pour permettre
 * de créer une instance séparée si le jeu en a besoin.
 */
(function exposeFeudalHorrorAudio(global) {
  "use strict";

  const AudioContextClass = global.AudioContext || global.webkitAudioContext;
  const EPSILON = 0.0001;
  const MUSIC_STATES = Object.freeze({
    title: {
      bpm: 72,
      melody: [69, null, 72, null, 64, null, 65, null, 69, null, 71, null, 64, null, null, null],
      pulseEvery: 16,
      pulseGain: 0.022,
      voice: "triangle",
      drone: [55, 82.41],
      droneGain: 0.018,
    },
    prologue: {
      bpm: 64,
      melody: [57, null, null, 60, null, null, 64, null, 62, null, null, 57, null, null, null, null],
      pulseEvery: 16,
      pulseGain: 0.016,
      voice: "triangle",
      drone: [43.65, 65.41],
      droneGain: 0.02,
    },
    travel: {
      bpm: 82,
      melody: [64, null, 67, 69, null, 72, null, 69, 67, null, 64, null, 62, null, null, null],
      pulseEvery: 8,
      pulseGain: 0.026,
      voice: "square",
      drone: [48.99, 73.42],
      droneGain: 0.017,
    },
    village: {
      bpm: 86,
      melody: [69, null, 72, null, 71, null, 69, null, 64, null, 65, null, 64, null, null, null, 69, null, 72, null, 76, null, 72, null, 71, null, 69, null, 65, null, 64, null],
      pulseEvery: 8,
      pulseGain: 0.04,
      voice: "square",
      drone: [55, 82.41],
      droneGain: 0.024,
    },
    interior: {
      bpm: 70,
      melody: [57, null, 60, null, null, 61, null, 57, null, null, 53, null, 55, null, null, null],
      pulseEvery: 16,
      pulseGain: 0.024,
      voice: "triangle",
      drone: [41.2, 61.74],
      droneGain: 0.028,
    },
    yomi: {
      bpm: 78,
      melody: [57, 58, null, 64, null, 61, 60, null, 57, null, 53, null, 58, null, null, null],
      pulseEvery: 8,
      pulseGain: 0.032,
      voice: "sawtooth",
      drone: [38.89, 58.27],
      droneGain: 0.032,
    },
    combat: {
      bpm: 112,
      melody: [57, null, 60, 64, 62, null, 60, null, 57, 60, null, 65, 64, null, 60, null],
      pulseEvery: 4,
      pulseGain: 0.064,
      voice: "square",
      drone: [48.99, 73.42],
      droneGain: 0.024,
    },
    boss: {
      bpm: 126,
      melody: [45, 52, 53, null, 45, 52, 57, 56, 45, 52, 53, 59, 57, null, 53, null],
      pulseEvery: 2,
      pulseGain: 0.085,
      voice: "sawtooth",
      drone: [36.71, 55],
      droneGain: 0.04,
    },
    purified: {
      bpm: 74,
      melody: [57, null, 60, null, 64, null, 69, null, 67, null, 64, null, 60, null, 57, null],
      pulseEvery: 16,
      pulseGain: 0.018,
      voice: "triangle",
      drone: [55, 82.41],
      droneGain: 0.014,
    },
  });

  const WEAPON_AUDIO_FAMILIES = Object.freeze({
    katana: "blade",
    tachi: "blade",
    greatblade: "heavyBlade",
    shortsword: "blade",
    shortblade: "blade",
    dagger: "throwing",
    trainingblade: "wood",
    breaker: "metalTool",
    parryingtool: "metalTool",
    spear: "polearm",
    naginata: "polearm",
    polearm: "polearm",
    hammer: "heavy",
    heavy: "heavy",
    ritualstaff: "staff",
    staff: "staff",
    flexible: "chain",
    chain: "chain",
    kusarigama: "chain",
    bow: "bow",
    firearm: "firearm",
    throwing: "throwing",
    warfan: "fan",
    fan: "fan",
  });

  /** Limite une valeur numérique à une plage sûre. */
  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, Number(value) || 0));
  }

  /** Conversion MIDI vers Hertz, pratique pour les motifs mélodiques. */
  function midiToHz(note) {
    return 440 * Math.pow(2, (note - 69) / 12);
  }

  class FeudalHorrorAudio {
    constructor(options = {}) {
      this.context = null;
      this.masterGain = null;
      this.musicGain = null;
      this.sfxGain = null;
      this.compressor = null;
      this.noiseBuffer = null;

      this.supported = Boolean(AudioContextClass);
      this.unlocked = false;
      this.muted = this._readStoredMute();
      this.masterVolume = clamp(options.masterVolume ?? 0.72, 0, 1);
      this.musicVolume = clamp(options.musicVolume ?? 0.19, 0, 1);
      this.sfxVolume = clamp(options.sfxVolume ?? 0.72, 0, 1);

      // État de la musique : le souhait de lecture est mémorisé même avant
      // l'autorisation audio du navigateur.
      this.musicWanted = options.music !== false;
      this.musicPlaying = false;
      this.musicTimer = null;
      this.musicStep = 0;
      this.nextMusicTime = 0;
      this.droneNodes = [];
      this.musicState = MUSIC_STATES[options.musicState] ? options.musicState : "title";
      this.musicIntensity = clamp(options.musicIntensity ?? 0.5, 0, 1);
      this._spatialNodes = new Set();

      this._gestureHandler = () => {
        this.unlock().catch(() => {
          // Un échec ponctuel (onglet masqué, navigateur strict) n'empêche pas
          // une nouvelle tentative au geste suivant.
        });
      };
      this._gestureEventsBound = false;

      if (options.autoUnlock !== false) {
        this.bindUnlockGestures();
      }
    }

    /**
     * Prépare les bus audio lors du premier geste utilisateur seulement.
     * Retourne false sur un navigateur sans Web Audio au lieu de planter.
     */
    async unlock() {
      if (!this.supported) return false;

      this._ensureContext();
      if (this.context.state !== "running") {
        await this.context.resume();
      }

      this.unlocked = this.context.state === "running";
      if (!this.unlocked) return false;

      this.unbindUnlockGestures();
      this._applyMasterVolume(true);
      if (this.musicWanted) this._startMusicNow();
      return true;
    }

    /** Alias utile pour les écrans « Cliquer pour commencer ». */
    async init() {
      return this.unlock();
    }

    /** Alias qui déverrouille puis démarre explicitement la musique. */
    async begin() {
      this.musicWanted = true;
      return this.unlock();
    }

    /** Installe des écouteurs one-shot compatibles souris, tactile et clavier. */
    bindUnlockGestures() {
      if (this._gestureEventsBound || !global.document) return;
      this._gestureEventsBound = true;
      global.document.addEventListener("pointerdown", this._gestureHandler, {
        capture: true,
        passive: true,
      });
      global.document.addEventListener("touchstart", this._gestureHandler, {
        capture: true,
        passive: true,
      });
      global.document.addEventListener("keydown", this._gestureHandler, true);
    }

    unbindUnlockGestures() {
      if (!this._gestureEventsBound || !global.document) return;
      this._gestureEventsBound = false;
      global.document.removeEventListener("pointerdown", this._gestureHandler, true);
      global.document.removeEventListener("touchstart", this._gestureHandler, true);
      global.document.removeEventListener("keydown", this._gestureHandler, true);
    }

    /** Demande une musique discrète ; elle partira après déverrouillage. */
    startMusic() {
      this.musicWanted = true;
      if (!this.unlocked || !this.context) return false;
      this._startMusicNow();
      return true;
    }

    stopMusic() {
      this.musicWanted = false;
      this.musicPlaying = false;
      if (this.musicTimer !== null) {
        global.clearInterval(this.musicTimer);
        this.musicTimer = null;
      }
      this._stopDrone();
    }

    /** Coupe ou rétablit l'ensemble du mixage, avec une rampe anti-clic. */
    setMuted(shouldMute) {
      this.muted = Boolean(shouldMute);
      this._storeMute();
      this._applyMasterVolume();
      return this.muted;
    }

    toggleMute() {
      return this.setMuted(!this.muted);
    }

    isMuted() {
      return this.muted;
    }

    setMasterVolume(value) {
      this.masterVolume = clamp(value, 0, 1);
      this._applyMasterVolume();
    }

    setMusicVolume(value) {
      this.musicVolume = clamp(value, 0, 1);
      this._setBusVolume(this.musicGain, this.musicVolume);
    }

    setSfxVolume(value) {
      this.sfxVolume = clamp(value, 0, 1);
      this._setBusVolume(this.sfxGain, this.sfxVolume);
    }

    /**
     * Change la couleur musicale sans interrompre le gameplay.
     * Les notes déjà programmées finissent naturellement, puis le nouveau motif
     * démarre sur une grille propre.
     */
    setMusicState(state, options = {}) {
      const requested = String(state || "").toLowerCase();
      const nextState = MUSIC_STATES[requested] ? requested : "village";
      const nextIntensity = clamp(options.intensity ?? this.musicIntensity, 0, 1);
      const changed = nextState !== this.musicState;
      this.musicState = nextState;
      this.musicIntensity = nextIntensity;
      if (!changed || !this.context || !this.musicPlaying) return this.musicState;

      this.musicStep = 0;
      this.nextMusicTime = this.context.currentTime + 0.12;
      this._stopDrone();
      this._startDrone();
      return this.musicState;
    }

    setMusicIntensity(value) {
      this.musicIntensity = clamp(value, 0, 1);
      return this.musicIntensity;
    }

    getMusicState() {
      return this.musicState;
    }

    /**
     * Point d'entrée générique. Les alias français/anglais rendent le branchement
     * depuis game.js moins fragile.
     */
    play(name, options) {
      const key = String(name || "").toLowerCase().replace(/[\s_-]/g, "");
      const sounds = {
        katana: () => this.playKatana(options),
        slash: () => this.playKatana(options),
        sabre: () => this.playKatana(options),
        shot: () => this.playShot(options),
        shoot: () => this.playShot(options),
        tir: () => this.playShot(options),
        impact: () => this.playImpact(options?.material || options, options),
        hit: () => this.playImpact(options?.material || options, options),
        playerhurt: () => this.playPlayerHurt(options),
        playerdamage: () => this.playPlayerHurt(options),
        hurtplayer: () => this.playPlayerHurt(options),
        zombie: () => this.playZombie(options),
        groan: () => this.playZombie(options),
        transition: () => this.playTransition(options?.to || options),
        modechange: () => this.playTransition(options?.to || options),
        pickup: () => this.playPickup(),
        collect: () => this.playPickup(),
        parry: () => this.playCombatCue("parry", options),
        guard: () => this.playCombatCue("guard", options),
        dodge: () => this.playCombatCue("dodge", options),
        checkpoint: () => this.playCombatCue("checkpoint", options),
        door: () => this.playCombatCue("door", options),
        footstep: () => this.playFootstep(options?.surface, options),
        victoire: () => this.playVictory(),
        victory: () => this.playVictory(),
        defaite: () => this.playDefeat(),
        defeat: () => this.playDefeat(),
        death: () => this.playDefeat(),
      };

      const sound = sounds[key];
      if (!sound) return false;
      sound();
      return true;
    }

    /** Alias explicite couramment utilisé dans les moteurs de jeu. */
    playSfx(name, options) {
      return this.play(name, options);
    }

    /**
     * Route une arme modulaire vers une signature sonore de famille.
     * phase accepte swing, release et impact. Les anciens appels katana/shot
     * restent supportés.
     */
    playWeapon(family = "katana", phase = "swing", options = {}) {
      if (!this._canPlay()) return false;
      const normalized = String(family || "katana").toLowerCase().replace(/[\s_-]/g, "");
      const audioFamily = WEAPON_AUDIO_FAMILIES[normalized] || "blade";
      const action = String(phase || "swing").toLowerCase();
      if (action === "impact") return this.playImpact(options.material || "flesh", options);
      if (audioFamily === "firearm") return this.playShot(options);
      if (audioFamily === "blade") return this.playKatana(options);

      const now = this.context.currentTime;
      const destination = this._createSfxDestination(options);
      const tone = (definition) => this._tone({ destination, start: now, ...definition });
      const noise = (definition) => this._noiseBurst({ destination, start: now, ...definition });

      if (audioFamily === "bow") {
        tone({ frequency: 185, endFrequency: 112, duration: 0.18, gain: 0.16, type: "triangle" });
        tone({ frequency: 760, endFrequency: 310, duration: 0.11, gain: 0.08, type: "square" });
        noise({ duration: 0.2, gain: 0.07, type: "highpass", frequency: 1450, q: 1.1 });
      } else if (audioFamily === "throwing") {
        tone({ frequency: 1450, endFrequency: 520, duration: 0.17, gain: 0.11, type: "sine" });
        noise({ duration: 0.14, gain: 0.09, type: "highpass", frequency: 1100, q: 1.6 });
      } else if (audioFamily === "chain") {
        [0, 0.035, 0.072].forEach((delay, index) => {
          this._tone({
            destination,
            start: now + delay,
            frequency: 980 + index * 420,
            endFrequency: 620 + index * 190,
            duration: 0.1,
            gain: 0.08 - index * 0.012,
            type: "triangle",
          });
        });
        noise({ duration: 0.24, gain: 0.12, type: "bandpass", frequency: 1250, q: 2.4 });
      } else if (audioFamily === "heavy" || audioFamily === "heavyBlade") {
        tone({ frequency: 125, endFrequency: 44, duration: 0.34, gain: 0.28, type: "triangle" });
        noise({ duration: 0.3, gain: 0.25, type: "lowpass", frequency: 620, q: 0.7 });
        if (audioFamily === "heavyBlade") {
          tone({ frequency: 980, endFrequency: 310, duration: 0.21, gain: 0.1, type: "sawtooth" });
        }
      } else if (audioFamily === "wood" || audioFamily === "staff" || audioFamily === "polearm") {
        noise({ duration: 0.22, gain: 0.18, type: "bandpass", frequency: audioFamily === "wood" ? 540 : 820, q: 1.2 });
        tone({ frequency: audioFamily === "polearm" ? 680 : 310, endFrequency: 125, duration: 0.2, gain: 0.12, type: "triangle" });
      } else if (audioFamily === "metalTool") {
        tone({ frequency: 1720, endFrequency: 840, duration: 0.16, gain: 0.16, type: "triangle" });
        noise({ duration: 0.08, gain: 0.12, type: "highpass", frequency: 1280, q: 1.4 });
      } else if (audioFamily === "fan") {
        noise({ duration: 0.25, gain: 0.19, type: "highpass", frequency: 940, q: 0.8 });
        tone({ frequency: 720, endFrequency: 240, duration: 0.18, gain: 0.07, type: "sine" });
      }
      return true;
    }

    playSpatial(name, options = {}) {
      return this.play(name, options);
    }

    playFootstep(surface = "earth", options = {}) {
      if (!this._canPlay()) return false;
      const now = this.context.currentTime;
      const destination = this._createSfxDestination(options);
      const material = String(surface || "earth").toLowerCase();
      const profiles = {
        wood: { frequency: 520, gain: 0.095, type: "bandpass" },
        stone: { frequency: 960, gain: 0.08, type: "highpass" },
        tatami: { frequency: 280, gain: 0.07, type: "lowpass" },
        water: { frequency: 640, gain: 0.09, type: "bandpass" },
        earth: { frequency: 190, gain: 0.085, type: "lowpass" },
      };
      const profile = profiles[material] || profiles.earth;
      this._noiseBurst({
        start: now,
        duration: material === "water" ? 0.18 : 0.11,
        gain: profile.gain,
        type: profile.type,
        frequency: profile.frequency,
        q: 0.8,
        destination,
      });
      return true;
    }

    playCombatCue(cue = "parry", options = {}) {
      if (!this._canPlay()) return false;
      const now = this.context.currentTime;
      const destination = this._createSfxDestination(options);
      const key = String(cue || "parry").toLowerCase();
      if (key === "dodge") {
        this._noiseBurst({
          start: now,
          duration: 0.2,
          gain: 0.16,
          type: "highpass",
          frequency: 780,
          q: 0.7,
          destination,
        });
      } else if (key === "checkpoint") {
        [57, 64, 69, 72].forEach((note, index) => {
          this._tone({
            frequency: midiToHz(note),
            start: now + index * 0.07,
            duration: 0.28,
            gain: 0.105,
            type: "triangle",
            destination,
          });
        });
      } else if (key === "door") {
        this._noiseBurst({
          start: now,
          duration: 0.38,
          gain: 0.13,
          type: "bandpass",
          frequency: 260,
          q: 2.1,
          destination,
        });
        this._tone({
          frequency: 92,
          endFrequency: 48,
          start: now,
          duration: 0.34,
          gain: 0.11,
          type: "triangle",
          destination,
        });
      } else if (key === "boss-intro") {
        [0, 0.16, 0.34].forEach((delay, index) => {
          this._tone({
            frequency: 92 - index * 11,
            endFrequency: 42,
            start: now + delay,
            duration: 0.34,
            gain: 0.2 + index * 0.025,
            type: "sine",
            destination,
          });
          this._noiseBurst({
            start: now + delay,
            duration: 0.12,
            gain: 0.1 + index * 0.018,
            type: "lowpass",
            frequency: 420,
            q: 0.75,
            destination,
          });
        });
      } else {
        const perfect = key.includes("parry");
        this._tone({
          frequency: perfect ? 2350 : 1380,
          endFrequency: perfect ? 1120 : 690,
          start: now,
          duration: perfect ? 0.2 : 0.14,
          gain: perfect ? 0.22 : 0.15,
          type: "triangle",
          destination,
        });
        this._noiseBurst({
          start: now,
          duration: 0.08,
          gain: perfect ? 0.16 : 0.1,
          type: "highpass",
          frequency: perfect ? 1550 : 980,
          q: 1.5,
          destination,
        });
      }
      return true;
    }

    /** Sifflement métallique bref d'un katana. */
    playKatana(options = {}) {
      if (!this._canPlay()) return false;
      const now = this.context.currentTime;
      const destination = this._createSfxDestination(options);

      this._noiseBurst({
        start: now,
        duration: 0.16,
        gain: 0.34,
        type: "highpass",
        frequency: 1250,
        q: 1.8,
        destination,
      });
      this._tone({
        frequency: 1680,
        endFrequency: 560,
        start: now,
        duration: 0.13,
        gain: 0.16,
        type: "triangle",
        destination,
      });
      this._tone({
        frequency: 2380,
        endFrequency: 1100,
        start: now + 0.015,
        duration: 0.09,
        gain: 0.055,
        type: "sine",
        destination,
      });
      return true;
    }

    /** Détonation sèche, pensée comme un teppō à mèche plutôt qu'une arme moderne. */
    playShot(options = {}) {
      if (!this._canPlay()) return false;
      const now = this.context.currentTime;
      const destination = this._createSfxDestination(options);
      this._noiseBurst({
        start: now,
        duration: 0.24,
        gain: 0.66,
        type: "lowpass",
        frequency: 1450,
        q: 0.5,
        destination,
      });
      this._noiseBurst({
        start: now + 0.018,
        duration: 0.48,
        gain: 0.13,
        type: "bandpass",
        frequency: 520,
        q: 0.75,
        destination,
      });
      this._tone({
        frequency: 115,
        endFrequency: 42,
        start: now,
        duration: 0.22,
        gain: 0.3,
        type: "sine",
        destination,
      });
      return true;
    }

    /** Impact distinct pour la chair, l'armure ou une entité spirituelle. */
    playImpact(material = "flesh", options = {}) {
      if (!this._canPlay()) return false;
      const now = this.context.currentTime;
      const requestedMaterial =
        typeof material === "object" ? material?.material : material;
      const spatialOptions = typeof material === "object" ? material : options;
      const destination = this._createSfxDestination(spatialOptions);
      const impactMaterial = ["armor", "spirit"].includes(
        String(requestedMaterial || "flesh").toLowerCase()
      )
        ? String(requestedMaterial).toLowerCase()
        : "flesh";

      if (impactMaterial === "armor") {
        this._tone({
          frequency: 1820,
          endFrequency: 930,
          start: now,
          duration: 0.18,
          gain: 0.21,
          type: "triangle",
          destination,
        });
        this._tone({
          frequency: 2740,
          endFrequency: 1560,
          start: now + 0.008,
          duration: 0.12,
          gain: 0.1,
          type: "sine",
          destination,
        });
        this._noiseBurst({
          start: now,
          duration: 0.075,
          gain: 0.17,
          type: "highpass",
          frequency: 1320,
          q: 1.4,
          destination,
        });
        return true;
      }

      if (impactMaterial === "spirit") {
        this._tone({
          frequency: 920,
          endFrequency: 430,
          start: now,
          duration: 0.28,
          gain: 0.14,
          type: "sine",
          destination,
          attack: 0.018,
        });
        this._tone({
          frequency: 1380,
          endFrequency: 690,
          start: now + 0.025,
          duration: 0.34,
          gain: 0.08,
          type: "triangle",
          destination,
          attack: 0.03,
        });
        this._noiseBurst({
          start: now,
          duration: 0.3,
          gain: 0.1,
          type: "bandpass",
          frequency: 1180,
          q: 3.8,
          attack: 0.02,
          destination,
        });
        return true;
      }

      this._tone({
        frequency: 145,
        endFrequency: 58,
        start: now,
        duration: 0.13,
        gain: 0.28,
        type: "triangle",
        destination,
      });
      this._noiseBurst({
        start: now,
        duration: 0.1,
        gain: 0.24,
        type: "lowpass",
        frequency: 780,
        q: 0.8,
        destination,
      });
      return true;
    }

    /** Réaction synthétique courte lorsque le samouraï subit des dégâts. */
    playPlayerHurt(options = {}) {
      if (!this._canPlay()) return false;
      const now = this.context.currentTime;
      const destination = this._createSfxDestination(options);
      this._tone({
        frequency: 132,
        endFrequency: 76,
        start: now,
        duration: 0.24,
        gain: 0.2,
        type: "sawtooth",
        destination,
        attack: 0.018,
      });
      this._tone({
        frequency: 82,
        endFrequency: 48,
        start: now + 0.025,
        duration: 0.3,
        gain: 0.17,
        type: "triangle",
        destination,
        attack: 0.025,
      });
      this._noiseBurst({
        start: now,
        duration: 0.2,
        gain: 0.11,
        type: "bandpass",
        frequency: 360,
        q: 1.9,
        attack: 0.018,
        destination,
      });
      return true;
    }

    /** Gémissement synthétique avec une légère variation à chaque appel. */
    playZombie(options = {}) {
      if (!this._canPlay()) return false;
      const now = this.context.currentTime;
      const destination = this._createSfxDestination(options);
      const variation = 0.88 + Math.random() * 0.24;
      const duration = 0.66 + Math.random() * 0.24;

      this._tone({
        frequency: 105 * variation,
        endFrequency: 68 * variation,
        start: now,
        duration,
        gain: 0.21,
        type: "sawtooth",
        destination,
        attack: 0.075,
      });
      this._tone({
        frequency: 164 * variation,
        endFrequency: 118 * variation,
        start: now + 0.04,
        duration: duration * 0.88,
        gain: 0.105,
        type: "square",
        destination,
        attack: 0.11,
      });
      this._noiseBurst({
        start: now + 0.02,
        duration: duration,
        gain: 0.075,
        type: "bandpass",
        frequency: 430 * variation,
        q: 3.6,
        attack: 0.09,
        destination,
      });
      return true;
    }

    /** Balayage sonore indiquant clairement le passage 2D <-> FPS. */
    playTransition(targetMode = "fps") {
      if (!this._canPlay()) return false;
      const now = this.context.currentTime;
      const toFps = String(targetMode).toLowerCase() !== "2d";
      const notes = toFps ? [330, 440, 660] : [660, 440, 330];

      notes.forEach((frequency, index) => {
        this._tone({
          frequency,
          endFrequency: frequency * (toFps ? 1.12 : 0.88),
          start: now + index * 0.065,
          duration: 0.18,
          gain: 0.115 - index * 0.018,
          type: index === 1 ? "square" : "triangle",
          destination: this.sfxGain,
        });
      });
      this._noiseBurst({
        start: now,
        duration: 0.24,
        gain: 0.075,
        type: "bandpass",
        frequency: toFps ? 1250 : 720,
        q: 1.3,
      });
      return true;
    }

    /** Petit arpège pentatonique pour les objets ramassés. */
    playPickup() {
      if (!this._canPlay()) return false;
      const now = this.context.currentTime;
      [69, 72, 76].forEach((note, index) => {
        this._tone({
          frequency: midiToHz(note),
          start: now + index * 0.055,
          duration: 0.15,
          gain: 0.12,
          type: "square",
          destination: this.sfxGain,
        });
      });
      return true;
    }

    /** Cadence courte et noble, sans couvrir l'écran de fin. */
    playVictory() {
      if (!this._canPlay()) return false;
      const now = this.context.currentTime;
      [57, 60, 64, 69].forEach((note, index) => {
        this._tone({
          frequency: midiToHz(note),
          start: now + index * 0.14,
          duration: index === 3 ? 0.65 : 0.26,
          gain: index === 3 ? 0.17 : 0.13,
          type: index === 3 ? "triangle" : "square",
          destination: this.sfxGain,
        });
      });
      return true;
    }

    /** Descente grave et inquiétante pour la défaite. */
    playDefeat() {
      if (!this._canPlay()) return false;
      const now = this.context.currentTime;
      [57, 53, 50, 45].forEach((note, index) => {
        this._tone({
          frequency: midiToHz(note),
          endFrequency: midiToHz(note) * 0.92,
          start: now + index * 0.17,
          duration: index === 3 ? 0.85 : 0.28,
          gain: 0.13,
          type: "sawtooth",
          destination: this.sfxGain,
        });
      });
      return true;
    }

    /** Libère les ressources lors d'un changement complet de page/scène. */
    async destroy() {
      this.stopMusic();
      this.unbindUnlockGestures();
      this._spatialNodes.forEach((entry) => {
        global.clearTimeout(entry.timer);
        entry.nodes.forEach((node) => {
          try { node.disconnect(); } catch (_error) { /* Déjà libéré. */ }
        });
      });
      this._spatialNodes.clear();
      if (this.context && this.context.state !== "closed") {
        await this.context.close();
      }
      this.context = null;
      this.unlocked = false;
    }

    // ---------------------------------------------------------------------
    // Construction du graphe Web Audio
    // ---------------------------------------------------------------------

    _ensureContext() {
      if (this.context) return;
      this.context = new AudioContextClass();

      this.masterGain = this.context.createGain();
      this.musicGain = this.context.createGain();
      this.sfxGain = this.context.createGain();
      this.compressor = this.context.createDynamicsCompressor();

      // Le compresseur évite les crêtes quand plusieurs zombies/impacts jouent.
      this.compressor.threshold.value = -12;
      this.compressor.knee.value = 18;
      this.compressor.ratio.value = 5;
      this.compressor.attack.value = 0.003;
      this.compressor.release.value = 0.19;

      this.musicGain.gain.value = this.musicVolume;
      this.sfxGain.gain.value = this.sfxVolume;
      this.masterGain.gain.value = this.muted ? 0 : this.masterVolume;

      this.musicGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.compressor);
      this.compressor.connect(this.context.destination);

      this.noiseBuffer = this._createNoiseBuffer(1.5);
    }

    _canPlay() {
      return Boolean(
        this.supported &&
          this.unlocked &&
          this.context &&
          this.context.state === "running"
      );
    }

    _applyMasterVolume(immediate = false) {
      if (!this.masterGain || !this.context) return;
      const now = this.context.currentTime;
      const target = this.muted ? 0 : this.masterVolume;
      const param = this.masterGain.gain;
      param.cancelScheduledValues(now);
      param.setValueAtTime(Math.max(0, param.value), now);
      if (immediate) param.setValueAtTime(target, now);
      else param.linearRampToValueAtTime(target, now + 0.025);
    }

    _setBusVolume(bus, volume) {
      if (!bus || !this.context) return;
      const now = this.context.currentTime;
      bus.gain.cancelScheduledValues(now);
      bus.gain.setValueAtTime(bus.gain.value, now);
      bus.gain.linearRampToValueAtTime(volume, now + 0.025);
    }

    /**
     * Crée une petite chaîne spatiale temporaire pour les sons FPS.
     * options.pan va de -1 (gauche) à 1 (droite), distance est exprimée en
     * cellules de carte et occluded assombrit un son derrière un mur.
     */
    _createSfxDestination(options = {}) {
      if (!this.context || !this.sfxGain || !options || typeof options !== "object") {
        return this.sfxGain;
      }
      const hasSpatialData =
        Number.isFinite(Number(options.pan))
        || Number.isFinite(Number(options.distance))
        || Boolean(options.occluded);
      if (!hasSpatialData) return this.sfxGain;

      const input = this.context.createGain();
      const nodes = [input];
      const distance = Math.max(0, Number(options.distance) || 0);
      const attenuation = clamp(1 / (1 + Math.pow(distance * 0.24, 1.35)), 0.12, 1);
      input.gain.value = attenuation * (options.occluded ? 0.58 : 1);
      let tail = input;

      if (options.occluded) {
        const filter = this.context.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 720;
        filter.Q.value = 0.65;
        tail.connect(filter);
        tail = filter;
        nodes.push(filter);
      }

      if (typeof this.context.createStereoPanner === "function") {
        const panner = this.context.createStereoPanner();
        panner.pan.value = clamp(options.pan ?? 0, -1, 1);
        tail.connect(panner);
        tail = panner;
        nodes.push(panner);
      }

      tail.connect(this.sfxGain);
      const entry = { nodes, timer: null };
      entry.timer = global.setTimeout(() => {
        entry.nodes.forEach((node) => {
          try { node.disconnect(); } catch (_error) { /* Déjà libéré. */ }
        });
        this._spatialNodes.delete(entry);
      }, 2200);
      this._spatialNodes.add(entry);
      return input;
    }

    _createNoiseBuffer(seconds) {
      const length = Math.ceil(this.context.sampleRate * seconds);
      const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
      const channel = buffer.getChannelData(0);
      let previous = 0;

      // Bruit légèrement corrélé : moins agressif que du blanc pur en boucle.
      for (let i = 0; i < length; i += 1) {
        const white = Math.random() * 2 - 1;
        previous = previous * 0.17 + white * 0.83;
        channel[i] = previous;
      }
      return buffer;
    }

    /** Crée une note avec enveloppe et arrêt automatique. */
    _tone({
      frequency,
      endFrequency = frequency,
      start,
      duration,
      gain,
      type = "square",
      destination,
      attack = 0.008,
    }) {
      const oscillator = this.context.createOscillator();
      const envelope = this.context.createGain();
      const safeStart = Math.max(this.context.currentTime, start);
      const end = safeStart + Math.max(0.025, duration);

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(Math.max(20, frequency), safeStart);
      oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(20, endFrequency),
        end
      );

      envelope.gain.setValueAtTime(EPSILON, safeStart);
      envelope.gain.exponentialRampToValueAtTime(
        Math.max(EPSILON, gain),
        safeStart + Math.min(attack, duration * 0.35)
      );
      envelope.gain.exponentialRampToValueAtTime(EPSILON, end);

      oscillator.connect(envelope);
      envelope.connect(destination);
      oscillator.start(safeStart);
      oscillator.stop(end + 0.02);
      oscillator.addEventListener("ended", () => {
        oscillator.disconnect();
        envelope.disconnect();
      });
    }

    /** Crée un bruit filtré avec enveloppe et arrêt automatique. */
    _noiseBurst({
      start,
      duration,
      gain,
      type = "bandpass",
      frequency = 900,
      q = 1,
      attack = 0.004,
      destination = this.sfxGain,
    }) {
      const source = this.context.createBufferSource();
      const filter = this.context.createBiquadFilter();
      const envelope = this.context.createGain();
      const safeStart = Math.max(this.context.currentTime, start);
      const end = safeStart + Math.max(0.025, duration);

      source.buffer = this.noiseBuffer;
      filter.type = type;
      filter.frequency.setValueAtTime(frequency, safeStart);
      filter.Q.value = q;
      envelope.gain.setValueAtTime(EPSILON, safeStart);
      envelope.gain.exponentialRampToValueAtTime(
        Math.max(EPSILON, gain),
        safeStart + Math.min(attack, duration * 0.3)
      );
      envelope.gain.exponentialRampToValueAtTime(EPSILON, end);

      source.connect(filter);
      filter.connect(envelope);
      envelope.connect(destination);
      source.start(safeStart);
      source.stop(end + 0.02);
      source.addEventListener("ended", () => {
        source.disconnect();
        filter.disconnect();
        envelope.disconnect();
      });
    }

    // ---------------------------------------------------------------------
    // Musique chiptune « Japon féodal horrifique »
    // ---------------------------------------------------------------------

    _startMusicNow() {
      if (this.musicPlaying || !this._canPlay()) return;
      this.musicPlaying = true;
      this.musicStep = 0;
      this.nextMusicTime = this.context.currentTime + 0.055;
      this._startDrone();
      this._scheduleMusic();
      this.musicTimer = global.setInterval(() => this._scheduleMusic(), 90);
    }

    _scheduleMusic() {
      if (!this.musicPlaying || !this.context || this.context.state !== "running") return;
      const lookAhead = this.context.currentTime + 0.22;
      const profile = MUSIC_STATES[this.musicState] || MUSIC_STATES.village;
      const stepDuration = 60 / profile.bpm / 2;
      const melody = profile.melody;

      while (this.nextMusicTime < lookAhead) {
        const index = this.musicStep % melody.length;
        const note = melody[index];
        if (note !== null) {
          this._tone({
            frequency: midiToHz(note),
            start: this.nextMusicTime,
            duration: stepDuration * 0.62,
            gain: (index % 8 === 0 ? 0.054 : 0.035) * (0.78 + this.musicIntensity * 0.28),
            type: profile.voice,
            destination: this.musicGain,
            attack: 0.012,
          });
        }

        if (index % profile.pulseEvery === 0) {
          this._tone({
            frequency: index % (profile.pulseEvery * 2) === 0 ? profile.drone[0] * 1.34 : profile.drone[1],
            endFrequency: profile.drone[0],
            start: this.nextMusicTime,
            duration: this.musicState === "boss" ? 0.28 : 0.42,
            gain: profile.pulseGain * (0.72 + this.musicIntensity * 0.52),
            type: "sine",
            destination: this.musicGain,
            attack: 0.008,
          });
          this._noiseBurst({
            start: this.nextMusicTime,
            duration: 0.085,
            gain: profile.pulseGain * 0.42,
            type: "lowpass",
            frequency: this.musicState === "boss" ? 520 : 360,
            q: 0.8,
            destination: this.musicGain,
          });
        }

        this.musicStep += 1;
        this.nextMusicTime += stepDuration;
      }
    }

    _startDrone() {
      if (this.droneNodes.length || !this.context) return;
      const now = this.context.currentTime;
      const profile = MUSIC_STATES[this.musicState] || MUSIC_STATES.village;
      const droneGain = this.context.createGain();
      const filter = this.context.createBiquadFilter();
      const low = this.context.createOscillator();
      const fifth = this.context.createOscillator();

      low.type = "triangle";
      fifth.type = "sine";
      low.frequency.value = profile.drone[0];
      fifth.frequency.value = profile.drone[1];
      fifth.detune.value = -7;
      filter.type = "lowpass";
      filter.frequency.value = this.musicState === "boss" ? 320 : 230;
      filter.Q.value = 0.7;
      droneGain.gain.setValueAtTime(EPSILON, now);
      droneGain.gain.exponentialRampToValueAtTime(profile.droneGain, now + 1.2);

      low.connect(filter);
      fifth.connect(filter);
      filter.connect(droneGain);
      droneGain.connect(this.musicGain);
      low.start(now);
      fifth.start(now);
      this.droneNodes = [low, fifth, filter, droneGain];
    }

    _stopDrone() {
      if (!this.droneNodes.length || !this.context) return;
      const [low, fifth, filter, droneGain] = this.droneNodes;
      const now = this.context.currentTime;
      droneGain.gain.cancelScheduledValues(now);
      droneGain.gain.setValueAtTime(Math.max(EPSILON, droneGain.gain.value), now);
      droneGain.gain.exponentialRampToValueAtTime(EPSILON, now + 0.24);
      low.stop(now + 0.27);
      fifth.stop(now + 0.27);
      global.setTimeout(() => {
        low.disconnect();
        fifth.disconnect();
        filter.disconnect();
        droneGain.disconnect();
      }, 360);
      this.droneNodes = [];
    }

    _readStoredMute() {
      try {
        return global.localStorage?.getItem("feudal-horror-muted") === "1";
      } catch (_error) {
        return false;
      }
    }

    _storeMute() {
      try {
        global.localStorage?.setItem("feudal-horror-muted", this.muted ? "1" : "0");
      } catch (_error) {
        // Certains modes privés interdisent localStorage : le son reste fonctionnel.
      }
    }
  }

  global.FeudalHorrorAudio = FeudalHorrorAudio;
  global.gameAudio = global.gameAudio || new FeudalHorrorAudio();
})(typeof window !== "undefined" ? window : globalThis);
