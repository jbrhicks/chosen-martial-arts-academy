import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Send, Mail, MessageSquare, Bell, Users, Filter, Plus, Trash2, Eye, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import toast from "react-hot-toast";

export default function AdminBroadcasts() {
  const [broadcasts, setBroadcasts] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [events, setEvents] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showComposer, setShowComposer] = useState(false);
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    subject: "",
    body: "",
    channel_email: false,
    channel_sms: false,
    channel_in_app: true,
    target_type: "all_active",
    target_program_id: "",
    target_belt_rank: "",
    target_event_id: "",
    target_event_title: "",
    target_user_ids: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [broadcastsData, programsData, eventsData, usersData] = await Promise.all([
        base44.entities.BroadcastMessage.list("-created_date"),
        base44.entities.Program.list(),
        base44.entities.Event.filter({ status: "active" }),
        base44.entities.User.list()
      ]);
      setBroadcasts(broadcastsData);
      setPrograms(programsData);
      setEvents(eventsData);
      setAllUsers(usersData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserToggle = (userId) => {
    const currentIds = formData.target_user_ids ? formData.target_user_ids.split(",") : [];
    const newIds = currentIds.includes(userId)
      ? currentIds.filter(id => id !== userId)
      : [...currentIds, userId];
    setFormData({ ...formData, target_user_ids: newIds.join(",") });
  };

  const filteredUsers = allUsers.filter(user =>
    user.full_name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  const selectedUserCount = formData.target_user_ids ? formData.target_user_ids.split(",").length : 0;

  const handleSendBroadcast = async () => {
    if (!formData.subject || !formData.body) {
      toast.error("Please fill in subject and message body");
      return;
    }

    if (!formData.channel_email && !formData.channel_sms && !formData.channel_in_app) {
      toast.error("Please select at least one delivery channel");
      return;
    }

    try {
      const broadcast = await base44.entities.BroadcastMessage.create({
        ...formData,
        created_by_id: (await base44.auth.me()).id,
        created_by_name: (await base44.auth.me()).full_name,
        created_date: new Date().toISOString(),
        status: "sent"
      });

      await base44.functions.invoke("sendBroadcast", { broadcastId: broadcast.id });
      
      toast.success("Broadcast sent successfully!");
      setShowComposer(false);
      setFormData({
        subject: "",
        body: "",
        channel_email: false,
        channel_sms: false,
        channel_in_app: true,
        target_type: "all_active",
        target_program_id: "",
        target_belt_rank: "",
        target_event_id: "",
        target_event_title: "",
        target_user_ids: ""
      });
      fetchData();
    } catch (error) {
      toast.error("Failed to send broadcast: " + error.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "sent": return "bg-green-500/20 text-green-400";
      case "draft": return "bg-gray-500/20 text-gray-400";
      case "scheduled": return "bg-blue-500/20 text-blue-400";
      case "failed": return "bg-red-500/20 text-red-400";
      default: return "bg-gray-500/20 text-gray-400";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#C9A84C]">Broadcast Messages</h1>
          <p className="text-sm text-[#A8A9AD] mt-1">Send announcements to students and families</p>
        </div>
        <Button onClick={() => setShowComposer(true)} className="bg-[#C9A84C] hover:bg-[#C9A84C]/90">
          <Plus size={18} />
          New Broadcast
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-black border-[#A8A9AD]/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-[#A8A9AD]">Total Broadcasts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{broadcasts.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-black border-[#A8A9AD]/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-[#A8A9AD]">Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {broadcasts.filter(b => b.status === "sent").length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black border-[#A8A9AD]/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-[#A8A9AD]">Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-400">
              {broadcasts.filter(b => b.status === "draft").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-black border-[#A8A9AD]/20">
        <CardHeader>
          <CardTitle className="text-white">Broadcast History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {broadcasts.length === 0 ? (
              <p className="text-[#A8A9AD] text-sm">No broadcasts sent yet</p>
            ) : (
              broadcasts.map((broadcast) => (
                <div key={broadcast.id} className="flex items-start justify-between p-4 bg-[#0A0A0A] rounded-lg border border-[#A8A9AD]/10">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getStatusColor(broadcast.status)}>{broadcast.status}</Badge>
                      <span className="text-xs text-[#A8A9AD]">
                        {broadcast.created_date ? new Date(broadcast.created_date).toLocaleDateString() : "No date"}
                      </span>
                    </div>
                    <h3 className="font-semibold text-white mb-1">{broadcast.subject}</h3>
                    <p className="text-sm text-[#A8A9AD] line-clamp-2">{broadcast.body}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-[#A8A9AD]">
                      <span className="flex items-center gap-1">
                        <Mail size={12} />
                        Email: {broadcast.email_sent_count || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare size={12} />
                        SMS: {broadcast.sms_sent_count || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Bell size={12} />
                        In-App: {broadcast.in_app_sent_count || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={12} />
                        Total: {broadcast.total_recipients || 0}
                      </span>
                    </div>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="border-[#A8A9AD]/20">
                        <Eye size={16} />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-black border-[#A8A9AD]/20 max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-white">{broadcast.subject}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-[#A8A9AD]">Message</Label>
                          <p className="text-white mt-1 whitespace-pre-wrap">{broadcast.body}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-[#A8A9AD]">Channels</Label>
                            <div className="flex gap-2 mt-1">
                              {broadcast.channel_email && <Badge variant="outline">Email</Badge>}
                              {broadcast.channel_sms && <Badge variant="outline">SMS</Badge>}
                              {broadcast.channel_in_app && <Badge variant="outline">In-App</Badge>}
                            </div>
                          </div>
                          <div>
                            <Label className="text-[#A8A9AD]">Target</Label>
                            <p className="text-white mt-1 capitalize">{broadcast.target_type.replace("_", " ")}</p>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {showComposer && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <Card className="bg-black border-[#A8A9AD]/20 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-white">Compose Broadcast</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-[#A8A9AD]">Subject *</Label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="bg-[#0A0A0A] border-[#A8A9AD]/20 text-white"
                  placeholder="e.g., Snow Day - Academy Closed"
                />
              </div>

              <div>
                <Label className="text-[#A8A9AD]">Message *</Label>
                <Textarea
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  className="bg-[#0A0A0A] border-[#A8A9AD]/20 text-white min-h-[150px]"
                  placeholder="Enter your message..."
                />
              </div>

              <div>
                <Label className="text-[#A8A9AD] mb-2 block">Delivery Channels *</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="channel_in_app"
                      checked={formData.channel_in_app}
                      onCheckedChange={(checked) => setFormData({ ...formData, channel_in_app: checked })}
                    />
                    <label htmlFor="channel_in_app" className="text-sm text-white flex items-center gap-2">
                      <Bell size={16} />
                      In-App Notifications (Always delivered)
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="channel_email"
                      checked={formData.channel_email}
                      onCheckedChange={(checked) => setFormData({ ...formData, channel_email: checked })}
                    />
                    <label htmlFor="channel_email" className="text-sm text-white flex items-center gap-2">
                      <Mail size={16} />
                      Email (Respects opt-out preferences)
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="channel_sms"
                      checked={formData.channel_sms}
                      onCheckedChange={(checked) => setFormData({ ...formData, channel_sms: checked })}
                    />
                    <label htmlFor="channel_sms" className="text-sm text-white flex items-center gap-2">
                      <MessageSquare size={16} />
                      SMS Text (Respects opt-out preferences)
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-[#A8A9AD]">Target Audience</Label>
                <Select
                  value={formData.target_type}
                  onValueChange={(value) => setFormData({ ...formData, target_type: value })}
                >
                  <SelectTrigger className="bg-[#0A0A0A] border-[#A8A9AD]/20 text-white mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-[#A8A9AD]/20">
                    <SelectItem value="all_active">All Active Students</SelectItem>
                    <SelectItem value="all_inactive">All Inactive Students</SelectItem>
                    <SelectItem value="program">By Program</SelectItem>
                    <SelectItem value="belt_rank">By Belt Rank</SelectItem>
                    <SelectItem value="event_registered">Event Registrants</SelectItem>
                    <SelectItem value="custom">Manually Select Users</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.target_type === "program" && (
                <div>
                  <Label className="text-[#A8A9AD]">Select Program</Label>
                  <Select
                    value={formData.target_program_id}
                    onValueChange={(value) => setFormData({ ...formData, target_program_id: value })}
                  >
                    <SelectTrigger className="bg-[#0A0A0A] border-[#A8A9AD]/20 text-white mt-2">
                      <SelectValue placeholder="Select a program" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-[#A8A9AD]/20">
                      {programs.map((program) => (
                        <SelectItem key={program.id} value={program.id}>
                          {program.program_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.target_type === "belt_rank" && (
                <div>
                  <Label className="text-[#A8A9AD]">Belt Rank</Label>
                  <Input
                    value={formData.target_belt_rank}
                    onChange={(e) => setFormData({ ...formData, target_belt_rank: e.target.value })}
                    className="bg-[#0A0A0A] border-[#A8A9AD]/20 text-white mt-2"
                    placeholder="e.g., Yellow Belt"
                  />
                </div>
              )}

              {formData.target_type === "event_registered" && (
                <div>
                  <Label className="text-[#A8A9AD]">Select Event</Label>
                  <Select
                    value={formData.target_event_id}
                    onValueChange={(value) => {
                      const event = events.find(e => e.id === value);
                      setFormData({ 
                        ...formData, 
                        target_event_id: value,
                        target_event_title: event?.title || ""
                      });
                    }}
                  >
                    <SelectTrigger className="bg-[#0A0A0A] border-[#A8A9AD]/20 text-white mt-2">
                      <SelectValue placeholder="Select an event" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-[#A8A9AD]/20">
                      {events.map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.title} ({new Date(event.start_date).toLocaleDateString()})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.target_type === "custom" && (
                <div>
                  <Label className="text-[#A8A9AD]">Select Users</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowUserPicker(true)}
                      className="border-[#A8A9AD]/20 flex-1 justify-between"
                    >
                      <span className="text-white">
                        {selectedUserCount > 0 
                          ? `${selectedUserCount} user${selectedUserCount > 1 ? 's' : ''} selected`
                          : "Choose users..."
                        }
                      </span>
                      <Users size={16} className="text-[#A8A9AD]" />
                    </Button>
                    {selectedUserCount > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setFormData({ ...formData, target_user_ids: "" })}
                        className="border-[#A8A9AD]/20"
                      >
                        <X size={16} />
                      </Button>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSendBroadcast} className="flex-1 bg-[#C9A84C] hover:bg-[#C9A84C]/90">
                  <Send size={18} />
                  Send Broadcast
                </Button>
                <Button variant="outline" onClick={() => setShowComposer(false)} className="border-[#A8A9AD]/20">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showUserPicker && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <Card className="bg-black border-[#A8A9AD]/20 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <CardHeader className="shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Select Users</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowUserPicker(false)}>
                  <X size={18} />
                </Button>
              </div>
            </CardHeader>
            <div className="p-4 border-b border-[#A8A9AD]/20 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A9AD]" size={18} />
                <Input
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="Search by name or email..."
                  className="bg-[#0A0A0A] border-[#A8A9AD]/20 text-white pl-10"
                />
              </div>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              <div className="space-y-2">
                {filteredUsers.map((user) => {
                  const isSelected = formData.target_user_ids?.split(",").includes(user.id);
                  return (
                    <div
                      key={user.id}
                      onClick={() => handleUserToggle(user.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-[#C9A84C]/20 border border-[#C9A84C]/30"
                          : "bg-[#0A0A0A] hover:bg-[#0A0A0A]/80 border border-[#A8A9AD]/10"
                      }`}
                    >
                      <Checkbox checked={isSelected} onChange={() => {}} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{user.full_name}</p>
                        <p className="text-xs text-[#A8A9AD]">{user.email}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="p-4 border-t border-[#A8A9AD]/20 shrink-0 flex gap-2">
              <Button
                onClick={() => setShowUserPicker(false)}
                className="flex-1 bg-[#C9A84C] hover:bg-[#C9A84C]/90"
              >
                Done ({selectedUserCount} selected)
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}