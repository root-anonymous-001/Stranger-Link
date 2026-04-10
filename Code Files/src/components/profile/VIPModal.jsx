// @ts-nocheck
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, X, Check, Zap, Heart, Star, Shield } from "lucide-react";
import { base44 } from "@/api/base44Client";

const VIP_PERKS = [
  { icon: Zap, text: "Unlimited matches every day" },
  { icon: Heart, text: "Priority in matchmaking queue" },
  { icon: Star, text: "One-time +100 Likes & Rookie promotion" },
  { icon: Crown, text: "Gold VIP badge on profile" },
  { icon: Shield, text: "Advanced privacy controls" },
];

export default function VIPModal({ open, onClose, user }) {
  const [spotsLeft, setSpotsLeft] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // RAZORPAY SETTINGS (Replace with your actual Test/Live Key later)
  const RAZORPAY_KEY = "rzp_test_SWCSWYlAHQtFyN"; 

  useEffect(() => {
    if (open) {
      loadSpotsLeft();
      loadRazorpayScript();
    }
  }, [open]);

  const loadSpotsLeft = async () => {
    const payments = await base44.entities.VIPPayment.filter({ plan: "discounted_69" });
    setSpotsLeft(Math.max(0, 100 - payments.length));
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) { resolve(true); return; }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (!selectedPlan) return;
    
    setSubmitting(true);
    const isLoaded = await loadRazorpayScript();
    
    if (!isLoaded) {
      alert("Failed to load payment gateway. Check your connection.");
      setSubmitting(false);
      return;
    }

    const amount = selectedPlan === "discounted_69" ? 69 : 199;
    const amountInPaise = amount * 100;

    const options = {
      key: RAZORPAY_KEY,
      amount: amountInPaise, 
      currency: "INR",
      name: "StrangerLink",
      description: "VIP Membership Upgrade",
      image: "https://your-app-logo.com/logo.png",
      handler: async function (response) {
        try {
          await fetch(`http://localhost:8000/api/vip-payments`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({
                user_email: user.email,
                user_name: user.full_name || "Anonymous",
                amount: amount,
                transaction_id: response.razorpay_payment_id,
                plan: selectedPlan,
                status: "completed"
             })
          });

          setSubmitted(true);
        } catch (err) {
          alert("Payment verified but failed to update profile. Contact support.");
        } finally {
          setSubmitting(false);
        }
      },
      prefill: {
        name: user.full_name || "Stranger",
        email: user.email || "",
      },
      theme: {
        color: "#6366f1",
      },
    };

    const paymentObject = new window.Razorpay(options);
    
    paymentObject.on('payment.failed', function (response){
        alert("Payment Failed: " + response.error.description);
        setSubmitting(false);
    });

    paymentObject.open();
  };

  const isEarlyBirdAvailable = spotsLeft === null || spotsLeft > 0;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[90vh] overflow-y-auto"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <div className="glass rounded-t-3xl p-6 mx-0">
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />
              <button onClick={onClose} className="absolute top-5 right-5 text-white/30 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>

              {submitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-white font-bold text-xl mb-2">Welcome to VIP! 👑</h3>
                  <p className="text-white/40 text-sm">Your payment was successful. Your VIP membership is now active!</p>
                  <button onClick={() => window.location.reload()} className="mt-6 px-8 py-3 rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold active:scale-95 transition-all">Start Swiping</button>
                </div>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500/30 to-orange-500/30 border border-yellow-500/30 flex items-center justify-center mx-auto mb-3">
                      <Crown className="w-8 h-8 text-yellow-400" />
                    </div>
                    <h3 className="text-white font-bold text-2xl">Go VIP</h3>
                    <p className="text-white/40 text-sm mt-1">Unlock the full StrangerLink experience</p>
                  </div>

                  <div className="space-y-2.5 mb-6">
                    {VIP_PERKS.map((perk) => (
                      <div key={perk.text} className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                          <perk.icon className="w-3.5 h-3.5 text-indigo-400" />
                        </div>
                        <p className="text-white/70 text-sm">{perk.text}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 mb-6">
                    {isEarlyBirdAvailable && (
                      <button
                        onClick={() => setSelectedPlan("discounted_69")}
                        className={`w-full p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.98] relative overflow-hidden ${
                          selectedPlan === "discounted_69"
                            ? "border-yellow-500/60 bg-yellow-500/10"
                            : "border-white/10 bg-white/[0.03] hover:border-white/20"
                        }`}
                      >
                        <div className="absolute top-0 right-0 bg-gradient-to-l from-yellow-500 to-orange-500 text-black text-[10px] font-bold px-3 py-1 rounded-bl-xl">
                          🔥 EARLY BIRD
                        </div>
                        <p className="text-white font-semibold text-base mt-1">₹69 <span className="text-white/40 text-sm font-normal">/ month</span></p>
                        <p className="text-white/50 text-xs mt-0.5">First 2 months only · then ₹199/month</p>
                        {spotsLeft !== null && (
                          <p className="text-orange-400 text-xs mt-1.5 font-medium">⚡ Only {spotsLeft} spots left!</p>
                        )}
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedPlan("monthly_199")}
                      className={`w-full p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.98] ${
                        selectedPlan === "monthly_199"
                          ? "border-indigo-500/60 bg-indigo-500/10"
                          : "border-white/10 bg-white/[0.03] hover:border-white/20"
                      }`}
                    >
                      <p className="text-white font-semibold text-base">₹199 <span className="text-white/40 text-sm font-normal">/ month</span></p>
                      <p className="text-white/50 text-xs mt-0.5">Standard VIP membership (1 Month)</p>
                    </button>
                    
                    {/* NAYA: NOTE DEDUCTION MESSAGE */}
                    <div className="mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <p className="text-[10px] text-red-400 leading-tight">
                            <span className="font-bold text-red-500">NOTE:</span> If your subscription expires, 50 bonus likes will be deducted, and your level will adjust accordingly.
                        </p>
                    </div>
                  </div>

                  {selectedPlan && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                      <button
                        onClick={handlePayment}
                        disabled={submitting}
                        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold text-sm active:scale-95 transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30"
                      >
                        {submitting ? (
                          <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        ) : (
                          <><Zap className="w-4 h-4" /> Pay with Razorpay</>
                        )}
                      </button>
                      <p className="text-center text-white/30 text-[10px]">Secured by Razorpay • UPI & Cards accepted</p>
                    </motion.div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}