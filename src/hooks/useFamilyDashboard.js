import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useFamily } from "@/lib/FamilyContext";

export function useFamilyDashboard() {
  const { hasFamily } = useFamily();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!hasFamily) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await base44.functions.invoke("getFamilyDashboard");
      setData(res);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [hasFamily]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, refresh: load };
}