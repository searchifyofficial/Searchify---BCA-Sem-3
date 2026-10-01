"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function MessagesPage() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [activeMsgMenu, setActiveMsgMenu] = useState<string | null>(null); // For mobile tap menu
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    checkUserAndFetch();
    fetchUsersList();

    // Supabase Realtime Subscription for instant message sync
    const channel = supabase
      .channel("public:messages")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        fetchMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkUserAndFetch = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      alert("Please login first to access messages!");
      router.push("/login");
      return;
    }

    const currentUser = session.user;
    setUser(currentUser);

    if (currentUser.email === "atul114p@gmail.com") {
      setIsAdmin(true);
    } else {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", currentUser.id)
        .single();
      if (profile?.role === "admin") setIsAdmin(true);
    }

    fetchMessages();
  };

  const fetchUsersList = async () => {
    const { data } = await supabase.from("profiles").select("email, name");
    if (data) setAllUsers(data);
  };

  const fetchMessages = async () => {
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
    await supabase.from("messages").delete().lt("created_at", twelveHoursAgo);

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMessages(data);
      scrollToBottom();
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setText(val);
    if (val.endsWith("@") || val.includes("@")) {
      setShowUserDropdown(true);
    } else {
      setShowUserDropdown(false);
    }
  };

  const selectUserForMention = (targetEmail: string) => {
    const namePart = targetEmail.split('@')[0];
    setText(`@${namePart} `);
    setShowUserDropdown(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!text.trim() && !imageFile) || !user) return;

    setUploading(true);
    try {
      let imageUrl = null;
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `msg_${Date.now()}_${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("materials")
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("materials")
          .getPublicUrl(fileName);
        imageUrl = urlData.publicUrl;
      }

      let receiverEmail = null;
      if (text.startsWith("@")) {
        const parts = text.split(" ");
        const mentionedName = parts[0].substring(1).toLowerCase();
        const found = allUsers.find(u => u.email.toLowerCase().includes(mentionedName) || (u.name && u.name.toLowerCase().includes(mentionedName)));
        if (found) receiverEmail = found.email;
      }

      const senderName = user.email.split('@')[0].toUpperCase();

      const { error: insertError } = await supabase.from("messages").insert([
        {
          sender_email: user.email,
          sender_name: senderName,
          receiver_email: receiverEmail,
          content: text,
          image_url: imageUrl,
          is_pinned: false
        }
      ]);

      if (insertError) throw insertError;

      setText("");
      setImageFile(null);
      setShowUserDropdown(false);
      fetchMessages();
    } catch (err: any) {
      alert("Error sending message: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMessage = async (msgId: string, senderEmail: string) => {
    if (!isAdmin && user?.email !== senderEmail) {
      alert("You can only delete your own messages!");
      return;
    }
    if (!confirm("Are you sure you want to delete this message?")) return;

    const { error } = await supabase.from("messages").delete().eq("id", msgId);
    if (!error) fetchMessages();
  };

  const handleTogglePin = async (msgId: string, currentPin: boolean) => {
    if (!isAdmin) {
      alert("Only admins can pin messages!");
      return;
    }
    const { error } = await supabase
      .from("messages")
      .update({ is_pinned: !currentPin })
      .eq("id", msgId);

    if (!error) fetchMessages();
  };

  const handlePrivateReply = (senderEmail: string) => {
    const namePart = senderEmail.split('@')[0];
    setText(`@${namePart} `);
    setShowUserDropdown(false);
  };

  const visibleMessages = messages.filter((msg) => {
    if (isAdmin) return true;
    if (!msg.receiver_email) return true;
    if (msg.sender_email === user?.email) return true;
    if (msg.receiver_email === user?.email) return true;
    return false;
  });

  const pinnedMessages = visibleMessages.filter((m) => m.is_pinned);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col h-screen">
      
      {/* Header */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center z-10 shadow-md">
        <div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-red-500 bg-clip-text text-transparent">
            Searchify Community Chat
          </h1>
          <p className="text-[10px] text-slate-400">Live sync active • 12hr auto-delete • Tap message for options</p>
        </div>
        <a href="/" className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700">
          ← Home
        </a>
      </div>

      {/* Pinned Messages Banner */}
      {pinnedMessages.length > 0 && (
        <div className="bg-blue-600/10 border-b border-blue-500/20 px-4 py-2 flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-bold text-blue-400 shrink-0">📌 Pinned:</span>
          {pinnedMessages.map((pin) => (
            <div key={pin.id} className="text-xs bg-slate-900 px-3 py-1 rounded-lg border border-blue-500/30 text-slate-300 truncate max-w-xs shrink-0">
              <span className="font-semibold text-blue-400">{pin.sender_name}:</span> {pin.content}
            </div>
          ))}
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-4xl w-full mx-auto">
        {visibleMessages.length === 0 ? (
          <div className="text-center py-20 text-slate-500 text-sm">
            No messages yet. Start the conversation below!
          </div>
        ) : (
          visibleMessages.map((msg) => {
            const isMe = msg.sender_email === user?.email;
            const isMenuOpen = activeMsgMenu === msg.id;

            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-semibold text-slate-400">{msg.sender_name}</span>
                  <span className="text-[9px] text-slate-600">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {msg.receiver_email && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">Private</span>
                  )}
                </div>

                <div 
                  onClick={() => setActiveMsgMenu(isMenuOpen ? null : msg.id)}
                  className={`p-3.5 rounded-2xl max-w-md shadow-md text-xs relative group cursor-pointer ${isMe ? "bg-blue-600 text-white rounded-tr-none" : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none"}`}
                >
                  {msg.content && <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>}
                  {msg.image_url && (
                    <img src={msg.image_url} alt="Attachment" className="mt-2 rounded-xl max-h-48 object-cover border border-white/10" />
                  )}

                  {/* Actions Menu (Visible on Hover for Desktop OR Tap for Mobile) */}
                  <div className={`absolute top-2 right-2 ${isMenuOpen ? "flex" : "hidden"} group-hover:flex items-center gap-1 bg-black/80 backdrop-blur-md p-1.5 rounded-lg z-20 shadow-xl border border-white/10`}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handlePrivateReply(msg.sender_email); setActiveMsgMenu(null); }}
                      className="text-[10px] px-2 py-1 bg-purple-600 rounded text-white font-medium"
                      title="Reply Privately"
                    >
                      Reply Privately
                    </button>
                    {isAdmin && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleTogglePin(msg.id, msg.is_pinned); setActiveMsgMenu(null); }}
                        className="text-[10px] px-1.5 py-1 bg-slate-800 rounded text-amber-400 font-medium"
                      >
                        {msg.is_pinned ? "Unpin" : "Pin"}
                      </button>
                    )}
                    {(isAdmin || isMe) && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteMessage(msg.id, msg.sender_email); setActiveMsgMenu(null); }}
                        className="text-[10px] px-1.5 py-1 bg-red-600 rounded text-white font-medium"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input & User Mention Dropdown */}
      <div className="p-4 bg-slate-900 border-t border-slate-800 relative">
        {showUserDropdown && allUsers.length > 0 && (
          <div className="absolute bottom-20 left-4 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 max-h-40 overflow-y-auto w-64 z-30">
            <p className="text-[10px] text-slate-400 px-2 py-1 uppercase font-bold">Select user to mention:</p>
            {allUsers.map((u, i) => (
              <button
                key={i}
                type="button"
                onClick={() => selectUserForMention(u.email)}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800 rounded-lg truncate"
              >
                {u.name || u.email}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-center gap-3">
          <input 
            type="text"
            value={text}
            onChange={handleTextChange}
            placeholder="Type message or type @ for private mention..."
            className="flex-1 px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500 shadow-inner"
          />

          <label className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer text-xs border border-slate-700 shrink-0" title="Attach Photo">
            📷
            <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="hidden" />
          </label>

          <button type="submit" disabled={uploading} className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-red-600 text-white font-semibold text-xs shadow-lg shrink-0 transition-all">
            {uploading ? "Sending..." : "Send 🚀"}
          </button>
        </form>
      </div>

    </div>
  );
}