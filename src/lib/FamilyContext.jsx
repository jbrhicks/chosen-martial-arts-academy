import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

const FamilyContext = createContext(null);

export function FamilyProvider({ children }) {
  const { user } = useAuth();
  const [familyGroup, setFamilyGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [activeProfileId, setActiveProfileId] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadFamily = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }

    const stored = localStorage.getItem(`family_profile_${user.id}`);
    setActiveProfileId(stored || user.id);

    if (!user.family_id) {
      setFamilyGroup(null);
      setMembers([]);
      setLoading(false);
      return;
    }

    try {
      const [group, allUsers] = await Promise.all([
        base44.entities.FamilyGroup.get(user.family_id).catch(() => null),
        base44.entities.User.filter({ family_id: user.family_id }).catch(() => []),
      ]);
      setFamilyGroup(group);
      setMembers(allUsers);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [user?.id, user?.family_id]);

  useEffect(() => { loadFamily(); }, [loadFamily]);

  const switchProfile = useCallback((profileId) => {
    setActiveProfileId(profileId);
    if (user?.id) localStorage.setItem(`family_profile_${user.id}`, profileId);
  }, [user?.id]);

  const resetProfile = useCallback(() => {
    if (user?.id) {
      setActiveProfileId(user.id);
      localStorage.setItem(`family_profile_${user.id}`, user.id);
    }
  }, [user?.id]);

  const activeProfile = members.find((m) => m.id === activeProfileId) || user;
  const isViewingAsChild = activeProfile?.id !== user?.id && activeProfile?.family_role === "student";
  const isPrimaryGuardian = user?.family_role === "primary_guardian";
  const isGuardian = user?.family_role === "primary_guardian" || user?.family_role === "secondary_guardian";
  const hasFamily = !!user?.family_id;

  return (
    <FamilyContext.Provider value={{
      familyGroup, members, activeProfile, activeProfileId,
      switchProfile, resetProfile, isViewingAsChild,
      isPrimaryGuardian, isGuardian, hasFamily, loading,
      refreshFamily: loadFamily,
    }}>
      {children}
    </FamilyContext.Provider>
  );
}

export function useFamily() {
  return useContext(FamilyContext);
}