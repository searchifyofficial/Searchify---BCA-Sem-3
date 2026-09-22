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
    if (currentUser.email === "atul114p@gmail.com") {
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
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-red-600 text-white font-bold text-sm shadow-xl shadow-red-500/10 hover:scale-105 transition-all duration-300"
          >
            Search Now 
          </button>
        </div>
      )}

      {/* Active Search & Repository Dashboard View */}
      {isSearching && (
        <div className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 transition-all duration-500">
          
          <div className="mb-6">
            <h1 className="text-2xl font-extrabold bg-gradient-to-r from-blue-400 to-red-500 bg-clip-text text-transparent">
              Searchify
            </h1>
            <p className="text-slate-400 text-xs mt-1">Instant search across all BCA Semester 3 materials</p>
          </div>

          {/* Search Bar & Hamburger Button */}
          <div className="mb-4 flex items-center gap-3">
            <div className="relative flex-1">
              <input 
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type keywords (e.g. data structures unit 1)..."
                className="w-full px-5 py-4 pl-12 pr-16 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-blue-500 shadow-2xl transition-all"
              />
              <span className="absolute left-4 top-4 text-slate-500">🔍</span>
              <button 
                onClick={() => { setIsSearching(false); setSearchQuery(""); }}
                className="absolute right-3 top-3 text-[11px] text-slate-400 hover:text-white px-2.5 py-1.5 rounded-xl bg-slate-800"
              >
                Close
              </button>
            </div>

            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-all shadow-xl flex items-center justify-center shrink-0 active:scale-95"
              aria-label="Toggle Menu"
            >
              <div className="w-5 h-5 flex flex-col justify-between items-center">
                <span className="w-full h-0.5 bg-slate-300 rounded-full" />
                <span className="w-full h-0.5 bg-slate-300 rounded-full" />
                <span className="w-full h-0.5 bg-slate-300 rounded-full" />
              </div>
            </button>
          </div>

          {/* Quick Suggestions Tags */}
          <div className="mb-8 flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-500 font-medium">Suggestions:</span>
            {suggestions.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setSearchQuery(item)}
                className="px-3 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 border border-slate-800 transition-all"
              >
                {item}
              </button>
            ))}
          </div>

          <h2 className="text-lg font-semibold mb-4 text-slate-300">
            {searchQuery ? `Search Results (${filteredMaterials.length})` : "All Approved Materials"}
          </h2>

          {loading ? (
            <p className="text-slate-500 text-center py-10">Loading study materials...</p>
          ) : filteredMaterials.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800/80">
              <p className="text-slate-400 text-sm">No matching study materials found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMaterials.map((item) => (
                <div key={item.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all">
                  <div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {item.subject}
                    </span>
                    <h3 className="text-base font-bold mt-2.5 text-slate-100">{item.title}</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Semester: {item.semester}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center">
                    <span className="text-[10px] text-slate-500">By: {item.uploaded_by || "Student"}</span>
                    <a 
                      href={item.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-blue-400 border border-slate-700 transition-all"
                    >
                      Download PDF →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}