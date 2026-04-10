// @ts-nocheck
import React, { useState, useEffect } from "react";
import { Plus, Play, Heart, MessageCircle, Send, MoreVertical, X, Search, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";

const formatLocalTime = (dateStr) => {
    if (!dateStr) return "";
    const dateStrFixed = dateStr.endsWith("Z") ? dateStr : dateStr + "Z";
    const diff = Date.now() - new Date(dateStrFixed).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
};

export default function PostGrid({ posts: initialPosts, onUpload, onPostDelete }) {
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showPostMenu, setShowPostMenu] = useState(false); 
  
  const [searchQuery, setSearchQuery] = useState("");
  const [newComment, setNewComment] = useState("");
  
  const [postComments, setPostComments] = useState([]);
  const [postLikesMap, setPostLikesMap] = useState({}); 
  const [connections, setConnections] = useState([]);

  // SMART FILTERING STATE
  const [activeTab, setActiveTab] = useState("posts");

  const navigate = useNavigate();
  const [me, setMe] = useState(null);

  useEffect(() => {
     setPosts(initialPosts);
  }, [initialPosts]);

  useEffect(() => {
      const initUser = async () => {
          try {
              const user = await base44.auth.me();
              setMe(user);
              const [followers, following] = await Promise.all([
                  base44.entities.UserFollow.filter({ following_email: user.email, status: "accepted" }),
                  base44.entities.UserFollow.filter({ follower_email: user.email, status: "accepted" })
              ]);
              const combined = new Map();
              followers.forEach(f => combined.set(f.follower_email, { email: f.follower_email, name: f.follower_name }));
              following.forEach(f => combined.set(f.following_email, { email: f.following_email, name: f.following_name }));
              setConnections(Array.from(combined.values()));
          } catch(e){}
      };
      initUser();
  }, []);

  useEffect(() => {
      if (selectedPost && me) {
          fetchPostInteractions(selectedPost.id);
      }
  }, [selectedPost]);

  const isVideo = (url) => url?.match(/\.(mp4|webm|ogg|mov)$/i);

  const fetchPostInteractions = async (postId) => {
      try {
          const res = await fetch(`http://localhost:8000/api/posts/${postId}/likes`);
          if (res.ok) {
              const userEmailsWhoLiked = await res.json();
              setPostLikesMap(prev => ({
                  ...prev, 
                  [postId]: { isLiked: userEmailsWhoLiked.includes(me.email), count: userEmailsWhoLiked.length }
              }));
          }
      } catch(e){}
  };

  const handleLike = async (e, post) => {
    e.stopPropagation();
    if(!me) return;

    const current = postLikesMap[post.id] || { isLiked: false, count: post.likes_count || 0 };
    const newIsLiked = !current.isLiked;
    const newCount = newIsLiked ? current.count + 1 : Math.max(0, current.count - 1);
    
    setPostLikesMap(prev => ({ ...prev, [post.id]: { isLiked: newIsLiked, count: newCount } }));

    try {
        await fetch(`http://localhost:8000/api/posts/${post.id}/like`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_email: me.email, user_name: me.full_name })
        });
    } catch(err){}
  };

  const openComments = async (post) => {
      setShowCommentsModal(true);
      try {
          const res = await fetch(`http://localhost:8000/api/posts/${post.id}/comments`);
          if(res.ok) {
              const data = await res.json();
              setPostComments(data);
          }
      } catch(e){}
  };

  const submitComment = async () => {
      if (!newComment.trim() || !me || !selectedPost) return;
      
      const commentPayload = { user_email: me.email, user_name: me.full_name, text: newComment };
      setPostComments(prev => [...prev, { ...commentPayload, id: Date.now() }]);
      setNewComment("");

      setPosts(prev => prev.map(p => p.id === selectedPost.id ? {...p, comments_count: (p.comments_count || 0) + 1} : p));

      try {
          await fetch(`http://localhost:8000/api/posts/${selectedPost.id}/comments`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(commentPayload)
          });
      } catch(e){}
  };

  const shareToChat = async (targetUser) => {
       if(!me || !selectedPost) return;

       setPosts(prev => prev.map(p => p.id === selectedPost.id ? {...p, shares_count: (p.shares_count || 0) + 1} : p));
       
       try {
           await fetch(`http://localhost:8000/api/posts/${selectedPost.id}/share`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ sender_email: me.email, sender_name: me.full_name, receiver_email: targetUser.email })
           });
           alert(`Post shared to ${targetUser.name} via Chat!`);
           setShowShareModal(false);
       } catch(e) {
           alert("Failed to share.");
       }
  };

  const handleDeletePost = async () => {
      if(!window.confirm("Permanently delete this post?")) return;
      
      const token = localStorage.getItem("base44_token") || me.email;
      const postId = selectedPost.id;

      setPosts(prev => prev.filter(p => p.id !== postId));
      setSelectedPost(null);
      setShowPostMenu(false);

      if (onPostDelete) onPostDelete(postId);

      try {
          await fetch(`http://localhost:8000/api/posts/${postId}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
          });
      } catch(e){}
  };

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-20 h-20 rounded-3xl bg-white/[0.03] border border-white/5 flex items-center justify-center mb-4">
          <span className="text-3xl">📸</span>
        </div>
        <p className="text-white/40 text-sm mb-4">No posts yet. Share your first moment!</p>
        <button onClick={onUpload} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium active:scale-95 transition-all">
          <Plus className="w-4 h-4" /> Upload Post
        </button>
      </div>
    );
  }

  const filteredConnections = connections.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // SMART FILTERING LOGIC
  const displayPosts = posts.filter((p) => {
     if (activeTab === "posts") return true; 
     return isVideo(p.image_url); // Automatically filter shorts
  });

  return (
    <>
      {/* TABS */}
      <div className="flex border-b border-white/5 mt-5">
        {[{ id: "posts", label: "Posts", icon: "⊞" }, { id: "short", label: "Shorts", icon: "▶" }].map((tab) => (
          <button 
             key={tab.id} 
             onClick={() => setActiveTab(tab.id)} 
             className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-medium transition-all ${activeTab === tab.id ? "text-white border-b-2 border-indigo-400" : "text-white/30 hover:text-white/50"}`}
          >
            <span>{tab.icon}</span>{tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-0.5 mt-0.5">
        {displayPosts.map((post, i) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
            onClick={() => setSelectedPost(post)}
            className="relative aspect-square bg-white/[0.03] overflow-hidden group cursor-pointer"
          >
            {isVideo(post.image_url) ? (
                <video src={post.image_url} preload="metadata" className="w-full h-full object-cover" muted playsInline />
            ) : (
                <img src={post.image_url} alt="post" className="w-full h-full object-cover" />
            )}

            {isVideo(post.image_url) && (
              <div className="absolute top-2 right-2"><Play className="w-4 h-4 text-white fill-white drop-shadow" /></div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-sm font-medium flex items-center gap-1">
                 <Heart className="w-4 h-4 fill-white" /> {postLikesMap[post.id]?.count ?? post.likes_count ?? 0}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedPost && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-[#08081a] flex flex-col">
            <div className="h-14 flex items-center justify-between px-4 border-b border-white/10 pt-safe relative">
               <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" onClick={() => setSelectedPost(null)} className="text-white/60 hover:text-white -ml-2"><X className="w-6 h-6"/></Button>
                  <div onClick={() => { setSelectedPost(null); navigate(`/Profile?user=${selectedPost.user_email}`); }} className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-all">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center font-bold text-white text-xs shadow-md">
                         {selectedPost.user_name?.charAt(0) || "U"}
                      </div>
                      <span className="text-white font-semibold text-sm">{selectedPost.user_name || "User"}</span>
                  </div>
               </div>
               
               <div className="relative">
                   <Button variant="ghost" size="icon" className="text-white/60" onClick={() => setShowPostMenu(!showPostMenu)}>
                       <MoreVertical className="w-5 h-5"/>
                   </Button>
                   {showPostMenu && me?.email === selectedPost.user_email && (
                       <div className="absolute right-0 top-10 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 min-w-[150px]">
                           <button onClick={handleDeletePost} className="flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-white/5 w-full text-left font-medium transition-all">
                               <Trash2 className="w-4 h-4" /> Delete Post
                           </button>
                       </div>
                   )}
               </div>
            </div>

            <div className="w-full bg-black flex flex-1 items-center justify-center overflow-hidden" onClick={() => setShowPostMenu(false)}>
               {isVideo(selectedPost.image_url) ? (
                   <video src={selectedPost.image_url} controls autoPlay loop playsInline className="w-full object-contain max-h-[70vh]" />
               ) : (
                   <img src={selectedPost.image_url} alt="post" className="w-full object-contain max-h-[70vh]" />
               )}
            </div>

            <div className="px-4 py-3 flex items-center justify-between bg-[#08081a]">
               <div className="flex items-center gap-4">
                  <motion.button whileTap={{ scale: 0.8 }} onClick={(e) => handleLike(e, selectedPost)}>
                     <Heart className={`w-7 h-7 ${postLikesMap[selectedPost.id]?.isLiked ? "fill-pink-500 text-pink-500" : "text-white hover:text-white/70"}`} />
                  </motion.button>
                  <button onClick={() => openComments(selectedPost)}><MessageCircle className="w-7 h-7 text-white hover:text-white/70" /></button>
                  <button onClick={() => setShowShareModal(true)}><Send className="w-7 h-7 text-white hover:text-white/70" /></button>
               </div>
            </div>

            <div className="px-4 pb-6 bg-[#08081a]">
               <div className="flex items-center gap-4 mb-2">
                   <p className="text-white/90 font-semibold text-sm">
                      {postLikesMap[selectedPost.id]?.count ?? selectedPost.likes_count ?? 0} likes
                   </p>
                   <p className="text-white/60 font-medium text-sm cursor-pointer hover:text-white" onClick={() => openComments(selectedPost)}>
                      {selectedPost.comments_count || 0} comments
                   </p>
                   <p className="text-white/60 font-medium text-sm">
                      {selectedPost.shares_count || 0} shares
                   </p>
               </div>
               
               {selectedPost.caption && (
                 <p className="text-sm text-white/90">
                    <span className="font-semibold mr-2">{selectedPost.user_name || "User"}</span>
                    {selectedPost.caption}
                 </p>
               )}
               <p className="text-white/30 text-[10px] uppercase tracking-wide mt-2">{formatLocalTime(selectedPost.created_date)}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCommentsModal && (
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed inset-x-0 bottom-0 z-[60] bg-[#111122] rounded-t-3xl border-t border-white/10 flex flex-col h-[75vh] shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
             <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-3 mb-2" />
             <div className="px-4 pb-2 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-white font-bold text-lg">Comments</h3>
                <button onClick={() => setShowCommentsModal(false)} className="text-white/50"><X className="w-5 h-5"/></button>
             </div>
             
             <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                 {postComments.map(c => (
                     <div key={c.id} className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold text-xs shrink-0">
                           {c.user_name?.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                            <div>
                                <span className="text-white text-xs font-semibold mr-2">{c.user_name}</span>
                                <span className="text-white/80 text-sm">{c.text}</span>
                            </div>
                            <span className="text-white/30 text-[9px] mt-0.5">{formatLocalTime(c.created_date)}</span>
                        </div>
                     </div>
                 ))}
                 {postComments.length === 0 && <p className="text-center text-white/30 mt-10">No comments yet. Be the first!</p>}
             </div>

             <div className="p-4 border-t border-white/5 bg-[#111122] pb-safe">
                 <div className="flex items-center bg-white/5 rounded-full px-4 py-1">
                     <input 
                        type="text" 
                        value={newComment}
                        onChange={(e)=>setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="flex-1 bg-transparent border-none text-white text-sm focus:outline-none py-2"
                     />
                     <button onClick={submitComment} disabled={!newComment.trim()} className="text-indigo-400 font-semibold text-sm ml-2 disabled:opacity-50">Post</button>
                 </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showShareModal && (
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed inset-x-0 bottom-0 z-[60] bg-[#111122] rounded-t-3xl border-t border-white/10 flex flex-col h-[70vh] shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-3 mb-4" />
            <div className="px-4 pb-4 border-b border-white/5 flex justify-between items-center">
               <h3 className="text-white font-bold text-lg">Share to Chat</h3>
               <button onClick={() => setShowShareModal(false)} className="text-white/50"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="px-4 py-3">
               <div className="bg-white/5 border border-white/10 rounded-xl flex items-center px-3 py-2">
                  <Search className="w-4 h-4 text-white/40 mr-2" />
                  <input 
                     type="text" 
                     placeholder="Search friends..." 
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="bg-transparent border-none text-white text-sm w-full focus:outline-none placeholder-white/30"
                  />
               </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4">
               {filteredConnections.map((f, idx) => (
                 <div key={idx} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                          {f.name?.charAt(0)}
                       </div>
                       <div>
                          <p className="text-white font-medium text-sm">{f.name}</p>
                          <p className="text-white/40 text-xs">{f.email}</p>
                       </div>
                    </div>
                    <Button onClick={() => shareToChat(f)} size="sm" className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-full px-5 h-8 text-xs font-semibold">
                       Send
                    </Button>
                 </div>
               ))}
               {filteredConnections.length === 0 && <p className="text-center text-white/40 mt-10">No connections found.</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}