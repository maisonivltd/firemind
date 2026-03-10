// Submarine-style soft sonar ping sounds using Web Audio API
const createAudioContext = () => {
  return new (window.AudioContext || (window as any).webkitAudioContext)();
};

const playSonarPing = (frequency: number = 880, duration: number = 0.3, volume: number = 0.15) => {
  try {
    const ctx = createAudioContext();

    // Main tone
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(frequency * 0.7, ctx.currentTime + duration);

    // Gain envelope — soft fade in/out
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    // Subtle reverb-like effect with delay
    const delay = ctx.createDelay();
    delay.delayTime.value = 0.08;
    const delayGain = ctx.createGain();
    delayGain.gain.value = 0.3;

    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.connect(delay);
    delay.connect(delayGain);
    delayGain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration + 0.1);

    setTimeout(() => ctx.close(), (duration + 0.5) * 1000);
  } catch {
    // Audio not supported
  }
};

export const playMessageSent = () => {
  playSonarPing(1046, 0.15, 0.1); // High C, short, quiet
};

export const playMessageReceived = () => {
  // Two-tone submarine sonar ping
  try {
    const ctx = createAudioContext();
    const now = ctx.currentTime;

    // First ping
    const osc1 = ctx.createOscillator();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(660, now);
    osc1.frequency.exponentialRampToValueAtTime(440, now + 0.25);

    const gain1 = ctx.createGain();
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.12, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    // Second ping (echo)
    const osc2 = ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(550, now + 0.15);
    osc2.frequency.exponentialRampToValueAtTime(380, now + 0.4);

    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0, now + 0.15);
    gain2.gain.linearRampToValueAtTime(0.08, now + 0.17);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc1.connect(gain1).connect(ctx.destination);
    osc2.connect(gain2).connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.3);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.45);

    setTimeout(() => ctx.close(), 1000);
  } catch {
    // Audio not supported
  }
};

export const playNotification = () => {
  // Three gentle pings, ascending — submarine alert
  try {
    const ctx = createAudioContext();
    const now = ctx.currentTime;
    const notes = [523, 659, 784]; // C5, E5, G5

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      const start = now + i * 0.12;
      osc.frequency.setValueAtTime(freq, start);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.85, start + 0.2);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.1, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);

      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.3);
    });

    setTimeout(() => ctx.close(), 1200);
  } catch {
    // Audio not supported
  }
};
