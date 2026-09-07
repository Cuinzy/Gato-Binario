/**
 * audio.js — Sistema de sonido del juego.
 *
 * Funciona SIN archivos de audio: todos los efectos y la música son
 * sintetizados con la Web Audio API (chiptune). Si más adelante se colocan
 * archivos en `assets/audio/sfx/<nombre>.mp3` o `assets/audio/music/<track>.mp3`,
 * el sistema los usa automáticamente en lugar de la versión sintetizada
 * (ver FILE_SFX / FILE_MUSIC).
 */
import { state, setSetting } from './storage.js';

/**
 * Los archivos reales se declaran en `assets/audio/manifest.json`:
 *   { "sfx": { "coin": "assets/audio/sfx/coin.mp3" },
 *     "music": { "menu": "assets/audio/music/menu.mp3" } }
 * Lo que no esté declarado se sintetiza. Así no se piden archivos inexistentes.
 */
const AUDIO_MANIFEST = 'assets/audio/manifest.json';

let ctx = null;
let masterSfx = null;
let masterMusic = null;
const buffers = new Map();      // nombre -> AudioBuffer (archivos reales)
const fileMusic = new Map();    // track -> HTMLAudioElement

export const audio = {
  get sfxOn() { return state.settings.sfx; },
  get musicOn() { return state.settings.music; },
  currentTrack: null,
};

// ---------------------------------------------------------------------------
// INICIALIZACIÓN (los navegadores exigen un gesto del usuario)
// ---------------------------------------------------------------------------
export function initAudio() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  masterSfx = ctx.createGain();
  masterSfx.gain.value = 0.5;
  masterSfx.connect(ctx.destination);
  masterMusic = ctx.createGain();
  masterMusic.gain.value = 0.22;
  masterMusic.connect(ctx.destination);
  loadOptionalFiles();
  return ctx;
}

/** Carga los archivos declarados en el manifiesto (si los hay). */
async function loadOptionalFiles() {
  let man;
  try {
    const res = await fetch(AUDIO_MANIFEST);
    if (!res.ok) return;
    man = await res.json();
  } catch { return; }

  for (const [name, url] of Object.entries(man.sfx || {})) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      buffers.set(name, await ctx.decodeAudioData(await res.arrayBuffer()));
    } catch { /* sigue con el sintetizador */ }
  }
  for (const [track, url] of Object.entries(man.music || {})) {
    const a = new Audio(url);
    a.loop = true;
    a.volume = 0.35;
    fileMusic.set(track, a);
  }
}

export function resumeAudio() {
  if (!ctx) initAudio();
  if (ctx && ctx.state === 'suspended') ctx.resume();
}

// ---------------------------------------------------------------------------
// SINTETIZADOR DE EFECTOS
// ---------------------------------------------------------------------------
/** Crea un oscilador con envolvente ADSR simplificada. */
function tone({ freq = 440, type = 'square', dur = 0.12, vol = 0.3, slideTo = null,
                attack = 0.005, decay = null, delay = 0, filter = null }) {
  if (!ctx) return;
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);

  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + (decay || dur));

  let node = osc;
  if (filter) {
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = filter;
    node.connect(f); node = f;
  }
  node.connect(gain).connect(masterSfx);
  osc.start(t0);
  osc.stop(t0 + (decay || dur) + 0.05);
}

/** Ruido blanco corto (para golpes y errores). */
function noise({ dur = 0.12, vol = 0.22, delay = 0, freq = 1200 }) {
  if (!ctx) return;
  const t0 = ctx.currentTime + delay;
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = 'bandpass'; f.frequency.value = freq;
  const g = ctx.createGain(); g.gain.value = vol;
  src.connect(f).connect(g).connect(masterSfx);
  src.start(t0);
}

/** Recetas de cada efecto sintetizado. */
const SYNTH = {
  click:   () => tone({ freq: 720, type: 'square', dur: 0.05, vol: 0.16 }),
  type:    () => tone({ freq: 1400 + Math.random() * 400, type: 'square', dur: 0.02, vol: 0.05 }),
  step:    () => tone({ freq: 240, type: 'triangle', dur: 0.07, vol: 0.14, slideTo: 180 }),
  jump:    () => tone({ freq: 320, type: 'square', dur: 0.18, vol: 0.2, slideTo: 760 }),
  coin:    () => { tone({ freq: 988, type: 'square', dur: 0.07, vol: 0.2 }); tone({ freq: 1319, type: 'square', dur: 0.13, vol: 0.2, delay: 0.07 }); },
  xp:      () => { tone({ freq: 660, type: 'triangle', dur: 0.08, vol: 0.16 }); tone({ freq: 880, type: 'triangle', dur: 0.1, vol: 0.16, delay: 0.06 }); tone({ freq: 1320, type: 'triangle', dur: 0.14, vol: 0.14, delay: 0.12 }); },
  success: () => [523, 659, 784, 1047].forEach((f, i) => tone({ freq: f, type: 'square', dur: 0.16, vol: 0.2, delay: i * 0.075 })),
  unlock:  () => [392, 523, 659].forEach((f, i) => tone({ freq: f, type: 'triangle', dur: 0.2, vol: 0.18, delay: i * 0.09 })),
  error:   () => { tone({ freq: 200, type: 'sawtooth', dur: 0.22, vol: 0.22, slideTo: 90 }); noise({ dur: 0.16, vol: 0.12, freq: 400 }); },
  hit:     () => { noise({ dur: 0.2, vol: 0.26, freq: 300 }); tone({ freq: 140, type: 'square', dur: 0.16, vol: 0.2, slideTo: 60 }); },
  levelup: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone({ freq: f, type: 'square', dur: 0.22, vol: 0.22, delay: i * 0.09 })),
  boss:    () => { tone({ freq: 110, type: 'sawtooth', dur: 0.8, vol: 0.26, slideTo: 55, filter: 800 }); noise({ dur: 0.5, vol: 0.14, freq: 200 }); },
};

