import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, FileText, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";

export default function TemplateLibrary({ templates, onLoad, onClose, onRefresh }) {
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");

  const filtered = templates.filter(t => {
    if (filterCat !== "all" && t.category !== filterCat) return false;
    if (search && !t.title?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleDelete = async (id) => {
    try {
      await base44.entities.MessageTemplate.delete(id);
      toast.success("Template deleted");
      onRefresh();
    } catch (e) {
      toast.error("Failed to delete: " + e.message);
    }
  };

  const categories = ["all", "Weather", "Billing", "Events", "Schedule", "Holiday", "General"];

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-black border border-[#A8A9AD]/20 w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col rounded-lg" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-[#A8A9AD]/20 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Template Library</h2>
          <Button variant="ghost" size="sm" onClick={onClose}><X size={18} /></Button>
        </div>

        <div className="p-4 border-b border-[#A8A9AD]/20 space-y-3">
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates..." className="bg-[#0A0A0A] border-[#A8A9AD]/20 text-white" />
          <div className="flex flex-wrap gap-2">
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setFilterCat(c)}
                className={`px-3 py-1 text-xs rounded transition-colors ${filterCat === c ? "bg-[#C9A84C] text-black" : "border border-[#A8A9AD]/30 text-[#A8A9AD] hover:text-white"}`}
              >
                {c === "all" ? "All" : c}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-[#A8A9AD]">
              <FileText size={32} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm">No templates yet. Save one from the composer.</p>
            </div>
          ) : (
            filtered.map(tpl => (
              <div key={tpl.id} className="border border-[#A8A9AD]/20 p-4 hover:border-[#C9A84C]/30 transition-colors">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-white">{tpl.title}</h3>
                    <Badge variant="outline" className="mt-1 text-xs border-[#A8A9AD]/30 text-[#A8A9AD]">{tpl.category}</Badge>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" onClick={() => onLoad(tpl)} className="bg-[#C9A84C] text-black hover:bg-[#E0C97A] h-8">
                      <Plus size={14} className="mr-1" /> Load
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(tpl.id)} className="border-red-500/30 text-red-400 hover:bg-red-500/10 h-8">
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-[#A8A9AD] line-clamp-2 whitespace-pre-wrap">{tpl.message_body}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}