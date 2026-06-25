import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, Search, Mail, MessageSquare, Bell, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const STATUS_ICONS = {
  sent: { icon: CheckCircle, color: "text-green-400", label: "Sent" },
  delivered: { icon: CheckCircle, color: "text-green-400", label: "Delivered" },
  failed: { icon: XCircle, color: "text-red-400", label: "Failed" },
  bounced: { icon: XCircle, color: "text-red-400", label: "Bounced" },
  pending: { icon: Clock, color: "text-yellow-400", label: "Pending" },
  skipped_opt_out: { icon: AlertCircle, color: "text-[#A8A9AD]", label: "Skipped (Opt-out)" },
};

const CHANNEL_ICONS = { email: Mail, sms: MessageSquare, in_app: Bell };

export default function DeliveryAuditLog({ broadcasts, onClose }) {
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedBroadcast, setSelectedBroadcast] = useState("all");

  useEffect(() => {
    loadRecipients();
  }, [selectedBroadcast]);

  const loadRecipients = async () => {
    setLoading(true);
    try {
      let records;
      if (selectedBroadcast !== "all") {
        records = await base44.entities.MessageRecipient.filter({ message_id: selectedBroadcast });
      } else {
        records = await base44.entities.MessageRecipient.list("-sent_date", 200);
      }
      setRecipients(records);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const filtered = recipients.filter(r => {
    if (search) {
      const q = search.toLowerCase();
      return r.user_name?.toLowerCase().includes(q) || r.user_email?.toLowerCase().includes(q);
    }
    return true;
  });

  const broadcastMap = {};
  broadcasts.forEach(b => { broadcastMap[b.id] = b; });

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-black border border-[#A8A9AD]/20 w-full max-w-3xl max-h-[88vh] overflow-hidden flex flex-col rounded-lg" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-[#A8A9AD]/20 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Delivery Audit Log</h2>
            <p className="text-xs text-[#A8A9AD] mt-1">Track exactly when messages were sent, delivered, and opened</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}><X size={18} /></Button>
        </div>

        <div className="p-4 border-b border-[#A8A9AD]/20 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A9AD]" size={16} />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by user name or email..." className="bg-[#0A0A0A] border-[#A8A9AD]/20 text-white pl-10" />
          </div>
          <Select value={selectedBroadcast} onValueChange={setSelectedBroadcast}>
            <SelectTrigger className="w-[200px] bg-[#0A0A0A] border-[#A8A9AD]/20 text-white"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-black border-[#A8A9AD]/20 text-white">
              <SelectItem value="all">All Broadcasts</SelectItem>
              {broadcasts.map(b => <SelectItem key={b.id} value={b.id}>{b.subject}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-[#A8A9AD]/20 border-t-[#C9A84C] rounded-full animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-[#A8A9AD]"><p className="text-sm">No delivery records found</p></div>
          ) : (
            <div className="divide-y divide-[#A8A9AD]/10">
              {filtered.map(r => {
                const StatusIcon = STATUS_ICONS[r.delivery_status]?.icon || Clock;
                const statusColor = STATUS_ICONS[r.delivery_status]?.color || "text-[#A8A9AD]";
                const statusLabel = STATUS_ICONS[r.delivery_status]?.label || r.delivery_status;
                const ChannelIcon = CHANNEL_ICONS[r.delivery_channel] || Bell;
                const broadcast = broadcastMap[r.message_id];

                return (
                  <div key={r.id} className="p-4 hover:bg-[#0A0A0A]/50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <ChannelIcon size={14} className="text-[#C9A84C]" />
                          <span className="text-sm font-medium text-white">{r.user_name || "Unknown"}</span>
                          <span className="text-xs text-[#A8A9AD]">{r.user_email}</span>
                        </div>
                        {broadcast && <p className="text-xs text-[#A8A9AD] mb-2">Broadcast: {broadcast.subject}</p>}
                        {r.bounce_reason && <p className="text-xs text-red-400 mb-1">Bounce reason: {r.bounce_reason}</p>}
                        <div className="flex flex-wrap gap-3 text-xs text-[#A8A9AD]">
                          {r.sent_date && <span>Sent: {new Date(r.sent_date).toLocaleString()}</span>}
                          {r.delivered_date && <span className="text-green-400">Delivered: {new Date(r.delivered_date).toLocaleString()}</span>}
                          {r.opened_at && <span className="text-blue-400">Opened: {new Date(r.opened_at).toLocaleString()}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <StatusIcon size={14} className={statusColor} />
                        <span className={`text-xs font-medium ${statusColor}`}>{statusLabel}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}