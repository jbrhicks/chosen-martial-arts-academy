import { useState } from "react";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { ChevronDown, GripVertical } from "lucide-react";
import NavigationItem from "./NavigationItem";

export default function SidebarGroup({
  group,
  items,
  isActive,
  favorites,
  onToggleFavorite,
  collapsed,
  onNavigate,
  dragHandleProps,
}) {
  const [expanded, setExpanded] = useState(false);
  const GroupIcon = group.icon;

  // Collapsed (icon-only) mode: show icon with hover flyout
  if (collapsed) {
    return (
      <div className="relative group/flyout">
        <button
          className="flex items-center justify-center w-full py-3 text-[#A8A9AD] hover:text-white hover:bg-white/5 rounded-sm transition-colors"
          title={group.label}
        >
          <GroupIcon size={20} />
        </button>
        <div className="hidden group-hover/flyout:block absolute left-full top-0 ml-2 w-56 bg-black border border-[#A8A9AD]/20 rounded-sm shadow-2xl z-50 p-2">
          <p className="text-[10px] tracking-widest uppercase text-[#C9A84C] px-2 py-1.5">
            {group.label}
          </p>
          {items.map((item) => (
            <NavigationItem
              key={item.path}
              item={item}
              isActive={isActive}
              isFavorite={favorites.includes(item.path)}
              onToggleFavorite={onToggleFavorite}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </div>
    );
  }

  // Expanded mode: accordion with DnD items
  return (
    <Droppable droppableId={group.id} type="item">
      {(provided, snapshot) => (
        <div ref={provided.innerRef} {...provided.droppableProps}>
          <div className={`flex items-center px-2 py-2 ${snapshot.isDraggingOver ? "bg-white/5 rounded-sm" : ""}`}>
            {dragHandleProps && (
              <span {...dragHandleProps} className="cursor-grab opacity-30 hover:opacity-100 transition-opacity">
                <GripVertical size={14} />
              </span>
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-2 flex-1 text-left ml-1"
            >
              <GroupIcon size={16} className="text-[#A8A9AD]" />
              <span className="text-[10px] tracking-widest uppercase text-[#A8A9AD] flex-1">
                {group.label}
              </span>
              <ChevronDown
                size={14}
                className={`text-[#A8A9AD] transition-transform ${expanded ? "rotate-180" : ""}`}
              />
            </button>
          </div>
          {expanded && (
            <div className="ml-2 pl-3 border-l border-[#A8A9AD]/10 space-y-0.5 pb-1">
              {items.map((item, index) => (
                <Draggable key={item.path} draggableId={item.path} index={index}>
                  {(prov) => (
                    <div ref={prov.innerRef} {...prov.draggableProps} className="flex items-center">
                      <span
                        {...prov.dragHandleProps}
                        className="cursor-grab opacity-0 hover:opacity-100 transition-opacity px-0.5"
                      >
                        <GripVertical size={12} className="text-[#A8A9AD]" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <NavigationItem
                          item={item}
                          isActive={isActive}
                          isFavorite={favorites.includes(item.path)}
                          onToggleFavorite={onToggleFavorite}
                          onNavigate={onNavigate}
                        />
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </div>
      )}
    </Droppable>
  );
}