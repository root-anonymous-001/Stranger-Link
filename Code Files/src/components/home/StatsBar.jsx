import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Globe, MessageCircle, Users, Clock } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function StatsBar() {
  const [realStats, setRealStats] = useState({ online: 1, chats: 0 });

  useEffect(() => {
    const fetchRealData = async () => {
      try {
        const activeSessions = await base44.entities.ChatSession.filter({ status: "active" });
        const waitingSessions = await base44.entities.ChatSession.filter({ status: "waiting" });
        
        const realOnline = (activeSessions.length * 2) + waitingSessions.length;
        setRealStats({
          online: realOnline > 0 ? realOnline : 1, // Minimum 1 dikhayega
          chats: activeSessions.length
        });
      } catch (err) { console.error("Stats error", err); }
    };

    fetchRealData();
    const interval = setInterval(fetchRealData, 10000); // Live fetch every 10s
    return () => clearInterval(interval);
  }, []);

  // THE DREAM/FAKE DATA (Bade Dabbo ke liye)
  const dreamStats = [
    { icon: Users, label: "Online Now", value: "2,847", color: "text-green-400" },
    { icon: MessageCircle, label: "Live Chats", value: "18.4K", color: "text-indigo-400" },
    { icon: Globe, label: "Countries", value: "120+", color: "text-purple-400" },
    { icon: Clock, label: "Avg Wait", value: "~3s", color: "text-pink-400" },
  ];

  // THE ACTUAL/REAL DATA (Chhote Dabbo ke liye)
  const actualStats = [
    { icon: Users, label: "Online", value: realStats.online.toLocaleString(), color: "text-green-400" },
    { icon: MessageCircle, label: "Chats", value: realStats.chats.toLocaleString(), color: "text-indigo-400" },
    { icon: Globe, label: "Countries", value: "1", color: "text-purple-400" },
    { icon: Clock, label: "Wait", value: "~5s", color: "text-pink-400" },
  ];

  return (
    <section className="px-4 pb-12 relative z-10 w-full">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="max-w-3xl mx-auto flex flex-col items-center">
        
        {/* BIG BOXES (DREAM DATA) */}
        <h3 className="text-white/80 font-bold tracking-widest uppercase text-xs mb-4 flex items-center gap-2 drop-shadow-md">
          Deserving the Hype ✨
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full mb-8">
          {dreamStats.map((stat) => (
            <div key={stat.label} className="glass-light rounded-2xl p-5 text-center border border-white/10 hover:border-white/20 transition-all bg-white/[0.04] shadow-lg">
              <stat.icon className={`w-6 h-6 mx-auto mb-3 ${stat.color} filter drop-shadow-[0_0_8px_currentColor]`} />
              <p className="text-2xl font-black text-white tracking-tight">{stat.value}</p>
              <p className="text-xs text-white/50 mt-1 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* SMALL BOXES (ACTUALLY IN REAL) */}
        <h3 className="text-white/40 font-semibold tracking-wider text-[10px] mb-3 flex items-center gap-1 uppercase">
          Actually In Real 👀
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full max-w-[85%] opacity-80 hover:opacity-100 transition-opacity">
          {actualStats.map((stat) => (
            <div key={stat.label} className="glass-light rounded-xl p-2.5 text-center border border-white/5 bg-black/20">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <stat.icon className={`w-3 h-3 ${stat.color}`} />
                <p className="text-[13px] font-bold text-white/90">{stat.value}</p>
              </div>
              <p className="text-[8px] text-white/30 uppercase tracking-widest">{stat.label}</p>
            </div>
          ))}
        </div>

      </motion.div>
    </section>
  );
}