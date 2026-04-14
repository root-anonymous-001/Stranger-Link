import React, { useState, useEffect } from "react";
import { getDailyLimit, getTodayString } from "../../utils/tiers";
import { motion } from "framer-motion";
import { MessageCircle, Video, ArrowRight, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function MatchFinder({ user, onSearchingStateChange }) {
  const [mode, setMode] = useState("text");
  const [genderPref, setGenderPref] = useState("any");
  const [myGender, setMyGender] = useState(user?.gender || null);
  const [isSearching, setIsSearching] = useState(false);
  
  const navigate = useNavigate();

  const today = getTodayString();
  const matchesUsed = user?.last_match_reset === today ? (user?.matches_used_today || 0) : 0;
  const limit = getDailyLimit(user?.total_likes || 0, user?.is_vip || false);
  
  const isFilterLocked = matchesUsed >= limit && !user?.is_vip;

  useEffect(() => {
    if (isFilterLocked && genderPref !== "any") {
      setGenderPref("any");
    }
  }, [isFilterLocked, genderPref]);

  const handleStartChat = async () => {
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }

    if (!myGender) return;

    setIsSearching(true);
    if (onSearchingStateChange) onSearchingStateChange(true); // Tell Home to speed up particles

    if (!user.gender) {
      await base44.auth.updateMe({ gender: myGender });
    }

    const waitingSessions = await base44.entities.ChatSession.filter({
      status: "waiting",
      mode: mode,
    });

    const compatible = waitingSessions.find((s) => {
      if (s.user1_email === user.email) return false;
      const theirPrefMatchesMe = s.gender_preference === "any" || s.gender_preference === myGender;
      const myPrefMatchesThem = genderPref === "any" || genderPref === s.user1_gender;
      return theirPrefMatchesMe && myPrefMatchesThem;
    });

    if (compatible) {
      await base44.entities.ChatSession.update(compatible.id, {
        user2_email: user.email,
        user2_name: user.full_name || "Stranger",
        user2_gender: myGender,
        status: "active",
      });

      await base44.entities.Message.create({
        session_id: compatible.id,
        sender_email: "system",
        sender_name: "System",
        content: "You are now connected with a stranger. Say hi! 👋",
        type: "system",
      });

      await base44.auth.updateMe({
        matches_used_today: matchesUsed + 1,
        last_match_reset: today,
      });
      navigate(createPageUrl("Chat") + `?session=${compatible.id}`);
      
    } else {
      const myGhostSessions = waitingSessions.filter(s => s.user1_email === user.email);
      for (const ghost of myGhostSessions) {
        await base44.entities.ChatSession.update(ghost.id, { status: "ended" });
      }

      const session = await base44.entities.ChatSession.create({
        user1_email: user.email,
        user1_name: user.full_name || "Stranger",
        user1_gender: myGender,
        status: "waiting",
        mode: mode,
        gender_preference: genderPref,
      });

      await base44.auth.updateMe({
        matches_used_today: matchesUsed + 1,
        last_match_reset: today,
      });
      navigate(createPageUrl("Chat") + `?session=${session.id}`);
    }

    setIsSearching(false);
    if (onSearchingStateChange) onSearchingStateChange(false); // Reset particle speed
  };

  const genderOptions = [
    { value: "male", label: "Male", emoji: "♂" },
    { value: "female", label: "Female", emoji: "♀" },
    { value: "any", label: "Anyone", emoji: "⚡" },
  ];

  const myGenderOptions = [
    { value: "male", label: "Male", emoji: "♂" },
    { value: "female", label: "Female", emoji: "♀" },
    { value: "other", label: "Other", emoji: "✦" },
  ];

  return (
    <section className="px-4 pb-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="max-w-lg mx-auto"
      >
        <div className="glass rounded-3xl p-6 sm:p-8 space-y-8">
          {/* Mode Selection */}
          <div>
            <label className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3 block">
              Chat Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "text", label: "Text Chat", icon: MessageCircle, desc: "Type messages" },
                { value: "video", label: "Video Chat", icon: Video, desc: "Face to face" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setMode(opt.value)}
                  className={`relative group p-4 rounded-2xl border transition-all duration-300 text-left ${
                    mode === opt.value
                      ? "border-indigo-500/50 bg-indigo-500/10"
                      : "border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]"
                  }`}
                >
                  <opt.icon
                    className={`w-6 h-6 mb-2 ${
                      mode === opt.value ? "text-indigo-400" : "text-white/30"
                    }`}
                  />
                  <p className={`text-sm font-medium ${mode === opt.value ? "text-white" : "text-white/60"}`}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-white/30 mt-0.5">{opt.desc}</p>
                  {mode === opt.value && (
                    <motion.div
                      layoutId="mode-indicator"
                      className="absolute top-3 right-3 w-2 h-2 rounded-full bg-indigo-400"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* My Gender */}
          <div>
            <label className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3 block">
              I am
            </label>
            <div className="grid grid-cols-3 gap-2">
              {myGenderOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setMyGender(opt.value)}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    myGender === opt.value
                      ? "bg-purple-500/20 border border-purple-500/40 text-purple-300"
                      : "bg-white/[0.03] border border-white/5 text-white/40 hover:text-white/60 hover:bg-white/[0.06]"
                  }`}
                >
                  <span className="text-lg block mb-1">{opt.emoji}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Gender Preference */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-medium text-white/40 uppercase tracking-wider">
                Match me with
              </label>
              {isFilterLocked && (
                <span className="text-[10px] text-red-400 font-medium bg-red-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Free filters exhausted
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {genderOptions.map((opt) => {
                const disabled = isFilterLocked && opt.value !== "any";
                return (
                  <button
                    key={opt.value}
                    disabled={disabled}
                    onClick={() => setGenderPref(opt.value)}
                    className={`relative px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      genderPref === opt.value
                        ? "bg-pink-500/20 border border-pink-500/40 text-pink-300"
                        : "bg-white/[0.03] border border-white/5 text-white/40 hover:text-white/60 hover:bg-white/[0.06]"
                    } ${disabled ? "opacity-30 cursor-not-allowed grayscale" : ""}`}
                  >
                    {disabled && <Lock className="absolute top-1.5 right-1.5 w-3 h-3 text-white/40" />}
                    <span className="text-lg block mb-1">{opt.emoji}</span>
                    {opt.label}
                  </button>
                );
              })}
            </div>
            {!isFilterLocked && (
              <p className="text-white/20 text-[10px] mt-2 text-center">
                Used {matchesUsed} of {limit} free filtered matches today.
              </p>
            )}
          </div>

          {/* Start Button */}
          <Button
            onClick={handleStartChat}
            disabled={isSearching || !myGender}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-90 text-white font-semibold text-base border-0 shadow-lg shadow-purple-500/20 disabled:opacity-40 transition-all"
          >
            {isSearching ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Finding a match...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                {mode === "text" ? (
                  <MessageCircle className="w-5 h-5" />
                ) : (
                  <Video className="w-5 h-5" />
                )}
                Start {mode === "text" ? "Chatting" : "Video Call"}
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </Button>

          {!myGender && (
            <p className="text-center text-xs text-white/30">
              Please select your gender to continue
            </p>
          )}
        </div>
      </motion.div>
    </section>
  );
}