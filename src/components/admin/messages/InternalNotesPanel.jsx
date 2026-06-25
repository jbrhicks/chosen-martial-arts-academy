import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { StickyNote, Send, Trash2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function InternalNotesPanel({ threadId, currentUser, notes, onRefresh }) {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!content.trim() || !threadId) return;
    setSaving(true);
    try {
      await base44.entities.InternalThreadNote.create({
        thread_id: threadId,
        admin_id: currentUser.id,
        admin_name: currentUser.full_name,
        note_content: content.trim()
      });
      setContent("");
      onRefresh();
      toast.success("Internal note added");
    } catch (e) {
      toast.error("Failed to add note: " + e.message);
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.InternalThreadNote.delete(id);
      onRefresh();
    } catch (e) {
      toast.error("Failed to delete note");
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1a1a0e] border-l border-[#A8A9AD]/20">
      <div className="p-3 border-b border-[#A8A9AD]/20 flex items-center gap-2">
        <StickyNote size={16} className="text-yellow-400" />
        <h3 className="text-xs font-bold tracking-widest uppercase text-yellow-400">Internal Notes</h3>
        <span className="text-[10px] text-[#A8A9AD] ml-auto">Staff only — user cannot see</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {notes.length === 0 ? (
          <p className="text-xs text-[#A8A9AD] text-center mt-4">No internal notes yet. Use these to collaborate with staff without the user seeing.</p>
        ) : (
          notes.map(note => (
            <div key={note.id} className="bg-yellow-100/90 text-black p-2.5 rounded text-xs relative group">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-[10px] uppercase tracking-wide">{note.admin_name}</span>
                <button onClick={() => handleDelete(note.id)} className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-800">
                  <Trash2 size={12} />
                </button>
              </div>
              <p className="leading-relaxed">{note.note_content}</p>
              <p className="text-[9px] text-black/50 mt-1">{note.created_date ? new Date(note.created_date).toLocaleString() : ""}</p>
            </div>
          ))
        )}
      </div>
      <div className="p-3 border-t border-[#A8A9AD]/20">
        <div className="flex gap-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add a private staff note..."
            className="flex-1 bg-black/30 border border-[#A8A9AD]/30 px-2 py-1.5 text-xs text-white placeholder:text-[#A8A9AD] focus:border-yellow-400 focus:outline-none min-h-[50px] resize-none"
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAdd(); } }}
          />
          <button
            onClick={handleAdd}
            disabled={!content.trim() || saving}
            className="bg-yellow-400 text-black px-3 flex items-center justify-center hover:bg-yellow-300 disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}