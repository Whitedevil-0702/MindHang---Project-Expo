const AudioContext = window.AudioContext || window.webkitAudioContext;
let ctx;

function initAudio() {
  if (!ctx) {
    ctx = new AudioContext();
  }
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
}

export const SFX = {
  droneOscillator: null,
  droneGain: null,

  playHover: () => {
    if (!ctx) initAudio();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.05);

    gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  },

  playClick: () => {
    if (!ctx) initAudio();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  },

  playError: () => {
    if (!ctx) initAudio();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.2);

    gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  },

  startMenuMusic: () => {
    if (!ctx) initAudio();
    if (SFX.droneOscillator) return; // already playing

    SFX.droneOscillator = ctx.createOscillator();
    SFX.droneGain = ctx.createGain();
    
    // Create a dark, Sci-Fi low-frequency drone (pad-like)
    SFX.droneOscillator.type = 'triangle';
    SFX.droneOscillator.frequency.setValueAtTime(55, ctx.currentTime); // Low A

    // Setup an LFO to modulate the frequency slightly for a "living" breathing drone
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.2; // very slow
    
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 2; // +/- 2Hz wobble

    lfo.connect(lfoGain);
    lfoGain.connect(SFX.droneOscillator.frequency);

    // Fade in the master drone volume over 3 seconds
    SFX.droneGain.gain.setValueAtTime(0.001, ctx.currentTime);
    SFX.droneGain.gain.exponentialRampToValueAtTime(0.1, ctx.currentTime + 3);

    // Filter to make it muffled and ambient
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, ctx.currentTime);

    SFX.droneOscillator.connect(SFX.droneGain);
    SFX.droneGain.connect(filter);
    filter.connect(ctx.destination);

    SFX.droneOscillator.start();
    lfo.start();
  },

  stopMenuMusic: () => {
    if (SFX.droneGain) {
      // Fade out over 1.5 seconds
      SFX.droneGain.gain.setValueAtTime(SFX.droneGain.gain.value, ctx.currentTime);
      SFX.droneGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
      
      setTimeout(() => {
        if (SFX.droneOscillator) {
          SFX.droneOscillator.stop();
          SFX.droneOscillator.disconnect();
          SFX.droneOscillator = null;
        }
      }, 1500);
    }
  }
};
