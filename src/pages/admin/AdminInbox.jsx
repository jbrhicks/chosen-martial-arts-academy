import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { MessageSquare, Send, Mail, Phone, Bell, Search, Filter, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import toast from "react-hot-toast";

export default function AdminInbox() {
  const [threads, setThreads] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [replyChannel, setReplyChannel] = useState("in_app");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
    fetchThreads();
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

  const loadUser = async () => {
    const user = await base44.auth.me();
    setCurrentUser(user);
  };

  const fetchThreads = async () => {
    try {
      const allThreads = await base44.entities.MessageThread.list("-updated_date");
      const participants = await base44.entities.ThreadParticipant.filter({ user_id: currentUser.id });
      const participantThreadIds = participants.map(p => p.thread_id);
      const userThreads = allThreads.filter(t => participantThreadIds.includes(t.id));
      setThreads(userThreads);
    } catch (error) {
      console.error("Error fetching threads:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (threadId) => {
    try {
      const threadMessages = await base44.entities.Message.filter({ thread_id: threadId }, "created_date");
      setMessages(threadMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!replyContent.trim() || !selectedThread) return;

    try {
      await base44.functions.invoke("sendMessage", {
        threadId: selectedThread.id,
        content: replyContent,
        channel: replyChannel
      });
      
      setReplyContent("");
      fetchMessages(selectedThread.id);
      toast.success("Message sent!");
    } catch (error) {
      toast.error("Failed to send message: " + error.message);
    }
  };

  const getParticipantName = async (thread) => {
    if (!thread) return "Unknown";
    const participants = await base44.entities.ThreadParticipant.filter({ thread_id: thread.id });
    const otherParticipant = participants.find(p => p.user_id !== currentUser?.id);
    return otherParticipant?.user_name || thread.thread_name || "Unknown";
  };

  const getUnreadCount = (thread) => {
    const participant = threads.find(t => t.id === thread.id);
    return participant?.unread_count || 0;
  };

  const filteredThreads = threads.filter(thread => {
    if (filterType !== "all" && thread.type !== filterType) return false;
    if (searchQuery && !thread.thread_name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#C9A84C]">Message Inbox</h1>
        <p className="text-sm text-[#A8A9AD] mt-1">Unified communication hub for all family messages</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        <Card className="bg-black border-[#A8A9AD]/20 lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center justify-between">
              <span>Conversations</span>
              <Badge variant="outline" className="border-[#C9A84C] text-[#C9A84C]">
                {threads.length}
              </Badge>
            </CardTitle>
            <div className="flex gap-2 mt-2">
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#0A0A0A] border-[#A8A9AD]/20 text-white"
              />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[120px] bg-[#0A0A0A] border-[#A8A9AD]/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black border-[#A8A9AD]/20">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="dm">Direct</SelectItem>
                  <SelectItem value="group">Group</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="overflow-y-auto h-[calc(100%-120px)]">
            <div className="space-y-2">
              {filteredThreads.map((thread) => (
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
                        <User size={16} className="text-[#A8A9AD]" />
                        <span className="font-medium text-white truncate">
                          {thread.thread_name || "Untitled"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs border-[#A8A9AD]/30 text-[#A8A9AD]">
                          {thread.type}
                        </Badge>
                        {thread.support_category && (
                          <Badge variant="outline" className="text-xs border-[#A8A9AD]/30 text-[#A8A9AD]">
                            {thread.support_category}
                          </Badge>
                        )}
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
                <CardTitle className="text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <User size={20} className="text-[#C9A84C]" />
                    <div>
                      <span>{selectedThread.thread_name || "Conversation"}</span>
                      {selectedThread.support_category && (
                        <span className="ml-2 text-xs text-[#A8A9AD]">
                          ({selectedThread.support_category})
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-[#A8A9AD]/30 text-[#A8A9AD]">
                      {selectedThread.type}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>

              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === currentUser?.id ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.sender_id === currentUser?.id
                          ? "bg-[#C9A84C]/20 border border-[#C9A84C]/30"
                          : "bg-[#0A0A0A] border border-[#A8A9AD]/10"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-[#C9A84C]">
                          {message.sender_name}
                        </span>
                        <span className="text-xs text-[#A8A9AD]">
                          {message.channel_used === "email" && <Mail size={12} />}
                          {message.channel_used === "sms" && <Phone size={12} />}
                          {message.channel_used === "in_app" && <Bell size={12} />}
                        </span>
                      </div>
                      <p className="text-sm text-white">{message.content}</p>
                      <p className="text-xs text-[#A8A9AD] mt-1">
                        {message.created_date ? new Date(message.created_date).toLocaleString() : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>

              <div className="p-4 border-t border-[#A8A9AD]/20">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-[#A8A9AD]">Send via:</span>
                  <Select value={replyChannel} onValueChange={setReplyChannel}>
                    <SelectTrigger className="w-[150px] bg-[#0A0A0A] border-[#A8A9AD]/20 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-[#A8A9AD]/20">
                      <SelectItem value="in_app">In-App (Always)</SelectItem>
                      <SelectItem value="email">Email (If opted in)</SelectItem>
                      <SelectItem value="sms">SMS (If opted in)</SelectItem>
                    </SelectContent>
                  </Select>
                  {replyChannel !== "in_app" && (
                    <span className="text-xs text-[#A8A9AD] ml-2">
                      Respects user preferences
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Type your reply..."
                    className="bg-[#0A0A0A] border-[#A8A9AD]/20 text-white flex-1 min-h-[80px]"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!replyContent.trim()}
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
                <p>Select a conversation to view messages</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}