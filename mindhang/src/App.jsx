import React, { useState } from 'react';
import AriaCanvasEngine from './components/AriaCanvasEngine';
import TransitionLayer from './components/TransitionLayer';
import { SFX } from './engine/sfx';

function App() {
  const [audioStarted, setAudioStarted] = useState(false);

  if (!audioStarted) {
    return (
      <div 
        onClick={() => {
          setAudioStarted(true);
          SFX.startMenuMusic();
        }}
        style={{
          width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: '#05050A', color: '#b39dff', fontFamily: 'monospace', cursor: 'pointer', zIndex: 9999
        }}
      >
        <h2>[ CLICK TO INITIALIZE AUDIO LINK ]</h2>
      </div>
    );
  }

  return (
    <>
      <AriaCanvasEngine />
      <TransitionLayer />
    </>
  );
}

export default App;
