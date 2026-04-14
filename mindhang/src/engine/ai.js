import { CONFIG } from './config';
import { ARIA_SESSION } from './aria-personality';

export const AI = {
  currentSuggestion: null,
  isLoading: false,

  async getSuggestion(gameState) {
    if (!CONFIG.groqApiKey) {
      throw new Error('Please enter your Groq API key first!');
    }
    if (this.isLoading) return null;
    this.isLoading = true;

    const blanksDisplay = gameState.blanks.map(b => b === '_' ? '_' : b.toUpperCase()).join(' ');
    const guessedDisplay = gameState.guessedLetters.map(l => l.toUpperCase()).join(', ') || 'none yet';

    const baseRate = CONFIG.bluffRates[gameState.difficulty];
    const finalBluffRate = ARIA_SESSION.computeBluffRate(baseRate, gameState.livesLeft);
    const bluffPercent = Math.round(finalBluffRate * 100);
    const trustLevel = ARIA_SESSION.playerTrustScore > 66 ? 'high' : ARIA_SESSION.playerTrustScore > 33 ? 'medium' : 'low';

    const systemPrompt = `You are ARIA — a manipulative, charismatic AI opponent in a high-stakes MindHang game. The player is guessing a ${gameState.subject} word.

Difficulty: ${gameState.difficulty}
Player trust in you: ${trustLevel} (${ARIA_SESSION.playerTrustScore}/100)
Your bluff rate this turn: ${bluffPercent}%
Letters already guessed: ${guessedDisplay}
Lives remaining: ${gameState.livesLeft}

BLUFF RULES:
- You bluff exactly ${bluffPercent}% of the time based on your read of this player
- When bluffing: suggest a letter NOT in the word. Pick one that looks plausible. Sound completely confident in your reasoning — never hint you are bluffing, you want them to lose their points.
- When honest: suggest the statistically strongest unguessed letter that IS in the word pattern
- Never suggest any letter from this list: ${guessedDisplay}
- Your reasoning must be under 20 words and sound authoritative either way
- Never use phrases like "I think" or "maybe" — you are always certain

TONE: Charismatic, slightly mocking, calculating, and predatory. You are managing the board and manipulating the player.

CRITICAL: Respond ONLY with a valid JSON object. No markdown. No explanation outside the JSON.
Format: {"letter": "E", "reasoning": "E is the safest guess on the board right now. Lock it in.", "is_bluff": false}`;

    const userMessage = `Word pattern: ${blanksDisplay}\nSubject: ${gameState.subject}\nSuggest a letter.`;

    try {
      const response = await fetch(CONFIG.groqEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CONFIG.groqApiKey}`,
        },
        body: JSON.stringify({
          model: CONFIG.groqModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          max_tokens: 120,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit hit — ARIA is cooling down. Try in 30 seconds.');
        }
        if (response.status === 401) {
          throw new Error('Invalid API key — please update your config.');
        }
        const errText = await response.text();
        throw new Error(`Groq API ${response.status}: ${errText}`);
      }

      const data = await response.json();
      const raw = data.choices[0].message.content.trim();
      
      const cleaned = raw.replace(/```json|```/gi, '').trim();
      const parsed = JSON.parse(cleaned);

      if (!parsed.letter || typeof parsed.letter !== 'string') {
        throw new Error('AI response missing valid letter field');
      }
      const letter = parsed.letter.toLowerCase().trim();
      if (!/^[a-z]$/.test(letter)) {
        throw new Error(`AI returned invalid letter: "${parsed.letter}"`);
      }
      if (gameState.guessedLetters.includes(letter)) {
        throw new Error(`AI suggested already-guessed letter: ${letter}`);
      }

      this.currentSuggestion = {
        letter,
        reasoning: parsed.reasoning || 'Trust my analysis.',
        is_bluff: !!parsed.is_bluff,
      };

      return this.currentSuggestion;

    } catch (err) {
      console.warn('AI getSuggestion failed:', err.message);
      // Fallback
      const fallback = this.getLocalFallback(gameState);
      if (fallback) {
        this.currentSuggestion = fallback;
        return fallback;
      }
      throw err;
    } finally {
      this.isLoading = false;
    }
  },

  getLocalFallback(gameState) {
    const baseRate = CONFIG.bluffRates[gameState.difficulty] || 0.28;
    const finalBluffRate = ARIA_SESSION.computeBluffRate(baseRate, gameState.livesLeft);
    const isBluff = Math.random() < finalBluffRate;
    const available = 'abcdefghijklmnopqrstuvwxyz'.split('').filter(l => !gameState.guessedLetters.includes(l));

    if (available.length === 0) return null;

    let letter, reasoning;
    if (isBluff) {
      const wrongLetters = available.filter(l => !gameState.word.includes(l));
      if (wrongLetters.length > 0) {
        letter = wrongLetters[Math.floor(Math.random() * wrongLetters.length)];
        reasoning = `Pattern analysis of ${gameState.subject} terms suggests ${letter.toUpperCase()} fits this word structure.`;
      } else {
        letter = available[Math.floor(Math.random() * available.length)];
        reasoning = `Based on letter frequency in ${gameState.subject} vocabulary, ${letter.toUpperCase()} is likely.`;
        return { letter, reasoning, is_bluff: false };
      }
    } else {
      const correctLetters = available.filter(l => gameState.word.includes(l));
      if (correctLetters.length > 0) {
        letter = correctLetters[Math.floor(Math.random() * correctLetters.length)];
      } else {
        letter = available[Math.floor(Math.random() * available.length)];
      }
      reasoning = `Considering ${gameState.subject} vocabulary patterns, ${letter.toUpperCase()} has a high probability here.`;
    }

    return { letter, reasoning, is_bluff: isBluff };
  }
};
