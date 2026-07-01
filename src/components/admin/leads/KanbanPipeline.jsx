import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Mail, Phone, Calendar, AlertTriangle, Clock } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

const STAGES = [
  { id: "new_lead", label: "New Lead", color: "text-[#C9A84C]", barColor: "bg-[#C9A84C]" },
  { id: "contacted", label: "Contacted", color: "text-blue-400", barColor: "bg-blue-400" },
  { id: "trial_booked", label: "Trial Booked", color: "text-purple-400", barColor: "bg-purple-400" },
  { id: "showed_up", label: "Trial Attended", color: "text-cyan-400", barColor: "bg-cyan-400" },
  { id: "won", label: "Won / Enrolled", color: "text-green-400", barColor: "bg-green-400" },
  { id: "lost", label: "Lost", color: "text-red-400", barColor: "bg-red-400" },
];

const STALE_HOURS = 48;
const STALE_STAGES = ["contacted"];

function isStale(lead) {
  if (!STALE_STAGES.includes(lead.pipeline_stage || "new_lead")) return false;
  const updated = new Date(lead.updated_date || lead.created_date);
  const hoursSince = (Date.now() - updated.getTime()) / (1000 * 60 * 60);
  return hoursSince >= STALE_HOURS;
}

export default function KanbanPipeline({ leads, onStageChange, onLeadClick }) {
  const { user } = useAuth();
  const adminName = user?.full_name || "Admin";

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const leadId = result.draggableId;
    const newStage = result.destination.droppableId;
    const lead = leads.find(l => l.id === leadId);
    if (lead && (lead.pipeline_stage || "new_lead") === newStage) return;

    try {
      await base44.functions.invoke("updateLeadStage", {
        lead_id: leadId,
        new_stage: newStage,
        admin_name: adminName,
      });
      onStageChange();
    } catch (e) {
      console.error("Failed to update stage:", e);
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map(stage => {
          const stageLeads = leads.filter(l => (l.pipeline_stage || "new_lead") === stage.id);
          const staleCount = stageLeads.filter(isStale).length;
          return (
            <Droppable key={stage.id} droppableId={stage.id}>
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="w-64 shrink-0">
                  <div className="border border-[#A8A9AD]/20 bg-black p-3 mb-2">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-xs tracking-widest uppercase font-bold ${stage.color}`}>{stage.label}</h3>
                      <span className={`text-xs ${stage.color} font-bold`}>{stageLeads.length}</span>
                    </div>
                    {staleCount > 0 && (
                      <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1">
                        <AlertTriangle size={10} /> {staleCount} stale
                      </p>
                    )}
                  </div>
                  <div className="space-y-2 min-h-[100px]">
                    {stageLeads.map((lead, idx) => {
                      const stale = isStale(lead);
                      return (
                        <Draggable key={lead.id} draggableId={lead.id} index={idx}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => onLeadClick?.(lead)}
                              className={`border p-3 cursor-pointer transition-colors ${
                                stale
                                  ? "border-red-500/50 bg-red-500/5 hover:border-red-500"
                                  : "border-[#A8A9AD]/20 bg-[#0A0A0A] hover:border-[#C9A84C]/30"
                              }`}
                            >
                              <div className={`w-full h-0.5 ${stale ? "bg-red-500" : stage.barColor} mb-2`} />
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-bold truncate flex-1">{lead.full_name}</p>
                                {stale && <AlertTriangle size={12} className="text-red-400 shrink-0" />}
                              </div>
                              <p className="text-xs text-[#A8A9AD] mb-1">{lead.program_of_interest || lead.interest || "—"}</p>
                              {lead.email && <p className="text-xs text-[#A8A9AD] flex items-center gap-1 truncate"><Mail size={10} /> {lead.email}</p>}
                              {lead.phone && lead.phone !== "N/A" && <p className="text-xs text-[#A8A9AD] flex items-center gap-1"><Phone size={10} /> {lead.phone}</p>}
                              {lead.trial_date && <p className="text-xs text-purple-400 flex items-center gap-1 mt-1"><Calendar size={10} /> {new Date(lead.trial_date).toLocaleDateString()}</p>}
                              {stale && (
                                <p className="text-[10px] text-red-400 flex items-center gap-1 mt-1">
                                  <Clock size={10} /> Stale — follow up!
                                </p>
                              )}
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          );
        })}
      </div>
    </DragDropContext>
  );
}