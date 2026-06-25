import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { MessageSquare, Send, Bell, Mail, Phone, Plus, Settings, Inbox, Contact } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import toast from "react-hot-toast";
import MessageBubble from "@/components/messages/MessageBubble";
import MessageMediaUploader from "@/components/messages/MessageMediaUploader";

export default function Messages() {
  const [threads, setThreads] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [familySettings, setFamilySettings] = useState(null);
  const [showContactDesk, setShowContactDesk] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [contactSubject, setContactSubject] = useState("");
  const [contactCategory, setContactCategory] = useState("general");
  const [contactMessage, setContactMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [reactions, setReactions] = useState([]);
  const [attachments, setAttachments] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedThread) {
      fetchMessages(selectedThread.id);
      const unsubscribe = base44.entities.Message.subscribe((event) => {
        if (event.data.thread_id === selectedThread.id) {
          fetchMessages(selectedThread.id);
        }
      });
      return () => unsubscribe();
    }
  }, [selectedThread]);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      const allThreads = await base44.entities.MessageThread.list("-updated_date");
      const participants = await base44.entities.ThreadParticipant.filter({ user_id: user.id });
      const participantThreadIds = participants.map(p => p.thread_id);
      const userThreads = allThreads.filter(t => participantThreadIds.includes(t.id));
      setThreads(userThreads);

      if (user.family_id) {
        const families = await base44.entities.FamilyGroup.filter({ id: user.family_id });
        if (families.length > 0) {
          setFamilySettings(families[0]);
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (threadId) => {
    try {
      const threadMessages = await base44.entities.Message.filter({ thread_id: threadId }, "created_date");
      setMessages(threadMessages);

      const participant = (await base44.entities.ThreadParticipant.filter({
        thread_id: threadId,
        user_id: currentUser.id
      }))[0];

      if (participant && participant.unread_count > 0) {
        await base44.entities.ThreadParticipant.update(participant.id, { unread_count: 0 });
      }

      // Mark admin outbound messages as read (read receipt) so admins see double checkmarks
      const unreadFromAdmin = threadMessages.filter(m => m.sender_id !== currentUser.id && !m.read_receipt);
      for (const m of unreadFromAdmin) {
        await base44.entities.Message.update(m.id, { read_receipt: true, read_date: new Date().toISOString() });
      }

      // Load reactions for these messages
      const msgIds = threadMessages.map(m => m.id);
      if (msgIds.length > 0) {
        const allReactions = await base44.entities.MessageReaction.list();
        setReactions(allReactions.filter(r => msgIds.includes(r.message_id)));
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!replyContent.trim() && attachments.length === 0) return;
    if (!selectedThread) return;

    try {
      await base44.functions.invoke("sendMessage", {
        threadId: selectedThread.id,
        content: replyContent || (attachments.length > 0 ? "📎 Attachment" : ""),
        channel: "in_app",
        mediaUrls: attachments.length > 0 ? attachments : undefined
      });
      
      setReplyContent("");
      setAttachments([]);
      fetchMessages(selectedThread.id);
      toast.success("Message sent!");
    } catch (error) {
      toast.error("Failed to send message: " + error.message);
    }
  };

  const handleContactFrontDesk = async () => {
    if (!contactMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }

    try {
      const result = await base44.functions.invoke("createSupportThread", {
        subject: contactSubject || `Support: ${currentUser.full_name}`,
        category: contactCategory,
        initialMessage: contactMessage
      });

      toast.success("Message sent to Front Desk!");
      setShowContactDesk(false);
      setContactSubject("");
      setContactCategory("general");
      setContactMessage("");
      loadData();
    } catch (error) {
      toast.error("Failed to send message: " + error.message);
    }
  };

  const handlePreferenceChange = async (field, value) => {
    if (!familySettings) return;

    try {
      await base44.entities.FamilyGroup.update(familySettings.id, {
        [field]: value
      });
      
      setFamilySettings({ ...familySettings, [field]: value });
      toast.success("Preferences updated!");
    } catch (error) {
      toast.error("Failed to update preferences: " + error.message);
    }
  };

  const totalUnread = threads.reduce((sum, thread) => {
    const participant = threads.find(t => t.id === thread.id);
    return sum + (participant?.unread_count || 0);
  }, 0);

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
          <h1 className="text-2xl font-bold text-[#C9A84C]">Messages</h1>
          <p className="text-sm text-[#A8A9AD] mt-1">
            Your secure inbox for academy communications
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowPreferences(true)}
            variant="outline"
            className="border-[#A8A9AD]/20"
          >
            <Settings size={18} />
            Preferences
          </Button>
          <Button
            onClick={() => setShowContactDesk(true)}
            className="bg-[#C9A84C] hover:bg-[#C9A84C]/90"
          >
            <Contact size={18} />
            Contact Front Desk
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
        <Card className="bg-black border-[#A8A9AD]/20 lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Inbox size={18} />
                <span>Inbox</span>
              </div>
              {totalUnread > 0 && (
                <Badge className="bg-red-500 text-white">
                  {totalUnread}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-y-auto h-[calc(100%-80px)]">
            <div className="space-y-2">
              {threads.map((thread) => (
                <div
                  key={thread.id}
                  onClick={() => setSelectedThread(thread)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedThread?.id === thread.id
                      ? "bg-[#C9A84C]/20 border border-[#C9A84C]/30"
                      : "bg-[#0A0A0A] hover:bg-[#0A0A0A]/80 border border-[#A8A9AD]/10"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Bell size={16} className="text-[#A8A9AD]" />
                        <span className="font-medium text-white truncate">
                          {thread.thread_name || "Announcement"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs border-[#A8A9AD]/30 text-[#A8A9AD]">
                          {thread.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black border-[#A8A9AD]/20 lg:col-span-2 flex flex-col">
          {selectedThread ? (
            <>
              <CardHeader className="pb-3 border-b border-[#A8A9AD]/20">
                <CardTitle className="text-white flex items-center gap-3">
                  <Bell size={20} className="text-[#C9A84C]" />
                  <span>{selectedThread.thread_name || "Conversation"}</span>
                </CardTitle>
              </CardHeader>

              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOutbound={message.sender_id === currentUser?.id}
                    currentUserId={currentUser?.id}
                    reactions={reactions.filter(r => r.message_id === message.id)}
                    onReactionsUpdate={() => fetchMessages(selectedThread.id)}
                    showChannel={false}
                  />
                ))}
              </CardContent>

              <div className="p-4 border-t border-[#A8A9AD]/20">
                <div className="flex items-end gap-2">
                  <MessageMediaUploader attachments={attachments} onAttachmentsChange={setAttachments} />
                  <Textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Type your reply..."
                    className="bg-[#0A0A0A] border-[#A8A9AD]/20 text-white flex-1 min-h-[60px] max-h-32"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!replyContent.trim() && attachments.length === 0}
                    className="bg-[#C9A84C] hover:bg-[#C9A84C]/90 self-end"
                  >
                    <Send size={18} />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[#A8A9AD]">
              <div className="text-center">
                <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                <p>Select a message to view</p>
                <p className="text-xs mt-2">All academy announcements appear here</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      <Dialog open={showContactDesk} onOpenChange={setShowContactDesk}>
        <DialogContent className="bg-black border-[#A8A9AD]/20 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Contact size={20} className="text-[#C9A84C]" />
              Contact Front Desk
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-[#A8A9AD]">Category</Label>
              <Select value={contactCategory} onValueChange={setContactCategory}>
                <SelectTrigger className="bg-[#0A0A0A] border-[#A8A9AD]/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black border-[#A8A9AD]/20">
                  <SelectItem value="general">General Inquiry</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="attendance">Attendance</SelectItem>
                  <SelectItem value="curriculum">Curriculum</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[#A8A9AD]">Subject (Optional)</Label>
              <Input
                value={contactSubject}
                onChange={(e) => setContactSubject(e.target.value)}
                placeholder="Brief subject"
                className="bg-[#0A0A0A] border-[#A8A9AD]/20"
              />
            </div>
            <div>
              <Label className="text-[#A8A9AD]">Message</Label>
              <Textarea
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="How can we help you today?"
                className="bg-[#0A0A0A] border-[#A8A9AD]/20 min-h-[150px]"
              />
            </div>
            <Button
              onClick={handleContactFrontDesk}
              className="w-full bg-[#C9A84C] hover:bg-[#C9A84C]/90"
            >
              <Send size={18} />
              Send Message
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
        <DialogContent className="bg-black border-[#A8A9AD]/20 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Settings size={20} className="text-[#C9A84C]" />
              Communication Preferences
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-white">Receive Email Updates</Label>
                <p className="text-xs text-[#A8A9AD]">
                  Get announcements and notifications via email
                </p>
              </div>
              <Switch
                checked={familySettings?.opt_in_email !== false}
                onCheckedChange={(value) => handlePreferenceChange("opt_in_email", value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-white">Receive SMS Text Updates</Label>
                <p className="text-xs text-[#A8A9AD]">
                  Get urgent notifications via text message
                </p>
              </div>
              <Switch
                checked={familySettings?.opt_in_sms !== false}
                onCheckedChange={(value) => handlePreferenceChange("opt_in_sms", value)}
              />
            </div>

            <div className="border-t border-[#A8A9AD]/20 pt-4">
              <div className="flex items-start gap-3 p-3 bg-[#C9A84C]/10 rounded-lg border border-[#C9A84C]/30">
                <Bell size={18} className="text-[#C9A84C] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-white">
                    In-App Messaging is Always Enabled
                  </p>
                  <p className="text-xs text-[#A8A9AD] mt-1">
                    Note: To ensure your family's safety and awareness, all official Chosen Martial Arts Academy 
                    announcements will always be delivered to your secure App Inbox, which cannot be disabled.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}