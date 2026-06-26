import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, ChevronRight, Calendar, DollarSign, Users, Globe, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Trash2 } from "lucide-react";

const EVENT_TYPES = [
  { value: "single-day", label: "Single-Day Event" },
  { value: "multi-day", label: "Multi-Day Event" },
  { value: "camp", label: "Summer Camp" },
  { value: "tournament", label: "Tournament" },
  { value: "in-house", label: "In-House Special Training" },
];

export default function EventCreatorWizard({ onClose, onEventCreated }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [ranks, setRanks] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    event_type: "single-day",
    description: "",
    start_date: "",
    end_date: "",
    max_capacity: 0,
    price: 0,
    is_public: false,
    target_audience_rank_id: "",
    target_audience_rank_name: "",
    location: "",
    image_url: "",
    early_bird_price: 0,
    early_bird_deadline: "",
    min_age: 0,
    max_age: 0,
    linked_waiver_id: "",
    what_to_bring: "",
    sibling_discount: 0,
    member_discount: 0,
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [scheduleItems, setScheduleItems] = useState([]);
  const [customFields, setCustomFields] = useState([]);
  const [waivers, setWaivers] = useState([]);

  useEffect(() => {
    loadRanks();
    loadWaivers();
  }, []);

  const loadWaivers = async () => {
    try {
      const all = await base44.entities.Waiver.filter({ is_active: true });
      setWaivers(all);
    } catch (e) { console.error(e); }
  };

  const loadRanks = async () => {
    try {
      const all = await base44.entities.RankBelt.list();
      const unique = all.filter((r, i, arr) => arr.findIndex(x => x.belt_name === r.belt_name) === i);
      setRanks(unique);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddSchedule = () => {
    setScheduleItems([...scheduleItems, { date: "", start_time: "", end_time: "", location: "", notes: "" }]);
  };

  const handleRemoveSchedule = (index) => {
    setScheduleItems(scheduleItems.filter((_, i) => i !== index));
  };

  const handleAddField = () => {
    setCustomFields([...customFields, { question_text: "", field_type: "text", dropdown_options: "", is_required: false, display_order: customFields.length }]);
  };

  const handleRemoveField = (index) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      
      let imageUrl = formData.image_url;
      
      const event = await base44.entities.Event.create({
        ...formData,
        image_url: imageUrl,
        created_by_id: user.id,
        created_by_name: user.full_name,
      });

      for (const item of scheduleItems) {
        await base44.entities.EventSchedule.create({
          event_id: event.id,
          event_title: event.title,
          ...item,
        });
      }

      for (const field of customFields) {
        await base44.entities.EventCustomField.create({
          event_id: event.id,
          event_title: event.title,
          ...field,
        });
      }

      if (formData.sibling_discount > 0) {
        await base44.entities.EventPricingRule.create({
          event_id: event.id,
          event_title: event.title,
          discount_type: "sibling",
          amount: formData.sibling_discount,
          is_percentage: true,
          is_active: true,
        });
      }
      if (formData.member_discount > 0) {
        await base44.entities.EventPricingRule.create({
          event_id: event.id,
          event_title: event.title,
          discount_type: "member",
          amount: formData.member_discount,
          is_percentage: true,
          is_active: true,
        });
      }

      onEventCreated();
    } catch (e) {
      alert("Failed to create event: " + e.message);
    }
    setLoading(false);
  };

  const canProceed = () => {
    if (step === 1) return formData.title && formData.start_date;
    return true;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-3xl border border-[#C9A84C]/30 bg-[#0A0A0A] my-8" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-[#A8A9AD]/20">
          <div>
            <h2 className="text-xl font-bold">Create New Event</h2>
            <p className="text-xs text-[#A8A9AD] mt-1">Step {step} of 3</p>
          </div>
          <button onClick={onClose} className="text-[#A8A9AD] hover:text-white"><X size={20} /></button>
        </div>

        <div className="flex items-center gap-2 px-6 py-4 border-b border-[#A8A9AD]/20">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step >= s ? "bg-[#C9A84C] text-black" : "bg-[#A8A9AD]/20 text-[#A8A9AD]"
              }`}>
                {s}
              </div>
              {s < 3 && <ChevronRight size={16} className="mx-2 text-[#A8A9AD]" />}
            </div>
          ))}
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold mb-4">Event Details</h3>
              <div>
                <Label className="text-[#A8A9AD] text-xs tracking-widest uppercase">Event Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white"
                  placeholder="e.g., Summer Camp 2024"
                />
              </div>
              <div>
                <Label className="text-[#A8A9AD] text-xs tracking-widest uppercase">Event Graphic</Label>
                <div className="border border-[#A8A9AD]/30 rounded-md p-4 mt-1">
                  {formData.image_url ? (
                    <div className="relative">
                      <img src={formData.image_url} alt="Event graphic" className="w-full h-48 object-cover rounded-md" />
                      <button
                        onClick={() => setFormData({ ...formData, image_url: "" })}
                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <label className="cursor-pointer">
                        <div className="border-2 border-dashed border-[#A8A9AD]/30 rounded-md p-6 hover:border-[#C9A84C]/50 transition-colors">
                          <p className="text-sm text-[#A8A9AD]">Click to upload event graphic</p>
                          <p className="text-xs text-[#A8A9AD] mt-1">JPG, PNG, or GIF (max 5MB)</p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files[0];
                            if (!file) return;
                            setUploadingImage(true);
                            try {
                              const result = await base44.integrations.Core.UploadFile({ file });
                              setFormData({ ...formData, image_url: result.file_url });
                            } catch (err) {
                              alert("Failed to upload image: " + err.message);
                            }
                            setUploadingImage(false);
                          }}
                        />
                      </label>
                      {uploadingImage && (
                        <div className="flex items-center justify-center mt-2">
                          <Loader2 size={16} className="animate-spin text-[#C9A84C]" />
                          <span className="text-xs text-[#A8A9AD] ml-2">Uploading...</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-[#A8A9AD] text-xs tracking-widest uppercase">Event Type</Label>
                <Select value={formData.event_type} onValueChange={(v) => setFormData({ ...formData, event_type: v })}>
                  <SelectTrigger className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0A0A0A] border border-[#A8A9AD]/30">
                    {EVENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value} className="text-white">{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#A8A9AD] text-xs tracking-widest uppercase">Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white min-h-[100px]"
                  placeholder="Event description..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[#A8A9AD] text-xs tracking-widest uppercase">Start Date *</Label>
                  <Input
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white datetime-picker-dark"
                  />
                </div>
                <div>
                  <Label className="text-[#A8A9AD] text-xs tracking-widest uppercase">End Date</Label>
                  <Input
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white datetime-picker-dark"
                  />
                </div>
              </div>
              <div>
                <Label className="text-[#A8A9AD] text-xs tracking-widest uppercase">Location</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white"
                  placeholder="e.g., Main Dojang"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold mb-4">Capacity & Pricing</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[#A8A9AD] text-xs tracking-widest uppercase">Max Capacity</Label>
                  <Input
                    type="number"
                    value={formData.max_capacity}
                    onChange={(e) => setFormData({ ...formData, max_capacity: parseInt(e.target.value) || 0 })}
                    className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white"
                    placeholder="0 = unlimited"
                  />
                </div>
                <div>
                  <Label className="text-[#A8A9AD] text-xs tracking-widest uppercase">Price ($)</Label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white"
                    placeholder="0 = Free"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[#A8A9AD] text-xs tracking-widest uppercase">Early Bird Price ($)</Label>
                  <Input
                    type="number"
                    value={formData.early_bird_price}
                    onChange={(e) => setFormData({ ...formData, early_bird_price: parseFloat(e.target.value) || 0 })}
                    className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <Label className="text-[#A8A9AD] text-xs tracking-widest uppercase">Early Bird Deadline</Label>
                  <Input
                    type="date"
                    value={formData.early_bird_deadline}
                    onChange={(e) => setFormData({ ...formData, early_bird_deadline: e.target.value })}
                    className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white datetime-picker-dark"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_public}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
                />
                <div>
                  <Label className="text-[#A8A9AD] text-sm">Public Event</Label>
                  <p className="text-xs text-[#A8A9AD]">Visible on public website</p>
                </div>
              </div>
              <div>
                <Label className="text-[#A8A9AD] text-xs tracking-widest uppercase">Rank Requirement (Optional)</Label>
                <Select
                  value={formData.target_audience_rank_id}
                  onValueChange={(v) => {
                    const rank = ranks.find(r => r.id === v);
                    setFormData({
                      ...formData,
                      target_audience_rank_id: v,
                      target_audience_rank_name: rank?.belt_name || "",
                    });
                  }}
                >
                  <SelectTrigger className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white">
                    <SelectValue placeholder="Any rank" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0A0A0A] border border-[#A8A9AD]/30">
                    <SelectItem value={null} className="text-white">Any Rank</SelectItem>
                    {ranks.map((rank) => (
                      <SelectItem key={rank.id} value={rank.id} className="text-white">{rank.belt_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-[#A8A9AD] mt-2">Leave empty for all ranks</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[#A8A9AD] text-xs tracking-widest uppercase">Min Age</Label>
                  <Input type="number" value={formData.min_age} onChange={(e) => setFormData({ ...formData, min_age: parseInt(e.target.value) || 0 })} className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white" placeholder="0 = no min" />
                </div>
                <div>
                  <Label className="text-[#A8A9AD] text-xs tracking-widest uppercase">Max Age</Label>
                  <Input type="number" value={formData.max_age} onChange={(e) => setFormData({ ...formData, max_age: parseInt(e.target.value) || 0 })} className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white" placeholder="0 = no max" />
                </div>
              </div>

              <div>
                <Label className="text-[#A8A9AD] text-xs tracking-widest uppercase">Linked Waiver</Label>
                <Select value={formData.linked_waiver_id} onValueChange={(v) => setFormData({ ...formData, linked_waiver_id: v })}>
                  <SelectTrigger className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white">
                    <SelectValue placeholder="No waiver required" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0A0A0A] border border-[#A8A9AD]/30">
                    <SelectItem value={null} className="text-white">No Waiver</SelectItem>
                    {waivers.map((w) => (
                      <SelectItem key={w.id} value={w.id} className="text-white">{w.waiver_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[#A8A9AD] text-xs tracking-widest uppercase">What to Bring</Label>
                <Textarea value={formData.what_to_bring} onChange={(e) => setFormData({ ...formData, what_to_bring: e.target.value })} className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white min-h-[80px]" placeholder="e.g., Sparring gear, water bottle, lunch..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[#A8A9AD] text-xs tracking-widest uppercase">Sibling Discount (%)</Label>
                  <Input type="number" value={formData.sibling_discount} onChange={(e) => setFormData({ ...formData, sibling_discount: parseFloat(e.target.value) || 0 })} className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white" placeholder="e.g., 10" />
                </div>
                <div>
                  <Label className="text-[#A8A9AD] text-xs tracking-widest uppercase">Member Discount (%)</Label>
                  <Input type="number" value={formData.member_discount} onChange={(e) => setFormData({ ...formData, member_discount: parseFloat(e.target.value) || 0 })} className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-white" placeholder="e.g., 15" />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">Event Schedule</h3>
                  <Button onClick={handleAddSchedule} variant="outline" className="border-[#A8A9AD]/30 text-[#A8A9AD] hover:text-white">
                    <Plus size={16} className="mr-2" />
                    Add Date
                  </Button>
                </div>
                {scheduleItems.length === 0 ? (
                  <p className="text-sm text-[#A8A9AD]">No schedule items added. For multi-day events, add dates here.</p>
                ) : (
                  <div className="space-y-3">
                    {scheduleItems.map((item, idx) => (
                      <div key={idx} className="border border-[#A8A9AD]/20 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-bold">Date {idx + 1}</p>
                          <button onClick={() => handleRemoveSchedule(idx)} className="text-[#A8A9AD] hover:text-red-400">
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            type="date"
                            value={item.date}
                            onChange={(e) => {
                              const updated = [...scheduleItems];
                              updated[idx].date = e.target.value;
                              setScheduleItems(updated);
                            }}
                            className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-xs datetime-picker-dark"
                            placeholder="Date"
                          />
                          <Input
                            value={item.start_time}
                            onChange={(e) => {
                              const updated = [...scheduleItems];
                              updated[idx].start_time = e.target.value;
                              setScheduleItems(updated);
                            }}
                            className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-xs"
                            placeholder="Start Time"
                          />
                          <Input
                            value={item.end_time}
                            onChange={(e) => {
                              const updated = [...scheduleItems];
                              updated[idx].end_time = e.target.value;
                              setScheduleItems(updated);
                            }}
                            className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-xs"
                            placeholder="End Time"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">Custom Registration Questions</h3>
                  <Button onClick={handleAddField} variant="outline" className="border-[#A8A9AD]/30 text-[#A8A9AD] hover:text-white">
                    <Plus size={16} className="mr-2" />
                    Add Question
                  </Button>
                </div>
                {customFields.length === 0 ? (
                  <p className="text-sm text-[#A8A9AD]">No custom questions. Add questions like "T-Shirt Size" or "Allergies".</p>
                ) : (
                  <div className="space-y-3">
                    {customFields.map((field, idx) => (
                      <div key={idx} className="border border-[#A8A9AD]/20 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-bold">Question {idx + 1}</p>
                          <button onClick={() => handleRemoveField(idx)} className="text-[#A8A9AD] hover:text-red-400">
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <Input
                          value={field.question_text}
                          onChange={(e) => {
                            const updated = [...customFields];
                            updated[idx].question_text = e.target.value;
                            setCustomFields(updated);
                          }}
                          className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-xs mb-2"
                          placeholder="Question text"
                        />
                        {field.field_type === "dropdown" || field.field_type === "radio" || field.field_type === "checkboxes" ? (
                          <Input
                            value={field.dropdown_options}
                            onChange={(e) => {
                              const updated = [...customFields];
                              updated[idx].dropdown_options = e.target.value;
                              setCustomFields(updated);
                            }}
                            className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-xs mb-2"
                            placeholder="Options (comma-separated)"
                          />
                        ) : null}
                        <div className="flex items-center gap-2">
                          <Select
                            value={field.field_type}
                            onValueChange={(v) => {
                              const updated = [...customFields];
                              updated[idx].field_type = v;
                              setCustomFields(updated);
                            }}
                          >
                            <SelectTrigger className="bg-[#0A0A0A] border border-[#A8A9AD]/30 text-xs w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#0A0A0A] border border-[#A8A9AD]/30">
                              <SelectItem value="text">Text</SelectItem>
                              <SelectItem value="textarea">Long Text</SelectItem>
                              <SelectItem value="dropdown">Dropdown</SelectItem>
                              <SelectItem value="radio">Multiple Choice</SelectItem>
                              <SelectItem value="checkboxes">Checkboxes</SelectItem>
                              <SelectItem value="checkbox">Yes/No</SelectItem>
                              <SelectItem value="number">Number</SelectItem>
                              <SelectItem value="date">Date</SelectItem>
                            </SelectContent>
                          </Select>
                          <label className="flex items-center gap-2 text-xs text-[#A8A9AD]">
                            <input
                              type="checkbox"
                              checked={field.is_required}
                              onChange={(e) => {
                                const updated = [...customFields];
                                updated[idx].is_required = e.target.checked;
                                setCustomFields(updated);
                              }}
                              className="rounded"
                            />
                            Required
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-6 border-t border-[#A8A9AD]/20">
          {step > 1 ? (
            <Button onClick={() => setStep(step - 1)} variant="outline" className="border-[#A8A9AD]/30 text-[#A8A9AD] hover:text-white">
              <ChevronRight size={16} className="mr-2 rotate-180" />
              Back
            </Button>
          ) : (
            <div />
          )}
          {step < 3 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="bg-[#C9A84C] text-black hover:bg-[#E0C97A]"
            >
              Next
              <ChevronRight size={16} className="ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-[#C9A84C] text-black hover:bg-[#E0C97A]"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : "Create Event"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}