import React from "react";
import { motion } from "framer-motion";
import { Zap, Users, Shield } from "lucide-react";
import AdSlot from "../ui/AdSlot"; 

export default function HeroSection() {
  return (
    <section className="relative min-h-[50vh] flex flex-col items-center justify-center text-center px-4 pt-16 pb-8">
      {/* Animated rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[400px] h-[400px] rounded-full border border-indigo-500/10 animate-pulse-ring" />
        <div className="absolute w-[300px] h-[300px] rounded-full border border-purple-500/10 animate-pulse-ring" style={{ animationDelay: "0.5s" }} />
        <div className="absolute w-[200px] h-[200px] rounded-full border border-pink-500/10 animate-pulse-ring" style={{ animationDelay: "1s" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full flex flex-col items-center"
      >
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-tight mb-6">
          <span className="text-white">Meet </span>
          <span className="gradient-text">Strangers</span>
          <br />
          <span className="text-white/90">Instantly</span>
        </h1>

        <p className="text-white/40 text-base sm:text-lg max-w-md mx-auto mb-10 leading-relaxed">
          Connect with random people around the world through text or video chat. 
          Choose your preference and start talking.
        </p>

        <div className="flex items-center justify-center gap-6 text-xs text-white/30 mb-8">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>Anonymous</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span>Instant Match</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>Free to Use</span>
          </div>
        </div>

        {/* 🚀 BANNER AD SLOT */}
        <div className="w-full max-w-sm mx-auto z-20">
            <AdSlot type="banner" />
        </div>

      </motion.div>
    </section>
  );
}