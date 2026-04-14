import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';

export default function HomeConfettiVibe({ triggerBurst }) {
  // 1. Continuous Smooth Flow (Vibrant Multi-Color Palette)
  useEffect(() => {
    let animationFrameId;
    // Beautiful vibrant colors for Home screen
    const colors = ['#ff007f', '#00f0ff', '#ffd700', '#00ffaa', '#bd00ff', '#ff5500'];

    const frame = () => {
      confetti({ particleCount: 2, angle: 60, spread: 55, origin: { x: 0 }, colors, zIndex: 0 });
      confetti({ particleCount: 2, angle: 120, spread: 55, origin: { x: 1 }, colors, zIndex: 0 });
      animationFrameId = requestAnimationFrame(frame);
    };
    
    frame();
    
    // 🔥 FIX: Screen change hone par pichle particles ko clear karega 🔥
    return () => {
      cancelAnimationFrame(animationFrameId);
      confetti.reset(); 
    };
  }, []);

  // 2. Blast on Match Found
  useEffect(() => {
    if (triggerBurst) {
      confetti({
        particleCount: 150, spread: 100, origin: { y: 0.5 }, zIndex: 100,
        colors: ['#00f0ff', '#ff007f', '#ffd700', '#ffffff']
      });
    }
  }, [triggerBurst]);

  return null; 
}