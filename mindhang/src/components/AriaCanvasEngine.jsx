import React, { useRef, useEffect } from 'react';
import { useAriaState } from '../store/AriaStateManager';

export default function AriaCanvasEngine() {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const timeRef = useRef(0);
  const { dangerMode, aiExpression } = useAriaState();

  // Lerp tracking
  const stateRef = useRef({
    lookX: 0,
    lookY: 0,
    blinkFactor: 0,
    lastBlink: Date.now(),
    nextBlinkDelta: 3000,
    isLookingAway: false,
    lookAwayTimer: Date.now()
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    
    const onMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener('mousemove', onMouseMove);

    const render = () => {
      timeRef.current += 16;
      const t = timeRef.current;
      const st = stateRef.current;
      
      // Update dimensions
      const w = canvas.width;
      const h = canvas.height;
      
      // Clear
      ctx.clearRect(0, 0, w, h);
      
      // Target calculations
      const cx = w / 2;
      const cy = h / 2;
      
      // Lookaway logic (every 8-12s)
      if (Date.now() - st.lookAwayTimer > 8000 + Math.random() * 4000) {
        st.isLookingAway = true;
        st.lookAwayTimer = Date.now();
        setTimeout(() => { st.isLookingAway = false; }, 800 + Math.random() * 1000);
      }

      let tX = st.isLookingAway ? cx + 200 : mouseX;
      let tY = st.isLookingAway ? cy - 200 : mouseY;

      // Parallax smooth lerp (4%)
      st.lookX += (tX - st.lookX) * 0.04;
      st.lookY += (tY - st.lookY) * 0.04;

      const px = (st.lookX - cx) * 0.03;
      const py = (st.lookY - cy) * 0.03;

      // Breathing sine (1.2Hz)
      const breath = Math.sin(t * 0.0012 * Math.PI * 2) * 3;
      
      // Idle sway (0.5Hz)
      const sway = Math.sin(t * 0.0005 * Math.PI * 2) * 5;

      // Blinking 
      if (Date.now() - st.lastBlink > st.nextBlinkDelta) {
        st.blinkFactor += 0.2;
        if (st.blinkFactor >= 1) {
          st.blinkFactor = 1;
          st.lastBlink = Date.now();
          st.nextBlinkDelta = 3000 + Math.random() * 2000;
        }
      } else {
        st.blinkFactor -= 0.1;
        if (st.blinkFactor < 0) st.blinkFactor = 0;
      }

      // Draw Background Glow (Opposite parallax)
      const glowColor = dangerMode ? 'rgba(255, 60, 40, 0.15)' : 'rgba(100, 150, 255, 0.1)';
      ctx.beginPath();
      const grad = ctx.createRadialGradient(cx - px * 3, cy - py * 3, 50, cx - px * 3, cy - py * 3, 600);
      grad.addColorStop(0, glowColor);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // ARIA core coordinates
      const coreX = cx + px + sway;
      const coreY = cy + py + breath;

      // Core Aura
      ctx.beginPath();
      ctx.arc(coreX, coreY, 150, 0, Math.PI * 2);
      ctx.fillStyle = dangerMode ? 'rgba(40, 10, 10, 0.9)' : 'rgba(10, 15, 30, 0.9)';
      ctx.shadowBlur = 60;
      ctx.shadowColor = dangerMode ? 'red' : 'aqua';
      ctx.fill();

      // Eye
      ctx.beginPath();
      const eyeHeight = 15 * (1 - Math.sin(st.blinkFactor * Math.PI / 2));
      const eyeWidth = 40;
      ctx.ellipse(coreX + px * 2, coreY - 20 + py, eyeWidth, Math.max(1, eyeHeight), 0, 0, Math.PI * 2);
      ctx.fillStyle = dangerMode ? '#ff3333' : '#a78bfa';
      ctx.fill();
      
      // Iris
      if (eyeHeight > 5) {
        ctx.beginPath();
        ctx.arc(coreX + px * 3, coreY - 20 + py * 1.5, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 20;
        ctx.shadowColor = dangerMode ? 'orange' : '#fff';
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Expression / Mouth Line
      ctx.beginPath();
      ctx.lineWidth = 3;
      ctx.strokeStyle = dangerMode ? '#ff6b6b' : '#60a5fa';
      
      let mouthCurve = 0; // Neutral (straight line)
      if (aiExpression === 'Curious') mouthCurve = -5;
      if (aiExpression === 'Suspicious') mouthCurve = -2;
      if (aiExpression === 'Tense') mouthCurve = 15;
      if (aiExpression === 'Pleased') mouthCurve = 10; // Smile (curve down)
      if (aiExpression === 'Angry') mouthCurve = -15;  // Frown (curve up)
      if (aiExpression === 'Confident') mouthCurve = 5;
      
      ctx.moveTo(coreX - 20 + px, coreY + 40 + py);
      ctx.quadraticCurveTo(coreX + px, coreY + 40 + mouthCurve + py, coreX + 20 + px, coreY + 40 + py);
      ctx.stroke();

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(animationRef.current);
    };
  }, [dangerMode, aiExpression]);

  return (
    <canvas 
      ref={canvasRef} 
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100vw', height: '100vh',
        zIndex: 0, pointerEvents: 'none'
      }} 
    />
  );
}
