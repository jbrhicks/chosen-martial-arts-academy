import PersonalInfoForm from "@/components/portal/profile/PersonalInfoForm";
import EmergencyContactsManager from "@/components/portal/profile/EmergencyContactsManager";
import NoteToAdmin from "@/components/portal/profile/NoteToAdmin";
import BadgeDisplay from "@/components/portal/profile/BadgeDisplay";
import { useAuth } from "@/lib/AuthContext";

export default function MyProfile() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-2">Account Settings</p>
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-sm text-[#A8A9AD] mt-1">Update your personal details, emergency contacts, and send messages to the academy.</p>
      </div>
      <PersonalInfoForm />
      <EmergencyContactsManager />
      <BadgeDisplay studentId={user.id} />
      <NoteToAdmin />
    </div>
  );
}