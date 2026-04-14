import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

export default function ChatMoonVibe() {
  const dots = useMemo(() => {
    return Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      size: Math.random() * 5 + 2, 
      x: Math.random() * 100, y: Math.random() * 100,
      duration: Math.random() * 30 + 20, delay: Math.random() * 5,
      color: ['#ffffff', '#00f0ff', '#ff007f', '#8a2be2'][Math.floor(Math.random() * 4)],
      blur: Math.random() * 2 // 3D depth effect
    }));
  }, []);

  return (
    // fixed inset-0 ensures it takes full screen even on scrolling
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[-1] bg-[#020205]">
      {/* Massive Moon-Shine Glows */}
      <motion.div 
        animate={{ scale: [1, 1.05, 1], opacity: [0.15, 0.25, 0.15] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-white rounded-full blur-[150px]"
      />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-900/30 rounded-full blur-[120px]" />
      
      {/* Floating 3D Glowing Dots */}
      {dots.map((d) => (
        <motion.div
          key={d.id}
          initial={{ opacity: 0, x: `${d.x}vw`, y: `${d.y}vh` }}
          animate={{ opacity: [0, 0.8, 0.8, 0], y: [`${d.y}vh`, `${d.y - 20}vh`] }}
          transition={{ duration: d.duration, repeat: Infinity, delay: d.delay, ease: "linear" }}
          className="absolute rounded-full"
          style={{ width: d.size, height: d.size, backgroundColor: d.color, filter: `blur(${d.blur}px)`, boxShadow: `0 0 10px ${d.color}` }}
        />
      ))}
    </div>
  );
}