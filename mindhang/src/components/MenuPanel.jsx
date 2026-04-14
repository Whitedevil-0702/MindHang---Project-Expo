import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAriaState } from '../store/AriaStateManager';
import { Play, Settings } from 'lucide-react';
import { PDF_EXTRACTOR } from '../engine/pdf-extractor';
import { WORDS } from '../engine/words';
import { SFX } from '../engine/sfx';

export default function MenuPanel() {
  const { startGame, setSubject, setDifficulty, setVoiceMode, subject, difficulty, voiceMode } = useAriaState();
  const [pdfStatus, setPdfStatus] = useState('');

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPdfStatus('Extracting...');
    try {
      const words = await PDF_EXTRACTOR.extractFromFile(file);
      WORDS['custom-pdf'] = words;
      setPdfStatus(`✅ Ready (${words.length} words)`);
      setSubject('custom-pdf');
    } catch (err) {
      setPdfStatus(`❌ Error: ${err.message}`);
    }
  };

  const handleStart = () => {
    startGame();
  };

  const menuVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <div className="menu-panel">
      <motion.div className="brand" initial={{opacity: 0, y:-20}} animate={{opacity: 1, y:0}}>
        <h1>MindHang</h1>
        <p>The Hangman That Thinks Back</p>
      </motion.div>

      <motion.div className="menu-options" variants={menuVariants} initial="hidden" animate="visible" style={{width: '350px'}}>
        


        <motion.div variants={itemVariants} style={{display:'flex', gap:'10px', marginBottom: '15px'}}>
          <div style={{flex:1}}>
            <label style={{display:'block', marginBottom:'5px', color:'var(--text-secondary)'}}>📚 Subject</label>
            <select value={subject} onChange={e => { SFX.playClick(); setSubject(e.target.value); }} onMouseEnter={SFX.playHover} style={{fontFamily: 'inherit', width:'100%', padding:'10px', background:'var(--bg-elevated)', border:'1px solid var(--border-color)', color:'white', borderRadius:'4px'}}>
              <option value="biology">🧬 Biology</option>
              <option value="geography">🌍 Geography</option>
              <option value="history">📜 History</option>
              <option value="computerscience">💻 Computer Science</option>
              <option value="custom-pdf">📄 Study Material (PDF)</option>
            </select>
          </div>
          <div style={{flex:1}}>
            <label style={{display:'block', marginBottom:'5px', color:'var(--text-secondary)'}}>⚡ Difficulty</label>
            <select value={difficulty} onChange={e => { SFX.playClick(); setDifficulty(e.target.value); }} onMouseEnter={SFX.playHover} style={{fontFamily: 'inherit', width:'100%', padding:'10px', background:'var(--bg-elevated)', border:'1px solid var(--border-color)', color:'white', borderRadius:'4px'}}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </motion.div>

        {subject === 'custom-pdf' && (
          <motion.div variants={itemVariants} style={{marginBottom: '15px', padding: '15px', border: '1px dashed var(--border-color)', borderRadius:'4px'}}>
             <input type="file" accept=".pdf" onChange={handlePdfUpload} style={{color:'white', fontSize:'0.9rem'}}/>
             <div style={{marginTop:'5px', color:'var(--text-secondary)', fontSize:'0.85rem'}}>{pdfStatus}</div>
          </motion.div>
        )}

        <motion.div variants={itemVariants} style={{marginBottom: '20px', display:'flex', alignItems:'center', gap:'10px'}}>
          <input type="checkbox" checked={voiceMode} onChange={(e)=> { SFX.playClick(); setVoiceMode(e.target.checked); }} onMouseEnter={SFX.playHover} id="voice-toggle" style={{width:'18px', height:'18px'}}/>
          <label htmlFor="voice-toggle" style={{color:'var(--text-secondary)', cursor:'pointer'}} onMouseEnter={SFX.playHover}>🎤 Enable Voice Recognition</label>
        </motion.div>

        <motion.button variants={itemVariants} className="menu-btn primary" onClick={() => { SFX.playClick(); handleStart(); }} onMouseEnter={SFX.playHover} style={{width:'100%', padding:'15px', fontSize:'1.1rem', fontWeight:'bold'}}>
          <Play size={20} style={{verticalAlign:'middle', marginRight:'8px'}}/> Initialize Session
        </motion.button>
      </motion.div>
      
      <motion.div className="status-footer" initial={{opacity: 0}} animate={{opacity: 1}} transition={{delay: 1.5}}>
        <p>SYSTEM STATUS: <span className="status-ok">ONLINE</span></p>
        <p>ARIA CORE: <span className="status-ok">CONNECTED</span></p>
      </motion.div>
    </div>
  );
}

