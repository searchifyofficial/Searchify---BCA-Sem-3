"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminPage() {
  const [pendingMaterials, setPendingMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAdminAndFetch();
  }, []);

  const checkAdminAndFetch = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      alert("Please login first!");
      router.push("/login");
      return;
    }

    const userEmail = session.user.email;

    // Check role from profiles table (or set your email as direct admin check)
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    // If you want a quick hardcoded override for your email, you can also check here:
    if (profile?.role === "admin" || userEmail === "atul114p@gmail.com") {
      setIsAdmin(true);
      fetchPendingMaterials();
    } else {
      alert("Access Denied: Admins only!");
      router.push("/");
    }
  };

  const fetchPendingMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from("materials")
        .select("*")
        .eq("approved", false)
        .order("created_at", { ascending: false });

      if (error) console.error(error.message);
      else setPendingMaterials(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    const { error } = await supabase
      .from("materials")
      .update({ approved: true })
      .eq("id", id);

    if (error) {
      alert("Error approving material: " + error.message);
    } else {
      alert("Material approved successfully!");
      fetchPendingMaterials(); // Refresh list
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this material?")) return;

    const { error } = await supabase
      .from("materials")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Error deleting material: " + error.message);
    } else {
      alert("Material deleted.");
      fetchPendingMaterials(); // Refresh list
    }
  };

  if (!isAdmin) {
    return <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">Verifying Admin Access...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-6xl mx-auto flex justify-between items-center mb-10 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-red-500 to-blue-400 bg-clip-text text-transparent">
            Admin Approval Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">Review and approve study materials uploaded by students.</p>
        </div>
        <a 
          href="/" 
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm border border-slate-700 transition-all"
        >
          ← Back to Home
        </a>
      </div>

      <div className="max-w-6xl mx-auto">
        <h2 className="text-xl font-semibold mb-6 text-slate-200">Pending Uploads ({pendingMaterials.length})</h2>

        {loading ? (
          <p className="text-slate-500 text-center py-10">Loading pending requests...</p>
        ) : pendingMaterials.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-slate-800/80">
            <p className="text-slate-400">No pending materials to approve right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingMaterials.map((item) => (
              <div key={item.id} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
                <div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                    {item.subject}
                  </span>
                  <h3 className="text-lg font-bold mt-3 text-slate-100">{item.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">Semester: {item.semester}</p>
                  <p className="text-[10px] text-slate-500 mt-2">Uploaded by: {item.uploaded_by}</p>
                </div>
                
                <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                  <a 
                    href={item.file_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-blue-400 border border-slate-700"
                  >
                    View PDF
                  </a>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleApprove(item.id)}
                      className="px-3 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-xs font-semibold text-white transition-all"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-semibold text-white transition-all"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}