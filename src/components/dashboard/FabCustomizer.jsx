import { useState } from "react";
import { Loader2, Check, RotateCcw } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { FAB_ACTIONS, getDefaultActionKeys, ACTION_GROUPS } from "./fabActions";

const MAX = 4;

export default function FabCustomizer({ current, familyRole, onSaved, onClose }) {
  const { user, checkUserAuth } = useAuth();
  const [selected, setSelected] = useState(() => {
    if (current) {
      const keys = current.split(",").map((s) => s.trim()).filter((k) => FAB_ACTIONS[k]);
      if (keys.length > 0) return keys;
    }
    return getDefaultActionKeys(familyRole);
  });
  const [saving, setSaving] = useState(false);

  const toggle = (key) => {
    setSelected((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      if (prev.length >= MAX) return prev;
      return [...prev, key];
    });
  };

  const resetDefaults = () => setSelected(getDefaultActionKeys(familyRole));

  const save = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({ fab_actions: selected.join(",") });
      // refresh the auth user so user.fab_actions reflects the change app-wide
      if (checkUserAuth) await checkUserAuth();
      onSaved(selected);
    } catch (e) {
      alert("Failed to save your quick actions.");
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        className="w-full sm:max-w-md max-h-[85vh] overflow-y-auto border border-[#C9A84C]/30 bg-[#0A0A0A] text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-[#0A0A0A] border-b border-[#A8A9AD]/20 p-5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Customize Quick Actions</h3>
            <p className="text-xs text-[#A8A9AD] mt-1">Choose up to {MAX} actions for your + menu.</p>
          </div>
          <button onClick={onClose} className="text-[#A8A9AD] hover:text-white text-xl leading-none">&times;</button>
        </div>

        <div className="p-5 space-y-5">
          {ACTION_GROUPS.map((group) => (
            <div key={group}>
              <p className="text-[10px] tracking-widest uppercase text-[#C9A84C] mb-2">{group}</p>
              <div className="space-y-2">
                {Object.values(FAB_ACTIONS)
                  .filter((a) => a.group === group)
                  .map((a) => {
                    const Icon = a.icon;
                    const active = selected.includes(a.key);
                    const disabled = !active && selected.length >= MAX;
                    return (
                      <button
                        key={a.key}
                        onClick={() => toggle(a.key)}
                        disabled={disabled}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 border text-left transition-colors ${
                          active
                            ? "border-[#C9A84C] bg-[#C9A84C]/10"
                            : disabled
                            ? "border-[#A8A9AD]/10 opacity-40 cursor-not-allowed"
                            : "border-[#A8A9AD]/20 hover:border-[#C9A84C]/30"
                        }`}
                      >
                        <Icon size={18} className={active ? "text-[#C9A84C]" : "text-[#A8A9AD]"} />
                        <span className="flex-1 text-sm font-medium">{a.label}</span>
                        {active && <Check size={16} className="text-[#C9A84C]" />}
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>

        <div className="sticky bottom-0 bg-[#0A0A0A] border-t border-[#A8A9AD]/20 p-4 flex items-center gap-3">
          <button onClick={resetDefaults} className="flex items-center gap-2 px-3 py-3 text-sm text-[#A8A9AD] hover:text-white transition-colors">
            <RotateCcw size={16} /> Reset
          </button>
          <button
            onClick={save}
            disabled={saving || selected.length === 0}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase hover:bg-[#E0C97A] transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}