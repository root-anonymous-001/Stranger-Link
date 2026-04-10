export const TIERS = [
  { name: "Newbie",  minLikes: 0,    dailyMatches: 5,   badge: "🌱", color: "text-slate-400",  border: "border-slate-500/40",  bg: "bg-slate-500/10" },
  { name: "Rookie",  minLikes: 100,  dailyMatches: 10,  badge: "🔰", color: "text-green-400",  border: "border-green-500/40",  bg: "bg-green-500/10" },
  { name: "Regular", minLikes: 250,  dailyMatches: 25,  badge: "⭐", color: "text-blue-400",   border: "border-blue-500/40",   bg: "bg-blue-500/10"  },
  { name: "Trusted", minLikes: 500,  dailyMatches: 50,  badge: "💎", color: "text-purple-400", border: "border-purple-500/40", bg: "bg-purple-500/10"},
  { name: "Elite",   minLikes: 800,  dailyMatches: 80,  badge: "🔥", color: "text-orange-400", border: "border-orange-500/40", bg: "bg-orange-500/10"},
  { name: "Legend",  minLikes: 1000, dailyMatches: 100, badge: "👑", color: "text-yellow-400", border: "border-yellow-500/40", bg: "bg-yellow-500/10"},
];

export function getTier(likes = 0) {
  const sorted = [...TIERS].reverse();
  return sorted.find((t) => likes >= t.minLikes) || TIERS[0];
}

export function getNextTier(likes = 0) {
  return TIERS.find((t) => t.minLikes > likes) || null;
}

export function getDailyLimit(likes = 0, isVIP = false) {
  if (isVIP) return 999;
  return getTier(likes).dailyMatches;
}

export function getTodayString() {
  return new Date().toISOString().split("T")[0];
}

export function getProgressToNext(likes = 0) {
  const current = getTier(likes);
  const next = getNextTier(likes);
  if (!next) return 100;
  const range = next.minLikes - current.minLikes;
  const earned = likes - current.minLikes;
  return Math.min(100, Math.round((earned / range) * 100));
}