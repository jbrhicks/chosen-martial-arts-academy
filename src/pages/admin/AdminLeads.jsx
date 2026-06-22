import { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Mail, Phone, Loader2, UserPlus, Send } from "lucide-react";

export default function AdminLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const loadLeads = useCallback(async () => {
    try {
      const data = await base44.entities.Lead.list();
      setLeads(data.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { loadLeads(); }, [loadLeads]);

  const updateStatus = async (id, status) => {
    try {
      await base44.entities.Lead.update(id, { status });
      setLeads(leads.map((l) => l.id === id ? { ...l, status } : l));
    } catch (e) { console.error(e); }
  };

  const sendWelcome = async (lead) => {
    try {
      await base44.integrations.Core.SendEmail({
        to: lead.email,
        subject: "Welcome to Chosen Martial Arts Academy — Your Free Trial Awaits",
        body: `Hello ${lead.full_name},\n\nThank you for your interest in Chosen Martial Arts Academy! We're excited to welcome you to our dojo.\n\nYour free trial pass is ready. Visit us at any scheduled class and mention your name at the front desk — no payment required for your first two weeks.\n\nWhat to bring:\n- Comfortable workout clothes\n- A water bottle\n- A positive attitude!\n\nIf you have any questions, call us at (555) 123-4567 or reply to this email.\n\nWe look forward to training with you.\n\n— The Chosen Martial Arts Academy Team`,
      });
      await base44.entities.Lead.update(lead.id, { welcome_email_sent: true });
      alert("Welcome email sent to " + lead.email);
    } catch (e) {
      alert("Failed to send email: " + e.message);
    }
  };

  const filtered = filter === "all" ? leads : leads.filter((l) => l.status === filter);

  const statusColors = {
    new: "text-[#C9A84C] border-[#C9A84C]/30",
    contacted: "text-blue-400 border-blue-400/30",
    enrolled: "text-green-400 border-green-400/30",
    lost: "text-[#A8A9AD] border-[#A8A9AD]/30",
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-2">Prospect Management</p>
        <h1 className="text-3xl font-bold">Leads</h1>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {["all", "new", "contacted", "enrolled", "lost"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-xs tracking-widest uppercase transition-all capitalize ${
              filter === f ? "bg-[#C9A84C] text-black" : "border border-[#A8A9AD]/30 text-[#A8A9AD] hover:text-white"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-[#C9A84C]" /></div>
      ) : filtered.length === 0 ? (
        <div className="border border-[#A8A9AD]/20 p-12 text-center">
          <UserPlus size={32} className="text-[#A8A9AD] mx-auto mb-3" />
          <p className="text-[#A8A9AD]">No leads in this category.</p>
        </div>
      ) : (
        <div className="space-y-px bg-[#A8A9AD]/20 border border-[#A8A9AD]/20">
          {filtered.map((lead) => (
            <div key={lead.id} className="bg-[#0A0A0A] p-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold">{lead.full_name}</h3>
                    <span className={`text-[10px] tracking-widest uppercase px-2 py-1 border ${statusColors[lead.status]}`}>
                      {lead.status}
                    </span>
                    {lead.welcome_email_sent && <span className="text-[10px] text-green-400">✓ Email sent</span>}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-[#A8A9AD]">
                    <a href={`mailto:${lead.email}`} className="flex items-center gap-1.5 hover:text-[#C9A84C]"><Mail size={14} /> {lead.email}</a>
                    <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 hover:text-[#C9A84C]"><Phone size={14} /> {lead.phone}</a>
                    <span>· {lead.interest}</span>
                  </div>
                  {lead.message && <p className="text-sm text-[#A8A9AD] mt-2 italic">"{lead.message}"</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!lead.welcome_email_sent && (
                    <button
                      onClick={() => sendWelcome(lead)}
                      className="flex items-center gap-1.5 px-3 py-2 border border-[#A8A9AD]/30 text-xs text-[#A8A9AD] hover:text-[#C9A84C] hover:border-[#C9A84C]/50 transition-colors"
                    >
                      <Send size={14} /> Resend
                    </button>
                  )}
                  <select
                    value={lead.status}
                    onChange={(e) => updateStatus(lead.id, e.target.value)}
                    className="bg-[#0A0A0A] border border-[#A8A9AD]/30 px-3 py-2 text-xs text-white focus:border-[#C9A84C] focus:outline-none"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="enrolled">Enrolled</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}