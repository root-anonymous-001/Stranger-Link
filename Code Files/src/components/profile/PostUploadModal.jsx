import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Image, Play, Upload } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function PostUploadModal({ open, onClose, user, onUploaded, activeTab }) {
  const [type, setType] = useState(activeTab === "short" ? "short" : "post");
  const [caption, setCaption] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!imageFile) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFile });
    const post = await base44.entities.Post.create({
      user_email: user.email,
      user_name: user.full_name || "Anonymous",
      caption,
      image_url: file_url,
      type,
      likes_count: 0,
    });
    setUploading(false);
    setCaption("");
    setImageFile(null);
    setPreview(null);
    onUploaded(post);
  };

  const handleClose = () => {
    setCaption(""); setImageFile(null); setPreview(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <div className="glass rounded-t-3xl p-6">
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />
              <button onClick={handleClose} className="absolute top-5 right-5 text-white/30 hover:text-white">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-white font-bold text-lg mb-4">New Post</h3>

              {/* Type selector */}
              <div className="flex gap-2 mb-4">
                {[{ id: "post", icon: Image, label: "Photo" }, { id: "short", icon: Play, label: "Short" }].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setType(t.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      type === t.id ? "bg-indigo-500/20 border border-indigo-500/40 text-indigo-300" : "bg-white/[0.03] border border-white/5 text-white/40"
                    }`}
                  >
                    <t.icon className="w-4 h-4" /> {t.label}
                  </button>
                ))}
              </div>

              {/* Image picker */}
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full aspect-video rounded-2xl bg-white/[0.03] border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 mb-4 hover:border-white/20 transition-all overflow-hidden"
              >
                {preview ? (
                  <img src={preview} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-white/20" />
                    <p className="text-white/30 text-sm">Tap to select {type === "short" ? "video thumbnail" : "photo"}</p>
                  </>
                )}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write a caption..."
                rows={3}
                className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/30 mb-4"
              />

              <button
                onClick={handleUpload}
                disabled={!imageFile || uploading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold text-sm active:scale-95 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Uploading...</>
                ) : (
                  <><Upload className="w-4 h-4" /> Share {type === "short" ? "Short" : "Post"}</>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}