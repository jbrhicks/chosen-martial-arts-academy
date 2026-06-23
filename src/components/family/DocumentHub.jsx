import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useFamily } from "@/lib/FamilyContext";
import { Loader2, FileText, CheckCircle, Clock, Plus, X, PenLine, AlertCircle } from "lucide-react";

const DOC_TYPE_LABELS = {
  waiver: "Waiver",
  permission_slip: "Permission Slip",
  testing_form: "Testing Form",
  other: "Document",
};

export default function DocumentHub() {
  const { user } = useAuth();
  const { familyGroup, members, isPrimaryGuardian, hasFamily } = useFamily();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [showCreate, setShowCreate] = useState(false);
  const [signing, setSigning] = useState(null);
  const [createForm, setCreateForm] = useState({ user_id: "", title: "", description: "", document_type: "permission_slip", due_date: "" });
  const [creating, setCreating] = useState(false);

  const students = members.filter((m) => m.family_role === "student");

  const loadDocs = async () => {
    if (!familyGroup?.id) { setLoading(false); return; }
    try {
      const docs = await base44.entities.FamilyDocument.filter({ family_id: familyGroup.id });
      setDocuments(docs.sort((a, b) => {
        if (a.status === "pending" && b.status !== "pending") return -1;
        if (a.status !== "pending" && b.status === "pending") return 1;
        return new Date(a.due_date || a.created_date) - new Date(b.due_date || b.created_date);
      }));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadDocs(); }, [familyGroup?.id]);

  const signDocument = async (doc) => {
    setSigning(doc.id);
    try {
      await base44.entities.FamilyDocument.update(doc.id, {
        status: "signed",
        signed_by: user.full_name,
        signed_date: new Date().toISOString().split("T")[0],
      });
      loadDocs();
    } catch (e) { alert("Failed to sign document."); }
    setSigning(null);
  };

  const createDocument = async (e) => {
    e.preventDefault();
    if (!createForm.user_id || !createForm.title.trim()) return;
    setCreating(true);
    try {
      const student = members.find((m) => m.id === createForm.user_id);
      await base44.entities.FamilyDocument.create({
        family_id: familyGroup.id,
        user_id: createForm.user_id,
        user_name: student?.full_name || "Unknown",
        title: createForm.title,
        description: createForm.description,
        document_type: createForm.document_type,
        status: "pending",
        due_date: createForm.due_date || undefined,
      });
      setShowCreate(false);
      setCreateForm({ user_id: "", title: "", description: "", document_type: "permission_slip", due_date: "" });
      loadDocs();
    } catch (e) { alert("Failed to create document."); }
    setCreating(false);
  };

  const filtered = documents.filter((d) => filter === "all" || d.status === filter);
  const pendingCount = documents.filter((d) => d.status === "pending").length;

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-[#C9A84C]" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary + actions */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex gap-3">
          <div className="border border-[#C9A84C]/30 bg-[#C9A84C]/5 px-5 py-3">
            <p className="text-[10px] tracking-widest uppercase text-[#A8A9AD]">Pending</p>
            <p className="text-2xl font-bold text-[#C9A84C]">{pendingCount}</p>
          </div>
          <div className="border border-[#A8A9AD]/20 bg-black px-5 py-3">
            <p className="text-[10px] tracking-widest uppercase text-[#A8A9AD]">Total</p>
            <p className="text-2xl font-bold">{documents.length}</p>
          </div>
        </div>
        {isPrimaryGuardian && students.length > 0 && (
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 bg-[#C9A84C] text-black font-bold text-sm tracking-wide uppercase hover:bg-[#E0C97A] transition-colors">
            <Plus size={16} /> Create Document
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {["pending", "signed", "all"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-xs tracking-widest uppercase transition-colors ${
              filter === f ? "bg-[#C9A84C] text-black" : "border border-[#A8A9AD]/20 text-[#A8A9AD] hover:text-white"
            }`}
          >
            {f === "all" ? "All" : f}
          </button>
        ))}
      </div>

      {/* Documents */}
      {filtered.length === 0 ? (
        <div className="border border-[#A8A9AD]/20 bg-black p-12 text-center">
          <FileText size={28} className="mx-auto text-[#A8A9AD] mb-3" />
          <p className="text-[#A8A9AD]">No {filter !== "all" ? filter : ""} documents.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((doc) => {
            const isPending = doc.status === "pending";
            const isSigned = doc.status === "signed";
            const overdue = isPending && doc.due_date && new Date(doc.due_date) < new Date();
            return (
              <div key={doc.id} className={`border bg-black p-5 ${isPending ? (overdue ? "border-red-400/30" : "border-[#C9A84C]/20") : "border-[#A8A9AD]/20"}`}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="text-[9px] tracking-widest uppercase text-[#C9A84C] border border-[#C9A84C]/30 px-2 py-0.5">{DOC_TYPE_LABELS[doc.document_type]}</span>
                      <span className="text-sm font-medium text-[#A8A9AD]">{doc.user_name}</span>
                      {overdue && <span className="text-[9px] tracking-widest uppercase text-red-400 flex items-center gap-1"><AlertCircle size={10} /> Overdue</span>}
                    </div>
                    <h4 className="font-bold text-sm mb-1">{doc.title}</h4>
                    {doc.description && <p className="text-xs text-[#A8A9AD]">{doc.description}</p>}
                    {doc.due_date && <p className="text-xs text-[#A8A9AD] mt-2">Due: {new Date(doc.due_date).toLocaleDateString()}</p>}
                    {isSigned && (
                      <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
                        <CheckCircle size={12} /> Signed by {doc.signed_by} on {new Date(doc.signed_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  {isPending && isPrimaryGuardian && (
                    <button
                      onClick={() => signDocument(doc)}
                      disabled={signing === doc.id}
                      className="flex items-center gap-2 px-4 py-2.5 bg-[#C9A84C] text-black font-bold text-xs tracking-widest uppercase hover:bg-[#E0C97A] transition-colors disabled:opacity-50 shrink-0"
                    >
                      {signing === doc.id ? <Loader2 size={14} className="animate-spin" /> : <PenLine size={14} />} Sign
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create document modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-md border border-[#C9A84C]/30 bg-[#0A0A0A] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">Create Document</h3>
              <button onClick={() => setShowCreate(false)} className="text-[#A8A9AD] hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={createDocument} className="space-y-4">
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">For Student *</label>
                <select value={createForm.user_id} onChange={(e) => setCreateForm({ ...createForm, user_id: e.target.value })} className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" required>
                  <option value="">Select student...</option>
                  {students.map((s) => <option key={s.id} value={s.id}>{s.full_name || "Unnamed"}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Title *</label>
                <input value={createForm.title} onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" placeholder="e.g. Tournament Permission Slip" required />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Description</label>
                <textarea value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} rows={3} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none resize-none" placeholder="Document details..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Type</label>
                  <select value={createForm.document_type} onChange={(e) => setCreateForm({ ...createForm, document_type: e.target.value })} className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none">
                    {Object.entries(DOC_TYPE_LABELS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Due Date</label>
                  <input type="date" value={createForm.due_date} onChange={(e) => setCreateForm({ ...createForm, due_date: e.target.value })} className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
                </div>
              </div>
              <button type="submit" disabled={creating} className="w-full bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase py-3 hover:bg-[#E0C97A] transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                {creating ? <Loader2 size={16} className="animate-spin" /> : "Create Document"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}