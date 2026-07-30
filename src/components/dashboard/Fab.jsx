import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, X, Settings } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useFamily } from "@/lib/FamilyContext";
import { resolveActions, FAB_ACTIONS } from "./fabActions";
import IDCard from "@/components/portal/checkin/IDCard";
import FabCustomizer from "./FabCustomizer";

export default function Fab({ smartSlot }) {
  const { user } = useAuth();
  const { activeProfile } = useFamily();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [actions, setActions] = useState([]);
  const [showIDCard, setShowIDCard] = useState(false);
  const [customizing, setCustomizing] = useState(false);

  const familyRole = activeProfile?.family_role || user?.family_role;

  useEffect(() => {
    setActions(resolveActions(user?.fab_actions, familyRole));
  }, [user?.fab_actions, familyRole]);

  const handleAction = (a) => {
    setOpen(false);
    if (a.action === "show_barcode") {
      setShowIDCard(true);
      return;
    }
    if (a.path) navigate(a.path);
  };

  const handleSaved = (keys) => {
    setActions(keys.map((k) => FAB_ACTIONS[k]).filter(Boolean));
    setCustomizing(false);
  };

  // Smart slot (if active) occupies the topmost slot, overriding the top custom button.
  const baseActions = smartSlot ? actions.slice(0, 3) : actions.slice(0, 4);
  const displayActions = smartSlot ? [smartSlot, ...baseActions] : baseActions;

  return (
    <>
      <div className="fixed bottom-20 lg:bottom-6 right-4 z-40 flex flex-col items-end gap-2">
        {open && (
          <div className="flex flex-col items-end gap-2 mb-1">
            {displayActions.map((a, i) => {
              const Icon = a.icon;
              const isSmart = smartSlot && i === 0;
              const tone = isSmart ? a.tone : null;
              return (
                <button
                  key={(a.key || "smart") + i}
                  onClick={() => handleAction(a)}
                  className={`flex items-center gap-2 pl-3 pr-4 py-2.5 border text-sm font-medium tracking-wide transition-colors ${
                    tone === "red"
                      ? "bg-red-600 border-red-500 text-white hover:bg-red-500"
                      : tone === "green"
                      ? "bg-green-600 border-green-500 text-white hover:bg-green-500"
                      : "bg-[#0A0A0A] border-[#C9A84C]/30 text-white hover:bg-[#C9A84C]/10"
                  }`}
                >
                  <Icon size={16} />
                  {a.label}
                </button>
              );
            })}
            <button
              onClick={() => {
                setOpen(false);
                setCustomizing(true);
              }}
              className="flex items-center gap-2 pl-3 pr-4 py-2.5 border border-[#A8A9AD]/30 bg-black text-[#A8A9AD] text-sm font-medium tracking-wide hover:text-white hover:border-[#C9A84C]/30 transition-colors"
            >
              <Settings size={16} />
              Customize Menu
            </button>
          </div>
        )}
        <button
          onClick={() => setOpen(!open)}
          onContextMenu={(e) => {
            e.preventDefault();
            setCustomizing(true);
          }}
          className="w-14 h-14 rounded-full bg-[#C9A84C] text-black flex items-center justify-center shadow-lg shadow-[#C9A84C]/30 hover:bg-[#E0C97A] transition-colors"
          aria-label="Quick actions"
        >
          {open ? <X size={26} /> : <Plus size={26} />}
        </button>
      </div>

      {showIDCard && <IDCard user={activeProfile || user} onClose={() => setShowIDCard(false)} />}
      {customizing && (
        <FabCustomizer
          current={user?.fab_actions}
          familyRole={familyRole}
          onSaved={handleSaved}
          onClose={() => setCustomizing(false)}
        />
      )}
    </>
  );
}