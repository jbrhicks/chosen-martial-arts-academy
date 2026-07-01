import { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Loader2, Search, ArrowLeft, User, Users, GraduationCap, CreditCard, Activity, ClipboardList, Ban, Trash2, AlertTriangle } from "lucide-react";
import EmergencyBanner from "@/components/admin/profile/EmergencyBanner";
import PersonalDetails from "@/components/admin/profile/PersonalDetails";
import FamilyManager from "@/components/admin/profile/FamilyManager";
import ProgramManager from "@/components/admin/profile/ProgramManager";
import BillingHub from "@/components/admin/profile/BillingHub";
import ActivityLog from "@/components/admin/profile/ActivityLog";
import AttendanceHistory from "@/components/admin/profile/AttendanceHistory";

export default function AdminProfileManager() {
  const { user: adminUser } = useAuth();
  const [allUsers, setAllUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(1);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      const users = await base44.entities.User.list();
      setAllUsers(users);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const loadProfileData = useCallback(async (userId) => {
    setDataLoading(true);
    try {
      const u = allUsers.find(x => x.id === userId);
      const familyId = u?.family_id;
      const [emergencyContacts, enrollments, programs, attendance, eventRegs, events, customFields, customFieldValues, activityLogs, billingRecords, paymentMethods, familyGroups, tiers, belts] = await Promise.all([
        base44.entities.EmergencyContact.filter({ user_id: userId }).catch(() => []),
        base44.entities.Enrollment.filter({ user_id: userId }).catch(() => []),
        base44.entities.Program.list().catch(() => []),
        base44.entities.AttendanceRecord.filter({ user_id: userId }).catch(() => []),
        base44.entities.EventRegistration.filter({ user_id: userId }).catch(() => []),
        base44.entities.Event.list().catch(() => []),
        base44.entities.CustomField.filter({ is_active: true }).catch(() => []),
        base44.entities.CustomFieldValue.filter({ user_id: userId }).catch(() => []),
        base44.entities.AdminActivityLog.filter({ user_id: userId }).catch(() => []),
        familyId ? base44.entities.BillingRecord.filter({ family_id: familyId }).catch(() => []) : Promise.resolve([]),
        familyId ? base44.entities.PaymentMethod.filter({ family_id: familyId }).catch(() => []) : Promise.resolve([]),
        familyId ? base44.entities.FamilyGroup.filter({ id: familyId }).catch(() => []) : Promise.resolve([]),
        base44.entities.SubscriptionTier.list().catch(() => []),
        base44.entities.RankBelt.list().catch(() => []),
      ]);
      const family = familyGroups[0] || null;
      const familyMembers = family ? allUsers.filter(x => x.family_id === family.id) : [];
      setProfileData({ user: u, emergencyContacts, enrollments, programs, attendance, eventRegs, events, customFields, customFieldValues, activityLogs, billingRecords, paymentMethods, family, familyMembers, tiers, belts });
    } catch (e) { console.error(e); }
    setDataLoading(false);
  }, [allUsers]);

  const selectUser = (userId) => { setSelectedUserId(userId); setActiveTab(1); loadProfileData(userId); };
  const refresh = () => { if (selectedUserId) loadProfileData(selectedUserId); };

  const logActivity = async (actionType, description, extra = {}) => {
    if (!selectedUserId) return;
    await base44.entities.AdminActivityLog.create({
      user_id: selectedUserId, admin_id: adminUser.id, admin_name: adminUser.full_name,
      action_type: actionType, description, timestamp: new Date().toISOString(), ...extra,
    });
  };

  const handleCancelMembership = async () => {
    setActionLoading(true);
    try {
      const familyId = profileData.user?.family_id;
      for (const e of profileData.enrollments.filter(e => e.status === "active")) {
        await base44.entities.Enrollment.update(e.id, { status: "cancelled" });
      }
      if (familyId) {
        for (const b of profileData.billingRecords.filter(b => b.status === "active")) {
          await base44.entities.BillingRecord.update(b.id, { status: "cancelled" });
        }
      }
      await base44.entities.User.update(selectedUserId, { role: "guest", subscription_status: "canceled", is_active: false });
      await logActivity("membership_cancelled", `Membership cancelled by ${adminUser.full_name}`);
      setShowCancelConfirm(false);
      refresh();
      loadUsers();
    } catch (e) {
      alert("Failed to cancel membership: " + (e.response?.data?.error || e.message));
    }
    setActionLoading(false);
  };

  const handleDeleteProfile = async () => {
    setActionLoading(true);
    try {
      const userId = selectedUserId;
      if (profileData.enrollments.length) await base44.entities.Enrollment.deleteMany({ user_id: userId }).catch(() => {});
      if (profileData.emergencyContacts.length) await base44.entities.EmergencyContact.deleteMany({ user_id: userId }).catch(() => {});
      if (profileData.customFieldValues.length) await base44.entities.CustomFieldValue.deleteMany({ user_id: userId }).catch(() => {});
      if (profileData.attendance.length) await base44.entities.AttendanceRecord.deleteMany({ user_id: userId }).catch(() => {});
      if (profileData.eventRegs.length) await base44.entities.EventRegistration.deleteMany({ user_id: userId }).catch(() => {});
      if (profileData.activityLogs.length) await base44.entities.AdminActivityLog.deleteMany({ user_id: userId }).catch(() => {});
      await base44.entities.User.delete(userId);
      setShowDeleteConfirm(false);
      setSelectedUserId(null);
      setProfileData(null);
      loadUsers();
    } catch (e) {
      alert("Failed to delete profile: " + (e.response?.data?.error || e.message));
    }
    setActionLoading(false);
  };

  const searchResults = search.length >= 1
    ? allUsers.filter(u => {
        const q = search.toLowerCase();
        return (u.full_name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q) || (u.phone || "").includes(q) || u.id === q;
      }).slice(0, 10)
    : [];

  const tabs = [
    { id: 1, label: "Personal Details", icon: User },
    { id: 2, label: "Family", icon: Users },
    { id: 3, label: "Programs", icon: GraduationCap },
    { id: 4, label: "Billing", icon: CreditCard },
    { id: 5, label: "Activity Log", icon: Activity },
    { id: 6, label: "Attendance & Events", icon: ClipboardList },
  ];

  if (loading) return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-[#C9A84C]" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-2">Profile Management</p>
        <h1 className="text-3xl font-bold">Student & Family Profiles</h1>
      </div>

      {!selectedUserId ? (
        <>
          <div className="relative">
            <div className="flex items-center gap-2 border border-[#A8A9AD]/30 px-4 py-3 bg-black">
              <Search size={18} className="text-[#A8A9AD]" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone, email, or user ID..." className="bg-transparent text-sm text-white focus:outline-none flex-1" autoFocus />
              {search && <button onClick={() => setSearch("")} className="text-[#A8A9AD] hover:text-white text-xs">Clear</button>}
            </div>
            {search && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 border border-[#A8A9AD]/30 bg-[#0A0A0A] max-h-96 overflow-y-auto z-50">
                {searchResults.map(u => (
                  <button key={u.id} onClick={() => { selectUser(u.id); setSearch(""); }} className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-[#C9A84C]/10 transition-colors border-b border-[#A8A9AD]/10">
                    <div className="w-10 h-10 bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center shrink-0">
                      <span className="text-[#C9A84C] font-bold">{u.full_name?.charAt(0) || "?"}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{u.full_name || "Unnamed"}</p>
                      <p className="text-xs text-[#A8A9AD] truncate">{u.email} {u.phone ? `· ${u.phone}` : ""}</p>
                    </div>
                    <span className="text-xs text-[#C9A84C] shrink-0">{u.belt_rank || "No belt"}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {search && searchResults.length === 0 && <p className="text-sm text-[#A8A9AD] text-center py-8">No users found.</p>}
          {!search && (
            <div className="border border-[#A8A9AD]/20 bg-black p-12 text-center">
              <Search size={32} className="text-[#A8A9AD] mx-auto mb-3" />
              <p className="text-[#A8A9AD]">Search for a student by name, phone, email, or user ID to open their master profile.</p>
            </div>
          )}
        </>
      ) : (
        dataLoading || !profileData ? (
          <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-[#C9A84C]" /></div>
        ) : (
          <>
            <button onClick={() => { setSelectedUserId(null); setProfileData(null); }} className="flex items-center gap-2 text-sm text-[#A8A9AD] hover:text-white transition-colors">
              <ArrowLeft size={16} /> Back to Search
            </button>

            <EmergencyBanner contacts={profileData.emergencyContacts} medicalConditions={profileData.user?.medical_conditions} />

            <div className="flex items-center gap-4 border border-[#A8A9AD]/20 bg-black p-6">
              <div className="w-16 h-16 bg-[#C9A84C]/10 border-2 border-[#C9A84C] flex items-center justify-center">
                <span className="text-[#C9A84C] font-bold text-2xl">{profileData.user?.full_name?.charAt(0) || "?"}</span>
              </div>
              <div>
                <h2 className="text-xl font-bold">{profileData.user?.full_name || "Unnamed"}</h2>
                <p className="text-sm text-[#A8A9AD]">{profileData.user?.email}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-[#C9A84C]">{profileData.user?.belt_rank || "No belt"}</span>
                  <span className="text-xs text-[#A8A9AD]">·</span>
                  <span className="text-xs text-[#A8A9AD]">{profileData.user?.phone || "No phone"}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-1 border-b border-[#A8A9AD]/20">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-3 text-sm font-medium tracking-wide transition-colors border-b-2 ${activeTab === tab.id ? "border-[#C9A84C] text-[#C9A84C]" : "border-transparent text-[#A8A9AD] hover:text-white"}`}>
                    <Icon size={16} /> {tab.label}
                  </button>
                );
              })}
            </div>

            <div>
              {activeTab === 1 && <PersonalDetails user={profileData.user} customFields={profileData.customFields} customFieldValues={profileData.customFieldValues} onRefresh={refresh} logActivity={logActivity} />}
              {activeTab === 2 && <FamilyManager user={profileData.user} family={profileData.family} familyMembers={profileData.familyMembers} onRefresh={refresh} logActivity={logActivity} />}
              {activeTab === 3 && <ProgramManager user={profileData.user} enrollments={profileData.enrollments} programs={profileData.programs} tiers={profileData.tiers} onRefresh={refresh} logActivity={logActivity} />}
              {activeTab === 4 && <BillingHub user={profileData.user} family={profileData.family} billingRecords={profileData.billingRecords} paymentMethods={profileData.paymentMethods} onRefresh={refresh} logActivity={logActivity} />}
              {activeTab === 5 && <ActivityLog user={profileData.user} activityLogs={profileData.activityLogs} onRefresh={refresh} logActivity={logActivity} />}
              {activeTab === 6 && <AttendanceHistory user={profileData.user} attendance={profileData.attendance} eventRegs={profileData.eventRegs} events={profileData.events} enrollments={profileData.enrollments} belts={profileData.belts} onRefresh={refresh} logActivity={logActivity} />}
            </div>

            {/* Danger Zone */}
            <div className="border border-red-500/20 bg-red-500/5 p-6">
              <p className="text-xs tracking-widest uppercase text-red-400 mb-4 flex items-center gap-2">
                <AlertTriangle size={14} /> Danger Zone
              </p>
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <p className="text-sm font-bold text-white">Cancel Membership</p>
                    <p className="text-xs text-[#A8A9AD] mt-1">Revokes student access, cancels active enrollments and billing, and sets the account to Guest. The user account remains but with limited access.</p>
                  </div>
                  <button onClick={() => setShowCancelConfirm(true)} disabled={profileData.user?.role === "admin"} className="flex items-center gap-2 px-4 py-2.5 border border-orange-500/30 text-orange-400 text-xs font-bold tracking-wide uppercase hover:bg-orange-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0">
                    <Ban size={14} /> Cancel Membership
                  </button>
                </div>
                <div className="border-t border-red-500/10 pt-4 flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <p className="text-sm font-bold text-white">Delete Profile</p>
                    <p className="text-xs text-[#A8A9AD] mt-1">Permanently removes the user account and all associated records (enrollments, attendance, emergency contacts, custom fields, etc.). This cannot be undone.</p>
                  </div>
                  <button onClick={() => setShowDeleteConfirm(true)} disabled={profileData.user?.role === "admin"} className="flex items-center gap-2 px-4 py-2.5 border border-red-500/30 text-red-400 text-xs font-bold tracking-wide uppercase hover:bg-red-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0">
                    <Trash2 size={14} /> Delete Profile
                  </button>
                </div>
              </div>
            </div>

            {/* Cancel confirmation */}
            {showCancelConfirm && (
              <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => !actionLoading && setShowCancelConfirm(false)}>
                <div className="w-full max-w-md border border-orange-500/30 bg-[#0A0A0A] p-8" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-start gap-3 mb-4">
                    <AlertTriangle size={20} className="text-orange-400 shrink-0 mt-0.5" />
                    <div>
                      <h2 className="text-xl font-bold">Cancel Membership?</h2>
                      <p className="text-sm text-[#A8A9AD] mt-2">This will revoke <strong className="text-white">{profileData.user?.full_name || profileData.user?.email}</strong>'s student access, cancel active enrollments and billing, and set their role to Guest.</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleCancelMembership} disabled={actionLoading} className="flex-1 px-4 py-3 bg-orange-500 text-white font-bold text-sm tracking-wide uppercase hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2">
                      {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <><Ban size={16} /> Cancel Membership</>}
                    </button>
                    <button onClick={() => setShowCancelConfirm(false)} disabled={actionLoading} className="px-4 py-3 text-sm text-[#A8A9AD] hover:text-white">Back</button>
                  </div>
                </div>
              </div>
            )}

            {/* Delete confirmation */}
            {showDeleteConfirm && (
              <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => !actionLoading && setShowDeleteConfirm(false)}>
                <div className="w-full max-w-md border border-red-500/30 bg-[#0A0A0A] p-8" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-start gap-3 mb-4">
                    <AlertTriangle size={20} className="text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <h2 className="text-xl font-bold">Delete Profile?</h2>
                      <p className="text-sm text-[#A8A9AD] mt-2">This will <strong className="text-red-400">permanently delete</strong> <strong className="text-white">{profileData.user?.full_name || profileData.user?.email}</strong>'s account and all associated records. This cannot be undone.</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleDeleteProfile} disabled={actionLoading} className="flex-1 px-4 py-3 bg-red-500 text-white font-bold text-sm tracking-wide uppercase hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2">
                      {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <><Trash2 size={16} /> Delete Permanently</>}
                    </button>
                    <button onClick={() => setShowDeleteConfirm(false)} disabled={actionLoading} className="px-4 py-3 text-sm text-[#A8A9AD] hover:text-white">Back</button>
                  </div>
                </div>
              </div>
            )}
          </>
        )
      )}
    </div>
  );
}