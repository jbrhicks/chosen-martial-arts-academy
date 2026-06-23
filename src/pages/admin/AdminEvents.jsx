import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Calendar, Plus, Users, DollarSign, Loader2, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import EventCreatorWizard from "@/components/admin/events/EventCreatorWizard";
import EventRoster from "@/components/admin/events/EventRoster";

export default function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreator, setShowCreator] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  const load = async () => {
    try {
      const all = await base44.entities.Event.list("-start_date");
      setEvents(all);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = events.filter((e) => {
    const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === "all" || e.event_type === filterType;
    return matchesSearch && matchesType;
  });

  const stats = {
    total: events.length,
    active: events.filter((e) => e.status === "active").length,
    totalRevenue: events.reduce((sum, e) => sum + (e.price || 0), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-2">Event Management</p>
          <h1 className="text-3xl font-bold">Events</h1>
          <p className="text-sm text-[#A8A9AD] mt-1">Create and manage academy events, tournaments, and camps.</p>
        </div>
        <Button onClick={() => setShowCreator(true)} className="bg-[#C9A84C] text-black font-bold text-xs tracking-widest uppercase hover:bg-[#E0C97A]">
          <Plus size={16} className="mr-2" />
          Create Event
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-[#A8A9AD]/20 bg-black p-4">
          <div className="flex items-center gap-3">
            <Calendar size={20} className="text-[#C9A84C]" />
            <div>
              <p className="text-xs text-[#A8A9AD] uppercase tracking-widest">Total Events</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="border border-[#A8A9AD]/20 bg-black p-4">
          <div className="flex items-center gap-3">
            <Users size={20} className="text-[#C9A84C]" />
            <div>
              <p className="text-xs text-[#A8A9AD] uppercase tracking-widest">Active Events</p>
              <p className="text-2xl font-bold">{stats.active}</p>
            </div>
          </div>
        </div>
        <div className="border border-[#A8A9AD]/20 bg-black p-4">
          <div className="flex items-center gap-3">
            <DollarSign size={20} className="text-[#C9A84C]" />
            <div>
              <p className="text-xs text-[#A8A9AD] uppercase tracking-widest">Avg Price</p>
              <p className="text-2xl font-bold">${stats.totalRevenue > 0 ? (stats.totalRevenue / stats.total).toFixed(2) : "0"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A9AD]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events..."
            className="pl-10 bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none"
        >
          <option value="all">All Types</option>
          <option value="single-day">Single-Day</option>
          <option value="multi-day">Multi-Day</option>
          <option value="camp">Camp</option>
          <option value="tournament">Tournament</option>
          <option value="in-house">In-House</option>
        </select>
      </div>

      {/* Event List */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-[#C9A84C]" /></div>
      ) : filtered.length === 0 ? (
        <div className="border border-[#A8A9AD]/20 bg-black p-12 text-center">
          <Calendar size={40} className="mx-auto text-[#A8A9AD]/40 mb-4" />
          <p className="text-sm text-[#A8A9AD]">No events found.</p>
          <p className="text-xs text-[#A8A9AD]/60 mt-2">Create your first event to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((event) => (
            <div key={event.id} className="border border-[#A8A9AD]/20 bg-black p-4 hover:border-[#C9A84C]/30 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-white">{event.title}</h3>
                    <span className={`px-2 py-0.5 text-xs uppercase tracking-wider rounded ${
                      event.status === "active" ? "bg-green-900/30 text-green-400" :
                      event.status === "cancelled" ? "bg-red-900/30 text-red-400" :
                      "bg-gray-900/30 text-gray-400"
                    }`}>
                      {event.status}
                    </span>
                    {event.is_public && <span className="px-2 py-0.5 text-xs uppercase tracking-wider rounded bg-[#C9A84C]/20 text-[#C9A84C]">Public</span>}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-[#A8A9AD] mb-2">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {new Date(event.start_date).toLocaleDateString()}
                      {event.end_date && event.end_date !== event.start_date && ` - ${new Date(event.end_date).toLocaleDateString()}`}
                    </span>
                    <span className="capitalize">{event.event_type.replace("-", " ")}</span>
                    {event.price > 0 && <span>${event.price}</span>}
                    {event.max_capacity > 0 && <span>Max: {event.max_capacity}</span>}
                  </div>
                  {event.target_audience_rank_name && (
                    <p className="text-xs text-[#C9A84C]">Rank Required: {event.target_audience_rank_name}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setSelectedEvent(event)}
                    variant="outline"
                    className="border-[#A8A9AD]/30 text-[#A8A9AD] hover:text-white hover:border-[#C9A84C]/50"
                  >
                    <Users size={16} className="mr-2" />
                    Roster
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreator && <EventCreatorWizard onClose={() => setShowCreator(false)} onEventCreated={() => { setShowCreator(false); load(); }} />}
      {selectedEvent && <EventRoster event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
    </div>
  );
}