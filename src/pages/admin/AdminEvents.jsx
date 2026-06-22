import { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { EVENT_TYPES } from "@/lib/constants";
import { Loader2, Plus, X, Pencil, Trash2, Calendar } from "lucide-react";

export default function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    title: "", description: "", event_type: "seminar",
    start_date: "", end_date: "", location: "", registration_url: "", is_public: true, image_url: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const loadEvents = useCallback(async () => {
    try {
      const data = await base44.entities.Event.list();
      setEvents(data.sort((a, b) => new Date(a.start_date) - new Date(b.start_date)));
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const resetForm = () => {
    setForm({ title: "", description: "", event_type: "seminar", start_date: "", end_date: "", location: "", registration_url: "", is_public: true, image_url: "" });
    setEditing(null);
  };

  const handleEdit = (event) => {
    setEditing(event);
    const startDate = event.start_date ? new Date(event.start_date).toISOString().slice(0, 16) : "";
    const endDate = event.end_date ? new Date(event.end_date).toISOString().slice(0, 16) : "";
    setForm({
      title: event.title || "", description: event.description || "", event_type: event.event_type || "seminar",
      start_date: startDate, end_date: endDate, location: event.location || "",
      registration_url: event.registration_url || "", is_public: event.is_public !== false, image_url: event.image_url || "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.start_date) return;
    setSubmitting(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        event_type: form.event_type,
        start_date: new Date(form.start_date).toISOString(),
        end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
        location: form.location || null,
        registration_url: form.registration_url || null,
        is_public: form.is_public,
        image_url: form.image_url || null,
      };
      if (editing) {
        await base44.entities.Event.update(editing.id, payload);
      } else {
        await base44.entities.Event.create(payload);
      }
      setShowForm(false);
      resetForm();
      loadEvents();
    } catch (e) {
      alert("Failed to save event: " + e.message);
    }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this event?")) return;
    try {
      await base44.entities.Event.delete(id);
      loadEvents();
    } catch (e) { alert("Delete failed"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-2">Event Management</p>
          <h1 className="text-3xl font-bold">Events</h1>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 px-5 py-2.5 bg-[#C9A84C] text-black font-bold text-sm tracking-wide uppercase hover:bg-[#E0C97A] transition-colors">
          <Plus size={18} /> Add Event
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-[#C9A84C]" /></div>
      ) : events.length === 0 ? (
        <div className="border border-[#A8A9AD]/20 p-12 text-center">
          <Calendar size={32} className="text-[#A8A9AD] mx-auto mb-3" />
          <p className="text-[#A8A9AD]">No events yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
            const typeInfo = EVENT_TYPES[event.event_type] || EVENT_TYPES.seminar;
            const eventDate = new Date(event.start_date);
            return (
              <div key={event.id} className="border border-[#A8A9AD]/20 p-5 flex items-center gap-4">
                <div className="shrink-0 w-14 h-14 border-2 border-[#C9A84C] flex flex-col items-center justify-center">
                  <span className="text-lg font-bold text-[#C9A84C] leading-none">{eventDate.toLocaleDateString("en-US", { day: "numeric" })}</span>
                  <span className="text-[9px] tracking-widest uppercase text-[#A8A9AD]">{eventDate.toLocaleDateString("en-US", { month: "short" })}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] tracking-widest uppercase text-[#C9A84C] border border-[#C9A84C]/30 px-2 py-0.5">{typeInfo.label}</span>
                    {event.is_public === false && <span className="text-[10px] text-[#A8A9AD]">· Members only</span>}
                  </div>
                  <h3 className="font-bold text-sm">{event.title}</h3>
                  <p className="text-xs text-[#A8A9AD] mt-0.5">
                    {eventDate.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    {event.location && ` · ${event.location}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => handleEdit(event)} className="p-2 text-[#A8A9AD] hover:text-[#C9A84C] transition-colors"><Pencil size={16} /></button>
                  <button onClick={() => handleDelete(event.id)} className="p-2 text-[#A8A9AD] hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-2xl border border-[#C9A84C]/30 bg-[#0A0A0A] p-8 my-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{editing ? "Edit Event" : "Add Event"}</h2>
              <button onClick={() => setShowForm(false)} className="text-[#A8A9AD] hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Title *</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-3 text-sm text-white focus:border-[#C9A84C] focus:outline-none" required />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-3 text-sm text-white focus:border-[#C9A84C] focus:outline-none resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Event Type</label>
                  <select value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value })} className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-3 text-sm text-white focus:border-[#C9A84C] focus:outline-none">
                    {Object.entries(EVENT_TYPES).map(([key, val]) => <option key={key} value={key}>{val.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Location</label>
                  <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-3 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Start Date & Time *</label>
                  <input type="datetime-local" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-3 text-sm text-white focus:border-[#C9A84C] focus:outline-none" required />
                </div>
                <div>
                  <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">End Date & Time</label>
                  <input type="datetime-local" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-3 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Registration URL</label>
                <input type="url" value={form.registration_url} onChange={(e) => setForm({ ...form, registration_url: e.target.value })} placeholder="https://..." className="w-full bg-transparent border border-[#A8A9AD]/30 px-4 py-3 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
              </div>
              <label className="flex items-center gap-2 text-sm text-white">
                <input type="checkbox" checked={form.is_public} onChange={(e) => setForm({ ...form, is_public: e.target.checked })} className="accent-[#C9A84C]" />
                Public (visible on website)
              </label>
              <button type="submit" disabled={submitting} className="w-full bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase py-3 hover:bg-[#E0C97A] transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                {submitting ? <Loader2 size={18} className="animate-spin" /> : <>{editing ? "Update" : "Create"} Event</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}