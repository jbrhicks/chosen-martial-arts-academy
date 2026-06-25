import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Mail, MessageSquare, Bell, Users, Plus, Eye, FileText, Search, Clock, AlertTriangle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BroadcastComposer from "@/components/admin/broadcasts/BroadcastComposer";
import TemplateLibrary from "@/components/admin/broadcasts/TemplateLibrary";
import DeliveryAuditLog from "@/components/admin/broadcasts/DeliveryAuditLog";
import toast from "react-hot-toast";

export default function AdminBroadcasts() {
  const [broadcasts, setBroadcasts] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [events, setEvents] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showComposer, setShowComposer] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [viewBroadcast, setViewBroadcast] = useState(null);
  const [loadedTemplate, setLoadedTemplate] = useState(null);

  const fetchData = async () => {
    try {
      const [broadcastsData, programsData, eventsData, usersData, templatesData] = await Promise.all([
        base44.entities.BroadcastMessage.list("-created_date"),
        base44.entities.Program.list(),
        base44.entities.Event.filter({ status: "active" }),
        base44.entities.User.list(),
        base44.entities.MessageTemplate.list("-created_date"),
      ]);
      setBroadcasts(broadcastsData);
      setPrograms(programsData);
      setEvents(eventsData);
      setAllUsers(usersData);
      setTemplates(templatesData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "sent": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "draft": return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      case "scheduled": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "failed": return "bg-red-500/20 text-red-400 border-red-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const stats = {
    total: broadcasts.length,
    sent: broadcasts.filter(b => b.status === "sent").length,
    scheduled: broadcasts.filter(b => b.status === "scheduled").length,
    drafts: broadcasts.filter(b => b.status === "draft").length,
    bounces: broadcasts.reduce((sum, b) => sum + (b.bounce_count || 0), 0),
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-[#A8A9AD]/20 border-t-[#C9A84C] rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#C9A84C]">Broadcast Messages</h1>
          <p className="text-sm text-[#A8A9AD] mt-1">Precision mass messaging with audience targeting and delivery tracking</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAuditLog(true)} className="border-[#A8A9AD]/20 text-[#A8A9AD] hover:text-white">
            <Search size={16} className="mr-1" /> Audit Log
          </Button>
          <Button variant="outline" onClick={() => setShowTemplates(true)} className="border-[#A8A9AD]/20 text-[#A8A9AD] hover:text-white">
            <FileText size={16} className="mr-1" /> Templates
          </Button>
          <Button onClick={() => setShowComposer(true)} className="bg-[#C9A84C] hover:bg-[#E0C97A] text-black">
            <Plus size={18} className="mr-1" /> New Broadcast
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-black border-[#A8A9AD]/20"><CardContent className="p-4"><div className="text-2xl font-bold text-white">{stats.total}</div><div className="text-xs text-[#A8A9AD] tracking-widest uppercase mt-1">Total</div></CardContent></Card>
        <Card className="bg-black border-[#A8A9AD]/20"><CardContent className="p-4"><div className="text-2xl font-bold text-green-400">{stats.sent}</div><div className="text-xs text-[#A8A9AD] tracking-widest uppercase mt-1">Sent</div></CardContent></Card>
        <Card className="bg-black border-[#A8A9AD]/20"><CardContent className="p-4"><div className="text-2xl font-bold text-blue-400">{stats.scheduled}</div><div className="text-xs text-[#A8A9AD] tracking-widest uppercase mt-1">Scheduled</div></CardContent></Card>
        <Card className="bg-black border-[#A8A9AD]/20"><CardContent className="p-4"><div className="text-2xl font-bold text-gray-400">{stats.drafts}</div><div className="text-xs text-[#A8A9AD] tracking-widest uppercase mt-1">Drafts</div></CardContent></Card>
        <Card className="bg-black border-red-500/20"><CardContent className="p-4"><div className="text-2xl font-bold text-red-400">{stats.bounces}</div><div className="text-xs text-[#A8A9AD] tracking-widest uppercase mt-1">Bounces</div></CardContent></Card>
      </div>

      {/* Broadcast History */}
      <Card className="bg-black border-[#A8A9AD]/20">
        <CardHeader><CardTitle className="text-white">Broadcast History</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {broadcasts.length === 0 ? (
              <p className="text-[#A8A9AD] text-sm text-center py-8">No broadcasts yet. Click "New Broadcast" to compose one.</p>
            ) : (
              broadcasts.map(broadcast => (
                <div key={broadcast.id} className="p-4 bg-[#0A0A0A] rounded-lg border border-[#A8A9AD]/10">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getStatusColor(broadcast.status)}>{broadcast.status}</Badge>
                        {broadcast.scheduled_date && broadcast.status === "scheduled" && (
                          <span className="text-xs text-blue-400 flex items-center gap-1">
                            <Calendar size={11} /> {new Date(broadcast.scheduled_date).toLocaleString()}
                          </span>
                        )}
                        <span className="text-xs text-[#A8A9AD]">
                          {broadcast.sent_date ? new Date(broadcast.sent_date).toLocaleString() : broadcast.created_date ? new Date(broadcast.created_date).toLocaleString() : ""}
                        </span>
                      </div>
                      <h3 className="font-semibold text-white mb-1">{broadcast.subject}</h3>
                      <p className="text-sm text-[#A8A9AD] line-clamp-2">{broadcast.body}</p>

                      {/* Delivery Stats */}
                      <div className="flex flex-wrap items-center gap-4 mt-3 text-xs">
                        <span className="flex items-center gap-1 text-[#A8A9AD]"><Mail size={12} /> Email: <span className="text-white font-medium">{broadcast.email_sent_count || 0}</span></span>
                        <span className="flex items-center gap-1 text-[#A8A9AD]"><MessageSquare size={12} /> SMS: <span className="text-white font-medium">{broadcast.sms_sent_count || 0}</span></span>
                        <span className="flex items-center gap-1 text-[#A8A9AD]"><Bell size={12} /> In-App: <span className="text-white font-medium">{broadcast.in_app_sent_count || 0}</span></span>
                        <span className="flex items-center gap-1 text-[#A8A9AD]"><Users size={12} /> Total: <span className="text-white font-medium">{broadcast.total_recipients || 0}</span></span>
                        {broadcast.bounce_count > 0 && (
                          <span className="flex items-center gap-1 text-red-400"><AlertTriangle size={12} /> Bounced: <span className="font-medium">{broadcast.bounce_count}</span></span>
                        )}
                      </div>

                      {/* Targeting Summary */}
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-[#A8A9AD]">
                        <span className="text-[#C9A84C]">Target: {broadcast.target_type.replace(/_/g, " ")}</span>
                        {broadcast.exclude_event_id && <span className="text-red-400">· Excludes: {broadcast.exclude_event_title || "event registrants"}</span>}
                        {broadcast.exclude_program_id && <span className="text-red-400">· Excludes: program members</span>}
                        {broadcast.min_belt_rank && <span className="text-red-400">· Min: {broadcast.min_belt_rank}</span>}
                      </div>
                    </div>

                    <Button variant="outline" size="sm" onClick={() => setViewBroadcast(broadcast)} className="border-[#A8A9AD]/20 shrink-0">
                      <Eye size={16} />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      {showComposer && (
        <BroadcastComposer
          onClose={() => { setShowComposer(false); setLoadedTemplate(null); }}
          onSent={fetchData}
          programs={programs}
          events={events}
          allUsers={allUsers}
          templates={templates}
          loadedTemplate={loadedTemplate}
          onSaveTemplate={fetchData}
        />
      )}

      {showTemplates && (
        <TemplateLibrary
          templates={templates}
          onClose={() => setShowTemplates(false)}
          onRefresh={fetchData}
          onLoad={(tpl) => {
            setShowTemplates(false);
            setLoadedTemplate(tpl);
            setShowComposer(true);
          }}
        />
      )}

      {showAuditLog && (
        <DeliveryAuditLog broadcasts={broadcasts} onClose={() => setShowAuditLog(false)} />
      )}

      {viewBroadcast && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setViewBroadcast(null)}>
          <div className="bg-black border border-[#A8A9AD]/20 w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-lg p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">{viewBroadcast.subject}</h2>
              <Button variant="ghost" size="sm" onClick={() => setViewBroadcast(null)}>Close</Button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-[#A8A9AD] tracking-widest uppercase mb-1">Message</p>
                <p className="text-white whitespace-pre-wrap text-sm">{viewBroadcast.body}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[#A8A9AD] tracking-widest uppercase mb-1">Channels</p>
                  <div className="flex gap-2">
                    {viewBroadcast.channel_email && <Badge variant="outline">Email</Badge>}
                    {viewBroadcast.channel_sms && <Badge variant="outline">SMS</Badge>}
                    {viewBroadcast.channel_in_app && <Badge variant="outline">In-App</Badge>}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-[#A8A9AD] tracking-widest uppercase mb-1">Target</p>
                  <p className="text-white text-sm capitalize">{viewBroadcast.target_type.replace(/_/g, " ")}</p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4 pt-4 border-t border-[#A8A9AD]/20">
                <div><p className="text-xs text-[#A8A9AD]">Email Sent</p><p className="text-lg font-bold text-white">{viewBroadcast.email_sent_count || 0}</p></div>
                <div><p className="text-xs text-[#A8A9AD]">SMS Sent</p><p className="text-lg font-bold text-white">{viewBroadcast.sms_sent_count || 0}</p></div>
                <div><p className="text-xs text-[#A8A9AD]">In-App Sent</p><p className="text-lg font-bold text-white">{viewBroadcast.in_app_sent_count || 0}</p></div>
                <div><p className="text-xs text-[#A8A9AD]">Bounced</p><p className="text-lg font-bold text-red-400">{viewBroadcast.bounce_count || 0}</p></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}