/**
 * alarmPlayer — plays a loud looping beep alarm using Web Audio API.
 * Starts exactly when called, stops only when stopAlarm() is called.
 * Works in-app (foreground). Background covered by local notifications.
 */

let audioCtx = null;
let beepInterval = null;
let isPlaying = false;

function getCtx() {
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function playBeep() {
  try {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();

    // Two-tone urgent beep (high + slightly lower = classic alarm feel)
    const tones = [960, 800];
    tones.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'square'; // harsh/urgent sound
      osc.frequency.value = freq;

      const startAt = ctx.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0, startAt);
      gain.gain.linearRampToValueAtTime(0.7, startAt + 0.02);
      gain.gain.setValueAtTime(0.7, startAt + 0.14);
      gain.gain.linearRampToValueAtTime(0, startAt + 0.18);

      osc.start(startAt);
      osc.stop(startAt + 0.18);
    });
  } catch (e) {
    // Web Audio not available — silent fallback
  }
}

/**
 * Start the looping alarm. Plays immediately and repeats every 900ms.
 * Call this the moment a timer hits 0.
 */
export function startAlarm() {
  if (isPlaying) return;
  isPlaying = true;
  playBeep();
  beepInterval = setInterval(playBeep, 900);
}

/**
 * Stop the alarm. Call when user taps "I'm Back" or "Reset".
 */
export function stopAlarm() {
  isPlaying = false;
  if (beepInterval) {
    clearInterval(beepInterval);
    beepInterval = null;
  }
}

/**
 * Unlock audio context on first user interaction (iOS requirement).
 * Call this once on app mount or first tap.
 */
export function unlockAudio() {
  try {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();
  } catch (e) {}
}
