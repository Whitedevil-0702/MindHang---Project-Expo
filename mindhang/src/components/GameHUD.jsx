import React from 'react';
import { useAriaState } from '../store/AriaStateManager';
import { motion } from 'framer-motion';
import { BrainCircuit, AlertTriangle } from 'lucide-react';
import { SFX } from '../engine/sfx';

export default function GameHUD() {
  const { 
    lives, score, dangerMode, setGameState, aiExpression, 
    word, blanks, guessedLetters, guessLetter, 
    askAI, isAiLoading, aiSuggestion, acceptSuggestion, callBluff,
    isHintRevealed, revealHint, hint, lastPointDelta, hintsRemaining = 3
  } = useAriaState();

  const handleLetterClick = (letter) => {
    if (guessedLetters.includes(letter)) return;
    guessLetter(letter);
  };

  return (
    <div className="game-hud">
      {/* Top Banner */}
      <div className={`hud-header ${dangerMode ? 'danger-pulse' : ''}`}>
        <div className="stats">
          <span>❤️ {lives} / 6</span>
          <span style={{ position: 'relative' }}>
            💎 {score} PTS
            {lastPointDelta && (
              <motion.span 
                key={lastPointDelta.key}
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 0, y: -20 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                style={{
                  position: 'absolute',
                  left: '100%',
                  top: '-5px',
                  marginLeft: '8px',
                  color: lastPointDelta.value > 0 ? '#2ed573' : '#ff4757',
                  fontWeight: 'bold',
                  fontSize: '0.9em'
                }}
              >
                {lastPointDelta.value > 0 ? `+${lastPointDelta.value}` : lastPointDelta.value}
              </motion.span>
            )}
          </span>
        </div>
        <div className="ai-status">
          <BrainCircuit size={18} />
          <span>ARIA: {aiExpression}</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="hud-content">
        <div className="left-panel">
          <div className="reference-tab" style={{ background: 'rgba(255,255,255,0.05)', padding: '10px 15px', borderRadius: '4px', marginBottom: '15px', borderLeft: '3px solid #60a5fa' }}>
            <span style={{color: '#60a5fa', fontSize: '0.8em', textTransform: 'uppercase', letterSpacing: '1px'}}>Target Reference</span>
            <div style={{color: '#e2e8f0', marginTop: '5px', fontStyle: 'italic'}}>"{hint}"</div>
          </div>

          <div className="word-display">
            {blanks.map((char, i) => (
              <motion.span 
                key={i} 
                className={`blank ${char !== '_' ? 'revealed' : ''}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                {char !== '_' ? char.toUpperCase() : '_'}
              </motion.span>
            ))}
          </div>

          <div className="hangman-schematic" style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <svg width="150" height="200" viewBox="0 0 150 200" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" style={{ color: dangerMode ? '#ff4444' : 'var(--primary-color)' }}>
              {/* Gallows structure (always visible) */}
              <path d="M10 190h130 M40 190V10h60v20" opacity="0.3"/>
              
              {/* 5 lives Left: Head */}
              {lives <= 5 && <circle cx="100" cy="50" r="20" />}
              {/* 4 lives Left: Torso */}
              {lives <= 4 && <path d="M100 70v50" />}
              {/* 3 lives Left: Left Arm */}
              {lives <= 3 && <path d="M100 80L80 110" />}
              {/* 2 lives Left: Right Arm */}
              {lives <= 2 && <path d="M100 80l20 30" />}
              {/* 1 life Left: Left Leg */}
              {lives <= 1 && <path d="M100 120L80 160" />}
              {/* 0 lives Left: Right Leg */}
              {lives <= 0 && <path d="M100 120l20 40" />}
            </svg>
          </div>

          <div className="keyboard">
            {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter => {
              const isGuessed = guessedLetters.includes(letter.toLowerCase());
              const isCorrect = isGuessed && word.includes(letter.toLowerCase());
              const isWrong = isGuessed && !word.includes(letter.toLowerCase());
              
              let btnClass = "key-btn";
              if (isCorrect) btnClass += " correct";
              if (isWrong) btnClass += " wrong";
              
              return (
                <button 
                  className={btnClass} 
                  key={letter}
                  disabled={isGuessed}
                  onMouseEnter={SFX.playHover}
                  onClick={() => { SFX.playClick(); handleLetterClick(letter); }}
                >
                  {letter}
                </button>
              );
            })}
          </div>
          
          <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
            <button 
              className="btn-primary" 
              style={{ flex: 1, padding: '15px'}}
              onMouseEnter={SFX.playHover}
              onClick={() => { SFX.playClick(); askAI(); }}
              disabled={isAiLoading}
            >
              <BrainCircuit size={18} style={{verticalAlign:'middle', marginRight:'8px'}} />
              {isAiLoading ? 'ARIA IS THINKING...' : 'ASK ARIA FOR HELP'}
            </button>
          </div>
          


          <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
            <button 
              style={{ width: 'fit-content', opacity: 0.7, padding: '10px 20px', fontSize: '0.9em' }} 
              className="btn-secondary" 
              onMouseEnter={SFX.playHover} 
              onClick={() => { SFX.playClick(); setGameState('MENU'); }}
            >
              ⬅ Leave Game
            </button>
          </div>
        </div>

        <div className="right-panel">
          {aiSuggestion && (
            <motion.div className="ai-communication-glass" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}}>
              <h4><BrainCircuit size={16}/> ARIA SUGGESTS</h4>
              <p className="suggest-letter">{aiSuggestion.letter.toUpperCase()}</p>
              <p className="suggest-reasoning">"{aiSuggestion.reasoning}"</p>
              <div className="action-row">
                <button className="btn-accept" onMouseEnter={SFX.playHover} onClick={() => { SFX.playClick(); acceptSuggestion(); }}>✅ Accept</button>
                <button className="btn-bluff" onMouseEnter={SFX.playHover} onClick={() => { SFX.playClick(); callBluff(); }}>🚨 Call Bluff</button>
              </div>
            </motion.div>
          )}

          {hintsRemaining > 0 && (
            <motion.button 
              initial={{opacity: 0}} animate={{opacity: 1}}
              className="btn-secondary" 
              style={{ width: '100%', marginTop: '10px', padding: '12px', color: '#ffb142', borderColor: '#ffb142'}}
              onMouseEnter={SFX.playHover}
              onClick={() => { SFX.playClick(); revealHint(); }}
            >
              💡 BUY HINT (-15 PTS) [{hintsRemaining}/3]
            </motion.button>
          )}
          
          {dangerMode && (
         <motion.div className="danger-alert" initial={{x: 50, opacity:0}} animate={{x:0, opacity:1}}>
              <AlertTriangle color="red" /> CRITICAL STATE DETECTED
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
