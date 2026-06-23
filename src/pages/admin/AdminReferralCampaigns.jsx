import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Plus, X, DollarSign, Gift, Calendar, Trash2, Edit, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/lib/AuthContext";

export default function AdminReferralCampaigns() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [formData, setFormData] = useState({
    campaign_name: "",
    required_referrals: 1,
    reward_type: "tuition_credit",
    reward_description: "",
    credit_amount: "",
    physical_item_name: "",
    custom_event_name: "",
    auto_deposit_credit: true,
    requires_admin_approval: false,
    is_active: true,
    display_order: 0,
    icon_symbol: "🎁",
    icon_color: "#C9A84C",
  });

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      const all = await base44.entities.ReferralCampaign.list();
      all.sort((a, b) => a.display_order - b.display_order || a.required_referrals - b.required_referrals);
      setCampaigns(all);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const openNewCampaign = () => {
    setEditingCampaign(null);
    setFormData({
      campaign_name: "",
      required_referrals: 1,
      reward_type: "tuition_credit",
      reward_description: "",
      credit_amount: "",
      physical_item_name: "",
      custom_event_name: "",
      auto_deposit_credit: true,
      requires_admin_approval: false,
      is_active: true,
      display_order: 0,
      icon_symbol: "🎁",
      icon_color: "#C9A84C",
    });
    setShowModal(true);
  };

  const openEditCampaign = (campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      campaign_name: campaign.campaign_name,
      required_referrals: campaign.required_referrals,
      reward_type: campaign.reward_type,
      reward_description: campaign.reward_description,
      credit_amount: campaign.credit_amount || "",
      physical_item_name: campaign.physical_item_name || "",
      custom_event_name: campaign.custom_event_name || "",
      auto_deposit_credit: campaign.auto_deposit_credit ?? true,
      requires_admin_approval: campaign.requires_admin_approval ?? false,
      is_active: campaign.is_active ?? true,
      display_order: campaign.display_order || 0,
      icon_symbol: campaign.icon_symbol || "🎁",
      icon_color: campaign.icon_color || "#C9A84C",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const data = {
        ...formData,
        credit_amount: formData.credit_amount ? parseFloat(formData.credit_amount) : null,
      };

      if (editingCampaign) {
        await base44.entities.ReferralCampaign.update(editingCampaign.id, data);
      } else {
        await base44.entities.ReferralCampaign.create(data);
      }
      setShowModal(false);
      loadCampaigns();
    } catch (e) {
      alert("Failed to save: " + e.message);
    }
  };

  const handleDelete = async (campaign) => {
    if (!confirm(`Delete "${campaign.campaign_name}"?`)) return;
    try {
      await base44.entities.ReferralCampaign.delete(campaign.id);
      loadCampaigns();
    } catch (e) {
      alert("Failed to delete: " + e.message);
    }
  };

  const handleToggleActive = async (campaign) => {
    try {
      await base44.entities.ReferralCampaign.update(campaign.id, {
        is_active: !campaign.is_active,
      });
      loadCampaigns();
    } catch (e) {
      alert("Failed to update: " + e.message);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-[#C9A84C]" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-2">Referral System</p>
          <h1 className="text-3xl font-bold">Reward Campaign Builder</h1>
          <p className="text-[#A8A9AD] text-sm mt-1">Create and manage referral incentives for students.</p>
        </div>
        <Button onClick={openNewCampaign} className="bg-[#C9A84C] text-black hover:bg-[#E0C97A]">
          <Plus size={18} className="mr-2" />
          New Campaign
        </Button>
      </div>

      <div className="grid gap-4">
        {campaigns.map((campaign) => (
          <div key={campaign.id} className="border border-[#A8A9AD]/20 p-6 bg-[#0A0A0A]">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div
                  className="w-16 h-16 rounded-lg flex items-center justify-center text-3xl"
                  style={{ backgroundColor: `${campaign.icon_color}20`, color: campaign.icon_color }}
                >
                  {campaign.icon_symbol}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold">{campaign.campaign_name}</h3>
                    <span className={`px-2 py-1 text-xs uppercase tracking-wider rounded ${
                      campaign.is_active ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"
                    }`}>
                      {campaign.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-[#A8A9AD] mb-3">{campaign.reward_description}</p>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-[#A8A9AD]">Required Referrals:</span>
                      <span className="font-bold text-white">{campaign.required_referrals}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#A8A9AD]">Reward Type:</span>
                      <span className="font-bold text-white capitalize flex items-center gap-1">
                        {campaign.reward_type === "tuition_credit" && <DollarSign size={14} className="text-green-400" />}
                        {campaign.reward_type === "physical_item" && <Gift size={14} className="text-blue-400" />}
                        {campaign.reward_type === "custom_event" && <Calendar size={14} className="text-purple-400" />}
                        {campaign.reward_type.replace("_", " ")}
                      </span>
                    </div>
                    {campaign.reward_type === "tuition_credit" && campaign.credit_amount && (
                      <div className="flex items-center gap-2">
                        <span className="text-[#A8A9AD]">Amount:</span>
                        <span className="font-bold text-green-400">${campaign.credit_amount}</span>
                      </div>
                    )}
                    {campaign.reward_type === "physical_item" && campaign.physical_item_name && (
                      <div className="flex items-center gap-2">
                        <span className="text-[#A8A9AD]">Item:</span>
                        <span className="font-bold text-blue-400">{campaign.physical_item_name}</span>
                      </div>
                    )}
                    {campaign.reward_type === "custom_event" && campaign.custom_event_name && (
                      <div className="flex items-center gap-2">
                        <span className="text-[#A8A9AD]">Event:</span>
                        <span className="font-bold text-purple-400">{campaign.custom_event_name}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-[#A8A9AD]">
                    <span>Auto-deposit: {campaign.auto_deposit_credit ? "Yes" : "No"}</span>
                    <span>Admin Approval: {campaign.requires_admin_approval ? "Required" : "Not Required"}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleToggleActive(campaign)}
                  size="sm"
                  variant="outline"
                  className={`border-[#A8A9AD]/30 ${campaign.is_active ? "text-green-400 hover:text-red-400" : "text-red-400 hover:text-green-400"}`}
                >
                  {campaign.is_active ? "Deactivate" : "Activate"}
                </Button>
                <Button
                  onClick={() => openEditCampaign(campaign)}
                  size="sm"
                  variant="outline"
                  className="border-[#A8A9AD]/30 text-[#A8A9AD] hover:text-[#C9A84C]"
                >
                  <Edit size={16} />
                </Button>
                <Button
                  onClick={() => handleDelete(campaign)}
                  size="sm"
                  variant="outline"
                  className="border-[#A8A9AD]/30 text-[#A8A9AD] hover:text-red-400"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          </div>
        ))}
        {campaigns.length === 0 && (
          <div className="border border-[#A8A9AD]/20 p-12 text-center">
            <p className="text-[#A8A9AD]">No reward campaigns yet. Create your first one!</p>
          </div>
        )}
      </div>

      {showModal && (
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="bg-[#0A0A0A] border border-[#A8A9AD]/20 max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingCampaign ? "Edit Reward Campaign" : "Create Reward Campaign"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div>
                <Label className="text-white">Campaign Name</Label>
                <Input
                  value={formData.campaign_name}
                  onChange={(e) => setFormData({ ...formData, campaign_name: e.target.value })}
                  placeholder="e.g., Free T-Shirt Reward"
                  className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Required Referrals</Label>
                  <Input
                    type="number"
                    value={formData.required_referrals}
                    onChange={(e) => setFormData({ ...formData, required_referrals: parseInt(e.target.value) || 1 })}
                    className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Display Order</Label>
                  <Input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white"
                  />
                </div>
              </div>

              <div>
                <Label className="text-white">Reward Type</Label>
                <Select value={formData.reward_type} onValueChange={(v) => setFormData({ ...formData, reward_type: v })}>
                  <SelectTrigger className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0A0A0A] border border-[#A8A9AD]/30">
                    <SelectItem value="tuition_credit" className="text-white">Tuition Credit</SelectItem>
                    <SelectItem value="physical_item" className="text-white">Physical Item</SelectItem>
                    <SelectItem value="custom_event" className="text-white">Custom Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-white">Reward Description</Label>
                <Textarea
                  value={formData.reward_description}
                  onChange={(e) => setFormData({ ...formData, reward_description: e.target.value })}
                  placeholder="Describe what the student earns..."
                  className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white"
                  rows={3}
                />
              </div>

              {formData.reward_type === "tuition_credit" && (
                <div>
                  <Label className="text-white">Credit Amount ($)</Label>
                  <Input
                    type="number"
                    value={formData.credit_amount}
                    onChange={(e) => setFormData({ ...formData, credit_amount: e.target.value })}
                    placeholder="50"
                    className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white"
                  />
                </div>
              )}

              {formData.reward_type === "physical_item" && (
                <div>
                  <Label className="text-white">Physical Item Name</Label>
                  <Input
                    value={formData.physical_item_name}
                    onChange={(e) => setFormData({ ...formData, physical_item_name: e.target.value })}
                    placeholder="e.g., Free T-Shirt"
                    className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white"
                  />
                </div>
              )}

              {formData.reward_type === "custom_event" && (
                <div>
                  <Label className="text-white">Custom Event Name</Label>
                  <Input
                    value={formData.custom_event_name}
                    onChange={(e) => setFormData({ ...formData, custom_event_name: e.target.value })}
                    placeholder="e.g., VIP Pizza Party"
                    className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white"
                  />
                </div>
              )}

              {formData.reward_type === "tuition_credit" && (
                <div className="flex items-center justify-between border border-[#A8A9AD]/20 p-4 rounded">
                  <div>
                    <p className="text-sm font-medium text-white">Auto-Deposit Credit</p>
                    <p className="text-xs text-[#A8A9AD]">Automatically add to student's wallet upon enrollment</p>
                  </div>
                  <Switch
                    checked={formData.auto_deposit_credit}
                    onCheckedChange={(v) => setFormData({ ...formData, auto_deposit_credit: v })}
                  />
                </div>
              )}

              <div className="flex items-center justify-between border border-[#A8A9AD]/20 p-4 rounded">
                <div>
                  <p className="text-sm font-medium text-white">Requires Admin Approval</p>
                  <p className="text-xs text-[#A8A9AD]">Admin must manually approve before reward is fulfilled</p>
                </div>
                <Switch
                  checked={formData.requires_admin_approval}
                  onCheckedChange={(v) => setFormData({ ...formData, requires_admin_approval: v })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Icon Symbol</Label>
                  <Input
                    value={formData.icon_symbol}
                    onChange={(e) => setFormData({ ...formData, icon_symbol: e.target.value })}
                    placeholder="🎁"
                    className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white text-2xl"
                  />
                </div>
                <div>
                  <Label className="text-white">Icon Color</Label>
                  <Input
                    type="color"
                    value={formData.icon_color}
                    onChange={(e) => setFormData({ ...formData, icon_color: e.target.value })}
                    className="bg-[#0A0A0A] border border-[#A8A9AD]/30 h-10"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button onClick={() => setShowModal(false)} variant="outline" className="border-[#A8A9AD]/30 text-[#A8A9AD]">
                Cancel
              </Button>
              <Button onClick={handleSave} className="bg-[#C9A84C] text-black hover:bg-[#E0C97A]">
                Save Campaign
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}