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
      if (error) alert(error.message);
      else {
        alert("Registration successful! You can login now.");
        setIsSignUp(false);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
      else router.push("/");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-blue-400 to-red-500 bg-clip-text text-transparent">
          Searchify Hub
        </h1>
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Email</label>
            <input 
              type="email" required value={email} 
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Password</label>
            <input 
              type="password" required value={password} 
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-red-500"
            />
          </div>
          <button 
            type="submit" disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-red-600 text-white font-semibold text-sm shadow-lg"
          >
            {loading ? "Processing..." : isSignUp ? "Sign Up" : "Login"}
          </button>
        </form>
        <button 
          onClick={() => setIsSignUp(!isSignUp)}
          className="w-full text-center text-xs text-slate-400 mt-4 hover:text-blue-400"
        >
          {isSignUp ? "Already have an account? Login" : "Don't have an account? Sign Up"}
        </button>
      </div>
    </div>
  );
}