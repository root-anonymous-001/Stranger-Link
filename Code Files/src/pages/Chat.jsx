// @ts-nocheck
import React, { useState, useEffect, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import WaitingScreen from "../components/chat/WaitingScreen";
import ChatMessages from "../components/chat/ChatMessages";
import ChatInput from "../components/chat/ChatInput";
import ChatHeader from "../components/chat/ChatHeader";
import PullToRefresh from "../components/ui/PullToRefresh";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Save, Clock, Trash2, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Chat() {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [partner, setPartner] = useState(null);
  const [followStatus, setFollowStatus] = useState("none"); 
  const [followRecordId, setFollowRecordId] = useState(null);

  const [hasLiked, setHasLiked] = useState(false);
  const [likeRecordId, setLikeRecordId] = useState(null);

  const [savedChatsList, setSavedChatsList] = useState([]);
  const [recentMatches, setRecentMatches] = useState([]);

  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [viewImage, setViewImage] = useState(null); 

  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get("session");
  const sessionRef = useRef(session);
  
  const isTogglingFollow = useRef(false);

  useEffect(() => { sessionRef.current = session; }, [session]);

  useEffect(() => {
    initChat();
    return () => {
      const s = sessionRef.current;
      if (s?.status === "active" && !s.saved_by_user1 && !s.saved_by_user2) {
        fetch(`http://localhost:8000/api/chat-sessions/${s.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: "ended" }), keepalive: true
        });
        fetch(`http://localhost:8000/api/messages`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: s.id, sender_email: "system", sender_name: "System",
            content: "The stranger has disconnected.", type: "system"
          }), keepalive: true
        });
      }
    };
  }, []);

  const fetchGlobalData = async (me) => {
    try {
        const blockData = await fetch(`http://localhost:8000/api/blocks?blocker_email=${me.email}`).then(res => res.json());
        const blockedEmails = blockData.map(b => b.blocked_email);

        const allSessions = await base44.entities.ChatSession.filter({});
        
        const mySessions = allSessions.filter(s => {
           const isMySession = s.user1_email === me.email || s.user2_email === me.email;
           const pEmail = s.user1_email === me.email ? s.user2_email : s.user1_email;
           return isMySession && !blockedEmails.includes(pEmail);
        });
        
        const recent = [...mySessions].sort((a,b) => new Date(b.created_date) - new Date(a.created_date));
        setRecentMatches(recent);

        const mySaved = mySessions.filter(s => 
          (s.user1_email === me.email && s.saved_by_user1) || 
          (s.user2_email === me.email && s.saved_by_user2)
        );
        
        const allMessages = await base44.entities.Message.filter({});
        const enrichedSaved = mySaved.map(s => {
          const unreadCount = allMessages.filter(m => m.session_id === s.id && m.sender_email !== me.email && !m.is_read).length;
          return { ...s, unreadCount };
        });
        setSavedChatsList(enrichedSaved);
    } catch(err) {
        console.error("Failed to load chat data", err);
    }
  };

  const initChat = async () => {
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) { base44.auth.redirectToLogin(); return; }
    const me = await base44.auth.me();
    setUser(me);

    try {
        if (sessionId) await loadSession(sessionId, me);
        else await fetchGlobalData(me);
    } catch(err) {
        console.error(err);
    } finally {
        setLoading(false); // THE FIX: Ensures infinite loading loop is broken
    }
  };

  const loadSession = async (id, me) => {
    const s = await base44.entities.ChatSession.filter({ id });
    if (s.length > 0) {
      setSession(s[0]);
      const msgs = await base44.entities.Message.filter({ session_id: id }, "created_date");
      setMessages(msgs);
      await fetch(`http://localhost:8000/api/messages/read/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: me.email })
      });
    }
  };

  useEffect(() => {
    if (!user) return; 
    
    const interval = setInterval(async () => {
      try {
          if (sessionId) {
            await loadSession(sessionId, user);
            const s = sessionRef.current;
            if (s) {
                 const pEmail = s.user1_email === user.email ? s.user2_email : s.user1_email;
                 if (pEmail) {
                   const pData = await base44.entities.User.filter({ email: pEmail });
                   if(pData.length > 0) setPartner(pData[0]);
                   
                   if (!isTogglingFollow.current) {
                       const followData = await base44.entities.UserFollow.filter({ follower_email: user.email, following_email: pEmail });
                       if(followData.length > 0) { 
                           setFollowStatus(followData[0].status); 
                           setFollowRecordId(followData[0].id); 
                       } else { 
                           setFollowStatus("none"); 
                           setFollowRecordId(null); 
                       }
                   }

                   const likeData = await base44.entities.ChatLike.filter({ liker_email: user.email, liked_email: pEmail });
                   if(likeData.length > 0) { setHasLiked(true); setLikeRecordId(likeData[0].id); } 
                   else { setHasLiked(false); }
                 }
            }
          } else {
            await fetchGlobalData(user);
          }
      } catch(e) {}
    }, 1000); 
    
    return () => clearInterval(interval);
  }, [sessionId, user]);

  const handleRefresh = useCallback(async () => {
    if (!sessionId) await fetchGlobalData(user);
    else await loadSession(sessionId, user);
  }, [sessionId, user]);

  const handleSendMessage = async (content, mediaUrl, mediaType) => {
    if (!session) return;
    let msgType = "text";
    
    if (mediaType === "image") {
      const isAlreadyTrusted = messages.some(m => m.sender_email === user.email && m.type === "image");
      msgType = isAlreadyTrusted ? "image" : "image_request";
    } 
    else if (mediaType === "audio") {
      msgType = "audio";
    }

    const newMsg = await base44.entities.Message.create({
      session_id: session.id, sender_email: user.email, sender_name: user.full_name || "Stranger",
      content: content || "", type: msgType, ...(mediaUrl ? { media_url: mediaUrl, media_type: mediaType } : {}),
    });
    
    setMessages(prev => [...prev, newMsg]);
  };

  const handleUpdateMessage = async (msgId, newType) => {
    await base44.entities.Message.update(msgId, { type: newType });
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, type: newType } : m));
  };

  const handleUnsend = async (msgId) => {
     await fetch(`http://localhost:8000/api/messages/${msgId}`, { method: 'DELETE' });
     handleRefresh();
  };

  const handleDeleteChat = async () => {
     if (window.confirm("Delete this chat permanently?")) {
        await fetch(`http://localhost:8000/api/chat-sessions/${session.id}`, { method: 'DELETE' });
        navigate(createPageUrl("Home"));
     }
  };

  const executeBlock = async (deleteChat) => {
    const pEmail = session.user1_email === user.email ? session.user2_email : session.user1_email;
    await fetch(`http://localhost:8000/api/blocks`, {
       method: 'POST', headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ blocker_email: user.email, blocked_email: pEmail, delete_chat: deleteChat, session_id: session.id })
    });
    setShowBlockModal(false);
    navigate(createPageUrl("Home"));
  };

  const saveChatHistory = async () => {
    const isUser1 = session.user1_email === user.email;
    const payload = isUser1 ? { saved_by_user1: true } : { saved_by_user2: true };
    
    if (isUser1) sessionRef.current.saved_by_user1 = true;
    else sessionRef.current.saved_by_user2 = true;

    await base44.entities.ChatSession.update(session.id, payload);
    setShowSavePrompt(false);
    navigate(createPageUrl("Chat"));
  };

  const handleToggleFollow = async () => {
    if (!partner) return;
    
    isTogglingFollow.current = true;

    if (followStatus !== "none") {
        setFollowStatus("none");
        setFollowRecordId(null);

        (async () => {
            try {
                const existingFollows = await base44.entities.UserFollow.filter({
                    follower_email: user.email, following_email: partner.email
                });
                for (const f of existingFollows) {
                    await base44.entities.UserFollow.delete(f.id).catch(()=>{});
                }
            } catch(e) {}
        })();
    } else {
        setFollowStatus("pending"); 

        const newFollow = await base44.entities.UserFollow.create({
            follower_email: user.email, following_email: partner.email,
            follower_name: user.full_name, following_name: partner.full_name
        });
        setFollowStatus(newFollow.status); 
        setFollowRecordId(newFollow.id);
    }

    setTimeout(() => { isTogglingFollow.current = false; }, 2000);
  };

  const handleToggleLike = async () => {
      if (!partner) return;
      if (hasLiked && likeRecordId) {
          await base44.entities.ChatLike.delete(likeRecordId);
          setHasLiked(false);
          setPartner(prev => ({...prev, total_likes: prev.total_likes - 1}));
      } else {
          const newLike = await base44.entities.ChatLike.create({
              liker_email: user.email, liked_email: partner.email, session_id: session.id
          });
          setHasLiked(true);
          setLikeRecordId(newLike.id);
          setPartner(prev => ({...prev, total_likes: prev.total_likes + 1}));
      }
  };

  const getPartnerName = (s) => {
    if (!s || !user) return "Stranger";
    return s.user1_email === user.email ? (s.user2_name || "Stranger") : (s.user1_name || "Stranger");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  if (!sessionId) {
    return (
      <div className="flex flex-col h-full bg-[#08081a] p-4 max-w-2xl mx-auto w-full">
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4">Recent Matches</h2>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {recentMatches.length === 0 ? (
               <p className="text-white/30 text-xs italic">No matches yet</p>
            ) : (
               recentMatches.map(m => {
                 const pName = getPartnerName(m);
                 return (
                   <div key={`rm-${m.id}`} onClick={() => navigate(createPageUrl("Chat") + `?session=${m.id}`)} className="flex flex-col items-center gap-1 cursor-pointer min-w-[60px]">
                     <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500/50 to-purple-500/50 flex items-center justify-center text-white font-bold text-lg border-2 border-[#08081a] ring-2 ring-indigo-500/30">
                       {pName?.charAt(0) || "?"}
                     </div>
                     <span className="text-[10px] text-white/70 truncate w-full text-center">{pName}</span>
                   </div>
                 )
               })
            )}
          </div>
        </div>

        <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4">Saved Messages</h2>
        {savedChatsList.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center mt-10">
            <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mx-auto mb-4"><MessageCircle className="w-8 h-8 text-white/20" /></div>
            <p className="text-white/40 text-sm">No saved chats yet.</p>
          </div>
        ) : (
          <PullToRefresh onRefresh={handleRefresh} className="space-y-3 pb-20">
            {savedChatsList.map(s => {
              const pName = getPartnerName(s);
              return (
                <div key={s.id} onClick={() => navigate(createPageUrl("Chat") + `?session=${s.id}`)} className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-white/[0.06] transition-all relative">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500/50 to-purple-500/50 flex items-center justify-center text-white font-bold">{pName?.charAt(0) || "?"}</div>
                    <div>
                      <p className="text-white font-medium">{pName}</p>
                      <p className="text-xs text-white/40 flex items-center gap-1">Tap to view chat</p>
                    </div>
                  </div>
                  {s.unreadCount > 0 && (
                     <div className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold absolute right-4">
                       {s.unreadCount}
                     </div>
                  )}
                </div>
              );
            })}
          </PullToRefresh>
        )}
      </div>
    );
  }

  const isWaiting = session?.status === "waiting";
  const isSavedByMe = session?.user1_email === user.email ? session?.saved_by_user1 : session?.saved_by_user2;
  const isChatActive = session?.status === "active" || isSavedByMe;

  const showEndedBanner = session?.status === "ended" && !isSavedByMe;

  if (isWaiting) return <PullToRefresh onRefresh={handleRefresh} className="h-[calc(100vh-4rem)] flex flex-col"><WaitingScreen onCancel={() => navigate(createPageUrl("Home"))} mode={session?.mode || "text"} /></PullToRefresh>;

  return (
    <div className="flex flex-col relative" style={{ height: "calc(100vh - 4rem)" }}>
      <ChatHeader
        session={session} 
        onEnd={() => {
           if (isSavedByMe) navigate(createPageUrl("Home"));
           else setShowSavePrompt(true);
        }} 
        onNext={() => navigate(createPageUrl("Home"))}
        partnerName={getPartnerName(session)} partnerDetails={partner} 
        followStatus={followStatus} 
        onToggleFollow={handleToggleFollow}
        hasLiked={hasLiked} 
        onToggleLike={handleToggleLike}
        onDeleteChat={handleDeleteChat} onBlockUser={() => setShowBlockModal(true)}
      />

      {showEndedBanner && (
        <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20 text-center z-10 flex justify-between items-center">
          <p className="text-xs text-red-300">This chat has ended.</p>
          <Button size="sm" onClick={() => navigate(createPageUrl("Home"))} className="h-7 text-xs bg-white/10 hover:bg-white/20 text-white rounded-full">Go Home</Button>
        </div>
      )}

      <PullToRefresh onRefresh={handleRefresh} className="flex-1 min-h-0 overflow-y-auto">
        <ChatMessages 
           messages={messages} 
           currentUserEmail={user?.email} 
           onImageClick={(url) => setViewImage(url)} 
           onUnsend={handleUnsend} 
           onUpdateMessage={handleUpdateMessage} 
        />
      </PullToRefresh>

      <ChatInput onSend={handleSendMessage} disabled={!isChatActive} />

      <AnimatePresence>
        {showSavePrompt && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#111122] border border-white/10 p-6 rounded-3xl max-w-sm w-full text-center space-y-6 shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400"><Save className="w-8 h-8" /></div>
              <div><h3 className="text-xl font-bold text-white mb-2">Save Chat History?</h3><p className="text-sm text-white/50">Save this conversation to read and chat later.</p></div>
              <div className="flex flex-col gap-3">
                <Button onClick={saveChatHistory} className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl h-12">Yes, Save & Keep Active</Button>
                <Button variant="ghost" onClick={() => { setShowSavePrompt(false); navigate(createPageUrl("Home")); }} className="w-full text-white/50 hover:bg-white/5 rounded-xl h-12">No, Go Home</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBlockModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#111122] border border-red-500/20 p-6 rounded-3xl max-w-sm w-full text-center space-y-6 shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto text-red-400"><Ban className="w-8 h-8" /></div>
              <div>
                 <h3 className="text-xl font-bold text-white mb-2">Block {getPartnerName(session)}?</h3>
                 <p className="text-sm text-white/50">They won't be able to find your profile or chat with you.</p>
              </div>
              <div className="flex flex-col gap-3 mt-4">
                <Button onClick={() => executeBlock(true)} className="w-full bg-red-500 hover:bg-red-600 text-white rounded-xl h-12">Block & Delete Chat</Button>
                <Button onClick={() => executeBlock(false)} className="w-full bg-white/10 hover:bg-white/20 text-white rounded-xl h-12">Block Only</Button>
                <Button variant="ghost" onClick={() => setShowBlockModal(false)} className="w-full text-white/50 hover:bg-white/5 rounded-xl h-12 mt-2">Cancel</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>{viewImage && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm" onContextMenu={(e) => e.preventDefault()}><Button variant="ghost" size="icon" className="absolute top-4 right-4 z-50 text-white/50 hover:text-white bg-black/20 rounded-full" onClick={() => setViewImage(null)}><X className="w-6 h-6" /></Button><div className="relative max-w-full max-h-full flex items-center justify-center"><img src={viewImage} alt="Secure View" className="max-w-full max-h-[85vh] object-contain select-none pointer-events-none rounded-md shadow-2xl" draggable={false} /><div className="absolute inset-0 overflow-hidden pointer-events-none flex flex-wrap content-center justify-center gap-8 p-4 opacity-[0.07]">{Array.from({ length: 30 }).map((_, i) => (<span key={i} className="text-white text-lg font-bold rotate-[-30deg] whitespace-nowrap">{user?.email}</span>))}</div></div></motion.div>)}</AnimatePresence>
    </div>
  );
}