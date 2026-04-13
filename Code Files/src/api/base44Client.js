// src/components/profile/SettingsDrawer.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Crown, Lock, Unlock, Bell, Shield, HelpCircle, Flag,
  FileText, UserX, Trash2, LogOut, ChevronRight, Moon,
  ChevronDown, ChevronUp, Mail, AlertTriangle, Ban, Unlock as UnlockIcon, Palette
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const formatBlockTime = (dateStr) => {
  if (!dateStr) return "";
  const utcDateStr = dateStr.endsWith("Z") ? dateStr : dateStr + "Z";
  return new Date(utcDateStr).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
};

const THEMES = [
  { id: "theme-default", name: "Dark Mode" },
  { id: "theme-ocean", name: "Deep Ocean" },
  { id: "theme-sunset", name: "Neon Sunset" },
  { id: "theme-royal", name: "Royal Purple" }
];

export default function SettingsDrawer({ open, onClose, user, onUpdateUser, onVIPClick }) {
  const [accountType, setAccountType] = useState(user?.account_type || "public");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [expandedSection, setExpandedSection] = useState(null);
  const [currentTheme, setCurrentTheme] = useState(localStorage.getItem("strangerlink_theme") || "theme-default");
  
  const [showBlockListModal, setShowBlockListModal] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState([]);
  
  const navigate = useNavigate();

  useEffect(() => {
    if (showBlockListModal && user) fetchBlockedUsers();
  }, [showBlockListModal, user]);

  const fetchBlockedUsers = async () => {
    try {
      const blocks = await base44.entities.UserBlock.filter({ blocker_email: user.email });
      const detailedBlocks = await Promise.all(blocks.map(async b => {
         const u = await base44.entities.User.filter({ email: b.blocked_email });
         return { ...b, blocked_name: u[0]?.full_name || "Unknown", blocked_email: b.blocked_email };
      }));
      setBlockedUsers(detailedBlocks);
    } catch (err) { console.error("Error fetching blocks", err); }
  };

  const handleUnblock = async (blockId) => {
    await base44.entities.UserBlock.delete(blockId);
    setBlockedUsers(prev => prev.filter(b => b.id !== blockId));
  };

  const handleAccountTypeToggle = async () => {
    const newType = accountType === "public" ? "private" : "public";
    setAccountType(newType);
    await onUpdateUser({ account_type: newType });
  };

  const changeTheme = (themeId) => {
    setCurrentTheme(themeId);
    localStorage.setItem('strangerlink_theme', themeId);
    document.body.classList.remove('theme-default', 'theme-ocean', 'theme-sunset', 'theme-forest', 'theme-royal');
    document.body.classList.add(themeId);
  };

  const handleDeleteAccount = async () => {
    if (deleteText.toLowerCase() !== "delete") return;
    try {
      await base44.auth.deleteAccount('delete');
      base44.auth.logout();
    } catch(e) { alert("Error deleting account"); }
  };

  const handleDeactivate = async () => {
    try {
      await base44.auth.deleteAccount('deactivate');
      base44.auth.logout();
    } catch(e) { alert("Error deactivating account"); }
  };

  const handleGoToNotifications = () => {
    onClose();
    navigate(createPageUrl("Notifications"));
  };

  const toggleExpand = (key) => setExpandedSection((prev) => (prev === key ? null : key));

  const EXPANDABLE_CONTENT = {
    theme: {
      title: "App Theme",
      body: (
        <div className="grid grid-cols-2 gap-2 mt-2">
          {THEMES.map(theme => (
            <button 
              key={theme.id} onClick={() => changeTheme(theme.id)}
              className={`p-3 rounded-xl border text-sm transition-all ${currentTheme === theme.id ? "bg-indigo-500/20 border-indigo-500 text-indigo-300 font-bold" : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"}`}
            >
              {theme.name}
            </button>
          ))}
        </div>
      )
    },
    help: {
      title: "Help & Support",
      body: (
        <div className="space-y-3 text-sm text-white/50">
          <p>📧 Email us: <span className="text-indigo-400">backdoorgates@gmail.com</span></p>
          <p>💬 For account issues, send your registered email and describe the problem.</p>
        </div>
      ),
    },
    report: {
      title: "Report a Problem",
      body: <ReportForm user={user} onDone={() => setExpandedSection(null)} />,
    },
    privacy: {
      title: "Privacy & Safety",
      body: (
        <div className="space-y-3 text-sm text-white/50 leading-relaxed">
          <p>🔒 Set your account to <span className="text-white/70">Private</span> so only followers can see your profile.</p>
          <div onClick={() => setShowBlockListModal(true)} className="flex items-center justify-between p-3 mt-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 cursor-pointer transition-all">
             <div className="flex items-center gap-2"><Ban className="w-4 h-4 text-orange-400" /><span className="text-white/80 font-medium">Manage Blocked Accounts</span></div>
             <ChevronRight className="w-4 h-4 text-white/30" />
          </div>
        </div>
      ),
    },
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={onClose} />
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 300 }} className="fixed top-0 right-0 bottom-0 w-[88vw] max-w-sm z-50 overflow-y-auto" style={{ paddingBottom: "env(safe-area-inset-bottom)" }} onClick={(e) => e.stopPropagation()}>
            <div className="glass min-h-full">
              <div className="sticky top-0 glass flex items-center justify-between px-5 py-4 border-b border-white/5 z-10">
                <h2 className="text-white font-semibold text-lg">Settings</h2>
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all active:scale-95"><X className="w-4 h-4 text-white/60" /></button>
              </div>

              <div className="px-5 py-4 flex items-center gap-3 border-b border-white/5">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-sm font-bold text-white">{user?.full_name?.[0]?.toUpperCase() || "?"}</div>
                <div>
                  <p className="text-white font-medium text-sm">{user?.full_name || "Anonymous"}</p>
                  <p className="text-white/30 text-xs">@{user?.username || user?.email?.split("@")[0]}</p>
                </div>
              </div>

              <div className="px-4 py-4 space-y-5">
                <SettingsSection title="Account">
                  <SettingsItem icon={accountType === "public" ? Unlock : Lock} label="Account Type" value={accountType === "public" ? "Public" : "Private"} desc={accountType === "public" ? "Anyone can see your profile" : "Only followers can see your profile"} toggle toggleOn={accountType === "private"} onAction={handleAccountTypeToggle} />
                  <SettingsItem icon={Crown} label="VIP Membership" value={user?.is_vip ? "Active ✓" : "₹199/mo"} desc={user?.is_vip ? "Unlimited matches + perks" : "Unlock unlimited daily matches"} highlight={!user?.is_vip} onAction={onVIPClick} />
                </SettingsSection>

                <SettingsSection title="Preferences">
                  <SettingsItem icon={Bell} label="Notifications" desc="View your notifications" onAction={handleGoToNotifications} />
                  <ExpandableItem icon={Shield} label="Privacy & Safety" desc="Control who can contact you" expanded={expandedSection === "privacy"} onToggle={() => toggleExpand("privacy")} content={EXPANDABLE_CONTENT.privacy.body} />
                  <ExpandableItem icon={Palette} label="App Theme" desc="Customize your experience" expanded={expandedSection === "theme"} onToggle={() => toggleExpand("theme")} content={EXPANDABLE_CONTENT.theme.body} />
                </SettingsSection>

                <SettingsSection title="Support">
                  <ExpandableItem icon={HelpCircle} label="Help & Support" desc="FAQs and contact info" expanded={expandedSection === "help"} onToggle={() => toggleExpand("help")} content={EXPANDABLE_CONTENT.help.body} />
                  <ExpandableItem icon={Flag} label="Report a Problem" desc="Let us know what went wrong" expanded={expandedSection === "report"} onToggle={() => toggleExpand("report")} content={EXPANDABLE_CONTENT.report.body} />
                </SettingsSection>

                <SettingsSection title="Danger Zone">
                  <SettingsItem icon={UserX} label="Deactivate Account" desc="Temporarily hide your account" danger onAction={() => setShowDeactivateDialog(true)} />
                  <SettingsItem icon={Trash2} label="Delete Account" desc="Permanently delete all data" danger onAction={() => setShowDeleteDialog(true)} />
                  <SettingsItem icon={LogOut} label="Sign Out" desc="Log out of StrangerLink" danger onAction={() => base44.auth.logout()} />
                </SettingsSection>
              </div>
            </div>
          </motion.div>

          <AnimatePresence>
            {showDeleteDialog && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60">
                <div className="glass rounded-3xl p-6 w-full max-w-sm">
                  <h3 className="text-white font-bold text-lg mb-2 text-red-400">Delete Account?</h3>
                  <p className="text-white/40 text-sm mb-4">Type <span className="text-red-300 font-bold">delete</span> below to confirm.</p>
                  <input type="text" value={deleteText} onChange={(e) => setDeleteText(e.target.value)} placeholder='Type "delete"' className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white mb-3" />
                  <div className="flex gap-2">
                    <button onClick={() => setShowDeleteDialog(false)} className="flex-1 py-2.5 rounded-xl bg-white/5 text-white/60">Cancel</button>
                    <button onClick={handleDeleteAccount} disabled={deleteText.toLowerCase() !== "delete"} className="flex-1 py-2.5 rounded-xl bg-red-500/20 text-red-400 disabled:opacity-30">Delete</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showDeactivateDialog && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60">
                <div className="glass rounded-3xl p-6 w-full max-w-sm">
                  <h3 className="text-white font-bold text-lg mb-2 text-yellow-400">Deactivate Account?</h3>
                  <p className="text-white/40 text-sm mb-5">Your profile will be hidden. You can reactivate by logging back in.</p>
                  <div className="flex gap-2">
                    <button onClick={() => setShowDeactivateDialog(false)} className="flex-1 py-2.5 rounded-xl bg-white/5 text-white/60">Cancel</button>
                    <button onClick={handleDeactivate} className="flex-1 py-2.5 rounded-xl bg-yellow-500/20 text-yellow-400">Deactivate</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}

