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

    // Three rapid high-pitched beeps — maximum urgency
    const tones = [1100, 1100, 1100];
    tones.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'square';
      osc.frequency.value = freq;

      const startAt = ctx.currentTime + i * 0.22;
      gain.gain.setValueAtTime(0, startAt);
      gain.gain.linearRampToValueAtTime(1.0, startAt + 0.01); // max volume
      gain.gain.setValueAtTime(1.0, startAt + 0.17);
      gain.gain.linearRampToValueAtTime(0, startAt + 0.20);

      osc.start(startAt);
      osc.stop(startAt + 0.22);
    });
  } catch (e) {
    // Web Audio not available — silent fallback
  }
}

/**
 * Start the looping alarm. Plays immediately and repeats every 800ms.
 * Call this the moment a timer hits 0.
 */
export function startAlarm() {
  if (isPlaying) return;
  isPlaying = true;
  // Resume context immediately in case it was suspended
  try {
    const ctx = getCtx();
    ctx.resume().then(() => {
      playBeep();
      beepInterval = setInterval(playBeep, 800);
    });
  } catch (e) {
    playBeep();
    beepInterval = setInterval(playBeep, 800);
  }
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
