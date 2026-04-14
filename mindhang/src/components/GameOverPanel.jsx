import React from 'react';
import { motion } from 'framer-motion';
import { useAriaState } from '../store/AriaStateManager';
import { RefreshCw, BookOpen } from 'lucide-react';

export default function GameOverPanel() {
  const { gameState, setGameState, word, subject, definition, hint } = useAriaState();

  const isLoss = gameState === 'GAMEOVER';

  return (
    <div className="game-over-panel" style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100%', color: 'white', backgroundColor: 'rgba(5, 5, 10, 0.6)', backdropFilter: 'blur(10px)',
      padding: '2rem'
    }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ textAlign: 'center', maxWidth: '600px' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: isLoss ? '#ff4757' : '#2ed573' }}>
          {isLoss ? 'SYSTEM FAILURE' : 'SIMULATION SUCCESS'}
        </h1>
        
        {isLoss && (
          <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ marginBottom: '0.5rem', color: '#b3b3b3' }}>The correct sequence was:</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', letterSpacing: '4px', margin: 0 }}>{word.toUpperCase()}</p>
            
            {subject === 'custom-pdf' && (
              <div style={{ marginTop: '1.5rem', textAlign: 'left', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffb142' }}>
                  <BookOpen size={18} /> Study Material Analysis
                </h4>
                <p style={{ fontStyle: 'italic', color: '#dfe4ea', margin: '0.5rem 0' }}>"{definition}"</p>
                <p style={{ fontSize: '0.9rem', color: '#a4b0be', margin: 0 }}>Hint reference: {hint}</p>
              </div>
            )}
          </div>
        )}

        <button 
          onClick={() => setGameState('MENU')}
          className="btn-primary" 
          style={{ padding: '15px 30px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', margin: '0 auto', gap: '10px' }}
        >
          <RefreshCw size={20} /> Return to Main Menu
        </button>
      </motion.div>
    </div>
  );
}
