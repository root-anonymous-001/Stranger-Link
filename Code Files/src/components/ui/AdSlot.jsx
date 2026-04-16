import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, PlayCircle, X } from 'lucide-react';
import { Button } from "@/components/ui/button";

// Tu yahan se true/false karke easily test kar sakta hai. 
// Baad me isko environment variable (jaise import.meta.env.VITE_DEV_MODE) se control karna best rahega.
const DEV_MODE = true; 

export default function AdSlot({ type = "banner", onAdComplete, onClose, isDevMode = DEV_MODE }) {
  const [adState, setAdState] = useState("loading"); // loading, ready, playing, finished
  const [dummyAdContent, setDummyAdContent] = useState(null);
  return null //Comment this null statement to show adds

  useEffect(() => {
    // Simulate Ad Network Loading
    const timer = setTimeout(() => {
      if (isDevMode) {
         // Setup Dummy Ads for testing
         setDummyAdContent({
             title: type === "rewarded" ? "DEV TEST SPONSOR" : "DEV TEST BANNER",
             desc: "This is a placeholder ad for local testing.",
             color: "from-blue-500/20 via-cyan-500/20 to-teal-500/20"
         });
      }
      setAdState("ready");
    }, 1500);
    return () => clearTimeout(timer);
  }, [isDevMode, type]);

  const handlePlayAd = () => {
    setAdState("playing");
    // Simulate a 5-second video ad
    setTimeout(() => {
      setAdState("finished");
      if (onAdComplete) onAdComplete();
    }, 5000);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.4, type: "spring", bounce: 0.2 }}
        className="w-full overflow-hidden my-4"
      >
        <div className="relative w-full max-w-sm mx-auto bg-slate-900/80 border border-teal-500/20 rounded-2xl p-4 flex flex-col items-center justify-center overflow-hidden backdrop-blur-md shadow-lg shadow-black/40">
          
          {/* Ad Label */}
          <span className="absolute top-2 left-3 text-[9px] uppercase tracking-widest text-white/30 font-bold flex items-center gap-2">
            Advertisement
            {isDevMode && <span className="bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded text-[8px]">DEV MODE</span>}
          </span>

          {onClose && adState !== "playing" && (
            <button onClick={onClose} className="absolute top-2 right-2 text-white/30 hover:text-white z-20">
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="mt-4 w-full flex flex-col items-center text-center">
            {adState === "loading" && (
              <div className="py-4 flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
                <p className="text-xs text-white/40">Loading Ad...</p>
              </div>
            )}

            {adState === "ready" && type === "rewarded" && (
              <div className="py-2 flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center">
                  <PlayCircle className="w-6 h-6 text-pink-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Watch a short video</h4>
                  <p className="text-xs text-white/50 mt-1">Get 2 Extra Gender-Filtered Matches!</p>
                </div>
                <Button 
                  onClick={handlePlayAd}
                  className="mt-2 bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-900 font-bold hover:scale-105 transition-transform rounded-xl h-10 px-6 z-10"
                >
                  Play Ad
                </Button>
              </div>
            )}

            {/* Simple Banner Ad (Non-Rewarded) */}
            {adState === "ready" && type === "banner" && (
                <div className={`w-full py-6 rounded-xl bg-gradient-to-r ${isDevMode ? dummyAdContent.color : 'from-indigo-500/10 to-purple-500/10'} border border-white/5 mt-2`}>
                   <h4 className="text-sm font-bold text-white/80">{isDevMode ? dummyAdContent.title : "Real Banner Here"}</h4>
                   <p className="text-xs text-white/40 mt-1">{isDevMode ? dummyAdContent.desc : "Click to learn more"}</p>
                </div>
            )}

            {adState === "playing" && (
              <div className="py-6 w-full flex flex-col items-center relative overflow-hidden rounded-xl">
                {/* Fake Video Player Visuals */}
                <div className={`absolute inset-0 bg-gradient-to-r ${isDevMode ? dummyAdContent.color : 'from-indigo-500/20 via-purple-500/20 to-pink-500/20'} animate-pulse`} />
                
                <p className="text-sm font-bold text-white z-10 animate-bounce">
                    {isDevMode ? "Playing Dummy Ad..." : "Playing Sponsor Video..."}
                </p>
                
                <div className="w-full h-1.5 bg-black/40 rounded-full mt-4 overflow-hidden z-10 mx-4">
                  <motion.div 
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 5, ease: "linear" }}
                    className="h-full bg-teal-400"
                  />
                </div>
              </div>
            )}

            {adState === "finished" && (
              <div className="py-4 flex flex-col items-center gap-2">
                <p className="text-sm font-bold text-emerald-400">Reward Granted! 🎉</p>
                <p className="text-xs text-white/50">You got 2 extra matches.</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}