import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Loader2, MapPin, Crosshair, Save } from "lucide-react";

export default function GeofenceManager({ onClose }) {
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState({ academy_lat: "", academy_lng: "", geofence_radius: 50, location_name: "Main Academy" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await base44.entities.LocationSettings.list();
        if (data.length > 0) {
          setSettings(data[0]);
          setForm({
            academy_lat: data[0].academy_lat || "",
            academy_lng: data[0].academy_lng || "",
            geofence_radius: data[0].geofence_radius || 50,
            location_name: data[0].location_name || "Main Academy",
          });
        }
      } catch (e) {}
      setLoading(false);
    };
    load();
  }, []);

  const useMyLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(f => ({ ...f, academy_lat: pos.coords.latitude, academy_lng: pos.coords.longitude }));
        setLocating(false);
      },
      () => { alert("Could not get your location."); setLocating(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (settings) {
        await base44.entities.LocationSettings.update(settings.id, form);
      } else {
        await base44.entities.LocationSettings.create(form);
      }
      setSaved(true);
      setTimeout(() => onClose(), 1000);
    } catch (e) { alert("Failed to save geofence settings."); }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-md border border-[#C9A84C]/30 bg-[#0A0A0A] p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <MapPin size={20} className="text-[#C9A84C]" />
            <h3 className="text-lg font-bold">Geofence Settings</h3>
          </div>
          <button onClick={onClose} className="text-[#A8A9AD] hover:text-white"><X size={18} /></button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-[#C9A84C]" /></div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Location Name</label>
              <input
                type="text"
                value={form.location_name}
                onChange={e => setForm({ ...form, location_name: e.target.value })}
                className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={form.academy_lat}
                  onChange={e => setForm({ ...form, academy_lat: parseFloat(e.target.value) })}
                  className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={form.academy_lng}
                  onChange={e => setForm({ ...form, academy_lng: parseFloat(e.target.value) })}
                  className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none"
                />
              </div>
            </div>
            <button
              onClick={useMyLocation}
              disabled={locating}
              className="w-full flex items-center justify-center gap-2 py-2.5 border border-[#C9A84C]/30 text-[#C9A84C] text-sm font-medium hover:bg-[#C9A84C]/10 transition-colors disabled:opacity-50"
            >
              {locating ? <Loader2 size={16} className="animate-spin" /> : <Crosshair size={16} />} Use My Current Location
            </button>
            <div>
              <label className="block text-xs tracking-widest uppercase text-[#A8A9AD] mb-2">Geofence Radius (meters)</label>
              <input
                type="number"
                value={form.geofence_radius}
                onChange={e => setForm({ ...form, geofence_radius: parseInt(e.target.value) || 50 })}
                className="w-full bg-[#0A0A0A] border border-[#A8A9AD]/30 px-4 py-2.5 text-sm text-white focus:border-[#C9A84C] focus:outline-none"
              />
              <p className="text-xs text-[#A8A9AD]/60 mt-1">Students within this radius can check in via GPS from their device.</p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase hover:bg-[#E0C97A] transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? "Saved!" : <><Save size={16} /> Save Settings</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}