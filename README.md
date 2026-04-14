# MindHang: Interactive AI Protocol
**A Cinematic, AI-Driven Web Application**

---

## 1. Product Overview
**MindHang** is a high-stakes, sci-fi reimagining of the classic Hangman game. Instead of a traditional solo puzzle, players are pitted against **ARIA** (Advanced Reasoning & Interactive AI) — a charismatic, manipulative, and highly observant AI opponent. ARIA actively manages the board, observes the player's psychology, generates contextual hints using a Large Language Model (Groq API), and executes dynamic bluffs to steal away the player's lives. 

The application is built to feel like an immersive cinematic experience heavily inspired by *Detroit: Become Human*, featuring a procedural WebAudio synthesis engine and an interactive canvas element that tracks the user's cursor.

---

## 2. Core Gameplay Mechanics

### 2.1 The Puzzle Loop
- **Objective:** Guess the hidden word one letter at a time from a variety of categories (Biology, History, Computer Science, etc.).
- **Lives:** Players start with 6 lives, represented dynamically by an SVG schematic drawing of a gallows.
- **Victory Condition:** Uncover all blanks before running out of lives. Flawless victories (6/6 lives) trigger unique ARIA interactions.
- **Defeat Condition:** Losing all 6 lives results in an instant "simulation failed" state.

### 2.2 Adaptive Bluff Engine (Player vs. AI Psychology)
ARIA acts as a high-stakes digital dealer who suggests letters for the player to pick. 
- **The Bluff Mechanism:** Based on the selected difficulty, current lives, and a hidden **Player Trust Score**, ARIA determines a "Bluff Percentage". 
- **Dynamic Deception:** ARIA will regularly suggest totally incorrect letters while outputting 100% confident, generated reasoning explaining why it is statistically correct to deceive the player.
- **Call Bluff:** Players can either "Accept" ARIA's suggestion or "Call Bluff".
  - If ARIA was lying and the player successfully calls the bluff, they are rewarded with double points.
  - If ARIA was truthful and the player doubts her, they are penalized by losing a life.

### 2.3 Interactive Features & Economy
- **Buy Hint System:** Players are granted a max of 3 "Hints" per session. Activating a hint deducts **15 Points** from the player's score and instantly reveals a random, un-guessed correct letter on the board.
- **Dynamic Scoring:** Floating points animate out of the score counter confirming positive gains for good deductions and stark red penalties for falling for bluffs or buying hints.
- **Custom Study Mode (PDF):** Instead of playing with default categories, players can upload custom `.pdf` files at the Main Menu. The system utilizes `pdfjs-dist` to scrape the document text and autonomously convert the user's study materials into playable vocabulary.

---

## 3. ARIA: Advanced Reasoning & Interactive AI

The entire game orbits around ARIA's "personality system", which bridges UI, animation, and dynamic text.

### 3.1 AI Personality Matrix
ARIA is specifically prompted to behave as a calculating, predatory, and charismatic opponent managing a high-stakes simulation. 
- **Mocking UI Commentary:** ARIA reacts directly to game events via pre-scripted UI overlays. She mocks the player for buying hints (*"Buying a hint? I appreciate your 15-point donation."*), chastises them for taking too long to guess, and gloats when she successfully executes a bluff (*"Never trust me. I just took your life."*).
- **Procedural Canvas Face:** ARIA is rendered as a procedural `HTMLCanvasElement` eye/core. It tracks the physical `(x,y)` coordinates of the player's mouse, executes random blinking physics, and pulsates to simulate organic "breathing".

### 3.2 Procedural Audio (WebAudio API)
To enforce the sci-fi aesthetic without relying on massive `.mp3` payloads, the entire soundscape is procedural:
- **UI Interaction:** High-frequency ascending sweeps test on hover, and punchy deterministic digital square-wave pulses occur on clicks, compiled natively inside the `AudioContext`.
- **Atmospheric Drone:** Entering the main menu boots up a low-pass filtered triangle oscillator with sine-LFO modulation, creating an organic, menacing ambient drone soundscape.

---

## 4. Technical Architecture

### 4.1 Technology Stack
- **Frontend Framework:** React 18 & Vite
- **Global State Management:** Zustand (`store/AriaStateManager.js`)
- **Animation Framework:** Framer Motion (for screen transitions and floating numbers)
- **Icons:** Lucide React
- **Web AI Integration:** Groq LLM API (`llama3-8b-8192`) accessed via fetch logic natively.
- **PDF Extraction:** `pdfjs-dist`
- **Audio Engine:** Vanilla JavaScript `WebAudio API` (`engine/sfx.js`)

### 4.2 System Components Structure
* **`src/store/AriaStateManager.js`**: The central nervous system. Owns UI states, scoring math, lives, letter states, and triggers UI dialogue logic events.
* **`src/engine/ai.js`**: The Groq API connection tunnel. Compiles the game state dynamically into the system prompt to enforce ARIA's manipulation strategies and guarantees formatted JSON output payloads. Provides a localized math-based fallback generator if API rate limits are hit.
* **`src/engine/aria-personality.js`**: Manages numerical trust metrics relative to the player (`consecutiveAccepts`, `consecutiveChallenges`) and houses the logic for rendering timeout/interaction commentary overlays.
* **`src/engine/sfx.js`**: The standalone procedural WebAudio synthesis generator used across all panels.
* **`src/components/`**: Houses all modular UI layers (`GameHUD.jsx`, `MenuPanel.jsx`, `TransitionLayer.jsx`, `AriaCanvasEngine.jsx`).

---

## 5. Development & Setup

### Environment Variables
MindHang executes Large Language Model prompts in runtime and requires API credentials. Create a `.env` in the root folder containing your keys:
\`\`\`
VITE_GROQ_API_KEY_ARIA=your_groq_api_key_here
\`\`\`

### Execution Directives
1. Install node dependencies:
   \`\`\`bash
   npm install
   \`\`\`
2. Boot the Vite local development proxy:
   \`\`\`bash
   npm run dev
   \`\`\`
3. Compile optimal production assets:
   \`\`\`bash
   npm run build
   \`\`\`
