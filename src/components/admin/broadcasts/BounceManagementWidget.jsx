import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, Mail, MessageSquare, ChevronDown, ChevronUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BounceManagementWidget() {
  const [bounces, setBounces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    loadBounces();
  }, []);

  const loadBounces = async () => {
    try {
      const all = await base44.entities.MessageRecipient.list("-sent_date", 500);
      const bounced = all.filter(r => r.is_bounced || r.delivery_status === "failed" || r.delivery_status === "bounced");
      setBounces(bounced);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const emailBounces = bounces.filter(b => b.delivery_channel === "email");
  const smsBounces = bounces.filter(b => b.delivery_channel === "sms");

  if (loading || bounces.length === 0) return null;

  return (
    <div className="border border-red-500/30 bg-red-500/5 p-4">
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border border-red-500/30 flex items-center justify-center bg-red-500/10">
            <AlertTriangle size={18} className="text-red-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-red-400">Delivery Failures Detected</p>
            <p className="text-xs text-[#A8A9AD]">
              {emailBounces.length} email{emailBounces.length !== 1 ? "s" : ""} bounced · {smsBounces.length} text{smsBounces.length !== 1 ? "s" : ""} failed
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="text-red-400">
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </Button>
      </div>

      {expanded && (
        <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
          <p className="text-xs text-[#A8A9AD] mb-2">Ask these families for updated contact info at their next class:</p>
          {bounces.map(b => (
            <div key={b.id} className="flex items-center justify-between p-2 bg-[#0A0A0A] border border-[#A8A9AD]/10">
              <div className="flex items-center gap-2">
                {b.delivery_channel === "email" ? <Mail size={14} className="text-red-400" /> : <MessageSquare size={14} className="text-red-400" />}
                <div>
                  <p className="text-sm text-white">{b.user_name || "Unknown"}</p>
                  <p className="text-xs text-[#A8A9AD]">{b.user_email || "No email"}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-red-400">{b.delivery_channel === "email" ? "Bounced" : "Failed"}</span>
                {b.bounce_reason && <p className="text-xs text-[#A8A9AD] mt-0.5 max-w-[200px] truncate">{b.bounce_reason}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}