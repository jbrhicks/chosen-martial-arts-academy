import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Search, X, Plus, Link as LinkIcon, Loader2 } from "lucide-react";

export default function CurriculumQuickTag({ linkedItems, onAdd, onRemove }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (query.startsWith("@") && query.length > 1) {
      const searchTerm = query.slice(1).toLowerCase();
      setLoading(true);
      base44.entities.CurriculumCriteria.list('-display_order', 200)
        .then((items) => {
          setResults(items.filter((c) => (c.title || "").toLowerCase().includes(searchTerm)).slice(0, 8));
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    } else {
      setResults([]);
    }
  }, [query]);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) && inputRef.current && !inputRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleAdd = (item) => {
    if (linkedItems.some((l) => l.criteria_id === item.id)) return;
    onAdd({
      criteria_id: item.id,
      criteria_title: item.title,
      video_url: item.video_url || "",
      embed_url: item.embed_url || "",
      thumbnail_url: item.thumbnail_url || "",
    });
    setQuery("");
    setShowDropdown(false);
  };

  return (
    <div>
      <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-1.5">Link Curriculum Videos (@ to search)</label>
      <div className="relative" ref={dropdownRef}>
        <div className="flex items-center gap-2 border border-[#A8A9AD]/30 px-3 py-2 bg-black">
          <Search size={16} className="text-[#A8A9AD]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Type @ to search curriculum items..."
            className="bg-transparent text-sm text-white focus:outline-none flex-1"
          />
          {loading && <Loader2 size={14} className="animate-spin text-[#C9A84C]" />}
        </div>
        {showDropdown && query.startsWith("@") && query.length > 1 && (
          <div className="absolute top-full left-0 right-0 mt-1 border border-[#A8A9AD]/30 bg-[#0A0A0A] max-h-64 overflow-y-auto z-50">
            {results.length === 0 ? (
              <p className="p-4 text-sm text-[#A8A9AD] text-center">No curriculum items found.</p>
            ) : (
              results.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleAdd(item)}
                  className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-[#C9A84C]/10 transition-colors border-b border-[#A8A9AD]/10"
                >
                  <Plus size={14} className="text-[#C9A84C] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-[#A8A9AD]">{item.category}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
      {linkedItems.length > 0 && (
        <div className="mt-3 space-y-2">
          {linkedItems.map((item) => (
            <div key={item.criteria_id} className="flex items-center gap-2 border border-[#C9A84C]/20 bg-[#C9A84C]/5 px-3 py-2">
              <LinkIcon size={14} className="text-[#C9A84C] shrink-0" />
              <span className="text-sm text-white flex-1 truncate">{item.criteria_title}</span>
              {item.video_url && <span className="text-xs text-[#C9A84C]">Video linked</span>}
              <button onClick={() => onRemove(item.criteria_id)} className="text-[#A8A9AD] hover:text-red-400 transition-colors">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}