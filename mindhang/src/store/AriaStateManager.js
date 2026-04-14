import { create } from 'zustand';
import { WORDS } from '../engine/words';
import { CONFIG } from '../engine/config';
import { AI } from '../engine/ai';
import { VOICE } from '../engine/voice';
import { ARIA_PERSONA, ARIA_SESSION } from '../engine/aria-personality';

import { SFX } from '../engine/sfx';

let aiTimer = null;

export const useAriaState = create((set, get) => ({
  gameState: 'MENU', // MENU, PLAYING, GAMEOVER, VICTORY
  dangerMode: false,
  lives: 6,
  score: 0,
  totalScore: 0,
  difficulty: 'medium',
  subject: 'biology',
  voiceMode: false,
  
  word: '',
  hint: '',
  definition: '',
  isHintRevealed: false,
  hintsRemaining: 3,
  lastPointDelta: null,
  blanks: [],
  guessedLetters: [],
  mistakes: 0,
  
  aiExpression: 'Neutral', 
  mouseRef: { x: 0, y: 0 },

  // AI Mechanics
  aiSuggestion: null,
  isAiLoading: false,
  bluffCallCount: 0,

  // Setup / Action functions
  setGameState: (state) => {
    set({ gameState: state });
    if (state === 'MENU') {
      SFX.startMenuMusic();
    } else {
      SFX.stopMenuMusic();
    }
  },
  setExpression: (expr) => set({ aiExpression: expr }),
  setDangerMode: (danger) => set({ dangerMode: danger }),
  setSubject: (sub) => set({ subject: sub }),
  setDifficulty: (diff) => set({ difficulty: diff }),
  setVoiceMode: (v) => set({ voiceMode: v }),
  setGroqKey: (key) => { CONFIG.groqApiKey = key; },

  updateMouse: (x, y) => set((state) => {
    state.mouseRef.x = x;
    state.mouseRef.y = y;
    return {};
  }),

  startGame: () => {
    const state = get();
    const pool = WORDS[state.subject];
    if (!pool || pool.length === 0) {
      alert(`No words available for subject "${state.subject}".`);
      return;
    }
    
    // Choose random word
    const entry = pool[Math.floor(Math.random() * pool.length)];
    const word = entry.word.toLowerCase();

    set({
      word: word,
      hint: entry.hint,
      definition: entry.definition,
      isHintRevealed: false,
      blanks: Array(word.length).fill('_'),
      guessedLetters: [],
      lives: 6,
      score: 0,
      mistakes: 0,
      bluffCallCount: 0,
      dangerMode: false,
      hintsRemaining: 3,
      lastPointDelta: null,
      aiExpression: 'Neutral',
      aiSuggestion: null,
      gameState: 'PLAYING'
    });

    SFX.stopMenuMusic();

    if (state.voiceMode) {
      VOICE.start({
        onGuess: (l) => get().guessLetter(l),
        onWordGuess: (w) => get().guessWholeWord(w),
        onCommand: (cmd) => get().runCommand(cmd)
      }, 'Voice uplink active. You may guess individual letters, the entire word, or say commands like: Ask ARIA, and Bluff.');
    }

    ARIA_PERSONA.deliver('game_start', state, { force: true });
    ARIA_PERSONA.startPauseWatcher(get());

    // Auto-trigger the first AI suggestion shortly after starting
    clearTimeout(aiTimer);
    aiTimer = setTimeout(() => {
      get().askAI();
    }, 2500);
  },

  revealHint: () => {
    const state = get();
    if (state.hintsRemaining <= 0 || state.gameState !== 'PLAYING') return;

    const availableCorrect = state.word.split('').filter(char => !state.guessedLetters.includes(char));
    if (availableCorrect.length === 0) return;

    const randomChar = availableCorrect[Math.floor(Math.random() * availableCorrect.length)];
    
    set({ hintsRemaining: state.hintsRemaining - 1, isHintRevealed: true });
    ARIA_PERSONA.deliver('hint_used', get());

    get().guessLetter(randomChar, false, true); // true = isPaidHint
  },

  guessLetter: (letter, isAiAccept = false, isPaidHint = false) => {
    const state = get();
    if (state.gameState !== 'PLAYING') return;
    letter = letter.toLowerCase();

    if (state.guessedLetters.includes(letter)) return; // Already guessed

    const newGuessed = [...state.guessedLetters, letter];
    let newLives = state.lives;
    let newScore = state.score;
    let newBlanks = [...state.blanks];
    let newDangerMode = state.dangerMode;
    let newExpression = state.aiExpression;
    let mist = state.mistakes;

    if (state.word.includes(letter)) {
      // Correct
      state.word.split('').forEach((char, i) => {
        if (char === letter) newBlanks[i] = letter;
      });
      if (isPaidHint) {
        newScore -= 15;
      } else {
        newScore += isAiAccept ? Math.floor(CONFIG.scoring.correctGuess / 2) : CONFIG.scoring.correctGuess;
      }
      newExpression = 'Pleased';
      if (state.voiceMode) VOICE.speak(`Correct! ${letter.toUpperCase()} is in the word.`);
    } else {
      // Wrong
      newLives -= 1;
      mist += 1;
      newScore += CONFIG.scoring.wrongGuess;
      newDangerMode = newLives <= 2;
      newExpression = 'Angry';
      if (state.voiceMode) VOICE.speak(`Wrong. ${newLives} lives remaining.`);
      
      ARIA_PERSONA.deliver('wrong_guess', get());
      if (newLives <= 2) {
        setTimeout(() => ARIA_PERSONA.deliver('low_lives', get(), { force: true }), 2000);
      }
    }

    set({
      guessedLetters: newGuessed,
      lives: newLives,
      score: newScore,
      blanks: newBlanks,
      dangerMode: newDangerMode,
      aiExpression: newExpression,
      mistakes: mist,
      lastPointDelta: newScore !== state.score ? { value: newScore - state.score, key: Date.now() } : state.lastPointDelta,
      aiSuggestion: null // Hide panel if present
    });

    get().checkWinLoss();

    // Auto generate next AI suggestion after board state changes
    if (get().gameState === 'PLAYING') {
      clearTimeout(aiTimer);
      aiTimer = setTimeout(() => {
        if (get().gameState === 'PLAYING') {
          get().askAI();
        }
      }, 1500);
    }
  },

  guessWholeWord: (spokenWord) => {
    const state = get();
    if (state.gameState !== 'PLAYING') return;
    
    if (spokenWord.toLowerCase() === state.word) {
      // Correct Word Guess
      const newScore = state.score + 50; // Bonus for full word
      set({
        blanks: state.word.split(''),
        score: newScore,
        aiExpression: 'Pleased'
      });
      get().checkWinLoss();
    } else {
      // Wrong Word Guess
      let newLives = state.lives - 1;
      let newDangerMode = newLives <= 2;
      set({ 
        lives: newLives, 
        mistakes: state.mistakes + 1,
        score: state.score - 10,
        dangerMode: newDangerMode,
        aiExpression: 'Angry'
      });
      if (state.voiceMode) VOICE.speak(`Incorrect deduction. The word is not ${spokenWord}.`);
      ARIA_PERSONA.deliver('wrong_guess', get());
      if (newLives <= 2) {
        setTimeout(() => ARIA_PERSONA.deliver('low_lives', get(), { force: true }), 2000);
      }
      get().checkWinLoss();
    }
  },

  checkWinLoss: () => {
    const state = get();
    if (state.lives <= 0) {
      set({ gameState: 'GAMEOVER', totalScore: state.totalScore + state.score, aiExpression: 'Neutral' });
      ARIA_PERSONA.deliver('ai_win', state, { force: true });
      ARIA_PERSONA.stopPauseWatcher();
      if (state.voiceMode) VOICE.speak(`Game over. The word was ${state.word}.`);
      if (state.voiceMode) VOICE.stop();
    } else if (!state.blanks.includes('_')) {
      const bonus = CONFIG.scoring.winBonus * state.lives;
      set({ gameState: 'VICTORY', score: state.score + bonus, totalScore: state.totalScore + state.score + bonus, aiExpression: 'Confident' });

      if (state.lives === 6) {
        ARIA_PERSONA.deliver('player_win_flawless', state, { force: true });
      } else {
        ARIA_PERSONA.deliver('player_win', state, { force: true });
      }

      ARIA_PERSONA.stopPauseWatcher();
      if (state.voiceMode) VOICE.speak(`Brilliant! You guessed it.`);
      if (state.voiceMode) VOICE.stop();
    }
  },

  askAI: async () => {
    const state = get();
    if (state.gameState !== 'PLAYING' || state.isAiLoading) return;
    
    set({ isAiLoading: true });
    try {
      const suggestion = await AI.getSuggestion({
        word: state.word,
        blanks: state.blanks,
        guessedLetters: state.guessedLetters,
        livesLeft: state.lives,
        subject: state.subject,
        difficulty: state.difficulty
      });
      if (suggestion) {
        set({ aiSuggestion: suggestion });
        if (state.voiceMode) {
          VOICE.speak(`ARIA suggests ${suggestion.letter.toUpperCase()}. ${suggestion.reasoning}`);
        }
      }
    } catch (e) {
      alert(e.message);
    }
    set({ isAiLoading: false });
  },

  acceptSuggestion: () => {
    const state = get();
    if (!state.aiSuggestion) return;
    ARIA_SESSION.recordAccept();
    const letter = state.aiSuggestion.letter;
    get().guessLetter(letter, true);
    ARIA_PERSONA.deliver('accepted_suggestion', get());
  },

  callBluff: () => {
    const state = get();
    if (!state.aiSuggestion) return;
    
    const wasBluff = state.aiSuggestion.is_bluff;
    set({ aiSuggestion: null, bluffCallCount: state.bluffCallCount + 1 });
    
    ARIA_SESSION.recordChallenge(wasBluff);

    if (wasBluff) {
      const pts = CONFIG.scoring.correctGuess * 2;
      set({ score: state.score + pts, lastPointDelta: { value: pts, key: Date.now() }, aiExpression: 'Tense' });
      if (state.voiceMode) VOICE.speak(`You caught the bluff! ${pts} bonus points.`);
      ARIA_PERSONA.deliver('bluff_caught', get(), { force: true });
    } else {
      let newLives = state.lives - 1;
      let newDanger = newLives <= 2;
      const ptsLost = CONFIG.scoring.wrongBluffCall;
      set({ 
        lives: newLives, 
        score: state.score + ptsLost,
        lastPointDelta: { value: ptsLost, key: Date.now() },
        dangerMode: newDanger,
        aiExpression: 'Confident'
      });
      if (state.voiceMode) VOICE.speak(`ARIA was honest. You lose a life.`);
      ARIA_PERSONA.deliver('bluff_failed', get(), { force: true });
      get().checkWinLoss();
    }
  },

  runCommand: (cmd) => {
    switch (cmd) {
      case 'bluff': get().callBluff(); break;
      case 'accept': get().acceptSuggestion(); break;
      case 'askai': get().askAI(); break;
      // other voice commands can be added here
    }
  }
}));

