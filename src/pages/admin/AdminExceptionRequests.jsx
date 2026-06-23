import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, ShieldAlert } from "lucide-react";
import ExceptionRequestDetail from "@/components/admin/exceptions/ExceptionRequestDetail";

export default function AdminExceptionRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [selected, setSelected] = useState(null);

  const load = async () => {
    try {
      const all = await base44.entities.ExceptionRequest.list("-created_date");
      setRequests(all);
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === "all" ? requests : requests.filter(r => r.status === filter);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-2">Exception Management</p>
        <h1 className="text-3xl font-bold">Age Override Requests</h1>
        <p className="text-sm text-[#A8A9AD] mt-1">Review and process age exception requests from parents.</p>
      </div>

      <div className="grid grid-cols-3 gap-px bg-[#A8A9AD]/20 border border-[#A8A9AD]/20">
        {[
          { label: "Pending", value: requests.filter(r => r.status === "pending").length, color: "text-[#C9A84C]" },
          { label: "Approved", value: requests.filter(r => r.status === "approved").length, color: "text-green-400" },
          { label: "Denied", value: requests.filter(r => r.status === "denied").length, color: "text-red-400" },
        ].map(stat => (
          <div key={stat.label} className="bg-[#0A0A0A] p-4 text-center">
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-[10px] tracking-widest uppercase text-[#A8A9AD]">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 border border-[#A8A9AD]/20 p-1 w-full sm:w-fit">
        {["pending", "approved", "denied", "all"].map(t => (
          <button key={t} onClick={() => setFilter(t)} className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium tracking-wide capitalize transition-colors ${filter === t ? "bg-[#C9A84C] text-black" : "text-[#A8A9AD] hover:text-white"}`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-[#C9A84C]" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <ShieldAlert size={32} className="mx-auto text-[#A8A9AD]/40 mb-3" />
          <p className="text-sm text-[#A8A9AD]">No {filter} age override requests.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <button key={r.id} onClick={() => setSelected(r)} className="w-full flex items-center gap-4 border border-[#A8A9AD]/20 p-4 hover:border-[#C9A84C]/30 transition-colors text-left">
              <div className={`w-1.5 h-14 ${r.status === "pending" ? "bg-[#C9A84C]" : r.status === "approved" ? "bg-green-400" : "bg-red-400"}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <p className="text-sm font-bold">{r.student_name}</p>
                  <span className="text-xs text-[#A8A9AD]">Age: {r.student_age ?? "—"}</span>
                </div>
                <p className="text-xs text-[#C9A84C]">{r.target_program_name}</p>
                <p className="text-xs text-[#A8A9AD] mt-1 truncate">"{r.reason_for_request}"</p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-xs tracking-widest uppercase ${r.status === "pending" ? "text-[#C9A84C]" : r.status === "approved" ? "text-green-400" : "text-red-400"}`}>{r.status}</p>
                <p className="text-xs text-[#A8A9AD]">{new Date(r.created_date).toLocaleDateString()}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && <ExceptionRequestDetail request={selected} onClose={() => setSelected(null)} onProcessed={() => { setSelected(null); load(); }} />}
    </div>
  );
}