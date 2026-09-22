"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  
  // Password state
  const [newPassword, setNewPassword] = useState("");
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg, setPassMsg] = useState("");

  // Theme state (Dark / Light)
  const [isDarkMode, setIsDarkMode] = useState(true);

  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        alert("Please login first to access settings!");
        router.push("/login");
      } else {
        setUser(session.user);
      }
    });
  }, [router]);

  // Handle Password Update
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPassMsg("Password must be at least 6 characters long.");
      return;
    }

    setPassLoading(true);
    setPassMsg("");

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setPassLoading(false);
    if (error) {
      setPassMsg("Error: " + error.message);
    } else {
      setPassMsg("Password updated successfully! 🎉");
      setNewPassword("");
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-100 text-slate-900"} p-6 md:p-12 transition-colors duration-300`}>
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 to-red-500 bg-clip-text text-transparent">
              Settings
            </h1>
            <p className="text-slate-400 text-xs mt-1">Manage your security, appearance, and app preferences</p>
          </div>
          <a 
            href="/" 
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs border border-slate-700 transition-all"
          >
            ← Back to Home
          </a>
        </div>

        {/* 1. Account & Security (Password Change) */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <h2 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
            🔒 Change Password
          </h2>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">New Password</label>
              <input 
                type="password" 
                placeholder="Enter new password (min 6 chars)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            {passMsg && <p className={`text-xs ${passMsg.includes("success") ? "text-green-400" : "text-red-400"}`}>{passMsg}</p>}
            <button 
              type="submit"
              disabled={passLoading}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all"
            >
              {passLoading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>

      {/* 3. Help & Feedback (Only Gmail ID) */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-3">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            💬 Help & Feedback / Report Bug
          </h2>
          <p className="text-xs text-slate-400">
            If You have any questions, suggestions, or encounter a bug, feel free to reach out via email. We value your feedback and are here to assist you!
          </p>
          <div className="inline-block px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-blue-400 font-mono text-xs font-semibold select-all">
            searchifyofficial@gmail.com
          </div>
        </div>

        {/* 4. App Info & Version */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-3">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            ℹ️ App Information
          </h2>
          <div className="grid grid-cols-2 gap-4 text-xs text-slate-300">
            <div>
              <p className="text-slate-500 text-[10px]">App Name</p>
              <p className="font-semibold">Searchify (BCA Sem 3)</p>
            </div>
            <div>
              <p className="text-slate-500 text-[10px]">Version</p>
              <p className="font-semibold">v1.0.0 (Beta)</p>
            </div>
            <div>
              <p className="text-slate-500 text-[10px]">Developer</p>
              <p className="font-semibold">Unnknown</p>
            </div>
            <div>
              <p className="text-slate-500 text-[10px]">Special Thanks To....</p>
              <p className="font-semibold">Next.js, Supabase, Vercel & VS Code</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}