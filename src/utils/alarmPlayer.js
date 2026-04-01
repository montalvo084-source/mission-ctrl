/**
 * alarmPlayer — loud looping beep + vibration alarm using Web Audio API + Haptics.
 * Starts the moment called, stops only when stopAlarm() is called.
 */

import { Capacitor } from '@capacitor/core';

let audioCtx = null;
let beepInterval = null;
let vibrateInterval = null;
let isPlaying = false;

function getCtx() {
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new (window.AudioContext || window['webkitAudioContext'])();
  }
  return audioCtx;
}

function playBeep() {
  try {
    const ctx = getCtx();
    // Three rapid high-pitched beeps
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
      gain.gain.linearRampToValueAtTime(1.0, startAt + 0.01);
      gain.gain.setValueAtTime(1.0, startAt + 0.17);
      gain.gain.linearRampToValueAtTime(0, startAt + 0.20);
      osc.start(startAt);
      osc.stop(startAt + 0.22);
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
 * Start the looping alarm — beep + vibrate every 800ms.
 * Call this the moment a timer hits 0.
 */
export function startAlarm() {
  if (isPlaying) return;
  isPlaying = true;

  try {
    const ctx = getCtx();
    ctx.resume().then(() => {
      playBeep();
      triggerHaptic();
      beepInterval = setInterval(() => {
        playBeep();
        triggerHaptic();
      }, 800);
    });
  } catch (e) {
    playBeep();
    triggerHaptic();
    beepInterval = setInterval(() => {
      playBeep();
      triggerHaptic();
    }, 800);
  }
}

/**
 * Stop the alarm. Call when user taps "I'm Back" or "Reset".
 */
export function stopAlarm() {
  isPlaying = false;
  if (beepInterval) { clearInterval(beepInterval); beepInterval = null; }
  if (vibrateInterval) { clearInterval(vibrateInterval); vibrateInterval = null; }
  try { if (navigator.vibrate) navigator.vibrate(0); } catch (e) {}
}

/**
 * Unlock audio context on first user interaction (iOS requirement).
 */
export function unlockAudio() {
  try {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();
  } catch (e) {}
}
