import { createContext, useContext, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useFamily } from "@/lib/FamilyContext";

const CommunityAccessContext = createContext(null);

export function CommunityAccessProvider({ children }) {
  const { user } = useAuth();
  const { familyGroup, members, loading: familyLoading } = useFamily();
  const [hasAccess, setHasAccess] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [childGroupIds, setChildGroupIds] = useState([]);

  useEffect(() => {
    if (!user?.id) { setIsChecking(false); return; }

    // Admins always have access
    if (user.role === "admin") { setHasAccess(true); setIsChecking(false); return; }

    // Check 1: Role — must not be guest, must be active, must have valid family_role
    if (user.role === "guest" || user.is_active === false) {
      setHasAccess(false); setIsChecking(false); return;
    }

    const validFamilyRole = ["primary_guardian", "secondary_guardian", "student"].includes(user.family_role);
    if (!validFamilyRole) { setHasAccess(false); setIsChecking(false); return; }

    // For guardians, wait for family data to load
    if (user.family_role !== "student" && familyLoading) return;

    const check = async () => {
      if (user.family_role === "student") {
        // Check 2a: Student must have active enrollment
        try {
          const enrollments = await base44.entities.Enrollment.filter({ user_id: user.id });
          setHasAccess(enrollments.some(e => e.status === "active"));
        } catch (e) { setHasAccess(false); }
      } else {
        // Check 2b: Guardian — family group billing active + at least one child with active enrollment
        if (!familyGroup || familyGroup.billing_status !== "active") {
          setHasAccess(false); setIsChecking(false); return;
        }

        const children = (members || []).filter(m => m.family_role === "student");
        let hasActiveChild = false;
        const groupIds = new Set();

        for (const child of children) {
          try {
            const enrollments = await base44.entities.Enrollment.filter({ user_id: child.id });
            if (enrollments.some(e => e.status === "active")) {
              hasActiveChild = true;
              const memberships = await base44.entities.GroupMember.filter({ user_id: child.id });
              memberships.forEach(m => groupIds.add(m.group_id));
            }
          } catch (e) {}
        }

        setHasAccess(hasActiveChild);
        setChildGroupIds([...groupIds]);
      }
      setIsChecking(false);
    };

    check();
  }, [user?.id, user?.role, user?.family_role, user?.is_active, familyLoading, familyGroup?.billing_status, members?.length]);

  return (
    <CommunityAccessContext.Provider value={{ hasAccess, isChecking, childGroupIds }}>
      {children}
    </CommunityAccessContext.Provider>
  );
}

export function useCommunityAccess() {
  return useContext(CommunityAccessContext);
}