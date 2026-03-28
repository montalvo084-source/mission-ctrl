#!/usr/bin/env node
/**
 * Generates a 28-second repeating alarm beep sound (alarm.wav)
 * and places it in ios/App/App/ for bundling with the iOS app.
 *
 * Run: node scripts/generate-alarm-sound.js
 */

const fs = require('fs');
const path = require('path');

const sampleRate = 22050;
const duration = 28; // seconds (max iOS notification sound is 30s)
const numSamples = sampleRate * duration;

// Beep pattern: 880Hz tone for 0.4s on, 0.15s off — fast urgent alarm feel
const beepFreq = 880;
const beepOnTime  = 0.4;
const beepOffTime = 0.15;
const beepPeriod  = beepOnTime + beepOffTime;

const samples = new Int16Array(numSamples);
for (let i = 0; i < numSamples; i++) {
  const t = i / sampleRate;
  const posInPeriod = t % beepPeriod;
  samples[i] = posInPeriod < beepOnTime
    ? Math.round(32767 * 0.85 * Math.sin(2 * Math.PI * beepFreq * t))
    : 0;
}

// Build WAV file
const dataSize = numSamples * 2;
const buffer = Buffer.alloc(44 + dataSize);
buffer.write('RIFF', 0);
buffer.writeUInt32LE(36 + dataSize, 4);
buffer.write('WAVE', 8);
buffer.write('fmt ', 12);
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20);           // PCM
buffer.writeUInt16LE(1, 22);           // mono
buffer.writeUInt32LE(sampleRate, 24);
buffer.writeUInt32LE(sampleRate * 2, 28);
buffer.writeUInt16LE(2, 32);
buffer.writeUInt16LE(16, 34);
buffer.write('data', 36);
buffer.writeUInt32LE(dataSize, 40);
for (let i = 0; i < numSamples; i++) {
  buffer.writeInt16LE(samples[i], 44 + i * 2);
}

const outPath = path.join(__dirname, '..', 'ios', 'App', 'App', 'alarm.wav');
fs.writeFileSync(outPath, buffer);
console.log(`✅ Generated alarm.wav (${(buffer.length / 1024).toFixed(1)} KB) → ${outPath}`);
console.log('Next: In Xcode, right-click the App folder → Add Files → select alarm.wav → Add to target');
