"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Cropper from "react-easy-crop";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState("user");
  const [name, setName] = useState("BCA Student");
  const [avatarUrl, setAvatarUrl] = useState("https://api.dicebear.com/7.x/avataaars/svg?seed=Searchify");
  
  // Cropper States
  const [isEditing, setIsEditing] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  const [myMaterials, setMyMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    getProfileData();
  }, []);

  const getProfileData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      alert("Please login first!");
      router.push("/login");
      return;
    }

    const currentUser = session.user;
    setUser(currentUser);

    if (currentUser.email === "atul114p@gmail.com") {
      setUserRole("admin");
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", currentUser.id)
      .single();

    if (profile) {
      if (profile.role) setUserRole(profile.role);
      if (profile.name) setName(profile.name);
      if (profile.avatar_url) setAvatarUrl(profile.avatar_url);
    } else {
      setName(currentUser.email?.split('@')[0].toUpperCase() || "USER");
    }

    const { data, error } = await supabase
      .from("materials")
      .select("*")
      .eq("uploaded_by", currentUser.email)
      .order("created_at", { ascending: false });

    if (!error) {
      setMyMaterials(data || []);
    }

    setLoading(false);
  };

  // Handle file selection to open WhatsApp-style cropper
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Helper to create cropped image blob
  const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<Blob> => {
    const image = new Image();
    image.src = imageSrc;
    await new Promise((resolve) => (image.onload = resolve));

    const canvas = document.createElement("canvas");
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext("2d");

    ctx?.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob as Blob);
      }, "image/jpeg");
    });
  };

  const handleSaveCroppedImage = async () => {
    if (!imageSrc || !croppedAreaPixels || !user) return;
    setUploading(true);

    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const fileName = `avatar_${user.id}_${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("materials")
        .upload(fileName, croppedBlob);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("materials")
        .getPublicUrl(fileName);

      const finalAvatarUrl = urlData.publicUrl;

      // Update Database
      const { error: dbError } = await supabase.from("profiles").upsert({
        id: user.id,
        email: user.email,
        name: name,
        avatar_url: finalAvatarUrl,
        role: userRole
      });

      if (dbError) throw dbError;

      setAvatarUrl(finalAvatarUrl);
      setImageSrc(null);
      setIsEditing(false);
      alert("Profile picture updated successfully!");
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 to-red-500 bg-clip-text text-transparent">
              Profile
            </h1>
            <p className="text-slate-400 text-xs mt-1">Manage your account details and contributions</p>
          </div>
          <a 
            href="/" 
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs border border-slate-700 transition-all"
          >
            ← Back to Home
          </a>
        </div>

        {/* User Card */}
        {user && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl mb-8 relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              
              <div className="flex items-center gap-5">
                <div className="relative">
                  <img 
                    src={avatarUrl} 
                    alt="User Logo" 
                    className="w-20 h-20 rounded-2xl bg-slate-950 border border-slate-800 object-cover shadow-lg"
                  />
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs shadow-md transition-all z-10"
                    title="Edit Profile"
                  >
                    ✏️
                  </button>
                </div>

                <div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">
                    {userRole} Account
                  </span>
                  <h2 className="text-xl font-bold mt-2 text-slate-100">{name}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
                  <p className="text-[10px] text-slate-500 mt-2 font-mono bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 inline-block">
                    UID: {user.id}
                  </p>
                </div>
              </div>

              <div className="text-right bg-slate-950/60 p-4 rounded-xl border border-slate-800 w-full md:w-auto">
                <p className="text-xs text-slate-400">Total Uploads</p>
                <p className="text-2xl font-black text-blue-400">{myMaterials.length}</p>
              </div>

            </div>

            {/* Edit Profile Modal / Section */}
            {isEditing && (
              <div className="mt-6 pt-6 border-t border-slate-800 space-y-4 animate-in fade-in">
                <h3 className="text-sm font-semibold text-slate-200">Edit Profile & DP</h3>
                
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Your Name</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500 mb-4"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-2">Select Image to Crop & Zoom (WhatsApp Style)</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                  />
                </div>

                {/* WhatsApp Style Cropper Box */}
                {imageSrc && (
                  <div className="space-y-4">
                    <div className="relative w-full h-64 bg-black rounded-xl overflow-hidden border border-slate-800">
                      <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={1} // Square crop like DP
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Zoom Slider</label>
                      <input 
                        type="range" 
                        min={1} 
                        max={3} 
                        step={0.1} 
                        value={zoom} 
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="w-full accent-blue-500 cursor-pointer"
                      />
                    </div>

                    <div className="flex gap-2 justify-end">
                      <button 
                        type="button" 
                        onClick={() => setImageSrc(null)}
                        className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                      >
                        Cancel Crop
                      </button>
                      <button 
                        type="button" 
                        onClick={handleSaveCroppedImage}
                        disabled={uploading}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg"
                      >
                        {uploading ? "Uploading Cropped DP..." : "Crop & Save DP"}
                      </button>
                    </div>
                  </div>
                )}

                {!imageSrc && (
                  <div className="flex gap-2 justify-end pt-2">
                    <button 
                      type="button" 
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* My Uploads Section */}
        <h3 className="text-lg font-semibold mb-4 text-slate-200">Your Uploaded Materials</h3>

        {loading ? (
          <p className="text-slate-500 text-center py-10">Loading your profile data...</p>
        ) : myMaterials.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-slate-800/80">
            <p className="text-slate-400 text-sm">You haven't uploaded any study materials yet.</p>
            <a href="/upload" className="inline-block mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold">
              Upload Now 🚀
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myMaterials.map((item) => (
              <div key={item.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {item.subject}
                    </span>
                    {item.approved ? (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20 font-semibold">Approved</span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">Pending Approval</span>
                    )}
                  </div>
                  <h4 className="text-base font-bold mt-3 text-slate-100">{item.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-1">Semester: {item.semester}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center">
                  <span className="text-[10px] text-slate-500">Uploaded on: {new Date(item.created_at).toLocaleDateString()}</span>
                  <a 
                    href={item.file_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 font-semibold hover:underline"
                  >
                    View File →
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}