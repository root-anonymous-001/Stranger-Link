// @ts-nocheck
import logo from "./assets/Logo.png";
import React, { useState, useEffect } from "react";
import { auth, googleProvider, signInWithPopup } from "@/lib/firebase";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import {
  Home, MessageCircle, User, LogOut, ArrowLeft, Bell, Mail, Calendar, Loader2, KeyRound
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";






export default function Layout({ children, currentPageName }) {
  const { user, isAuthModalOpen, authMode, openAuthModal, closeAuthModal, checkAppState } = useAuth();
  const [unreadAlerts, setUnreadAlerts] = useState(0); 
  const navigate = useNavigate();

  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get("session");
  const isInChat = currentPageName === "Chat" && !!sessionId;

  useEffect(() => {
    // FIX: Scope theme strictly to the specific user's email if logged in.
    let themeKey = "theme_guest";
    if (user && user.email) themeKey = `theme_${user.email}`;

    const savedTheme = localStorage.getItem(themeKey) || "theme-default";
    document.body.classList.remove("theme-default", "theme-ocean", "theme-sunset", "theme-forest", "theme-royal");
    document.body.classList.add(savedTheme);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const checkAlerts = async () => {
      try {
        const notifs = await base44.entities.Notification.filter({ user_email: user.email });
        const unread = notifs.filter((n) => !n.read).length;
        setUnreadAlerts(unread);
      } catch (err) {}
    };
    checkAlerts();
    const interval = setInterval(checkAlerts, 2000); 
    return () => clearInterval(interval);
  }, [user]);

  const navItems = [
    { name: "Home", page: "Home", icon: Home },
    { name: "Chat", page: "Chat", icon: MessageCircle },
    { name: "Alerts", page: "Notifications", icon: Bell },
    { name: "Profile", page: "Profile", icon: User },
  ];
  return (
  
    <div className="min-h-screen bg-background text-foreground transition-colors duration-500">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] bg-pink-600/5 rounded-full blur-[100px]" />
      </div>

      <nav className="fixed top-0 left-0 right-0 z-50 glass pt-safe border-b-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {isInChat ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(createPageUrl("Home"))}
                  className="md:hidden flex items-center gap-1.5 text-white/70 hover:text-white active:scale-95 transition-all"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="text-sm font-medium">Back</span>
                </button>
                <Link to={createPageUrl("Home")} className="hidden md:flex items-center gap-2">
                  <img src={logo} alt="StrangerLink Logo" className="logo w-12 h-12 object-contain drop-shadow-md" />
                  
                  <span className="text-lg font-bold tracking-tight">
                    <span className="gradient-text">Stranger</span>
                    <span className="text-white/90">Link</span>
                  </span>
                </Link>
              </div>
            ) : (
              <Link to={createPageUrl("Home")} className="flex items-center gap-2">
                <img src={logo} alt="StrangerLink Logo" className="logo w-12 h-12 object-contain drop-shadow-md" />
                <span className="text-lg font-bold tracking-tight">
                  <span className="gradient-text">Stranger</span>
                  <span className="text-white/90">Link</span>
                </span>
              </Link>
            )}

            {user && (
              <div className="hidden md:flex items-center gap-1 bg-white/5 backdrop-blur-xl border border-white/10 px-2 py-1.5 rounded-2xl shadow-xl shadow-black/20">
                {navItems.map((item) => {
                  const isActive = currentPageName === item.page;
                  return (
                    <Link
                      key={item.page}
                      to={createPageUrl(item.page)}
                      className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${isActive ? "text-white" : "text-white/50 hover:text-white hover:bg-white/5"}`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="nav-active"
                          className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-white/10 rounded-xl"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <div className="relative">
                        <item.icon className="w-4 h-4 relative z-10" />
                        {item.page === "Notifications" && unreadAlerts > 0 && (
                          <div className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center shadow-lg">
                            {unreadAlerts > 99 ? "99+" : unreadAlerts}
                          </div>
                        )}
                      </div>
                      <span className="relative z-10">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            )}

            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-2xl border border-white/5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold shadow-md">
                      {user.full_name?.[0] || user.email?.[0]?.toUpperCase() || "?"}
                    </div>
                    <span className="text-sm font-medium text-white/80">{user.full_name || user.email}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-2xl transition-all"
                    onClick={() => base44.auth.logout()}
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => openAuthModal('login')}
                  className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-90 text-white font-bold border-0 rounded-xl px-6 shadow-lg shadow-purple-500/25"
                >
                  Sign In
                </Button>
              )}
            </div>

            {!isInChat && (
              <div className="md:hidden flex items-center gap-2">
                {!user && (
                  <Button
                    onClick={() => openAuthModal('login')}
                    size="sm"
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold border-0 rounded-xl px-4 text-xs shadow-md shadow-indigo-500/20"
                  >
                    Sign In
                  </Button>
                )}
                {user && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold shadow-md">
                    {user.full_name?.[0] || user.email?.[0]?.toUpperCase() || "?"}
                  </div>
                )}
              </div>
            )}
            {isInChat && (
              <div className="md:hidden">
                <span className="text-sm font-medium text-white/60">Live Chat</span>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="relative pt-20 main-content-mobile">{children}</main>

      {user && (
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/5"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="flex items-stretch">
            {navItems.map((item) => {
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-all active:scale-95 ${isActive ? "text-white" : "text-white/30"}`}
                >
                  <div className="relative">
                    {isActive && (
                      <motion.div
                        layoutId="tab-active"
                        className="absolute -inset-2 bg-indigo-500/20 rounded-xl"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                      />
                    )}
                    <item.icon className={`w-5 h-5 relative z-10 transition-all ${isActive ? "text-indigo-400" : ""}`} />
                    {item.page === "Notifications" && unreadAlerts > 0 && (
                      <div className="absolute -top-1 -right-2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full z-20 shadow-md">
                        {unreadAlerts > 99 ? "99+" : unreadAlerts}
                      </div>
                    )}
                  </div>
                  <span className={`text-[10px] font-medium transition-all ${isActive ? "text-indigo-300" : ""}`}>
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      <AnimatePresence>
        {isAuthModalOpen && (
           <AuthModal 
             mode={authMode} 
             setMode={(m) => openAuthModal(m)} 
             onClose={closeAuthModal}
             onSuccess={() => { closeAuthModal(); checkAppState(); }}
           />
        )}
      </AnimatePresence>
    </div>
  );
}

// ================= GLOBAL AUTH MODAL COMPONENT =================
function AuthModal({ mode, setMode, onClose, onSuccess }) {
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [fullName, setFullName] = useState("");
    const [dob, setDob] = useState("");
    
    const [otp, setOtp] = useState("");
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const resetForm = () => {
      setErrorMsg("");
      setSuccessMsg("");
      setShowOtpInput(false);
      setOtp("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg("");
        setSuccessMsg("");
        setLoading(true);

        try {
            if (mode === "login") {
                await base44.auth.login(identifier, password);
                onSuccess();
            } else {
                if (!showOtpInput) {
                    await base44.auth.sendOtp(email, username);
                    setShowOtpInput(true);
                    setSuccessMsg("OTP has been sent to your email!");
                } else {
                    if (!otp || otp.length < 6) throw new Error("Please enter a valid 6-digit OTP.");
                    await base44.auth.register({ email, username, full_name: fullName, dob, password, otp });
                    onSuccess();
                }
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.detail || err.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

   const handleGoogleAuth = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const firebaseUser = result.user;
        
        const response = await base44.auth.firebaseLogin({
            email: firebaseUser.email,
            full_name: firebaseUser.displayName
        });

        if (response) onSuccess(); 
    } catch (error) {
        console.error("Auth Error:", error);
        alert("Google Login Failed! Check Console.");
    }
};

    return (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
            <motion.div 
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                transition={{ type: "spring", bounce: 0.3 }}
                className="bg-[#111122] border border-white/10 p-6 sm:p-8 rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden"
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors bg-white/5 p-2 rounded-full">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>

                <div className="text-center mb-6">
                    <img src={logo} alt="StrangerLink Logo" className="logo w-14 h-14 object-contain mx-auto mb-3 drop-shadow-md" />
                    <h2 className="text-2xl font-bold text-white">{mode === "login" ? "Welcome Back" : "Join StrangerLink"}</h2>
                    <p className="text-white/40 text-xs mt-1">Connect with the world, anonymously.</p>
                </div>

                {errorMsg && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                        <p className="text-red-400 text-xs font-semibold">{errorMsg}</p>
                    </div>
                )}
                {successMsg && (
                    <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                        <p className="text-emerald-400 text-xs font-semibold">{successMsg}</p>
                    </div>
                )}

                <AnimatePresence mode="wait">
                    <motion.form 
                        key={mode}
                        initial={{ opacity: 0, x: mode === "login" ? -20 : 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: mode === "login" ? 20 : -20 }}
                        transition={{ duration: 0.2 }}
                        onSubmit={handleSubmit} 
                        className="space-y-4"
                    >
                        {mode === "login" ? (
                            <>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><User className="h-4 w-4 text-white/30" /></div>
                                    <input 
                                        type="text" required value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="Email or Username"
                                        className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Mail className="h-4 w-4 text-white/30" /></div>
                                    <input 
                                        type="email" required readOnly={showOtpInput} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Address"
                                        className={`w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${showOtpInput ? "opacity-50 cursor-not-allowed" : ""}`}
                                    />
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><User className="h-4 w-4 text-white/30" /></div>
                                    <input 
                                        type="text" required readOnly={showOtpInput} value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Unique Username"
                                        className={`w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${showOtpInput ? "opacity-50 cursor-not-allowed" : ""}`}
                                    />
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><User className="h-4 w-4 text-white/30" /></div>
                                    <input 
                                        type="text" required readOnly={showOtpInput} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Display Name"
                                        className={`w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${showOtpInput ? "opacity-50 cursor-not-allowed" : ""}`}
                                    />
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Calendar className="h-4 w-4 text-white/30" /></div>
                                    <input 
                                        type="date" required readOnly={showOtpInput} value={dob} onChange={(e) => setDob(e.target.value)}
                                        className={`w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${showOtpInput ? "opacity-50 cursor-not-allowed" : ""}`}
                                        style={{ colorScheme: "dark" }}
                                    />
                                </div>
                            </>
                        )}

                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><KeyRound className="h-4 w-4 text-white/30" /></div>
                            <input 
                                type={showPassword ? "text" : "password"} required readOnly={showOtpInput} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password"
                                className={`w-full pl-11 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${showOtpInput ? "opacity-50 cursor-not-allowed" : ""}`}
                            />
                            <button 
                                type="button" 
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-xl hover:scale-110 transition-transform"
                            >
                                {showPassword ? "🐵" : "🙈"}
                            </button>
                        </div>

                        <AnimatePresence>
                            {showOtpInput && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="relative pt-2">
                                    <p className="text-xs text-indigo-300 font-semibold mb-2">Check your email for the 6-digit code</p>
                                    <input 
                                        type="text" required value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter OTP (e.g. 123456)"
                                        className="w-full text-center tracking-widest text-xl font-bold py-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                        maxLength={6}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <Button 
                            type="submit" disabled={loading}
                            className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold shadow-lg shadow-purple-500/25 active:scale-95 transition-all"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 
                              (mode === "login" ? "Log In" : 
                              (!showOtpInput ? "Send Verification OTP" : "Verify & Create Account"))}
                        </Button>
                    </motion.form>
                </AnimatePresence>

                <div className="mt-6 flex items-center gap-3">
                    <div className="flex-1 h-px bg-white/10"></div>
                    <span className="text-white/30 text-xs font-medium uppercase tracking-wider">or</span>
                    <div className="flex-1 h-px bg-white/10"></div>
                </div>

                <button 
                    onClick={handleGoogleAuth}
                    type="button" 
                    className="w-full mt-6 h-12 rounded-xl bg-white text-black font-bold flex items-center justify-center gap-3 active:scale-95 transition-all hover:bg-gray-100"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                    Continue with Google
                </button>

                <p className="text-center text-sm text-white/50 mt-6">
                    {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                    <button 
                        onClick={() => { setMode(mode === "login" ? "register" : "login"); resetForm(); }} 
                        className="text-indigo-400 font-bold hover:underline"
                    >
                        {mode === "login" ? "Sign up here" : "Log in"}
                    </button>
                </p>



            </motion.div>
        </motion.div>

        
      );
      
    
}