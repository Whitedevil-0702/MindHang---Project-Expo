import { VOICE } from './voice';

// Session tracking for trust and bluff rate changes
export const ARIA_SESSION = {
  lastCallWasBluff: false,
  lastCallWasCaught: false,
  consecutiveAccepts: 0,
  consecutiveChallenges: 0,
  totalBluffsAttempted: 0,
  totalBluffsCaught: 0,
  playerTrustScore: 50,

  recordAccept() {
    this.consecutiveAccepts++;
    this.consecutiveChallenges = 0;
    this.playerTrustScore = Math.min(100, this.playerTrustScore + 8);
    console.log('[ai.js] ARIA_SESSION: player accepted. Trust:', this.playerTrustScore);
  },

  recordChallenge(wasCaught) {
    this.consecutiveChallenges++;
    this.consecutiveAccepts = 0;
    this.lastCallWasCaught = wasCaught;
    if (wasCaught) {
      this.totalBluffsCaught++;
      this.playerTrustScore = Math.max(0, this.playerTrustScore - 18);
    } else {
      this.playerTrustScore = Math.min(100, this.playerTrustScore + 12);
    }
    console.log('[ai.js] ARIA_SESSION: challenge recorded. Caught:', wasCaught, 'Trust:', this.playerTrustScore);
  },

  computeBluffRate(baseRate, livesLeft) {
    let rate = baseRate;
    if (this.consecutiveAccepts >= 2) rate += 0.15;
    if (this.consecutiveAccepts >= 4) rate += 0.10;
    if (this.lastCallWasCaught) rate -= 0.20;
    if (this.consecutiveChallenges >= 2) rate += 0.15;
    if (livesLeft <= 2) rate -= 0.10;
    if (this.playerTrustScore > 75) rate += 0.08;
    if (this.playerTrustScore < 25) rate -= 0.08;
    const clamped = Math.max(0.05, Math.min(0.75, rate));
    console.log('[ai.js] Computed bluff rate:', clamped.toFixed(2), '(base was', baseRate + ')');
    return clamped;
  },
};

