"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showWelcomeBox, setShowWelcomeBox] = useState(true); // Welcome box state
  const router = useRouter();

  const suggestions = ["Computer Networking", "Mathematics - III", "OOPJ", "DTI", "Version Controlling", "Operating System"];

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      
      if (currentUser) {
        checkAdminRole(currentUser);
      }
    });
    fetchMaterials();
  }, []);

  const checkAdminRole = async (currentUser: any) => {
    if (currentUser.email === "theaevogaming@gmail.com" || currentUser.email === "searchifyofficial@gmail.com") {
      setIsAdmin(true);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", currentUser.id)
      .single();

    if (profile?.role === "admin") {
      setIsAdmin(true);
    }
  };

  const fetchMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from("materials")
        .select("*")
        .eq("approved", true)
        .order("created_at", { ascending: false });

      if (error) console.error("Error fetching materials:", error.message);
      else setMaterials(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    setIsSidebarOpen(false);
    router.refresh();
  };

  const filteredMaterials = materials.filter((item) => {
    const queryWords = searchQuery.toLowerCase().trim().split(/\s+/);
    const textToSearch = `${item.title} ${item.subject} ${item.semester}`.toLowerCase();
    return queryWords.every((word) => textToSearch.includes(word));
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-x-hidden flex flex-col">
      
      {/* Sidebar Overlay & Panel */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setIsSidebarOpen(false)}
          />
          
          <div className="relative w-80 bg-slate-900 border-l border-slate-800 p-6 flex flex-col justify-between h-full z-10 shadow-2xl overflow-y-auto">
            <div>
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800">
                <div>
                  <h2 className="font-bold text-base bg-gradient-to-r from-blue-400 to-red-500 bg-clip-text text-transparent">
                    Searchify Hub
                  </h2>
                  <p className="text-[11px] text-slate-400 truncate max-w-[190px]">
                    {user ? user.email : "Welcome, Guest"}
                  </p>
                </div>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-xl text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Navigation Menu Links */}
              <div className="flex flex-col gap-2.5">
                {user ? (
                  <>
                    <a 
                      href="/profile" 
                      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-all border border-slate-700"
                    >
                      👤 Profile
                    </a>

                    <a 
                      href="/upload" 
                      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-all border border-slate-700"
                    >
                      📤 Upload Material
                    </a>

                    <a 
                      href="/messages" 
                      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-all border border-slate-700"
                    >
                      💬 Messages
                    </a>

                    <a 
                      href="/settings" 
                      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-all border border-slate-700"
                    >
                      ⚙️ Settings
                    </a>

                    {isAdmin && (
                      <a 
                        href="/admin" 
                        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-xs font-bold text-red-400 border border-red-500/40 transition-all"
                      >
                        🛡️ Admin Panel
                      </a>
                    )}
                  </>
                ) : (
                  <a 
                    href="/login" 
                    className="block text-center py-3 rounded-xl bg-gradient-to-r from-blue-600 to-red-600 text-white text-xs font-bold shadow-lg mt-2"
                  >
                    Login / Sign Up
                  </a>
                )}
              </div>
            </div>

            {/* Logout Option */}
            <div className="pt-4 mt-6 border-t border-slate-800">
              {user && (
                <button 
                  onClick={handleLogout}
                  className="w-full py-3 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs font-bold border border-red-500/30 transition-all flex items-center justify-center gap-2"
                >
                  🚪 Logout
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      {!isSearching && (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-12 transition-all duration-500">
          <div className="w-20 h-20 mb-6 rounded-3xl shadow-2xl shadow-blue-500/20 border border-white/10 overflow-hidden bg-slate-900">
            <img src="/icon.png" alt="Searchify Logo" className="w-full h-full object-cover" />
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-slate-100 to-red-500 bg-clip-text text-transparent mb-3">
            Searchify
          </h1>
          <p className="text-slate-400 text-sm md:text-base font-medium mb-8">
            Google For BCA semester 3
          </p>

          <button 
            onClick={() => setIsSearching(true)}
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-red-600 text-white font-bold text-sm shadow-xl shadow-red-500/10 hover:scale-105 transition-all duration-300 mb-8"
          >
            Search Now 🚀
          </button>
        </div>
      )}

      {/* Removable Welcoming / Introduction Box */}
          {showWelcomeBox && (
            <div className="max-w-xl w-full bg-slate-900/95 border border-slate-800 p-6 rounded-3xl backdrop-blur-xl shadow-2xl text-left relative animate-fadeIn">
              <button 
                onClick={() => setShowWelcomeBox(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                title="Dismiss"
              >
                ✕
              </button>
              
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
                  Welcome to Searchify 🚀
                </span>
              </div>
              
              <h3 className="text-sm font-extrabold text-slate-100 mb-2">
                Your Ultimate BCA Semester 3 Study Partner
              </h3>
              
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                No more wasting time searching through scattered groups or folders for notes. Get verified study materials, PYQs, and direct PDF downloads all in one place!
              </p>
              
              <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-300 font-medium">
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  <span className="text-blue-400 font-bold block mb-1">⚡ Instant Search</span>
                  Type keywords and instantly find notes for your specific subjects.
                </div>
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  <span className="text-red-400 font-bold block mb-1">💬 Live Community Chat</span>
                  Connect with peers, send private messages, and share photos on the go.
                </div>
              </div>
            </div>
          )}

    </div>
  );
}