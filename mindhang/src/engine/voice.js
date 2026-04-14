export const VOICE = {
  recognition: null,
  synthesis: window.speechSynthesis,
  isListening: false,
  lastCommandTime: 0,
  DEBOUNCE_MS: 800,
  CONFIDENCE_MIN: 0.40,
  callbacks: {
    onCommand: null,
    onGuess: null
  },

  PHONETIC_MAP: {
    'ay': 'a', 'ei': 'a', 'bee': 'b', 'be': 'b',
    'sea': 'c', 'see': 'c', 'si': 'c', 'dee': 'd', 'de': 'd',
    'ee': 'e', 'ef': 'f', 'eff': 'f', 'gee': 'g', 'ji': 'g',
    'aitch': 'h', 'haitch': 'h', 'eye': 'i', 'jay': 'j', 'jae': 'j',
    'kay': 'k', 'el': 'l', 'ell': 'l', 'em': 'm', 'en': 'n',
    'oh': 'o', 'owe': 'o', 'pee': 'p', 'pi': 'p',
    'cue': 'q', 'queue': 'q', 'ar': 'r', 'are': 'r', 'es': 's',
    'ess': 's', 'tea': 't', 'tee': 't', 'ti': 't', 'you': 'u',
    'yu': 'u', 'vee': 'v', 'vi': 'v',
    'double you': 'w', 'doubleyou': 'w', 'dub': 'w',
    'ex': 'x', 'why': 'y', 'wi': 'y', 'wai': 'y',
    'zed': 'z', 'zee': 'z',
    'aye': 'a', 'ke': 'k', 'di': 'd', 'bi': 'b',
    'em em': 'm', 'en en': 'n', 'ji ji': 'g',
  },

  COMMANDS: {
    bluff: ['bluff', 'call bluff', 'i call bluff', 'challenge', 'i challenge', 'fake', 'lying', 'he is lying', 'that is wrong', 'catch bluff'],
    accept: ['accept', 'i accept', 'use it', 'take it', 'yes use', 'go with it', 'okay use', 'use that', 'confirm'],
    hint: ['hint', 'give hint', 'show hint', 'clue', 'give clue', 'need help', 'help me', 'give me a hint'],
    newgame: ['new game', 'restart', 'start over', 'reset', 'play again', 'start again', 'new round'],
    score: ['score', 'my score', 'what is my score', 'points', 'how many points', 'current score'],
    askai: ['ask ai', 'ask aria', 'aria suggest', 'get suggestion', 'ai help', 'suggestion', 'what should i guess'],
  },

  init() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      console.warn('SpeechRecognition unavailable');
      return false;
    }
    this.recognition = new SR();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 5;
    this.recognition.lang = 'en-IN';

    this.recognition.onresult = (e) => this._onResult(e);
    this.recognition.onerror = (e) => this._onError(e);
    this.recognition.onend = () => this._onEnd();

    return true;
  },

  _onResult(event) {
    const results = event.results[event.results.length - 1];
    const alternatives = [];
    for (let i = 0; i < results.length; i++) {
      alternatives.push({
        text: results[i].transcript.trim().toLowerCase(),
        confidence: results[i].confidence,
      });
    }

    const topText = alternatives[0]?.text || '';
    const now = Date.now();
    if (now - this.lastCommandTime < this.DEBOUNCE_MS) return;

    for (const alt of alternatives) {
      if (alt.confidence > 0 && alt.confidence < this.CONFIDENCE_MIN) continue;
      if (this._parseCommand(alt.text)) {
        this.lastCommandTime = now;
        return;
      }
    }
    this.speak(`Heard "${topText}" — not recognized. Say a letter or a command.`);
  },

  _onError(event) {
    if (event.error === 'not-allowed') {
      alert('Microphone access denied. Please allow it in the browser.');
      this.stop();
    }
  },

  _onEnd() {
    if (this.isListening) {
      setTimeout(() => {
        if (!this.isListening || !this.recognition) return;
        try { this.recognition.start(); } catch (e) { }
      }, 300);
    }
  },

  _parseCommand(rawText) {
    const text = rawText.replace(/[^a-z\s]/g, '').trim();

    // 1. Direct single-letter match ("b", "c")
    if (/^[a-z]$/.test(text)) {
      this._guessLetter(text); return true;
    }

    // 2. Intent to guess a letter ("guess b", "letter a")
    const letterPhrase = text.match(/\b(?:letter|guess|try|say|choose|it is|its)\s+([a-z])\b/);
    if (letterPhrase) {
      this._guessLetter(letterPhrase[1]); return true;
    }

    // 3. Command Match ("ask ai", "call bluff")
    for (const [cmd, keywords] of Object.entries(this.COMMANDS)) {
      if (keywords.some(kw => text === kw || text.includes(kw))) {
        this._runCommand(cmd); return true;
      }
    }

    // 4. Exact Phonetic Map ("bee" -> 'b', "why" -> 'y')
    for (const [phonetic, letter] of Object.entries(this.PHONETIC_MAP)) {
      const regex = new RegExp(`\\b${phonetic}\\b`, 'i');
      if (regex.test(text)) {
        this._guessLetter(letter); return true;
      }
    }

    // 5. Fallback: isolated single characters in a sentence
    const singleLetter = text.match(/\b([a-z])\b/);
    if (singleLetter) {
      // Skip 'a' and 'i' if part of a multi-word phrase to avoid accidental guessing (e.g. "i think")
      if (text.length > 1 && (singleLetter[1] === 'a' || singleLetter[1] === 'i') && !/^a$|^i$/.test(text)) {
        // skip
      } else {
        this._guessLetter(singleLetter[1]); return true;
      }
    }

    // 6. Whole word explicit phrase ("guess biology")
    const wordPhrase = text.match(/\b(?:guess|word is|try)\s+([a-z]{4,})\b/);
    if (wordPhrase) {
      if (this.callbacks.onWordGuess) this.callbacks.onWordGuess(wordPhrase[1]);
      return true;
    }

    // 7. Fallback single word >= 4 length ("biology")
    const words = text.split(/\s+/);
    if (words.length === 1 && words[0].length >= 4) {
      if (this.callbacks.onWordGuess) this.callbacks.onWordGuess(words[0]);
      return true;
    }

    return false;
  },

  _guessLetter(letter) {
    if (this.callbacks.onGuess) this.callbacks.onGuess(letter);
  },

  _runCommand(cmd) {
    if (this.callbacks.onCommand) this.callbacks.onCommand(cmd);
  },

  start(callbacks, introText = 'Voice mode on.') {
    this.callbacks = callbacks;
    if (!this.recognition && !this.init()) {
      alert('Voice mode requires Google Chrome.');
      return;
    }
    this.isListening = true;
    try { this.recognition.start(); } catch (e) { }
    setTimeout(() => {
      this.speak(introText);
    }, 400);
  },

  stop() {
    this.isListening = false;
    try { this.recognition?.stop(); } catch (e) { }
  },

  speak(text) {
    if (!this.synthesis) return;
    this.synthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.92;
    utt.pitch = 1.0;
    utt.volume = 1.0;
    const voices = this.synthesis.getVoices();
    const preferred = voices.find(v => v.lang === 'en-IN') || voices.find(v => v.lang.startsWith('en'));
    if (preferred) utt.voice = preferred;
    this.synthesis.speak(utt);
  },
};
