import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, ChevronUp, ChevronDown, X } from "lucide-react";

export default function LessonPlanSectionEditor({ sections, onChange }) {
  const [availableSections, setAvailableSections] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");

  useEffect(() => {
    base44.entities.LessonPlanSection.filter({ is_active: true })
      .then((items) => setAvailableSections(items.sort((a, b) => (a.display_order || 0) - (b.display_order || 0))))
      .catch(() => {});
  }, []);

  const addSection = (name) => {
    onChange([...sections, { section_name: name, content: "" }]);
    setShowAdd(false);
  };

  const addCustomSection = async () => {
    if (!newSectionName.trim()) return;
    try {
      await base44.entities.LessonPlanSection.create({
        section_name: newSectionName.trim(),
        is_active: true,
        created_by_name: "",
      });
      setAvailableSections([...availableSections, { section_name: newSectionName.trim() }]);
    } catch (e) { /* might already exist */ }
    addSection(newSectionName.trim());
    setNewSectionName("");
  };

  const updateContent = (index, content) => {
    const updated = [...sections];
    updated[index] = { ...updated[index], content };
    onChange(updated);
  };

  const removeSection = (index) => {
    onChange(sections.filter((_, i) => i !== index));
  };

  const moveSection = (index, dir) => {
    const newIndex = index + dir;
    if (newIndex < 0 || newIndex >= sections.length) return;
    const updated = [...sections];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    onChange(updated);
  };

  const unusedTemplates = availableSections.filter(
    (s) => !sections.some((sec) => sec.section_name === s.section_name)
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs tracking-widest uppercase text-[#A8A9AD]">Lesson Plan Sections</label>
        <button type="button" onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1 text-xs text-[#C9A84C] hover:text-[#E0C97A]">
          <Plus size={14} /> Add Section
        </button>
      </div>

      {showAdd && (
        <div className="border border-[#A8A9AD]/20 p-3 mb-3 space-y-3">
          {unusedTemplates.length > 0 && (
            <div>
              <p className="text-xs text-[#A8A9AD] mb-2">Select from existing sections:</p>
              <div className="flex flex-wrap gap-2">
                {unusedTemplates.map((s) => (
                  <button key={s.id || s.section_name} type="button" onClick={() => addSection(s.section_name)} className="border border-[#C9A84C]/30 px-3 py-1.5 text-xs text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-colors">
                    {s.section_name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <input value={newSectionName} onChange={(e) => setNewSectionName(e.target.value)} placeholder="Or create a custom section name..." className="flex-1 bg-transparent border border-[#A8A9AD]/30 px-3 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
            <button type="button" onClick={addCustomSection} disabled={!newSectionName.trim()} className="px-3 py-2 bg-[#C9A84C] text-black text-sm font-bold hover:bg-[#E0C97A] disabled:opacity-50">Add</button>
          </div>
          <button type="button" onClick={() => setShowAdd(false)} className="text-xs text-[#A8A9AD] hover:text-white">Cancel</button>
        </div>
      )}

      {sections.length === 0 ? (
        <p className="text-sm text-[#A8A9AD] italic py-4 text-center border border-dashed border-[#A8A9AD]/20">No sections yet. Click "Add Section" to structure your lesson plan.</p>
      ) : (
        <div className="space-y-3">
          {sections.map((section, index) => (
            <div key={index} className="border border-[#A8A9AD]/20 bg-black">
              <div className="flex items-center justify-between px-3 py-2 border-b border-[#A8A9AD]/20 bg-[#0A0A0A]">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#A8A9AD]">{index + 1}.</span>
                  <h4 className="text-sm font-bold text-[#C9A84C]">{section.section_name}</h4>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => moveSection(index, -1)} disabled={index === 0} className="text-[#A8A9AD] hover:text-white disabled:opacity-30"><ChevronUp size={14} /></button>
                  <button type="button" onClick={() => moveSection(index, 1)} disabled={index === sections.length - 1} className="text-[#A8A9AD] hover:text-white disabled:opacity-30"><ChevronDown size={14} /></button>
                  <button type="button" onClick={() => removeSection(index)} className="text-[#A8A9AD] hover:text-red-400 ml-1"><Trash2 size={14} /></button>
                </div>
              </div>
              <textarea
                value={section.content}
                onChange={(e) => updateContent(index, e.target.value)}
                rows={3}
                placeholder="Enter content for this section..."
                className="w-full bg-transparent px-3 py-2 text-sm text-white focus:outline-none resize-none"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}