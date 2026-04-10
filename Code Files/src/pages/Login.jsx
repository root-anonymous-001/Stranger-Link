import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { isAuthenticated, openAuthModal } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    } else {
      navigate("/");
      openAuthModal("login");
    }
  }, [isAuthenticated, navigate, openAuthModal]);

  // Render an empty div or loader while redirecting
  return (
    <div className="min-h-screen bg-[#08081a] flex items-center justify-center">
       <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}