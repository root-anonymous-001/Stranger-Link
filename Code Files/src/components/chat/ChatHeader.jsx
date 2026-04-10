// @ts-nocheck
import React, { useState } from "react";
import { X, SkipForward, Video, MessageCircle, Heart, UserPlus, UserCheck, Clock, MoreVertical, Ban, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom"; // NAYA: Import kiya hai

export default function ChatHeader({ session, onEnd, onNext, partnerName, partnerDetails, hasLiked, onToggleLike, followStatus, onToggleFollow, onDeleteChat, onBlockUser }) {
  const isActive = session?.status === "active";
  const partnerInitial = partnerName ? partnerName.charAt(0).toUpperCase() : "?";
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate(); // NAYA: Hook initialize kiya

  return (
    <div className="h-16 px-4 flex items-center justify-between border-b border-white/5 bg-[#08081a] relative">
      
      {/* NAYA: Ye pura block Clickable kar diya taaki profile par redirect ho sake */}
      <div 
        className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-all"
        onClick={() => {
          if (partnerDetails?.email) {
            navigate(`/Profile?user=${partnerDetails.email}`);
          }
        }}
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-lg">
          {partnerInitial}
        </div>
        <div className="flex flex-col">
          <span className="text-white font-medium flex items-center gap-2">
            {partnerName}
            {isActive && partnerDetails && (
              <span className="text-xs font-normal bg-white/5 px-2 py-0.5 rounded-full flex items-center gap-1 text-white/70">
                <Heart className="w-3 h-3 text-pink-500 fill-pink-500" />{partnerDetails.total_likes}
              </span>
            )}
          </span>
          <span className="text-xs text-white/40 flex items-center gap-1">
            {session?.mode === "video" ? <Video className="w-3 h-3" /> : <MessageCircle className="w-3 h-3" />}
            {isActive ? <span className="text-emerald-400">Connected</span> : <span className="text-white/40">Saved Chat</span>}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isActive && partnerDetails && (
          <>
            {/* NAYA: Like Button Wapas Aaya */}
            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={onToggleLike}
              className={`w-8 h-8 flex items-center justify-center rounded-full border transition-all ${
                hasLiked ? "bg-pink-500/20 border-pink-500/40" : "bg-white/5 border-white/10 hover:bg-white/10"
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${hasLiked ? "text-pink-500 fill-pink-500" : "text-white/40"}`} />
            </motion.button>
            
            <Button variant="ghost" size="sm" onClick={onToggleFollow} className={`h-8 px-3 text-xs rounded-full border transition-all ${followStatus === 'accepted' ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" : "bg-white/5 text-white/70 border-white/10"}`}>
              {followStatus === 'accepted' ? <><UserCheck className="w-3.5 h-3.5 mr-1.5" /> Following</> : <><UserPlus className="w-3.5 h-3.5 mr-1.5" /> Follow</>}
            </Button>
          </>
        )}
        
        {/* 3 DOT MENU FOR SETTINGS */}
        <div className="relative">
          <Button variant="ghost" size="icon" onClick={() => setShowMenu(!showMenu)} className="text-white/60 hover:text-white h-8 w-8">
            <MoreVertical className="w-5 h-5" />
          </Button>
          
          <AnimatePresence>
            {showMenu && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="absolute right-0 mt-2 w-48 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                <button onClick={() => { setShowMenu(false); onDeleteChat(); }} className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-white/5 flex items-center gap-2">
                  <Trash2 className="w-4 h-4" /> Delete Chat
                </button>
                <button onClick={() => { setShowMenu(false); onBlockUser(); }} className="w-full text-left px-4 py-3 text-sm text-orange-400 hover:bg-white/5 flex items-center gap-2">
                  <Ban className="w-4 h-4" /> Block User
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {isActive && (
          <Button variant="ghost" size="icon" onClick={onEnd} className="text-red-400 hover:text-red-300 hover:bg-red-400/10 h-8 w-8 ml-1">
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>
    </div>
  );
}