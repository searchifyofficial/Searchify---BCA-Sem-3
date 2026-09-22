"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function UploadPage() {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [type, setType] = useState("Material");
  const [semester] = useState("Semester 3"); // Fixed to Semester 3
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        alert("Please login first to upload materials!");
        router.push("/login");
      }
    });
  }, [router]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert("Please select a PDF file to upload.");
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userEmail = session?.user?.email || "Student";

      // 1. Upload PDF to Supabase Storage Bucket ('materials')
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("materials")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL of the uploaded file
      const { data: urlData } = supabase.storage
        .from("materials")
        .getPublicUrl(filePath);

      const fileUrl = urlData.publicUrl;

      // 3. Insert record into 'materials' database table
      const { error: dbError } = await supabase.from("materials").insert([
        {
          title: `[${type}] ${title}`, // Prefixing title with type for clear identification
          subject,
          semester,
          file_url: fileUrl,
          uploaded_by: userEmail,
          approved: false, // Needs admin approval by default
        },
      ]);

      if (dbError) throw dbError;

      alert("Material uploaded successfully! It will appear on home after admin approval.");
      router.push("/");
    } catch (error: any) {
      alert("Upload failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 flex items-center justify-center">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl w-full max-w-lg shadow-2xl">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-red-500 bg-clip-text text-transparent">
              Upload Study Material
            </h1>
            <p className="text-slate-400 text-xs mt-1">Contribute resources for BCA Semester 3 students.</p>
          </div>
          <a 
            href="/" 
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-all"
          >
            ← Home
          </a>
        </div>

        <form onSubmit={handleUpload} className="space-y-4">
          
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Material Title</label>
            <input 
              type="text" 
              required
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Unit 1 Complete Notes"
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Type Dropdown */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Material Type</label>
            <select 
              value={type} 
              onChange={(e) => setType(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="Material">Material (Notes)</option>
              <option value="PYQs">PYQs (Previous Year Questions)</option>
              <option value="Assignments">Assignments</option>
              <option value="Question Banks">Question Banks</option>
            </select>
          </div>

          {/* Semester (Fixed to Semester 3) */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Semester</label>
            <input 
              type="text" 
              disabled
              value={semester} 
              className="w-full px-4 py-3 rounded-xl bg-slate-950/50 border border-slate-800 text-slate-400 text-sm cursor-not-allowed"
            />
          </div>

          {/* PDF File Upload */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">PDF File</label>
            <input 
              type="file" 
              accept="application/pdf"
              required
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-red-600 text-white font-semibold text-sm shadow-lg transition-all mt-4"
          >
            {loading ? "Uploading to Storage..." : "Submit for Approval"}
          </button>
        </form>

      </div>
    </div>
  );
}