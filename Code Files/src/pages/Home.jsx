// @ts-nocheck
import React, { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import HeroSection from "../components/home/HeroSection";
import MatchFinder from "../components/home/MatchFinder";
import StatsBar from "../components/home/StatsBar";
import PullToRefresh from "../components/ui/PullToRefresh";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import DownloadApp from "./DownloadApp";
import HomeConfettiVibe from "../components/ui/HomeConfettiVibe";

export default function Home() {
  const { user, checkAppState, openAuthModal } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [showDownloadPage, setShowDownloadPage] = useState(false);
  const [matchBurst, setMatchBurst] = useState(false);

  const handleRefresh = useCallback(async () => {
    await checkAppState();
    setRefreshKey((k) => k + 1);
  }, [checkAppState]);

  useEffect(() => {
    const handleMatchEvent = () => {
      setMatchBurst(true);
      setTimeout(() => setMatchBurst(false), 2000);
    };
    window.addEventListener("match_found_burst", handleMatchEvent);
    return () => window.removeEventListener("match_found_burst", handleMatchEvent);
  }, []);

  if (showDownloadPage) {
    return <DownloadApp onBack={() => setShowDownloadPage(false)} />;
  }

  return (
    // overflow-x-hidden se scroll issue fix ho jata hai
    <PullToRefresh onRefresh={handleRefresh} className="min-h-screen relative overflow-x-hidden">
      
      <HomeConfettiVibe triggerBurst={matchBurst} />
      
      <div className="relative z-10 w-full max-w-[100vw]">
          <HeroSection key={refreshKey} />
          
          {!user && (
            <div className="flex flex-col items-center justify-center gap-3 mb-10 px-4">
                <Button onClick={() => openAuthModal("register")} className="w-full max-w-sm h-14 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-90 text-white font-bold text-lg border-0 shadow-lg shadow-purple-500/25 active:scale-95 transition-all">
                  Start Swiping Now
                </Button>
                
                <p className="text-sm text-white/50">
                  Already have an account?{" "}
                  <button onClick={() => openAuthModal("login")} className="text-indigo-400 font-semibold hover:underline">
                    Log In
                  </button>
                </p>

                <div className="w-full max-w-sm mt-6">
                    <motion.button 
                      onClick={() => setShowDownloadPage(true)} 
                      animate={{ scale: [1, 1.03, 1], boxShadow: ["0px 0px 0px rgba(45, 212, 191, 0)", "0px 0px 25px rgba(45, 212, 191, 0.6)", "0px 0px 0px rgba(45, 212, 191, 0)"] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="w-full h-14 rounded-2xl bg-slate-900 border border-teal-500/40 flex items-center justify-center hover:bg-slate-800 active:scale-95 transition-colors"
                    >
                      <span className="text-lg font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-emerald-400 to-cyan-400">
                        DOWNLOAD OUR APP
                      </span>
                    </motion.button>
                </div>
            </div>
          )}

          <StatsBar />
          {user && (
            <MatchFinder 
              user={user} 
              onSearchingStateChange={(isSearching) => {
                if (!isSearching) window.dispatchEvent(new Event("match_found_burst"));
              }} 
            />
          )}
      </div>
    </PullToRefresh>
  );
}