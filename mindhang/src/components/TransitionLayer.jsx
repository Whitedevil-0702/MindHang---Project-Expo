import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAriaState } from '../store/AriaStateManager';
import MenuPanel from './MenuPanel';
import GameHUD from './GameHUD';
import GameOverPanel from './GameOverPanel';

export default function TransitionLayer() {
  const { gameState } = useAriaState();

  const variants = {
    initial: { opacity: 0, scale: 0.95 },
    in: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: 'easeOut' } },
    out: { opacity: 0, scale: 1.05, transition: { duration: 0.5, ease: 'easeIn' } }
  };

  return (
    <div style={{ position: 'relative', zIndex: 10, width: '100%', height: '100%' }}>
      <AnimatePresence mode="wait">
        {gameState === 'MENU' && (
          <motion.div key="menu" variants={variants} initial="initial" animate="in" exit="out" style={{height: '100vh'}}>
            <MenuPanel />
          </motion.div>
        )}
        {gameState === 'PLAYING' && (
          <motion.div key="game" variants={variants} initial="initial" animate="in" exit="out" style={{height: '100vh'}}>
            <GameHUD />
          </motion.div>
        )}
        {(gameState === 'GAMEOVER' || gameState === 'VICTORY') && (
          <motion.div key="postgame" variants={variants} initial="initial" animate="in" exit="out" style={{height: '100vh'}}>
            <GameOverPanel />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
