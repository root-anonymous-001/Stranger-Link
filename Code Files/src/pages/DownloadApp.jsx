import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

const DownloadApp = ({ onBack }) => {

  // Page load hote hi automatically glitter animation chalega
  useEffect(() => {
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const colors = ['#15616d', '#001524', '#ff7d00', '#78281f', '#1b4f72']; // Peacock palette

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < animationEnd) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center overflow-hidden font-sans z-50 fixed inset-0 w-full h-full">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          className="relative flex flex-col items-center justify-center text-center p-10"
        >
          {/* Background Glow (Peacock Feather Vibe) */}
          <div className="absolute w-[500px] h-[500px] bg-teal-500/20 blur-[120px] rounded-full -z-10" />
          
          {/* 3D Peacock Icon / Graphic Placeholder */}
          <motion.div
            animate={{ 
              rotateY: [0, 15, -15, 0],
              y: [0, -20, 0]
            }}
            transition={{ repeat: Infinity, duration: 4 }}
            className="text-8xl mb-8 filter drop-shadow-2xl"
          >
            🦚
          </motion.div>

          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 via-emerald-400 to-blue-500"
          >
            App Development is in Progress...
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-6 text-cyan-100/70 text-lg italic tracking-wide"
          >
            "Magic is brewing. We'll update you soon with the ultimate Stranger Link experience."
          </motion.p>

          {/* Back Button - Ab ye prop use karke Home state ko wapas false karega */}
          <button 
            onClick={onBack}
            className="goBack mt-12 text-xs text-slate-500 hover:underline cursor-pointer z-10 p-2"
          >
            Go Back
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default DownloadApp;