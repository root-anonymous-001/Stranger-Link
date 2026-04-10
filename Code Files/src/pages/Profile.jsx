// @ts-nocheck
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Settings, X, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

import ProfileHeader from "../components/profile/ProfileHeader";
import PostGrid from "../components/profile/PostGrid";
import SettingsDrawer from "../components/profile/SettingsDrawer";
import VIPModal from "../components/profile/VIPModal";
import PostUploadModal from "../components/profile/PostUploadModal";
import LikeTierProgress from "../components/profile/LikeTierProgress";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(true);
  
  const [posts, setPosts] = useState([]);
  const [followersData, setFollowersData] = useState([]);
  const [followingData, setFollowingData] = useState([]);
  
  const [followStatus, setFollowStatus] = useState("none"); 
  const [followRecordId, setFollowRecordId] = useState(null);
  
  const [doesFollowMe, setDoesFollowMe] = useState(false);

  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [vipModalOpen, setVipModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => { loadData(); }, [window.location.search]);

  const loadData = async () => {
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) { base44.auth.redirectToLogin(); return; }
    
    const me = await base44.auth.me();
    setLoggedInUser(me);

    const urlParams = new URLSearchParams(window.location.search);
    const targetUserEmail = urlParams.get("user");

    let targetUser = me;
    let isOwn = true;

    if (targetUserEmail && targetUserEmail !== me.email) {
       isOwn = false;
       const fetchedUsers = await base44.entities.User.filter({ email: targetUserEmail });
       if (fetchedUsers.length > 0) targetUser = fetchedUsers[0];
    }

    setIsOwnProfile(isOwn);
    setUser(targetUser);
    
    const [userPosts, followersList, followingList] = await Promise.all([
      base44.entities.Post.filter({ user_email: targetUser.email }, "-created_date"),
      base44.entities.UserFollow.filter({ following_email: targetUser.email, status: "accepted" }),
      base44.entities.UserFollow.filter({ follower_email: targetUser.email, status: "accepted" }),
    ]);

    if (!isOwn) {
       const myFollowData = await base44.entities.UserFollow.filter({ follower_email: me.email, following_email: targetUser.email });
       if (myFollowData.length > 0) {
          setFollowStatus(myFollowData[0].status);
          setFollowRecordId(myFollowData[0].id);
       } else {
          setFollowStatus("none");
          setFollowRecordId(null);
       }

       const theyFollowData = await base44.entities.UserFollow.filter({ follower_email: targetUser.email, following_email: me.email, status: "accepted" });
       setDoesFollowMe(theyFollowData.length > 0);
    }
    
    const uniqueFollowers = Array.from(new Map(followersList.map(item => [item.follower_email, item])).values());
    const uniqueFollowing = Array.from(new Map(followingList.map(item => [item.following_email, item])).values());

    setPosts(userPosts);
    setFollowersData(uniqueFollowers);
    setFollowingData(uniqueFollowing);
    setLoading(false);
  };

  const handleUpdateUser = async (data) => {
    const updatedUser = await base44.auth.updateMe(data);
    setUser(updatedUser);
  };

  const handlePostUploaded = (post) => {
    setPosts((prev) => [post, ...prev]);
    setUploadModalOpen(false);
  };

  const handlePostDeleted = (deletedPostId) => {
      setPosts((prev) => prev.filter(p => p.id !== deletedPostId));
  };

  const handleToggleFollow = async () => {
    if (!user || isOwnProfile || !loggedInUser) return;
    const isUnfollowing = followStatus !== "none";

    if (isUnfollowing) {
        setFollowStatus("none");
        setFollowersData(prev => prev.filter(f => f.follower_email !== loggedInUser.email));
    } else {
        const expectedStatus = user.account_type === "private" ? "pending" : "accepted";
        setFollowStatus(expectedStatus);
        if (expectedStatus === "accepted") {
            setFollowersData(prev => {
                if (prev.some(f => f.follower_email === loggedInUser.email)) return prev;
                return [...prev, { follower_email: loggedInUser.email, follower_name: loggedInUser.full_name }];
            });
        }
    }

    try {
        if (isUnfollowing) {
            const existingFollows = await base44.entities.UserFollow.filter({ follower_email: loggedInUser.email, following_email: user.email });
            for (const f of existingFollows) {
                await base44.entities.UserFollow.delete(f.id);
            }
            setFollowRecordId(null);

            const notifs = await base44.entities.Notification.filter({ user_email: user.email });
            const spam = notifs.filter(n => n.from_email === loggedInUser.email && (n.type === 'follow' || n.type === 'follow_request'));
            for (const n of spam) {
                await base44.entities.Notification.delete(n.id);
            }
        } else {
            const payload = { follower_email: loggedInUser.email, following_email: user.email, follower_name: loggedInUser.full_name, following_name: user.full_name };
            const res = await base44.entities.UserFollow.create(payload);
            
            if (res) {
                setFollowStatus(res.status);
                setFollowRecordId(res.id);
                if (res.status === "accepted") {
                    setFollowersData(prev => {
                        if (prev.some(f => f.follower_email === loggedInUser.email)) return prev;
                        return [...prev, { follower_email: loggedInUser.email, follower_name: loggedInUser.full_name }];
                    });
                } else {
                    setFollowersData(prev => prev.filter(f => f.follower_email !== loggedInUser.email));
                }
            }
        }
    } catch (err) {}
  };

  const handleStartMessage = async () => {
    if (!user || isOwnProfile) return;
    const allSessions = await base44.entities.ChatSession.filter({});
    const existingSession = allSessions.find(s => 
        (s.user1_email === loggedInUser.email && s.user2_email === user.email) ||
        (s.user1_email === user.email && s.user2_email === loggedInUser.email)
    );

    if (existingSession) {
        navigate(`/Chat?session=${existingSession.id}`);
    } else {
        const newSession = await base44.entities.ChatSession.create({
            user1_email: loggedInUser.email, user1_name: loggedInUser.full_name, user1_gender: loggedInUser.gender,
            user2_email: user.email, user2_name: user.full_name, user2_gender: user.gender,
            status: "active", mode: "text"
        });
        navigate(`/Chat?session=${newSession.id}`);
    }
  };

  const handleUnfollowUser = async (targetEmail) => {
    setFollowingData(prev => prev.filter(f => f.following_email !== targetEmail));
    const existingFollows = await base44.entities.UserFollow.filter({ follower_email: loggedInUser.email, following_email: targetEmail });
    for (const f of existingFollows) {
        await base44.entities.UserFollow.delete(f.id);
    }
  };

  const handleRemoveFollower = async (followerEmail) => {
    const iFollowThem = followingData.some(f => f.following_email === followerEmail);
    let alsoUnfollow = false;

    if (iFollowThem) {
        alsoUnfollow = window.confirm("They are also in your Following list. Do you want to unfollow them as well?");
    }

    setFollowersData(prev => prev.filter(f => f.follower_email !== followerEmail));
    if (alsoUnfollow) {
        setFollowingData(prev => prev.filter(f => f.following_email !== followerEmail));
    }

    try {
        const incomingFollows = await base44.entities.UserFollow.filter({ follower_email: followerEmail, following_email: loggedInUser.email });
        for (const f of incomingFollows) {
            await base44.entities.UserFollow.delete(f.id);
        }

        if (alsoUnfollow) {
           const outgoingFollows = await base44.entities.UserFollow.filter({ follower_email: loggedInUser.email, following_email: followerEmail });
           for (const f of outgoingFollows) {
               await base44.entities.UserFollow.delete(f.id);
           }
        }
    } catch(err) {}
  };

  const handleFollowBack = async (targetEmail, targetName) => {
      setFollowingData(prev => [...prev, { following_email: targetEmail, following_name: targetName }]);
      const payload = { follower_email: loggedInUser.email, following_email: targetEmail, follower_name: loggedInUser.full_name, following_name: targetName };
      await base44.entities.UserFollow.create(payload);
  };

  const goToProfile = (email) => {
      setShowFollowersModal(false);
      setShowFollowingModal(false);
      navigate(`/Profile?user=${email}`);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  const isPrivateLocked = !isOwnProfile && user?.account_type === "private" && followStatus !== "accepted";

  return (
    <div className="min-h-screen pb-24 relative">
      {isOwnProfile && (
        <div className="absolute top-4 right-4 z-10">
          <button onClick={() => setSettingsOpen(true)} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all active:scale-95">
            <Settings className="w-5 h-5 text-white/60" />
          </button>
        </div>
      )}

      <ProfileHeader
        user={user}
        isOwnProfile={isOwnProfile}
        followStatus={followStatus}
        doesFollowMe={doesFollowMe}
        onToggleFollow={handleToggleFollow}
        onStartMessage={handleStartMessage} 
        postsCount={posts.length}
        followersCount={followersData.length}
        followingCount={followingData.length}
        onUpdateUser={handleUpdateUser}
        onVIPClick={() => setVipModalOpen(true)}
        onFollowersClick={!isPrivateLocked ? () => setShowFollowersModal(true) : null}
        onFollowingClick={!isPrivateLocked ? () => setShowFollowingModal(true) : null}
      />

      {isPrivateLocked ? (
        <div className="flex flex-col items-center justify-center py-24 text-center px-4 mt-4 border-t border-white/5">
            <div className="w-20 h-20 rounded-full border-2 border-white/10 flex items-center justify-center mb-4">
               <Lock className="w-8 h-8 text-white/30" />
            </div>
            <h2 className="text-white font-bold text-lg mb-1">This Account is Private</h2>
            <p className="text-white/50 text-sm max-w-[250px]">Follow @{user?.full_name?.split(' ')?.[0]?.toLowerCase() || "user"} to see their photos, videos, and insights.</p>
        </div>
      ) : (
        <>
          <LikeTierProgress user={user} />
          <PostGrid posts={posts} onUpload={() => setUploadModalOpen(true)} onPostDelete={handlePostDeleted} />
          {isOwnProfile && (
            <button onClick={() => setUploadModalOpen(true)} className="fixed bottom-24 right-5 w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg shadow-purple-500/30 flex items-center justify-center text-white text-2xl active:scale-95 transition-all z-40 border border-white/10">
              +
            </button>
          )}
        </>
      )}

      <AnimatePresence>
        {showFollowersModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-[#111122] border border-white/10 p-6 rounded-3xl max-w-md w-full max-h-[70vh] flex flex-col shadow-2xl">
              <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-white">Followers</h3><Button variant="ghost" size="icon" onClick={() => setShowFollowersModal(false)} className="text-white/50 hover:text-white"><X className="w-5 h-5"/></Button></div>
              <div className="overflow-y-auto space-y-3 flex-1 scrollbar-hide">
                 {followersData.length === 0 ? <p className="text-center text-white/40 py-10">No followers yet.</p> : followersData.map((f) => {
                     const amIFollowingThem = followingData.some(follow => follow.following_email === f.follower_email);

                     return (
                       <div key={f.id || f.follower_email} className="flex items-center justify-between p-2 bg-white/5 border border-white/5 rounded-2xl">
                         <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => goToProfile(f.follower_email)}>
                           <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">{f.follower_name?.charAt(0) || "?"}</div>
                           <span className="text-white font-medium hover:underline">{f.follower_name}</span>
                         </div>
                         {isOwnProfile && (
                             <div className="flex gap-2">
                                 {!amIFollowingThem && (
                                     <Button size="sm" onClick={() => handleFollowBack(f.follower_email, f.follower_name)} className="h-7 text-xs bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg">Follow Back</Button>
                                 )}
                                 <Button variant="ghost" size="sm" onClick={() => handleRemoveFollower(f.follower_email)} className="h-7 text-xs bg-white/10 hover:bg-white/20 text-white rounded-lg">Remove</Button>
                             </div>
                         )}
                       </div>
                     )
                 })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFollowingModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-[#111122] border border-white/10 p-6 rounded-3xl max-w-md w-full max-h-[70vh] flex flex-col shadow-2xl">
              <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-white">Following</h3><Button variant="ghost" size="icon" onClick={() => setShowFollowingModal(false)} className="text-white/50 hover:text-white"><X className="w-5 h-5"/></Button></div>
              <div className="overflow-y-auto space-y-3 flex-1 scrollbar-hide">
                 {followingData.length === 0 ? <p className="text-center text-white/40 py-10">Not following anyone.</p> : followingData.map((f) => (
                   <div key={f.id || f.following_email} className="flex items-center justify-between p-2 bg-white/5 border border-white/5 rounded-2xl">
                     <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => goToProfile(f.following_email)}>
                       <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold">{f.following_name?.charAt(0) || "?"}</div>
                       <span className="text-white font-medium hover:underline">{f.following_name}</span>
                     </div>
                     {isOwnProfile && (
                         <Button variant="ghost" size="sm" onClick={() => handleUnfollowUser(f.following_email)} className="h-7 text-xs bg-white/10 hover:bg-red-500/20 hover:text-red-400 text-white rounded-lg">Unfollow</Button>
                     )}
                   </div>
                 ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} user={user} onUpdateUser={handleUpdateUser} onVIPClick={() => { setSettingsOpen(false); setVipModalOpen(true); }} />
      <VIPModal open={vipModalOpen} onClose={() => setVipModalOpen(false)} user={user} />
      <PostUploadModal open={uploadModalOpen} onClose={() => setUploadModalOpen(false)} user={user} onUploaded={handlePostUploaded} activeTab={"posts"} />
    </div>
  );
}