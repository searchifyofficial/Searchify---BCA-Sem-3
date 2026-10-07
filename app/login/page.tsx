"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push("/");
    });
  }, [router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        alert(error.message);
      } else {
        alert("Registration successful! 🎉 You Can Login Now...");
        setIsSignUp(false); // Switch back to login view automatically
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        alert(error.message);
      } else {
        router.push("/");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 w-full max-w-md shadow-2xl backdrop-blur-xl">
        
        <div className="text-center mb-6">
          <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
            Searchify Hub 🚀
          </span>
          <h1 className="text-2xl font-extrabold mt-3 bg-gradient-to-r from-blue-400 to-red-500 bg-clip-text text-transparent">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isSignUp ? "Sign up to access BCA Sem 3 materials" : "Login to continue your studies"}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Email</label>
            <input 
              type="email" required value={email} 
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500 transition-all shadow-inner"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Password</label>
            <input 
              type="password" required value={password} 
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-red-500 transition-all shadow-inner"
            />
          </div>
          <button 
            type="submit" disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-red-600 text-white font-bold text-sm shadow-lg transition-all hover:scale-[1.02]"
          >
            {loading ? "Processing..." : isSignUp ? "Sign Up 🚀" : "Login 🔓"}
          </button>
        </form>

        <button 
          onClick={() => setIsSignUp(!isSignUp)}
          className="w-full text-center text-xs text-slate-400 mt-6 hover:text-blue-400 transition-all font-medium"
        >
          {isSignUp ? "Already have an account? Login here" : "Don't have an account? Sign Up"}
        </button>
      </div>
    </div>
  );
}