// @ts-nocheck
import React, { useState, useRef } from "react";
import { Send, ImagePlus, Mic, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

export default function ChatInput({ onSend, disabled }) {
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message);
      setMessage("");
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setIsUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      // Hum direct 'image' bhejenge, Chat.jsx usko 'image_request' me badal dega
      onSend("", file_url, "image"); 
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
      e.target.value = null;
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
        setIsUploading(true);
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        onSend("", file_url, "audio");
        setIsUploading(false);
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic error:", err);
      alert("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  return (
    <div className="p-4 bg-[#08081a] border-t border-white/5">
      <form onSubmit={handleSubmit} className="flex items-end gap-2 max-w-4xl mx-auto relative">
        
        {/* Hidden File Input */}
        <input 
           type="file" 
           accept="image/*" 
           ref={fileInputRef} 
           onChange={handleFileChange} 
           className="hidden" 
        />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled || isUploading || isRecording}
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 h-12 w-12 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white"
        >
          {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImagePlus className="w-5 h-5" />}
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled || isUploading}
          onClick={isRecording ? stopRecording : startRecording}
          className={`shrink-0 h-12 w-12 rounded-2xl border transition-all ${
            isRecording 
              ? "bg-red-500/20 border-red-500/50 text-red-400 animate-pulse" 
              : "bg-white/5 border-white/10 hover:bg-white/10 text-white/60 hover:text-white"
          }`}
        >
          {isRecording ? <Square className="w-4 h-4 fill-current" /> : <Mic className="w-5 h-5" />}
        </Button>

        <div className="flex-1 relative">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={disabled || isRecording}
            placeholder={isRecording ? "Recording audio..." : "Type a message..."}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all disabled:opacity-50"
          />
        </div>

        <Button
          type="submit"
          disabled={disabled || (!message.trim() && !isRecording) || isUploading}
          className="shrink-0 h-12 w-12 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white border-0 shadow-lg shadow-purple-500/20"
        >
          <Send className="w-5 h-5 ml-1" />
        </Button>
      </form>
    </div>
  );
}