/** Reproduce un efecto por nombre. */
export function sfx(name) {
  if (!state.settings.sfx) return;
  resumeAudio();
  if (!ctx) return;
  const buf = buffers.get(name);
  if (buf) {
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(masterSfx);
    src.start();
    return;
  }
  SYNTH[name]?.();
}

// ---------------------------------------------------------------------------
// MÚSICA PROCEDURAL (chiptune)
// ---------------------------------------------------------------------------
const NOTE = n => 440 * Math.pow(2, (n - 69) / 12); // MIDI -> Hz

/** Cada pista: escala, bajo, patrón de arpegio y tempo. */
const TRACKS = {
  menu:    { bpm: 96,  bass: [45, 45, 50, 52], arp: [69, 72, 76, 79, 76, 72], lead: 'triangle', bassType: 'square', gain: 0.16 },
  level:   { bpm: 112, bass: [40, 40, 45, 43], arp: [64, 67, 71, 74, 71, 67], lead: 'square', bassType: 'triangle', gain: 0.13 },
  boss:    { bpm: 138, bass: [33, 33, 34, 32], arp: [57, 60, 63, 66, 63, 60], lead: 'sawtooth', bassType: 'sawtooth', gain: 0.15 },
  victory: { bpm: 120, bass: [48, 52, 55, 60], arp: [72, 76, 79, 84, 79, 76], lead: 'triangle', bassType: 'square', gain: 0.18 },
};

let musicTimer = null;
let musicStep = 0;
let musicGain = null;

function scheduleMusicStep(track) {
  if (!ctx || !state.settings.music) return;
  const T = TRACKS[track];
  const t = ctx.currentTime + 0.02;
  const beat = 60 / T.bpm / 2; // corcheas

  // Bajo cada 4 pasos
  if (musicStep % 4 === 0) {
    const n = T.bass[(musicStep / 4) % T.bass.length];
    playMusicNote(NOTE(n), T.bassType, beat * 3.6, T.gain * 0.9, t, 600);
  }
  // Arpegio en cada paso
  const a = T.arp[musicStep % T.arp.length];
  playMusicNote(NOTE(a), T.lead, beat * 0.85, T.gain * 0.55, t, 3000);
  // Acento cada 8 pasos
  if (musicStep % 8 === 7) {
    playMusicNote(NOTE(T.arp[0] + 12), T.lead, beat * 1.4, T.gain * 0.4, t, 4000);
  }
  musicStep++;
}

function playMusicNote(freq, type, dur, vol, t0, cutoff) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  const f = ctx.createBiquadFilter();
  osc.type = type;
  osc.frequency.value = freq;
  f.type = 'lowpass'; f.frequency.value = cutoff;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(f).connect(g).connect(musicGain || masterMusic);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

/** Cambia la pista de fondo (menu | level | boss | victory). */
export function playMusic(track) {
  if (audio.currentTrack === track) return;
  stopMusic();
  audio.currentTrack = track;
  if (!state.settings.music) return;
  resumeAudio();
  if (!ctx) return;

  // Si existe un archivo real, usarlo
  const fileTrack = fileMusic.get(track);
  if (fileTrack) { fileTrack.currentTime = 0; fileTrack.play().catch(() => {}); return; }

  musicGain = ctx.createGain();
  musicGain.gain.value = 1;
  musicGain.connect(masterMusic);
  musicStep = 0;
  const T = TRACKS[track] || TRACKS.menu;
  const interval = (60 / T.bpm / 2) * 1000;
  scheduleMusicStep(track);
  musicTimer = setInterval(() => scheduleMusicStep(track), interval);
}

export function stopMusic() {
  if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
  fileMusic.forEach(a => { a.pause(); });
  if (musicGain) { try { musicGain.disconnect(); } catch {} musicGain = null; }
  audio.currentTrack = null;
}

// ---------------------------------------------------------------------------
// INTERRUPTORES
// ---------------------------------------------------------------------------
export function toggleSfx(force) {
  const v = force === undefined ? !state.settings.sfx : force;
  setSetting('sfx', v);
  if (v) sfx('click');
  return v;
}

export function toggleMusic(force) {
  const v = force === undefined ? !state.settings.music : force;
  setSetting('music', v);
  if (!v) { const t = audio.currentTrack; stopMusic(); audio.currentTrack = t; }
  else { const t = audio.currentTrack || 'menu'; audio.currentTrack = null; playMusic(t); }
  return v;
}
