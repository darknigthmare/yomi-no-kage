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
     * Point d'entrée générique. Les alias français/anglais rendent le branchement
     * depuis game.js moins fragile.
     */
    play(name, options) {
      const key = String(name || "").toLowerCase().replace(/[\s_-]/g, "");
      const sounds = {
        katana: () => this.playKatana(),
        slash: () => this.playKatana(),
        sabre: () => this.playKatana(),
        shot: () => this.playShot(),
        shoot: () => this.playShot(),
        tir: () => this.playShot(),
        impact: () => this.playImpact(),
        hit: () => this.playImpact(),
        zombie: () => this.playZombie(),
        groan: () => this.playZombie(),
        transition: () => this.playTransition(options?.to || options),
        modechange: () => this.playTransition(options?.to || options),
        pickup: () => this.playPickup(),
        collect: () => this.playPickup(),
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

    /** Sifflement métallique bref d'un katana. */
    playKatana() {
      if (!this._canPlay()) return false;
      const now = this.context.currentTime;
      const destination = this.sfxGain;

      this._noiseBurst({
        start: now,
        duration: 0.16,
        gain: 0.34,
        type: "highpass",
        frequency: 1250,
        q: 1.8,
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
    playShot() {
      if (!this._canPlay()) return false;
      const now = this.context.currentTime;
      this._noiseBurst({
        start: now,
        duration: 0.24,
        gain: 0.66,
        type: "lowpass",
        frequency: 1450,
        q: 0.5,
      });
      this._noiseBurst({
        start: now + 0.018,
        duration: 0.48,
        gain: 0.13,
        type: "bandpass",
        frequency: 520,
        q: 0.75,
      });
      this._tone({
        frequency: 115,
        endFrequency: 42,
        start: now,
        duration: 0.22,
        gain: 0.3,
        type: "sine",
        destination: this.sfxGain,
      });
      return true;
    }

    /** Coup sourd utilisable sur ennemi, porte ou décor. */
    playImpact() {
      if (!this._canPlay()) return false;
      const now = this.context.currentTime;
      this._tone({
        frequency: 145,
        endFrequency: 58,
        start: now,
        duration: 0.13,
        gain: 0.28,
        type: "triangle",
        destination: this.sfxGain,
      });
      this._noiseBurst({
        start: now,
        duration: 0.1,
        gain: 0.24,
        type: "lowpass",
        frequency: 780,
        q: 0.8,
      });
      return true;
    }

    /** Gémissement synthétique avec une légère variation à chaque appel. */
    playZombie() {
      if (!this._canPlay()) return false;
      const now = this.context.currentTime;
      const variation = 0.88 + Math.random() * 0.24;
      const duration = 0.66 + Math.random() * 0.24;

      this._tone({
        frequency: 105 * variation,
        endFrequency: 68 * variation,
        start: now,
        duration,
        gain: 0.21,
        type: "sawtooth",
        destination: this.sfxGain,
        attack: 0.075,
      });
      this._tone({
        frequency: 164 * variation,
        endFrequency: 118 * variation,
        start: now + 0.04,
        duration: duration * 0.88,
        gain: 0.105,
        type: "square",
        destination: this.sfxGain,
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
      const stepDuration = 60 / 86 / 2; // croches lentes, ambiance discrète

      // Motif inspiré de la gamme hirajōshi en La : A, B, C, E, F.
      // Les silences laissent respirer les bruitages et le gameplay.
      const melody = [
        69, null, 72, null, 71, null, 69, null,
        64, null, 65, null, 64, null, null, null,
        69, null, 72, null, 76, null, 72, null,
        71, null, 69, null, 65, null, 64, null,
      ];

      while (this.nextMusicTime < lookAhead) {
        const index = this.musicStep % melody.length;
        const note = melody[index];
        if (note !== null) {
          this._tone({
            frequency: midiToHz(note),
            start: this.nextMusicTime,
            duration: stepDuration * 0.62,
            gain: index % 8 === 0 ? 0.055 : 0.037,
            type: "square",
            destination: this.musicGain,
            attack: 0.012,
          });
        }

        // Pulsation grave de taiko synthétique, très en retrait.
        if (index % 8 === 0) {
          this._tone({
            frequency: index % 16 === 0 ? 73.42 : 82.41,
            endFrequency: 48,
            start: this.nextMusicTime,
            duration: 0.42,
            gain: 0.045,
            type: "sine",
            destination: this.musicGain,
            attack: 0.008,
          });
          this._noiseBurst({
            start: this.nextMusicTime,
            duration: 0.085,
            gain: 0.018,
            type: "lowpass",
            frequency: 360,
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
      const droneGain = this.context.createGain();
      const filter = this.context.createBiquadFilter();
      const low = this.context.createOscillator();
      const fifth = this.context.createOscillator();

      low.type = "triangle";
      fifth.type = "sine";
      low.frequency.value = 55;
      fifth.frequency.value = 82.41;
      fifth.detune.value = -7;
      filter.type = "lowpass";
      filter.frequency.value = 230;
      filter.Q.value = 0.7;
      droneGain.gain.setValueAtTime(EPSILON, now);
      droneGain.gain.exponentialRampToValueAtTime(0.026, now + 1.8);

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
