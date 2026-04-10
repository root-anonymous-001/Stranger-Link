// @ts-nocheck
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import {
  Bell,
  Heart,
  UserPlus,
  Zap,
  Crown,
  Check,
  X,
  Trash2,
  Send,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const TYPE_CONFIG = {
  like: {
    icon: Heart,
    color: "text-pink-400",
    bg: "bg-pink-500/10",
    border: "border-pink-500/20",
  },
  comment: {
    icon: MessageCircle,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  share: {
    icon: Send,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
  },
  follow: {
    icon: UserPlus,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  follow_request: {
    icon: UserPlus,
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
  },
  match: {
    icon: Zap,
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
  },
  vip: {
    icon: Crown,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
  },
  system: {
    icon: Bell,
    color: "text-white/40",
    bg: "bg-white/5",
    border: "border-white/10",
  },
};

function timeAgo(dateStr) {
  if (!dateStr) return "";
  // Ensure the date is treated correctly without timezone mismatches
  const dateStrFixed = dateStr.endsWith("Z") ? dateStr : dateStr + "Z";
  const diff = Date.now() - new Date(dateStrFixed).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) {
      base44.auth.redirectToLogin();
      return;
    }
    const me = await base44.auth.me();
    setUser(me);

    const allNotifs = await base44.entities.Notification.filter(
      { user_email: me.email },
      "-created_date",
      100,
    );

    const now = Date.now();
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const validNotifs = [];
    const expiredNotifs = [];

    for (const n of allNotifs) {
      const dateStrFixed = n.created_date.endsWith("Z")
        ? n.created_date
        : n.created_date + "Z";
      if (now - new Date(dateStrFixed).getTime() > ONE_DAY_MS) {
        expiredNotifs.push(n);
      } else {
        validNotifs.push(n);
      }
    }

    expiredNotifs.forEach((n) => {
      fetch(`http://localhost:8000/api/notifications/${n.id}`, {
        method: "DELETE",
      }).catch(() => {});
    });

    setNotifications(validNotifs);
    setLoading(false);

    const unread = validNotifs.filter(
      (n) => !n.read && n.type !== "follow_request",
    );
    for (const n of unread) {
      await base44.entities.Notification.update(n.id, { read: true });
    }
  };

  const handleFollowResponse = async (notif, action, e) => {
    if (e) e.stopPropagation();
    try {
      const follows = await base44.entities.UserFollow.filter({
        follower_email: notif.from_email,
        following_email: user.email,
        status: "pending",
      });

      if (follows.length > 0) {
        const followRecord = follows[0];
        if (action === "accept") {
          await base44.entities.UserFollow.update(followRecord.id, {
            status: "accepted",
          });

          await base44.entities.Notification.create({
            user_email: notif.from_email,
            type: "follow",
            title: "Request Accepted",
            content: `${user.full_name} accepted your follow request.`,
            from_email: user.email,
            from_name: user.full_name,
          });
        } else {
          await fetch(
            `http://localhost:8000/api/user-follows/${followRecord.id}`,
            { method: "DELETE" },
          );
        }
      }

      await base44.entities.Notification.update(notif.id, {
        read: true,
        content:
          action === "accept"
            ? "You accepted the request."
            : "You declined the request.",
      });

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notif.id
            ? {
                ...n,
                read: true,
                content:
                  action === "accept"
                    ? "You accepted the request."
                    : "You declined the request.",
              }
            : n,
        ),
      );
    } catch (err) {}
  };

  const handleDeleteItem = async (id, e) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await fetch(`http://localhost:8000/api/notifications/${id}`, {
      method: "DELETE",
    }).catch(() => {});
  };

  const handleClearAll = async () => {
    if (!window.confirm("Delete all notifications permanently?")) return;
    setNotifications([]);
    await fetch(
      `http://localhost:8000/api/notifications?user_email=${user.email}`,
      { method: "DELETE" },
    ).catch(() => {});
  };

  const handleNotifClick = (notif) => {
    if (notif.from_email) {
      navigate(`/Profile?user=${notif.from_email}`);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-white font-bold text-2xl">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-indigo-400 text-sm mt-0.5">
                {unreadCount} new
              </p>
            )}
          </div>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              onClick={handleClearAll}
              className="text-white/40 hover:text-red-400 hover:bg-red-500/10 h-9 px-3 text-xs rounded-xl flex items-center gap-1.5 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear All
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-3xl bg-white/[0.03] border border-white/5 flex items-center justify-center mb-4">
              <Bell className="w-7 h-7 text-white/10" />
            </div>
            <p className="text-white/30 text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif, i) => {
              const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.system;
              const Icon = cfg.icon || Bell;
              const isPendingRequest =
                notif.type === "follow_request" && !notif.read;

              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => handleNotifClick(notif)}
                  className={`cursor-pointer relative flex flex-col gap-2 p-3 rounded-2xl border transition-all hover:bg-white/[0.08] ${cfg.border} ${notif.read ? "bg-white/[0.01]" : "bg-white/[0.05]"} group`}
                >
                  <div className="flex items-start gap-3 pr-6">
                    <div
                      className={`w-8 h-8 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}
                    >
                      <Icon className={`w-4 h-4 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      {notif.title && (
                        <p className="text-white/90 text-sm font-medium leading-tight">
                          {notif.title}
                        </p>
                      )}
                      <p className="text-white/50 text-xs mt-0.5">
                        {notif.content}
                      </p>
                      <span className="text-white/20 text-[10px] block mt-1">
                        {timeAgo(notif.created_date)}
                      </span>
                    </div>
                    {!notif.read && !isPendingRequest && (
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2" />
                    )}
                  </div>

                  <button
                    onClick={(e) => handleDeleteItem(notif.id, e)}
                    className="absolute top-3 right-3 text-white/20 hover:text-white/60 p-1 bg-transparent hover:bg-white/5 rounded-full transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {isPendingRequest && (
                    <div className="flex gap-2 mt-1 ml-11 pr-2">
                      <Button
                        size="sm"
                        onClick={(e) =>
                          handleFollowResponse(notif, "accept", e)
                        }
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white h-7 text-xs font-semibold rounded-lg shadow-sm"
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        onClick={(e) =>
                          handleFollowResponse(notif, "decline", e)
                        }
                        className="flex-1 bg-white/10 hover:bg-white/20 text-white/70 h-7 text-xs font-semibold rounded-lg"
                      >
                        Decline
                      </Button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}







