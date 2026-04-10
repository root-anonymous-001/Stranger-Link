// @ts-nocheck
import React, { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Check, X, Trash2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const formatLocalTime = (dateStr) => {
  if (!dateStr) return "";
  const dateObj = new Date(dateStr.endsWith("Z") ? dateStr : dateStr + "Z");
  return dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export default function ChatMessages({ messages, currentUserEmail, onUpdateMessage, onImageClick, onUnsend }) {
  const bottomRef = useRef(null);
  const [selectedMsgId, setSelectedMsgId] = useState(null);
  const prevMsgCount = useRef(messages.length);
  const navigate = useNavigate();

  useEffect(() => { 
    if (messages.length > prevMsgCount.current) {
       bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevMsgCount.current = messages.length;
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-10">
      <div className="flex justify-center mb-6">
        <div className="bg-white/5 border border-white/10 rounded-full px-4 py-1.5 flex items-center gap-2 text-xs text-white/40">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />Secure chat & Anti-screenshot enabled
        </div>
      </div>

      {messages.map((msg, index) => {
        const isMe = msg.sender_email === currentUserEmail;
        const isSystem = msg.type === "system";

        if (isSystem) {
          return (
            <div key={msg.id} className="flex justify-center my-4">
              <span className="text-[10px] text-white/40 bg-white/5 px-3 py-1 rounded-full">{msg.content}</span>
            </div>
          );
        }

        if (msg.is_deleted) {
          return (
             <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                <div className="max-w-[75%] px-4 py-2 border border-white/5 bg-transparent rounded-2xl italic text-white/30 text-xs">
                  This message was unsent.
                </div>
             </div>
          )
        }

        return (
          <motion.div key={msg.id || index} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className={`flex flex-col relative ${isMe ? "items-end" : "items-start"}`}>
            {!isMe && <span className="text-[10px] text-white/30 mb-1 ml-2">{msg.sender_name}</span>}
            
            <div 
              onClick={() => isMe ? setSelectedMsgId(selectedMsgId === msg.id ? null : msg.id) : null}
              className={`max-w-[75%] rounded-2xl px-4 py-2.5 relative group cursor-pointer ${
                  // Media has different background
                  msg.type === "media" ? "bg-white/[0.03] border border-white/10 p-2" :
                  isMe ? "bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-br-sm shadow-lg shadow-indigo-500/20" : "bg-white/10 text-white/90 rounded-bl-sm border border-white/5"
              }`}
            >
              {msg.type === "text" && <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>}
              {msg.type === "audio" && <audio controls src={msg.media_url} className="h-10 w-48" />}
              
              {/* NORMAL CHAT IMAGE */}
              {msg.type === "image" && (
                <div className="space-y-2 cursor-pointer relative" onClick={() => onImageClick(msg.media_url)}>
                  <img src={msg.media_url} alt="Secure" className="w-48 h-48 object-cover rounded-xl pointer-events-none select-none shadow-sm" draggable="false" />
                </div>
              )}

              {/* NAYA: SHARED POST PREVIEW */}
              {msg.type === "media" && (
                 <div className="flex flex-col items-center">
                     <p className="text-xs text-white/60 w-full mb-2 font-medium">Shared a Post</p>
                     <div 
                        onClick={() => navigate(`/Profile?user=${msg.sender_email}`)} 
                        className="relative w-48 h-64 rounded-xl overflow-hidden cursor-pointer"
                     >
                         {msg.media_type === "video" ? (
                            <>
                                <video src={msg.media_url} className="w-full h-full object-cover opacity-70" preload="metadata" />
                                <div className="absolute inset-0 flex items-center justify-center"><Play className="w-8 h-8 text-white fill-white drop-shadow-md" /></div>
                            </>
                         ) : (
                            <img src={msg.media_url} className="w-full h-full object-cover" />
                         )}
                     </div>
                 </div>
              )}

              {msg.type === "image_request" && (
                <div className="space-y-2">
                  {isMe ? (
                    <p className="text-xs text-white/70 italic flex items-center gap-1">Waiting for approval...</p>
                  ) : (
                    <div className="flex flex-col gap-2 items-center text-center p-1">
                      <p className="text-xs font-medium text-indigo-200">{msg.sender_name} wants to send a picture.</p>
                      <div className="flex gap-2 w-full mt-1">
                        <Button size="sm" onClick={(e) => { e.stopPropagation(); onUpdateMessage(msg.id, "image"); }} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg h-7 text-xs">
                          <Check className="w-3.5 h-3.5 mr-1" /> Accept
                        </Button>
                        <Button size="sm" onClick={(e) => { e.stopPropagation(); onUpdateMessage(msg.id, "image_declined"); }} className="flex-1 bg-red-500/20 text-red-300 hover:bg-red-500/40 h-7 text-xs">
                          <X className="w-3.5 h-3.5 mr-1" /> Deny
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {msg.type === "image_declined" && (
                <p className="text-xs text-red-300 italic flex items-center gap-1">
                   <X className="w-3 h-3" /> {isMe ? "Request was denied." : "You denied the image."}
                </p>
              )}
            </div>

            <AnimatePresence>
              {selectedMsgId === msg.id && isMe && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-1">
                  <button onClick={() => onUnsend(msg.id)} className="text-[10px] bg-red-500/20 text-red-400 px-3 py-1 rounded-full flex items-center gap-1 hover:bg-red-500/30">
                    <Trash2 className="w-3 h-3" /> Unsend
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="flex items-center gap-1 mt-1 mx-1">
              <span className="text-[9px] text-white/20">{formatLocalTime(msg.created_date)}</span>
              {isMe && <span className="text-[9px] font-bold tracking-tighter text-indigo-400">{msg.is_read ? "✓✓" : "✓"}</span>}
            </div>
          </motion.div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}