function SettingsSection({ title, children }) {
  return (
    <div>
      <p className="text-white/30 text-[10px] uppercase tracking-wider font-medium mb-2 px-1">{title}</p>
      <div className="rounded-2xl overflow-hidden bg-white/[0.03] border border-white/5 divide-y divide-white/5">{children}</div>
    </div>
  );
}

function SettingsItem({ icon: Icon, label, desc, value, danger, highlight, toggle, toggleOn, onAction, noChevron }) { 
  return (
    <button onClick={onAction} className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all ${danger ? "hover:bg-red-500/5" : "hover:bg-white/[0.04]"}`}>
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${danger ? "bg-red-500/10" : highlight ? "bg-yellow-500/10" : "bg-white/5"}`}>
        <Icon className={`w-4 h-4 ${danger ? "text-red-400" : highlight ? "text-yellow-400" : "text-white/50"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${danger ? "text-red-300" : "text-white/80"}`}>{label}</p>
        {desc && <p className="text-xs text-white/30 mt-0.5">{desc}</p>}
      </div>
      {value && !toggle && <span className={`text-xs font-medium flex-shrink-0 ${highlight ? "text-yellow-400" : "text-white/40"}`}>{value}</span>}
      {!toggle && !noChevron && <ChevronRight className="w-4 h-4 text-white/20 flex-shrink-0" />}
      {toggle && (
        <div className={`relative flex-shrink-0 rounded-full transition-colors ${toggleOn ? "bg-indigo-500" : "bg-white/10"}`} style={{ width: 40, height: 22 }}>
          <div className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow transition-all ${toggleOn ? "left-[20px]" : "left-[3px]"}`} />
        </div>
      )}
    </button>
  );
}

function ExpandableItem({ icon: Icon, label, desc, expanded, onToggle, content }) {
  return (
    <div>
      <button onClick={onToggle} className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-white/[0.04] transition-all">
        <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0"><Icon className="w-4 h-4 text-white/50" /></div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white/80">{label}</p>
          {desc && <p className="text-xs text-white/30 mt-0.5">{desc}</p>}
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/20" />}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 pt-1 border-t border-white/5 bg-white/[0.02]">{content}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ReportForm({ user, onDone }) {
  const [issue, setIssue] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!issue.trim()) return;
    setSending(true);
    await base44.entities.Notification.create({
      user_email: "admin@strangerlink.app", type: "system", title: `Problem Report from ${user?.email}`,
      content: issue, from_email: user?.email, from_name: user?.full_name || "Anonymous", read: false,
    });
    setSent(true);
    setSending(false);
    setTimeout(onDone, 1500);
  };

  if (sent) return <p className="text-green-400 text-sm py-2">✅ Report sent! We'll look into it.</p>;

  return (
    <div className="space-y-2">
      <textarea value={issue} onChange={(e) => setIssue(e.target.value)} placeholder="Describe the problem..." rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/20 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
      <button onClick={handleSend} disabled={!issue.trim() || sending} className="w-full py-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm font-medium disabled:opacity-30">
        {sending ? "Sending..." : "Send Report"}
      </button>
    </div>
  );
}




// Supabase string: postgresql://postgres.byaysrildtutmegvrtul:Root%40...%237431@aws-1-ap-south-1.pooler.supabase.com:6543/postgres
