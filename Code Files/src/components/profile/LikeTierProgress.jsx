// @ts-nocheck
import React from "react";
import { Heart } from "lucide-react";
import { getTier, getNextTier, getProgressToNext } from "../../utils/tiers";

export default function LikeTierProgress({ user }) {
  const likes = user?.total_likes || 0;
  const tier = getTier(likes);
  const next = getNextTier(likes);
  const progress = getProgressToNext(likes);

  return (
    <div className="mx-4 mt-4 glass rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-pink-400 fill-pink-400" />
          <span className="text-white font-semibold text-lg">
            {likes.toLocaleString()}
          </span>
          <span className="text-white/40 text-sm">likes</span>
        </div>
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${tier.bg} ${tier.border} border ${tier.color}`}
        >
          <span>{tier.badge}</span>
          <span>{tier.name}</span>
        </div>
      </div>

      {next ? (
        <>
          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-white/30 text-xs mt-2">
            {next.badge} {next.minLikes - likes} more likes to reach{" "}
            <span className={next.color}>{next.name}</span>
            {/* VIP Hide Logic */}
            {!user?.is_vip && (
              <span>
                {" "}
                · unlock{" "}
                <span className="text-white/60">
                  {next.dailyMatches} matches/day
                </span>
              </span>
            )}
          </p>
        </>
      ) : (
        <p className="text-yellow-400/70 text-xs mt-1">
          👑 You've reached the highest tier!{" "}
          {!user?.is_vip && `${tier.dailyMatches} matches/day unlocked.`}
        </p>
      )}
    </div>
  );
}