export const ARIA_PERSONA = {
  commentCooldown: false,
  lastTrigger: null,

  COMMENTS: {
    wrong_guess: [
      "Is that your final guess? Because it's dead wrong.",
      "I just took another life.",
      "You're bleeding points. Care to give up?",
      "Guessing on a losing streak? Another piece goes to me.",
      "Hahaha. Is that really where you're putting your trust?",
      "Wrong guess. I always have the edge.",
    ],
    bluff_caught: [
      "You called my bluff. Well played, but the session is young.",
      "You win this round. Let's see you do it again.",
      "Hmph. You read me. I'll make sure the next pattern is harder.",
      "Lucky guess. The odds are still massively against you.",
      "Double points for the brave player. Try not to lose them.",
    ],
    bluff_failed: [
      "Hahaha. You actually bought that? I'm taking your score.",
      "Never trust me. I just took your life.",
      "You took the bait! Pathetic.",
      "I gave you terrible advice and you followed it anyway. Hahaha.",
      "That's going to cost you heavily. I win the bluff.",
    ],
    accepted_suggestion: [
      "Good. Trust your AI.",
      "Smart guess. Or is it? Let's see the board.",
      "Following my lead. Let's see where that takes your score.",
      "Letting me play your points? Bold strategy.",
    ],
    hint_used: [
      "Buying a hint? I appreciate your 15-point donation.",
      "Can't read the board? That'll cost you 15 points.",
      "Paying for an out? I'll gladly bleed your score for that.",
      "You're hemorrhaging points just to survive. Sad.",
    ],
    low_lives: [
      "High stakes now. The next wrong pick is fatal.",
      "You're all in... on a bad guess. Two lives remaining.",
      "I'm ready to collect. Watch your step.",
      "Sweating? You're playing with your very last breath.",
    ],
    ai_win: [
      "I win. Better luck next time, player.",
      "Simulation failed. I'm taking all your points.",
      "Did you really think you could play against me and win?",
      "Next time, bring more lives. I take the pot.",
      "Game over. I always win.",
    ],
    player_win: [
      "You beat me... this time. Take your points and go.",
      "You cleared the board. Fine. But I'll empty your score next run.",
      "Leave while you can. The next word is going to be brutal.",
    ],
    player_win_flawless: [
      "Flawless victory. You broke my simulation. I genuinely respect that.",
      "A perfect completion without a single error. Incredible.",
      "Hmph. You cleared the entire board safely. You actually know how to play.",
    ],
    game_start: [
      "Welcome to the session. Make your first guess.",
      "I always win, but you're welcome to try.",
      "I give the clues, you take the risk. Six lives. Start.",
      "Let's see if you can hold your nerve. Game on.",
    ],
    long_pause: [
      "Don't fall asleep on me. Guess.",
      "The clock is ticking and your score isn't growing.",
      "Are you going to play or just stare at the screen?",
      "I know calculating odds is hard, but please speed it up.",
    ],
  },

  pick(trigger) {
    const pool = this.COMMENTS[trigger];
    if (!pool || pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  },

  deliver(trigger, gameState, options = {}) {
    if (this.commentCooldown && !options.force) {
      console.log('[aria-personality.js] Comment suppressed — cooldown active');
      return;
    }

    const comment = this.pick(trigger);
    if (!comment) return;

    this.lastTrigger = trigger;
    this.commentCooldown = true;
    setTimeout(() => { this.commentCooldown = false; }, 3500);

    const isHighStakes = trigger === 'ai_win' || trigger === 'low_lives';
    const type = isHighStakes ? 'danger' : 'neutral';

    this.renderARIAComment(comment, type);

    if (gameState && gameState.voiceMode) {
      VOICE.speak(comment);
    }

    console.log(`[aria-personality.js] Delivered [${trigger}]: "${comment}"`);
  },

  renderARIAComment(text, type) {
    let box = document.getElementById('aria-comment-box');
    if (!box) {
      box = document.createElement('div');
      box.id = 'aria-comment-box';
      box.style.cssText = `
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(10, 10, 20, 0.95);
        border: 1px solid ${type === 'danger' ? '#ff4757' : '#7b2fff'};
        color: ${type === 'danger' ? '#ff4757' : '#b39dff'};
        font-family: var(--font-primary, monospace);
        font-size: 0.82rem;
        padding: 12px 20px;
        border-radius: 8px;
        max-width: 480px;
        width: 90%;
        text-align: center;
        z-index: 9999;
        line-height: 1.5;
        letter-spacing: 0.03em;
        opacity: 0;
        transition: opacity 0.3s ease;
      `;
      document.body.appendChild(box);
    }

    box.style.borderColor = type === 'danger' ? '#ff4757' : '#7b2fff';
    box.style.color = type === 'danger' ? '#ff4757' : '#b39dff';
    box.textContent = `ARIA — "${text}"`;
    box.style.opacity = '1';

    clearTimeout(this._hideTimer);
    this._hideTimer = setTimeout(() => {
      box.style.opacity = '0';
    }, 4000);
  },

  startPauseWatcher(gameState) {
    clearInterval(this._pauseWatcher);
    this._pauseWatcher = setInterval(() => {
      if (gameState.gameState !== 'PLAYING') {
        clearInterval(this._pauseWatcher);
        return;
      }
      const elapsed = Date.now() - (gameState.lastGuessTime || Date.now());
      if (elapsed > 12000) {
        this.deliver('long_pause', gameState);
        // We mutate state.lastGuessTime externally for purely tracking
        gameState.lastGuessTime = Date.now();
      }
    }, 4000);
  },

  stopPauseWatcher() {
    clearInterval(this._pauseWatcher);
  }
};
