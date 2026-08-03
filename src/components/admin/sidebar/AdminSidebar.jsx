import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { PanelLeftClose, PanelLeftOpen, Star } from "lucide-react";
import { DEFAULT_GROUPS, STANDALONE_ITEMS, getAllItems } from "./navConfig";
import SidebarGroup from "./SidebarGroup";
import NavigationItem from "./NavigationItem";

export default function AdminSidebar({
  settings,
  loading,
  isActive,
  onToggleFavorite,
  onToggleSidebarCollapsed,
  handleDragEnd,
  collapsed,
  onNavigate,
}) {
  if (loading || !settings) {
    return (
      <div className="flex-1 p-4">
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-8 bg-white/5 rounded" />
          ))}
        </div>
      </div>
    );
  }

  const allItems = getAllItems();
  const favoriteItems = settings.favorites
    .map((p) => allItems.find((i) => i.path === p))
    .filter(Boolean);

  const orderedGroups = settings.groupOrder
    .map((groupId) => {
      const group = DEFAULT_GROUPS.find((g) => g.id === groupId);
      if (!group) return null;
      const orderedPaths = settings.itemOrder[groupId] || group.items.map((i) => i.path);
      const orderedItems = orderedPaths
        .map((p) => group.items.find((i) => i.path === p))
        .filter(Boolean);
      return { ...group, items: orderedItems };
    })
    .filter(Boolean);

  return (
    <div className={`flex-1 flex flex-col ${collapsed ? "overflow-visible" : "overflow-y-auto"}`}>
      {/* Collapse toggle (desktop only) */}
      <button
        onClick={onToggleSidebarCollapsed}
        className="hidden lg:flex items-center gap-2 px-4 py-2 text-[10px] tracking-widest uppercase text-[#A8A9AD] hover:text-white border-b border-[#A8A9AD]/10 transition-colors"
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        {!collapsed && <span>Collapse</span>}
      </button>

      {/* Dashboard (standalone) */}
      <div className="px-2 pt-2">
        <NavigationItem
          item={STANDALONE_ITEMS[0]}
          isActive={isActive}
          isFavorite={settings.favorites.includes(STANDALONE_ITEMS[0].path)}
          onToggleFavorite={onToggleFavorite}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
      </div>

      {/* Favorites section */}
      {favoriteItems.length > 0 && !collapsed && (
        <div className="px-2 pt-2">
          <div className="flex items-center gap-2 px-3 py-1.5">
            <Star size={12} className="text-[#C9A84C] fill-[#C9A84C]" />
            <span className="text-[10px] tracking-widest uppercase text-[#C9A84C]">Favorites</span>
          </div>
          {favoriteItems.map((item) => (
            <NavigationItem
              key={item.path}
              item={item}
              isActive={isActive}
              isFavorite={true}
              onToggleFavorite={onToggleFavorite}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}

      {/* Groups with DnD */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="groups" type="group">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="px-2 flex-1">
              {orderedGroups.map((group, index) => (
                <Draggable key={group.id} draggableId={group.id} index={index}>
                  {(prov, snap) => (
                    <div
                      ref={prov.innerRef}
                      {...prov.draggableProps}
                      className={`rounded-sm ${snap.isDragging ? "bg-white/5 shadow-lg" : ""}`}
                    >
                      <SidebarGroup
                        group={group}
                        items={group.items}
                        isActive={isActive}
                        favorites={settings.favorites}
                        onToggleFavorite={onToggleFavorite}
                        collapsed={collapsed}
                        onNavigate={onNavigate}
                        dragHandleProps={prov.dragHandleProps}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Front Desk Kiosk (standalone) */}
      <div className="px-2 pb-2 pt-2 border-t border-[#A8A9AD]/10 mt-auto">
        <NavigationItem
          item={STANDALONE_ITEMS[1]}
          isActive={isActive}
          isFavorite={settings.favorites.includes(STANDALONE_ITEMS[1].path)}
          onToggleFavorite={onToggleFavorite}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
      </div>
    </div>
  );
}