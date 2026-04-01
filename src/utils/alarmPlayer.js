/**
 * alarmPlayer — loud looping beep + vibration alarm.
 *
 * iOS suspends AudioContext after ~10s of silence. To prevent this, we play
 * a silent keepalive tone every 3s once the timer starts, so the context
 * stays live and the alarm fires instantly when the timer hits 0.
 */

import { Capacitor } from '@capacitor/core';

let audioCtx = null;
let keepAliveInterval = null;
let beepInterval = null;
let isPlaying = false;

function getCtx() {
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new (window.AudioContext || window['webkitAudioContext'])();
  }
  return audioCtx;
}

/** Play a completely silent tone — just enough to keep iOS from suspending the context. */
function playSilent() {
  try {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.value = 0.001; // inaudible
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  } catch (e) {}
}

function playBeep() {
  try {
    const ctx = getCtx();
    const tones = [1100, 1100, 1100];
    tones.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.22;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(1.0, t + 0.01);
      gain.gain.setValueAtTime(1.0, t + 0.17);
      gain.gain.linearRampToValueAtTime(0, t + 0.20);
      osc.start(t);
      osc.stop(t + 0.22);
    });
  } catch (e) {}
}

async function triggerHaptic() {
  try {
    if (Capacitor.isNativePlatform()) {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } else if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  } catch (e) {}
}

/**
 * Call this when the user taps Start on a timer.
 * Begins the silent keepalive so iOS can't suspend the audio context
 * before the timer ends and the alarm needs to fire.
 */
export function unlockAudio() {
  try {
    const ctx = getCtx();
    ctx.resume().then(() => {
      playSilent();
      // Keep the context alive every 3s
      if (keepAliveInterval) clearInterval(keepAliveInterval);
      keepAliveInterval = setInterval(playSilent, 3000);
    });
  } catch (e) {}
}

/**
 * Start the alarm — loud beep + vibration every 800ms until stopAlarm() is called.
 */
export function startAlarm() {
  if (isPlaying) return;
  isPlaying = true;

  // Stop keepalive — alarm takes over
  if (keepAliveInterval) { clearInterval(keepAliveInterval); keepAliveInterval = null; }

  playBeep();
  triggerHaptic();
  beepInterval = setInterval(() => {
    playBeep();
    triggerHaptic();
  }, 800);
}

/**
 * Stop the alarm. Call when user taps "I'm Back" or "Reset".
 */
export function stopAlarm() {
  isPlaying = false;
  if (beepInterval) { clearInterval(beepInterval); beepInterval = null; }
  if (keepAliveInterval) { clearInterval(keepAliveInterval); keepAliveInterval = null; }
  try { if (navigator.vibrate) navigator.vibrate(0); } catch (e) {}
}
