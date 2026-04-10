import React from "react";
import { motion } from "framer-motion";
import { Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WaitingScreen({ onCancel, mode }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      {/* Pulsing circles */}
      <div className="relative w-32 h-32 mb-8">
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-indigo-500/30"
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-purple-500/30"
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-pink-500/30"
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
            <Users className="w-7 h-7 text-white" />
          </div>
        </div>
      </div>

      <h2 className="text-xl font-semibold text-white mb-2">
        Looking for a stranger...
      </h2>
      <p className="text-white/40 text-sm mb-2">
        Mode: <span className="text-white/60 capitalize">{mode}</span> chat
      </p>
      <p className="text-white/30 text-xs mb-8">
        You'll be connected when someone matches your preferences
      </p>

      <Button
        variant="outline"
        onClick={onCancel}
        className="rounded-xl border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
      >
        Cancel
      </Button>
    </div>
  );
}