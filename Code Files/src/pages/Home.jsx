// @ts-nocheck
import React, { useState, useCallback } from "react";
import { useAuth } from "@/lib/AuthContext";
import HeroSection from "../components/home/HeroSection";
import MatchFinder from "../components/home/MatchFinder";
import StatsBar from "../components/home/StatsBar";
import PullToRefresh from "../components/ui/PullToRefresh";
import { Button } from "@/components/ui/button";

// Framer motion import kiya infinite animation ke liye
import { motion } from "framer-motion";

// Download App Page Component Import
import DownloadApp from "./DownloadApp";

export default function Home() {
  const { user, checkAppState, openAuthModal } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  
  // State to toggle between Home and Download animation page
  const [showDownloadPage, setShowDownloadPage] = useState(false);

  const handleRefresh = useCallback(async () => {
    await checkAppState();
    setRefreshKey((k) => k + 1);
  }, [checkAppState]);

  // Agar user ne button click kiya hai, to download page dikhao aur onBack prop bhejo
  if (showDownloadPage) {
    return <DownloadApp onBack={() => setShowDownloadPage(false)} />;
  }

  return (
    <PullToRefresh onRefresh={handleRefresh} className="min-h-screen relative">
      <HeroSection key={refreshKey} />
      
      {!user && (
        <div className="flex flex-col items-center justify-center gap-3 mb-10 px-4">
            <Button
              onClick={() => openAuthModal("register")}
              className="w-full max-w-sm h-14 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-90 text-white font-bold text-lg border-0 shadow-lg shadow-purple-500/25 active:scale-95 transition-all"
            >
              Start Swiping Now
            </Button>
            
            <p className="text-sm text-white/50">
              Already have an account?{" "}
              <button onClick={() => openAuthModal("login")} className="text-indigo-400 font-semibold hover:underline">
                Log In
              </button>
            </p>

            {/* 🔥 NEW: Animated Gradient Download Button 🔥 */}
            <div className="w-full max-w-sm mt-6">
                <motion.button 
                  onClick={() => setShowDownloadPage(true)} 
                  // Infinite pulse and glow animation
                  animate={{ 
                    scale: [1, 1.03, 1],
                    boxShadow: [
                      "0px 0px 0px rgba(45, 212, 191, 0)", 
                      "0px 0px 25px rgba(45, 212, 191, 0.6)", 
                      "0px 0px 0px rgba(45, 212, 191, 0)"
                    ]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                  className="w-full h-14 rounded-2xl bg-slate-900 border border-teal-500/40 flex items-center justify-center hover:bg-slate-800 active:scale-95 transition-colors"
                >
                  {/* Gradient Text applied here */}
                  <span className="text-lg font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-emerald-400 to-cyan-400">
                    DOWNLOAD OUR APP
                  </span>
                </motion.button>
            </div>
        </div>
      )}

      <StatsBar />
      {user && <MatchFinder user={user} />}
    </PullToRefresh>
  );
}