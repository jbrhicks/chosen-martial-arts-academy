import { createContext, useContext, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { computeIsMinor } from "@/lib/studentAccess";

const StudentAccessContext = createContext(null);

// Resolves the current user's effective permissions under the parental
// access-control system. Non-minors are never restricted here.
export function StudentAccessProvider({ children }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const isMinor = computeIsMinor(user?.dob);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    if (!isMinor) { setSettings(null); setLoading(false); return; }

    let mounted = true;
    (async () => {
      try {
        const res = await base44.entities.StudentAccessSettings.filter({ student_id: user.id });
        if (mounted) setSettings(res[0] || null);
      } catch (e) {
        console.error("Failed to load student access settings:", e);
      }
      if (mounted) setLoading(false);
    })();
    return () => { mounted = false; };
  }, [user?.id, isMinor]);

  const adminLocked = !!settings?.admin_locked;

  // Non-minors are unrestricted. Minors default to restricted (safe default)
  // until a guardian explicitly grants access and the admin has not locked it.
  const canAccessCommunity = !isMinor || (!!settings && settings.allow_community && !adminLocked);
  const canDirectMessageMembers = !isMinor || (!!settings && settings.allow_member_direct_messages && !adminLocked);

  return (
    <StudentAccessContext.Provider
      value={{ isMinor, settings, adminLocked, canAccessCommunity, canDirectMessageMembers, loading }}
    >
      {children}
    </StudentAccessContext.Provider>
  );
}

export function useStudentAccess() {
  return useContext(StudentAccessContext);
}