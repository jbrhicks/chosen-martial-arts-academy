import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { MapPin, Check, Loader2, Navigation } from "lucide-react";

export default function GPSCheckIn({ user, activeProfile }) {
  const [location, setLocation] = useState(null);
  const [withinFence, setWithinFence] = useState(false);
  const [checking, setChecking] = useState(false);
  const [success, setSuccess] = useState(false);
  const [checkingLocation, setCheckingLocation] = useState(true);
  const [classes, setClasses] = useState([]);

  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });

  useEffect(() => {
    const load = async () => {
      try {
        const settings = await base44.entities.LocationSettings.list();
        if (settings.length > 0) setLocation(settings[0]);
        const c = await base44.entities.ClassSchedule.filter({ is_active: true, day_of_week: today });
        setClasses(c);
      } catch (e) {}
      setCheckingLocation(false);
    };
    load();
  }, [today]);

  useEffect(() => {
    if (!location || !navigator.geolocation) { setCheckingLocation(false); return; }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const distance = calculateDistance(
          pos.coords.latitude, pos.coords.longitude,
          location.academy_lat, location.academy_lng
        );
        setWithinFence(distance <= (location.geofence_radius || 50));
        setCheckingLocation(false);
      },
      () => setCheckingLocation(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [location]);

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371e3;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const handleCheckIn = async () => {
    const profile = activeProfile || user;
    if (!profile) return;
    setChecking(true);
    try {
      const className = classes.length > 0 ? classes[0].class_name : "Open Mat";
      await base44.entities.AttendanceRecord.create({
        user_id: profile.id,
        user_name: profile.full_name,
        class_name: className,
        check_in_date: new Date().toISOString(),
        check_in_method: "GPS",
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) { alert("Check-in failed."); }
    setChecking(false);
  };

  if (checkingLocation || !location || !withinFence) {
    if (success) {
      return (
        <div className="border border-green-400/30 bg-green-400/5 p-4 flex items-center gap-3">
          <Check size={20} className="text-green-400" />
          <p className="text-sm text-green-400">Checked in! Train hard!</p>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="border border-[#C9A84C]/30 bg-[#C9A84C]/5 p-5">
      <div className="flex items-center gap-3 mb-3">
        <Navigation size={20} className="text-[#C9A84C]" />
        <div>
          <p className="text-sm font-bold">You're at the academy!</p>
          <p className="text-xs text-[#A8A9AD]">Are you here for class? Tap to check in.</p>
        </div>
      </div>
      <button
        onClick={handleCheckIn}
        disabled={checking}
        className="w-full flex items-center justify-center gap-2 py-3 bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase hover:bg-[#E0C97A] transition-colors disabled:opacity-50"
      >
        {checking ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />} Check In via GPS
      </button>
    </div>
  );
}