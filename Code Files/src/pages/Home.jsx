// @ts-nocheck
import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/AuthContext";
import HeroSection from "../components/home/HeroSection";
import MatchFinder from "../components/home/MatchFinder";
import StatsBar from "../components/home/StatsBar";
import PullToRefresh from "../components/ui/PullToRefresh";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { user, checkAppState, openAuthModal } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = useCallback(async () => {
    await checkAppState();
    setRefreshKey((k) => k + 1);
  }, [checkAppState]);

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
        </div>
      )}

      <StatsBar />
      {user && <MatchFinder user={user} />}
    </PullToRefresh>
  );
}