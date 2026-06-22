import { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { BELT_RANKS } from "@/lib/constants";
import BeltBadge from "@/components/BeltBadge";
import GoalManager from "@/components/admin/GoalManager";
import StudentProgressView from "@/components/admin/StudentProgressView";
import { Loader2, Target, Users } from "lucide-react";

export default function AdminProgress() {
  const [tab, setTab] = useState("goals"); // goals | students
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await base44.entities.User.list();
        setUsers(data.filter((u) => u.role !== "admin"));
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-2">Student Development</p>
        <h1 className="text-3xl font-bold">Progress & Goals</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border border-[#A8A9AD]/20 p-1 w-fit">
        <button
          onClick={() => setTab("goals")}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium tracking-wide transition-colors ${
            tab === "goals" ? "bg-[#C9A84C] text-black" : "text-[#A8A9AD] hover:text-white"
          }`}
        >
          <Target size={16} /> Belt Goals
        </button>
        <button
          onClick={() => setTab("students")}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium tracking-wide transition-colors ${
            tab === "students" ? "bg-[#C9A84C] text-black" : "text-[#A8A9AD] hover:text-white"
          }`}
        >
          <Users size={16} /> Student Progress
        </button>
      </div>

      {tab === "goals" && <GoalManager />}

      {tab === "students" && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-[#C9A84C]" /></div>
          ) : users.length === 0 ? (
            <p className="text-[#A8A9AD] text-center py-12">No students found.</p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => setSelectedUser(u)}
                    className={`border p-4 text-left transition-colors ${
                      selectedUser?.id === u.id
                        ? "border-[#C9A84C] bg-[#C9A84C]/5"
                        : "border-[#A8A9AD]/20 bg-black hover:border-[#A8A9AD]/40"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center text-xs font-bold text-[#C9A84C]">
                        {u.full_name?.charAt(0) || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{u.full_name || "Unnamed"}</p>
                        <BeltBadge rank={u.belt_rank || "White"} size="sm" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {selectedUser && (
                <StudentProgressView student={selectedUser} />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}