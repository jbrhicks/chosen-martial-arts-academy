import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import BeltCard from "@/components/admin/curriculum/BeltCard";
import { Loader2, Plus, X, BookOpen, Copy } from "lucide-react";

export default function AdminCurriculumBuilder() {
  const [programs, setPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [belts, setBelts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [beltsLoading, setBeltsLoading] = useState(false);
  const [showAddBelt, setShowAddBelt] = useState(false);
  const [beltForm, setBeltForm] = useState({ belt_name: "", rank_order: 1, min_classes_required: 20, min_time_in_grade: 8 });
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);

  const loadPrograms = async () => {
    try { const p = await base44.entities.Program.list(); setPrograms(p); if (p.length > 0) setSelectedProgram(p[0]); } catch (e) { console.error(e); }
    setLoading(false);
  };

  const loadBelts = async () => {
    if (!selectedProgram) return;
    setBeltsLoading(true);
    try {
      const b = await base44.entities.RankBelt.filter({ program_id: selectedProgram.id });
      b.sort((a, b) => (a.rank_order || 0) - (b.rank_order || 0));
      setBelts(b);
    } catch (e) { console.error(e); }
    setBeltsLoading(false);
  };

  useEffect(() => { loadPrograms(); }, []);
  useEffect(() => { loadBelts(); }, [selectedProgram?.id]);

  const handleAddBelt = async (e) => {
    e.preventDefault();
    if (!beltForm.belt_name.trim()) return;
    setSaving(true);
    try {
      await base44.entities.RankBelt.create({
        ...beltForm,
        program_id: selectedProgram.id,
        program_name: selectedProgram.program_name,
      });
      setShowAddBelt(false);
      setBeltForm({ belt_name: "", rank_order: belts.length + 1, min_classes_required: 20, min_time_in_grade: 8 });
      loadBelts();
    } catch (e) { alert("Failed to create belt."); }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-[#C9A84C]" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-2">Syllabus Builder</p>
        <h1 className="text-3xl font-bold">Curriculum Builder</h1>
        <p className="text-sm text-[#A8A9AD] mt-2">Build belt hierarchies and attach criteria, descriptions, and videos for each rank.</p>
      </div>

      {/* Program selector */}
      <div className="flex items-center gap-4 flex-wrap">
        <label className="text-xs tracking-widest uppercase text-[#A8A9AD]">Program:</label>
        <select value={selectedProgram?.id || ""} onChange={e => setSelectedProgram(programs.find(p => p.id === e.target.value))} className="bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none">
          {programs.map(p => <option key={p.id} value={p.id}>{p.program_name}</option>)}
        </select>
        {selectedProgram && (
          <>
            <button onClick={() => setShowAddBelt(true)} className="flex items-center gap-2 px-4 py-2.5 bg-[#C9A84C] text-black font-bold text-sm tracking-wide uppercase hover:bg-[#E0C97A] transition-colors">
              <Plus size={16} /> Add Belt
            </button>
            {selectedProgram.program_name.includes("Tang Soo Do") && (
              <button onClick={() => setShowSyncModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-[#3B82F6] text-white font-bold text-sm tracking-wide uppercase hover:bg-[#2563EB] transition-colors">
                <Copy size={16} /> Sync Tang Soo Do Programs
              </button>
            )}
          </>
        )}
      </div>

      {/* Belt list */}
      {beltsLoading ? (
        <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-[#C9A84C]" /></div>
      ) : belts.length === 0 ? (
        <div className="border border-[#A8A9AD]/20 bg-black p-12 text-center">
          <BookOpen size={32} className="text-[#A8A9AD] mx-auto mb-3" />
          <p className="text-[#A8A9AD]">No belts defined yet. Click "Add Belt" to start building the curriculum.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {belts.map(belt => <BeltCard key={belt.id} belt={belt} onBeltUpdate={loadBelts} onBeltDelete={loadBelts} />)}
        </div>
      )}

      {/* Add belt modal */}
      {showAddBelt && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setShowAddBelt(false)}>
          <div className="w-full max-w-md border border-[#C9A84C]/30 bg-[#0A0A0A] p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">Add Belt to {selectedProgram?.program_name}</h3>
              <button onClick={() => setShowAddBelt(false)} className="text-[#A8A9AD] hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleAddBelt} className="space-y-4">
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Belt Name *</label>
                <input value={beltForm.belt_name} onChange={e => setBeltForm({ ...beltForm, belt_name: e.target.value })} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" placeholder="e.g. White Belt" required />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Rank Order</label>
                  <input type="number" value={beltForm.rank_order} onChange={e => setBeltForm({ ...beltForm, rank_order: parseInt(e.target.value) || 1 })} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Min Classes</label>
                  <input type="number" value={beltForm.min_classes_required} onChange={e => setBeltForm({ ...beltForm, min_classes_required: parseInt(e.target.value) || 0 })} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Min Weeks</label>
                  <input type="number" value={beltForm.min_time_in_grade} onChange={e => setBeltForm({ ...beltForm, min_time_in_grade: parseInt(e.target.value) || 0 })} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
                </div>
              </div>
              <button type="submit" disabled={saving} className="w-full bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase py-3 hover:bg-[#E0C97A] transition-colors disabled:opacity-50">
                {saving ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Create Belt"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Sync modal */}
      {showSyncModal && (
        <SyncModal
          selectedProgram={selectedProgram}
          programs={programs}
          onClose={() => setShowSyncModal(false)}
          onSyncComplete={() => { setShowSyncModal(false); loadBelts(); }}
        />
      )}
    </div>
  );
}

function SyncModal({ selectedProgram, programs, onClose, onSyncComplete }) {
  const [syncing, setSyncing] = useState(false);
  const [targetProgram, setTargetProgram] = useState(null);

  const tangSooDoPrograms = programs.filter(p => p.program_name.includes("Tang Soo Do") && p.id !== selectedProgram.id);

  const handleSync = async () => {
    if (!targetProgram) {
      alert("Please select a target program.");
      return;
    }
    if (!confirm(`This will copy all belts and criteria from ${selectedProgram.program_name} to ${targetProgram.program_name}. Existing belts in the target program will be deleted. Continue?`)) return;

    setSyncing(true);
    try {
      // Get all belts from source program
      const sourceBelts = await base44.entities.RankBelt.filter({ program_id: selectedProgram.id });
      sourceBelts.sort((a, b) => (a.rank_order || 0) - (b.rank_order || 0));

      // Delete existing belts in target program
      const existingTargetBelts = await base44.entities.RankBelt.filter({ program_id: targetProgram.id });
      for (const belt of existingTargetBelts) {
        await base44.entities.RankBelt.delete(belt.id);
      }

      // Copy belts to target program
      for (const belt of sourceBelts) {
        const newBelt = await base44.entities.RankBelt.create({
          program_id: targetProgram.id,
          program_name: targetProgram.program_name,
          belt_name: belt.belt_name,
          rank_order: belt.rank_order,
          min_classes_required: belt.min_classes_required,
          min_time_in_grade: belt.min_time_in_grade,
        });

        // Copy criteria for each belt
        const sourceCriteria = await base44.entities.CurriculumCriteria.filter({ rank_id: belt.id });
        for (const criteria of sourceCriteria) {
          await base44.entities.CurriculumCriteria.create({
            rank_id: newBelt.id,
            belt_name: newBelt.belt_name,
            program_id: targetProgram.id,
            program_name: targetProgram.program_name,
            category: criteria.category,
            title: criteria.title,
            description: criteria.description,
            display_order: criteria.display_order,
            is_required: criteria.is_required,
          });
        }
      }

      alert("Programs synced successfully!");
      onSyncComplete();
    } catch (e) {
      alert("Failed to sync programs: " + e.message);
    }
    setSyncing(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-md border border-[#C9A84C]/30 bg-[#0A0A0A] p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">Sync Tang Soo Do Programs</h3>
          <button onClick={onClose} className="text-[#A8A9AD] hover:text-white"><X size={18} /></button>
        </div>
        <p className="text-sm text-[#A8A9AD] mb-4">
          Copy all belts and criteria from <strong>{selectedProgram.program_name}</strong> to another Tang Soo Do program.
        </p>
        <div className="mb-6">
          <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Target Program</label>
          <select
            value={targetProgram?.id || ""}
            onChange={e => setTargetProgram(programs.find(p => p.id === e.target.value))}
            className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none"
          >
            <option value="">Select a program...</option>
            {tangSooDoPrograms.map(p => (
              <option key={p.id} value={p.id}>{p.program_name}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSync}
            disabled={syncing || !targetProgram}
            className="flex-1 bg-[#3B82F6] text-white font-bold text-sm tracking-widest uppercase py-3 hover:bg-[#2563EB] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {syncing ? <Loader2 size={16} className="animate-spin" /> : <><Copy size={16} /> Sync Programs</>}
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 border border-[#A8A9AD]/30 text-[#A8A9AD] hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}