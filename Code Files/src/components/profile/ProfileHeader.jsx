// @ts-nocheck
import React, { useState, useRef } from "react";
import { Camera, Edit3, Check, X, Crown, ExternalLink, UserPlus, UserCheck, MessageCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function ProfileHeader({ user, isOwnProfile = true, followStatus, onToggleFollow, postsCount, followersCount, followingCount, onUpdateUser, onVIPClick, onFollowersClick, onFollowingClick, onStartMessage, doesFollowMe }) {
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(user?.bio || "");
  const [website, setWebsite] = useState(user?.website || "");
  const [editName, setEditName] = useState(user?.full_name || ""); 
  const [editUsername, setEditUsername] = useState(user?.username || user?.email?.split("@")[0] || ""); 
  
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileRef = useRef(null);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await onUpdateUser({ avatar_url: file_url });
    setUploadingAvatar(false);
  };

  const handleSave = async () => {
    // NAYA: Saving the username along with other details
    await onUpdateUser({ full_name: editName, username: editUsername, bio, website });
    setEditing(false);
  };

  const stats = [
    { label: "Posts", value: postsCount, action: null },
    { label: "Followers", value: followersCount, action: onFollowersClick },
    { label: "Following", value: followingCount, action: onFollowingClick },
  ];

  return (
    <div className="px-4 pt-2 pb-4">
      <div className="flex items-start gap-4">
        <div className="relative flex-shrink-0">
          <div className="w-24 h-24 rounded-full p-[2px] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
            <div className="w-full h-full rounded-full overflow-hidden bg-[#0f0f24] flex items-center justify-center">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-white">
                  {user?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?"}
                </span>
              )}
            </div>
          </div>
          {isOwnProfile && (
            <button onClick={() => fileRef.current?.click()} disabled={uploadingAvatar} className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-indigo-500 border-2 border-[#08081a] flex items-center justify-center active:scale-95 transition-all">
              {uploadingAvatar ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Camera className="w-3 h-3 text-white" />}
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>

        <div className="flex-1 flex items-center justify-around pt-3">
          {stats.map((s) => (
            <div key={s.label} onClick={s.action} className={`text-center ${s.action ? "cursor-pointer hover:opacity-70 active:scale-95 transition-all" : ""}`}>
              <p className="text-white font-bold text-xl leading-none">{s.value}</p>
              <p className="text-white/40 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-white font-semibold text-base">{user?.full_name || "Anonymous"}</p>
          {user?.is_vip && <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-[10px] font-semibold"><Crown className="w-3 h-3" /> VIP</span>}
        </div>
        
        {!isOwnProfile && (
           <div className="mb-1.5">
               {doesFollowMe ? (
                   <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                       Follows You
                   </span>
               ) : (
                   <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-red-500/10 text-red-300/80 border border-red-500/20">
                       Not Follows You
                   </span>
               )}
           </div>
        )}

        {/* NAYA: Email hide karke Unique Username dikha raha hu */}
        <p className="text-indigo-400 text-xs mt-0.5">@{user?.username || user?.email?.split("@")[0]}</p>

        {editing ? (
          <div className="mt-2 space-y-2">
            <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Display Name" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
            
            {/* NAYA: Username Edit Input */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">@</span>
              <input value={editUsername} onChange={(e) => setEditUsername(e.target.value)} placeholder="username" className="w-full bg-white/5 border border-white/10 rounded-xl pl-7 pr-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
            </div>

            <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Write your bio..." rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/20 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
            <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="Website URL" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
            <div className="flex gap-2">
              <button onClick={handleSave} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-500 text-white text-xs font-medium active:scale-95 transition-all"><Check className="w-3 h-3" /> Save</button>
              <button onClick={() => setEditing(false)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 text-white/60 text-xs font-medium active:scale-95 transition-all"><X className="w-3 h-3" /> Cancel</button>
            </div>
          </div>
        ) : (
          <>
            {user?.bio && <p className="text-white/70 text-sm mt-1 leading-relaxed">{user.bio}</p>}
            {user?.website && <a href={user.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-indigo-400 text-xs mt-1 hover:underline"><ExternalLink className="w-3 h-3" /> {user.website.replace(/^https?:\/\//, "")}</a>}
          </>
        )}
      </div>

      <div className="flex gap-2 mt-4">
        {isOwnProfile ? (
          <>
            <button onClick={() => { setEditName(user?.full_name || ""); setEditUsername(user?.username || user?.email?.split("@")[0] || ""); setEditing(true); }} className="flex-1 py-2 rounded-xl bg-white/[0.07] border border-white/10 text-white text-sm font-medium hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center gap-1.5"><Edit3 className="w-3.5 h-3.5" /> Edit Profile</button>
            {!user?.is_vip && <button onClick={onVIPClick} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 text-yellow-300 text-sm font-medium hover:opacity-80 active:scale-95 transition-all"><Crown className="w-3.5 h-3.5" /> VIP</button>}
          </>
        ) : (
          <>
            <button onClick={onToggleFollow} className={`flex-1 py-2 rounded-xl text-sm font-medium active:scale-95 transition-all flex items-center justify-center gap-1.5 ${followStatus === 'accepted' ? 'bg-white/10 text-white' : followStatus === 'pending' ? 'bg-orange-500/20 text-orange-300' : 'bg-indigo-500 text-white'}`}>
               {followStatus === 'accepted' ? <><UserCheck className="w-4 h-4"/> Following</> : followStatus === 'pending' ? 'Requested' : <><UserPlus className="w-4 h-4"/> Follow</>}
            </button>
            <button onClick={onStartMessage} className="flex-1 py-2 rounded-xl bg-white/10 text-white text-sm font-medium hover:bg-white/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"><MessageCircle className="w-4 h-4" /> Message</button>
          </>
        )}
      </div>
    </div>
  );
}