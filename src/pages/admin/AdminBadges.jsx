import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Award, Plus, Edit, Trash2, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const CATEGORIES = ["character", "performance", "attendance", "leadership", "improvement", "academic", "special"];
const ICON_SYMBOLS = ["star", "heart", "shield", "flame", "trophy", "medal", "check", "lightning"];
const ICON_COLORS = ["#C9A84C", "#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EC4899", "#EF4444"];

export default function AdminBadges() {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingBadge, setEditingBadge] = useState(null);
  const [formData, setFormData] = useState({
    badge_name: "",
    category: "character",
    description: "",
    icon_color: "#C9A84C",
    icon_symbol: "star",
    points_value: 10,
    display_order: 0,
    is_active: true,
  });

  const load = async () => {
    try {
      const all = await base44.entities.Badge.list();
      all.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
      setBadges(all);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleOpen = (isOpen) => {
    setOpen(isOpen);
    if (!isOpen) {
      setEditingBadge(null);
      setFormData({
        badge_name: "",
        category: "character",
        description: "",
        icon_color: "#C9A84C",
        icon_symbol: "star",
        points_value: 10,
        display_order: 0,
        is_active: true,
      });
    }
  };

  const handleEdit = (badge) => {
    setEditingBadge(badge);
    setFormData({
      badge_name: badge.badge_name,
      category: badge.category,
      description: badge.description || "",
      icon_color: badge.icon_color,
      icon_symbol: badge.icon_symbol,
      points_value: badge.points_value,
      display_order: badge.display_order,
      is_active: badge.is_active,
    });
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.badge_name) {
      alert("Badge name is required.");
      return;
    }
    try {
      if (editingBadge) {
        await base44.entities.Badge.update(editingBadge.id, formData);
      } else {
        await base44.entities.Badge.create(formData);
      }
      setOpen(false);
      load();
    } catch (e) {
      alert("Failed to save badge: " + e.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this badge?")) return;
    try {
      await base44.entities.Badge.delete(id);
      load();
    } catch (e) {
      alert("Failed to delete: " + e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs tracking-widest uppercase text-[#C9A84C] mb-2">Gamification</p>
          <h1 className="text-3xl font-bold">Badge Management</h1>
          <p className="text-sm text-[#A8A9AD] mt-1">Create and manage achievement badges for students.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="bg-[#C9A84C] text-black font-bold text-xs tracking-widest uppercase hover:bg-[#E0C97A]">
          <Plus size={16} className="mr-2" />
          Create Badge
        </Button>
      </div>

      <Dialog open={open} onOpenChange={handleOpen}>
        <DialogContent className="bg-[#0A0A0A] border border-[#A8A9AD]/20 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">{editingBadge ? "Edit Badge" : "Create New Badge"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-[#A8A9AD] text-xs tracking-widest uppercase">Badge Name *</Label>
              <Input
                value={formData.badge_name}
                onChange={(e) => setFormData({ ...formData, badge_name: e.target.value })}
                className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white"
                placeholder="e.g., Perfect Attendance"
              />
            </div>
            <div>
              <Label className="text-[#A8A9AD] text-xs tracking-widest uppercase">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0A0A0A] border border-[#A8A9AD]/30">
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-white capitalize">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[#A8A9AD] text-xs tracking-widest uppercase">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white"
                placeholder="Optional description..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#A8A9AD] text-xs tracking-widest uppercase">Icon Symbol</Label>
                <Select
                  value={formData.icon_symbol}
                  onValueChange={(value) => setFormData({ ...formData, icon_symbol: value })}
                >
                  <SelectTrigger className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0A0A0A] border border-[#A8A9AD]/30">
                    {ICON_SYMBOLS.map((icon) => (
                      <SelectItem key={icon} value={icon} className="text-white capitalize">
                        {icon}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#A8A9AD] text-xs tracking-widest uppercase">Icon Color</Label>
                <Select
                  value={formData.icon_color}
                  onValueChange={(value) => setFormData({ ...formData, icon_color: value })}
                >
                  <SelectTrigger className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0A0A0A] border border-[#A8A9AD]/30">
                    {ICON_COLORS.map((color) => (
                      <SelectItem key={color} value={color} className="text-white flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
                        {color}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#A8A9AD] text-xs tracking-widest uppercase">Points Value</Label>
                <Input
                  type="number"
                  value={formData.points_value}
                  onChange={(e) => setFormData({ ...formData, points_value: parseInt(e.target.value) || 0 })}
                  className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white"
                />
              </div>
              <div>
                <Label className="text-[#A8A9AD] text-xs tracking-widest uppercase">Display Order</Label>
                <Input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label className="text-[#A8A9AD] text-sm">Active (visible to instructors)</Label>
            </div>
            <div className="flex gap-3 pt-4">
              <Button onClick={handleSubmit} className="flex-1 bg-[#C9A84C] text-black hover:bg-[#E0C97A]">
                {editingBadge ? "Save Changes" : "Create Badge"}
              </Button>
              <Button variant="outline" onClick={() => setOpen(false)} className="border-[#A8A9AD]/30 text-[#A8A9AD]">
                <X size={16} />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-[#C9A84C]" /></div>
      ) : badges.length === 0 ? (
        <div className="border border-[#A8A9AD]/20 bg-black p-12 text-center">
          <Award size={40} className="mx-auto text-[#A8A9AD]/40 mb-4" />
          <p className="text-sm text-[#A8A9AD]">No badges created yet.</p>
          <p className="text-xs text-[#A8A9AD]/60 mt-2">Create your first badge to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {badges.map((badge) => (
            <div key={badge.id} className="border border-[#A8A9AD]/20 bg-black p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                    style={{ backgroundColor: badge.icon_color + "20", color: badge.icon_color }}
                  >
                    ★
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{badge.badge_name}</h3>
                    <p className="text-xs text-[#A8A9AD] capitalize">{badge.category} • {badge.points_value} pts</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleEdit(badge)} className="text-[#A8A9AD] hover:text-[#C9A84C]">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => handleDelete(badge.id)} className="text-[#A8A9AD] hover:text-red-400">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              {badge.description && <p className="text-xs text-[#A8A9AD] mb-2">{badge.description}</p>}
              <div className="flex items-center justify-between text-xs">
                <span className={badge.is_active ? "text-green-400" : "text-[#A8A9AD]"}>
                  {badge.is_active ? "Active" : "Inactive"}
                </span>
                <span className="text-[#A8A9AD]">Order: {badge.display_order || 0}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}