# MindHang: Architecture & Implementation Guide

This document provides a deep, technical breakdown of how **MindHang** was engineered. It maps out the exact technology stack, the architectural patterns utilized, and the logic flows that dictate how the application processes state changes, AI integrations, voice synthesis, and procedural rendering.

---

## 1. High-Level Architecture
MindHang eschews a standard component-only React flow in favor of a hybrid **Engine-Driven State Pattern**. 
The React layer (`GameHUD`, `MenuPanel`) operates strictly as a "dumb" visual layer. All game logic, AI state calculation, audio synthesis, and microphone ingestion is managed by vanilla JavaScript singletons (`ai.js`, `sfx.js`, `voice.js`) synchronized globally through a single **Zustand** state store (`AriaStateManager.js`).

This decoupling ensures that API rates, audio contexts, and microphone listeners remain persistent and immune to React component re-renders.

---

## 2. Technology Stack
* **Build Tooling:** Vite, Node.js.
* **Core Framework:** React 18.
* **Global State Management:** Zustand.
* **Animations:** Framer Motion (DOM element transitions), pure Math/Lerp (HTML5 Canvas).
* **Styling:** Vanilla CSS 3 with Global CSS Variables (`index.css`).
* **Icons:** Lucide-React.
* **External APIs / Models:** 
  * Groq inference API (`llama-3.1-8b-instant`).
  * Web Speech API (Native browser microphone & TTS engine).
  * WebAudio API (Native browser synthesizer).
* **Data Extraction:** `pdfjs-dist` (PDF parsing).

---

## 3. Feature Implementations & Module Breakdown

### 3.1 The Global Brain (`src/store/AriaStateManager.js`)
Zustand orchestrates the entire application lifecycle avoiding prop-drilling. 
* **State Trees:** Tracks structural variables (`blanks`, `guessedLetters`, `lives`, `score`), visual routing states (`gameState`), and UI toggle flags (`isAiLoading`, `aiSuggestion`).
* **Action Handlers:** Functions like `guessLetter(letter)`, `guessWholeWord(w)`, and `checkWinLoss()` forcibly mutate state, handle mathematical logic (scoring penalties/bonuses), and interact directly with internal singletons (triggering `VOICE.speak()` and `SFX.playClick()`).

### 3.2 Procedural HTML5 Canvas AI (`src/components/AriaCanvasEngine.jsx`)
ARIA's face is a highly performant, procedural drawing engineered natively on `HTMLCanvasElement`.
* **Physics / Movement:** Utilizes `requestAnimationFrame` running locked at native monitor refresh rates.
* **Math Dynamics:** Employs standard Sine/Cosine waves (`Math.sin()`) for organic "breathing" and "swaying", combined with Lerp algorithms (linear interpolation) tied to `window.addEventListener('mousemove', ...)` to generate smooth parallax cursor-tracking.
* **State Reactivity:** Inherits the `aiExpression` string from Zustand (e.g., `'Angry'`, `'Pleased'`, `'Neutral'`) and directly transforms that string into geometric mathematical arc modifiers — specifically editing the `quadraticCurveTo` coordinates to force the blue/red neon "mouth" to smile or frown dynamically.

### 3.3 NLP Bluff & AI Logic (`src/engine/ai.js`)
The bluff engine creates the illusion of an intelligent opponent.
* **API Ingestion:** Makes native REST POST `fetch` calls to the Groq inference engine. It uses the `llama-3.1-8b-instant` model to ensure under-500ms response times.
* **System Prompting & Game State Sync:** Automatically injects structural metadata (lives remaining, word length, known blanks) into the system prompt to force the LLM to output contextual JSON blocks containing `{ "letter": "x", "reasoning": "...", "is_bluff": true }`.
* **Fallback Matrix:** If internet fails or API keys degrade, it falls back to a deterministic Javascript probability algorithm that calculates optimal character frequencies based on standard English matrices.

### 3.4 Speech Navigation & NLP Intent Parsing (`src/engine/voice.js`)
The entire application can be played handless using native browser integrations. 
* **Transcription Hooking:** Utilizes `window.SpeechRecognition` (for Chrome/Edge).
* **Intelligent NLP Parsing:** The `_parseCommand(rawText)` hook intercepts raw transcription blocks and runs a sophisticated suite of Regular Expressions:
  1. Sanitizes punctuation (e.g., `C.` to `C`).
  2. Extracts intent commands ("ask ARIA", "call bluff").
  3. Uses strict `\b` word boundaries for phonetic mappings (`"bee"` translates to `"b"` while safely ignoring phrases like "maybe").
  4. Scrapes target words natively returning full word attempts (`guessWholeWord(w)`) back to Zustand.
* **TTS Generator:** Utilizes `window.speechSynthesis` natively to trigger Voiceover feedback mapped dynamically mapped to the `en-IN` or localized English vocal synthesizer.

### 3.5 Procedural WebAudio Synth (`src/engine/sfx.js`)
Instead of bloated `.mp3` loading pipelines, the sound effects are synthetically processed by the browser's audio DAC dynamically.
* **Implementation:** Generates a native `AudioContext`.
* **Menu Drone:** When entering the menu, mathematical 'Oscillators' generate low-frequency `Triangle` waves, masked by a Low-Pass Biquad Filter. A secondary `Sine` wave oscillator intercepts the drone and executes an LFO (Low-Frequency Oscillator) to continuously warp the primary pitch by +/- 2Hz creating a terrifying, pulsing 'breathing' atmosphere.
* **UI interactions:** High-frequency, rapid exponential gain sweeps over `Square` and `Sine` oscillators natively mimic typical "Detroit: Become Human" sci-fi interaction 'clicks'. 

### 3.6 Autonomous Vocabulary Engine (`src/engine/pdf-extractor.js`)
The custom study setup is driven purely client-side without a backend Python/Node layer.
* **Document Parsing:** Takes `File` blobs and renders them using Mozilla's `pdfjs-dist` to rip native text blocks from pages.
* **Cleanup & Summarization:** Trims extracted artifacts down to a strict 15,000-character payload chunk.
* **Vectorizing into Game Context:** Submits the payload back to the Groq LLM API with instructions to extract uniquely identifying nouns/definitions and parse them back into the strict `WORDS` JSON array payload required by the Hangman state engine.

---

## 4. Architectural Data Pipeline Example (Calling a Bluff)
To understand how the modules connect, here is a trace of the "Call Bluff" logic:
1. `GameHUD.jsx` invokes `callBluff()`.
2. `AriaStateManager` evaluates `state.aiSuggestion.isBluff`.
3. If it **WAS** a bluff: State adjusts points `+20`.
4. `voice.js` receives execution directive: `VOICE.speak("You caught the bluff!")`.
5. `aria-personality.js` adjusts the internal trust matrix penalizing ARIA, and drops an angry overlay text element on the HUD.
6. The `aiExpression` state fires the `'Tense'` modifier.
7. `AriaCanvasEngine.jsx` recalculates the `mouthCurve` instantly reacting to the new `Tense` modifier on the next `requestAnimationFrame` loop.
