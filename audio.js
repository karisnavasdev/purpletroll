/* ============================================================
   Dadcoin — audio engine
   - Web Audio: synthesized SFX (no asset files)
   - Web Speech: voice lines (browser TTS, fatherly voice if available)
   ============================================================ */

(() => {
  'use strict';

  let ac = null;
  let masterGain = null;

  function ctx() {
    if (ac) return ac;
    ac = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ac.createGain();
    masterGain.gain.value = 0.42;
    masterGain.connect(ac.destination);
    return ac;
  }

  // resume on first user gesture (autoplay policy)
  function unlock() {
    const c = ctx();
    if (c.state === 'suspended') c.resume();
  }
  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('keydown', unlock, { once: true });

  function env(node, t0, attack, decay, sustain, release, peak = 1) {
    const g = node.gain;
    g.cancelScheduledValues(t0);
    g.setValueAtTime(0, t0);
    g.linearRampToValueAtTime(peak, t0 + attack);
    g.linearRampToValueAtTime(sustain, t0 + attack + decay);
    g.linearRampToValueAtTime(0, t0 + attack + decay + release);
  }

  function tone(freq, dur, type = 'sine', { peak = .6, attack = .005, decay = .05, release = .1 } = {}) {
    const c = ctx();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = freq;
    o.connect(g).connect(masterGain);
    const t0 = c.currentTime;
    env(g, t0, attack, decay, peak * .6, release, peak);
    o.start(t0);
    o.stop(t0 + dur + release + .05);
  }

  function noise(dur, { peak = .35, lp = 1200, hp = 200, attack = .005, decay = .05, release = .15 } = {}) {
    const c = ctx();
    const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf;
    const lpf = c.createBiquadFilter(); lpf.type = 'lowpass';  lpf.frequency.value = lp;
    const hpf = c.createBiquadFilter(); hpf.type = 'highpass'; hpf.frequency.value = hp;
    const g = c.createGain();
    src.connect(hpf).connect(lpf).connect(g).connect(masterGain);
    const t0 = c.currentTime;
    env(g, t0, attack, decay, peak * .5, release, peak);
    src.start(t0);
    src.stop(t0 + dur + release + .05);
  }

  function freqSweep(f0, f1, dur, type = 'square', peak = .4) {
    const c = ctx();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(Math.max(40, f1), c.currentTime + dur);
    o.connect(g).connect(masterGain);
    const t0 = c.currentTime;
    env(g, t0, .005, .04, peak * .6, dur, peak);
    o.start(t0);
    o.stop(t0 + dur + .1);
  }

  // ---- specific sound effects ----

  const SFX = {
    click() {
      tone(1200, .03, 'square', { peak: .25, release: .04 });
    },
    coin() {
      tone(987.77, .07, 'square', { peak: .35, release: .04 });
      setTimeout(() => tone(1318.51, .12, 'square', { peak: .35, release: .08 }), 70);
    },
    cha_ching() {
      // briefcase opens → coins
      [0, 80, 160, 240, 320].forEach((d, i) => {
        setTimeout(() => tone(880 + i * 110, .08, 'square', { peak: .25, release: .05 }), d);
      });
    },
    boombox() {
      // 4-note funky bass groove
      const notes = [110, 130.81, 146.83, 110];
      notes.forEach((f, i) => setTimeout(() => {
        tone(f, .14, 'sawtooth', { peak: .35, release: .08 });
        tone(f * 2, .14, 'square', { peak: .12, release: .08 });
      }, i * 160));
      setTimeout(() => noise(.05, { peak: .15, hp: 4000, lp: 8000 }), 80);
    },
    arcade_start() {
      // classic chiptune "PRESS START" jingle
      [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
        setTimeout(() => tone(f, .08, 'square', { peak: .3, release: .06 }), i * 70);
      });
    },
    camera_shutter() {
      noise(.08, { peak: .4, hp: 1500, lp: 6000, decay: .02, release: .05 });
      setTimeout(() => noise(.06, { peak: .25, hp: 2000, lp: 5000 }), 90);
    },
    lawnmower() {
      const c = ctx();
      // low rumbling engine
      const o1 = c.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = 80;
      const o2 = c.createOscillator(); o2.type = 'square';   o2.frequency.value = 160;
      const lfo = c.createOscillator(); lfo.frequency.value = 14;
      const lfoGain = c.createGain(); lfoGain.gain.value = 24;
      lfo.connect(lfoGain).connect(o1.frequency);
      const g = c.createGain();
      o1.connect(g); o2.connect(g); g.connect(masterGain);
      const t0 = c.currentTime;
      env(g, t0, .04, .1, .25, .9, .35);
      o1.start(t0); o2.start(t0); lfo.start(t0);
      o1.stop(t0 + 1.1); o2.stop(t0 + 1.1); lfo.stop(t0 + 1.1);
    },
    lightbulb_click() {
      tone(140, .05, 'square', { peak: .3, release: .04 });
      setTimeout(() => tone(380, .03, 'square', { peak: .15, release: .03 }), 40);
    },
    tire_thud() {
      tone(80, .12, 'sine', { peak: .55, release: .1 });
      noise(.08, { peak: .2, hp: 80, lp: 800 });
    },
    tools_clank() {
      noise(.06, { peak: .35, hp: 2000, lp: 6000 });
      setTimeout(() => tone(440, .08, 'triangle', { peak: .25, release: .06 }), 30);
    },
    tshirt_woo() {
      // crowd cheer
      noise(.5, { peak: .3, hp: 800, lp: 3500 });
      [220, 277.18, 329.63].forEach((f, i) => setTimeout(() =>
        tone(f, .12, 'sawtooth', { peak: .25, release: .09 }), i * 90));
    },
    rim_shot() {
      // ba dum tss
      tone(180, .08, 'sine', { peak: .5, release: .06 });
      setTimeout(() => tone(180, .08, 'sine', { peak: .5, release: .06 }), 130);
      setTimeout(() => noise(.45, { peak: .35, hp: 4000, lp: 12000, attack: .002, decay: .02, release: .4 }), 280);
    },
    laugh() {
      // warm chuckle: 3 quick descending sines
      [330, 294, 262].forEach((f, i) => setTimeout(() =>
        tone(f, .1, 'sine', { peak: .25, release: .07 }), i * 90));
    },
    buy_pop() {
      tone(660, .05, 'square', { peak: .3, release: .05 });
      setTimeout(() => tone(880, .08, 'square', { peak: .35, release: .07 }), 60);
      setTimeout(() => tone(1318, .1, 'square', { peak: .3, release: .1 }), 130);
    },
    door_roll() {
      // garage door rolling up — slow whoosh
      noise(.6, { peak: .25, hp: 200, lp: 1500, attack: .1, decay: .2, release: .3 });
    },
    water() {
      // soft river / lake-lapping sound: filtered brown-ish noise + a few "plinks"
      noise(2.0, { peak: .35, hp: 60, lp: 700, attack: .15, decay: .25, release: 1.4 });
      // bubbly plinks
      [180, 280, 420, 320, 250].forEach((delay, i) => {
        setTimeout(() => tone(700 + Math.random() * 1100, .035, 'sine',
                              { peak: .14, attack: .002, decay: .005, release: .04 }),
                   delay + i * 80);
      });
    },
  };

  // ---- voice lines (Web Speech) ----
  let voicePref = null;
  function pickVoice() {
    if (voicePref) return voicePref;
    const list = speechSynthesis.getVoices();
    if (!list.length) return null;
    // strongly prefer a deep adult male English voice — dad voice, not kid
    const score = v => {
      let s = 0;
      const n = v.name || '';
      // hard penalties for kid / female / cartoon voices
      if (/child|kid|junior|baby|young/i.test(n)) s -= 100;
      if (/female|woman|girl|samantha|victoria|allison|karen|tessa|moira|fiona|veena|zira|hazel|catherine|susan|hera/i.test(n)) s -= 50;
      // bonuses for common deep male names
      if (/male/i.test(n)) s += 5;
      if (/david|mark|guy|alex|daniel|fred|tom|james|george|aaron|arthur|brian|matthew|ryan|paul|gordon/i.test(n)) s += 8;
      // major TTS engines tend to be highest quality
      if (/google/i.test(n)) s += 3;
      if (/microsoft/i.test(n)) s += 2;
      if (/apple|natural|enhanced|premium/i.test(n)) s += 4;
      return s;
    };
    const ranked = list
      .filter(v => /^en/i.test(v.lang || ''))
      .sort((a, b) => score(b) - score(a));
    voicePref = ranked[0] || list[0];
    return voicePref;
  }

  function speak(text, { rate = 0.88, pitch = 0.65, volume = 0.95 } = {}) {
    if (!('speechSynthesis' in window)) return;
    try { speechSynthesis.cancel(); } catch {}
    const u = new SpeechSynthesisUtterance(text);
    const v = pickVoice();
    if (v) u.voice = v;
    u.rate = rate; u.pitch = pitch; u.volume = volume;
    speechSynthesis.speak(u);
    return u;
  }

  // populate voice list on load (Chrome quirk)
  if ('speechSynthesis' in window) {
    speechSynthesis.onvoiceschanged = () => { voicePref = null; pickVoice(); };
    setTimeout(pickVoice, 100);
  }

  // ============================================================
  // Pre-recorded clip player — drops MP3s in assets/audio/{key}.mp3
  // Falls back to Web Speech if the clip is missing.
  // ============================================================
  const clipCache = new Map();   // key → HTMLAudioElement
  const missing   = new Set();   // keys we know don't exist (404)
  function playClip(key, opts = {}) {
    if (!key) return false;
    if (missing.has(key)) return false;
    let a = clipCache.get(key);
    if (!a) {
      a = new Audio(`assets/audio/${key}.mp3`);
      a.preload = 'auto';
      a.volume = opts.volume ?? 0.95;
      a.addEventListener('error', () => {
        // 404 / decode failure → mark as missing so we never retry
        missing.add(key);
      }, { once: true });
      clipCache.set(key, a);
    }
    try {
      a.currentTime = 0;
      const p = a.play();
      if (p && typeof p.then === 'function') p.catch(() => { /* autoplay blocked, just swallow */ });
      return true;
    } catch { return false; }
  }
  // High-level: try to play the recorded MP3, otherwise speak the text.
  function voice(key, fallbackText, opts) {
    if (playClip(key, opts)) return;
    if (fallbackText) speak(fallbackText, opts);
  }

  // expose globally
  window.DCAudio = { SFX, speak, ctx, unlock, playClip, voice };
})();
