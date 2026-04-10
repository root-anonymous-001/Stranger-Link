import React from "react";
import { motion } from "framer-motion";
import { Globe, MessageCircle, Users, Clock } from "lucide-react";

const stats = [
  { icon: Users, label: "Online Now", value: "2,847", color: "text-green-400" },
  { icon: MessageCircle, label: "Chats Today", value: "18.4K", color: "text-indigo-400" },
  { icon: Globe, label: "Countries", value: "120+", color: "text-purple-400" },
  { icon: Clock, label: "Avg Wait", value: "~3s", color: "text-pink-400" },
];

export default function StatsBar() {
  return (
    <section className="px-4 pb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="max-w-3xl mx-auto"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className="glass-light rounded-2xl p-4 text-center"
            >
              <stat.icon className={`w-5 h-5 mx-auto mb-2 ${stat.color}`} />
              <p className="text-xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-white/30 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}