import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function PostChatLike({ session, currentUser, partnerName, onDone }) {
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  const partnerEmail = session.user1_email === currentUser.email
    ? session.user2_email
    : session.user1_email;

  const handleLike = async () => {
    if (loading || liked) return;
    setLoading(true);

    // Anti-spam: check if liked this person in last 24h
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const recentLikes = await base44.entities.ChatLike.filter({
      liker_email: currentUser.email,
      liked_email: partnerEmail,
    });

    const alreadyLikedRecently = recentLikes.some(
      (l) => l.created_date && l.created_date > oneDayAgo
    );

    if (!alreadyLikedRecently) {
      // Create like record
      await base44.entities.ChatLike.create({
        liker_email: currentUser.email,
        liked_email: partnerEmail,
        session_id: session.id,
      });

      // Get partner's current likes and increment
      const partnerUsers = await base44.entities.User.filter({ email: partnerEmail });
      if (partnerUsers.length > 0) {
        const partner = partnerUsers[0];
        await base44.entities.User.update(partner.id, {
          total_likes: (partner.total_likes || 0) + 1,
        });
      }

      // Send notification to partner
      await base44.entities.Notification.create({
        user_email: partnerEmail,
        type: "like",
        title: "Someone liked your vibe! ❤️",
        content: `A stranger enjoyed chatting with you and gave you a like!`,
        from_email: currentUser.email,
        from_name: "A Stranger",
        read: false,
      });
    }

    setLiked(true);
    setLoading(false);
    setTimeout(() => onDone(), 1200);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute inset-0 bg-[#08081a]/80 backdrop-blur-sm flex items-end justify-center pb-6 z-20"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-3xl p-6 mx-4 text-center w-full max-w-sm"
      >
        <button onClick={onDone} className="absolute top-4 right-4 text-white/20 hover:text-white/50">
          <X className="w-4 h-4" />
        </button>

        <AnimatePresence mode="wait">
          {liked ? (
            <motion.div key="liked" initial={{ scale: 0 }} animate={{ scale: 1 }} className="py-2">
              <div className="text-5xl mb-2">💕</div>
              <p className="text-white font-semibold">Liked!</p>
              <p className="text-white/40 text-xs mt-1">You made someone's day better</p>
            </motion.div>
          ) : (
            <motion.div key="prompt" exit={{ opacity: 0 }}>
              <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Chat Ended</p>
              <p className="text-white font-semibold text-lg mb-1">
                Did you enjoy chatting with{" "}
                <span className="gradient-text">{partnerName}</span>?
              </p>
              <p className="text-white/30 text-sm mb-5">Give them a like to boost their daily matches!</p>

              <button
                onClick={handleLike}
                disabled={loading}
                className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center mx-auto shadow-lg shadow-pink-500/30 active:scale-95 transition-all disabled:opacity-50"
              >
                {loading
                  ? <div className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <Heart className="w-7 h-7 text-white fill-white" />
                }
              </button>
              <p className="text-white/20 text-xs mt-3">❤ Like • Helps them unlock more matches</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}