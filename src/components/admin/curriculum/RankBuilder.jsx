import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import CurriculumItemForm from "./CurriculumItemForm";
import { Plus, Trash2, Pencil, Loader2, Video, FileText, X, GripVertical } from "lucide-react";

export default function RankBuilder({ belt, onBeltUpdate }) {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState("");

  const load = async () => {
    try {
      const [cats, allItems] = await Promise.all([
        base44.entities.CurriculumCategory.filter({ rank_id: belt.id }),
        base44.entities.CurriculumCriteria.filter({ rank_id: belt.id }),
      ]);
      cats.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
      allItems.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
      setCategories(cats);
      setItems(allItems);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [belt.id]);

  const itemsByCategory = (catIdOrName) => items.filter(i => (i.category_id || i.category) === catIdOrName);

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const sourceCatId = result.source.droppableId;
    const destCatId = result.destination.droppableId;
    const draggedItem = items.find(i => i.id === result.draggableId);
    if (!draggedItem) return;

    const destCat = categories.find(c => c.id === destCatId);
    const newCatId = destCat?.id || destCatId;
    const newCatName = destCat?.category_name || destCatId;

    // Optimistic update
    const updated = items.map(i => i.id === draggedItem.id ? { ...i, category_id: newCatId, category: newCatName } : i);
    setItems(updated);

    try {
      await base44.entities.CurriculumCriteria.update(draggedItem.id, { category_id: newCatId, category: newCatName });
    } catch (e) {
      alert("Failed to move item.");
      load();
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      await base44.entities.CurriculumCategory.create({
        rank_id: belt.id,
        rank_name: belt.belt_name,
        program_id: belt.program_id,
        category_name: newCategoryName.trim(),
        display_order: categories.length,
      });
      setNewCategoryName("");
      setShowAddCategory(false);
      load();
    } catch (e) { alert("Failed to create category."); }
  };

  const handleEditCategory = async (cat) => {
    try {
      await base44.entities.CurriculumCategory.update(cat.id, { category_name: editCategoryName.trim() });
      setEditingCategoryId(null);
      load();
    } catch (e) { alert("Failed to update category."); }
  };

  const handleDeleteCategory = async (cat) => {
    if (!confirm(`Delete "${cat.category_name}"? Items in this category will be uncategorized but not deleted.`)) return;
    try {
      await base44.entities.CurriculumCategory.delete(cat.id);
      load();
    } catch (e) { alert("Failed to delete category."); }
  };

  const handleDeleteItem = async (id) => {
    if (!confirm("Delete this curriculum item?")) return;
    try { await base44.entities.CurriculumCriteria.delete(id); load(); } catch (e) { alert("Failed to delete item."); }
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-[#C9A84C]" /></div>;

  // Build column list: custom categories + any standard categories that have items
  const standardCatsWithItems = items
    .filter(i => !i.category_id && !categories.find(c => c.category_name === i.category))
    .map(i => i.category)
    .filter((v, i, arr) => arr.indexOf(v) === i);

  const allColumns = [
    ...categories.map(c => ({ id: c.id, name: c.category_name, isCustom: true, cat: c })),
    ...standardCatsWithItems.map(name => ({ id: name, name, isCustom: false, cat: null })),
  ];

  return (
    <div className="p-4 space-y-4">
      {/* Testing Criteria Summary */}
      <div className="border border-[#C9A84C]/20 bg-[#C9A84C]/5 p-3 flex items-center gap-4 text-xs">
        <span className="text-[#A8A9AD] tracking-widest uppercase">Testing Requirements:</span>
        <span className="text-white"><strong>{belt.min_classes_required}</strong> classes minimum</span>
        <span className="text-white"><strong>{belt.min_time_in_grade}</strong> weeks in grade</span>
        <span className="text-white"><strong>{items.length}</strong> curriculum items</span>
      </div>

      {/* Add Category Bar */}
      <div className="flex items-center gap-2">
        {showAddCategory ? (
          <div className="flex items-center gap-2 flex-1">
            <input autoFocus value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAddCategory()} className="flex-1 bg-transparent border border-[#A8A9AD]/30 px-3 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none" placeholder="Category name (e.g. Forms, Sparring, Terminology)" />
            <button onClick={handleAddCategory} className="px-4 py-2 bg-[#C9A84C] text-black text-xs font-bold uppercase tracking-wide">Add</button>
            <button onClick={() => setShowAddCategory(false)} className="text-[#A8A9AD] hover:text-white"><X size={16} /></button>
          </div>
        ) : (
          <button onClick={() => setShowAddCategory(true)} className="flex items-center gap-2 px-3 py-2 border border-dashed border-[#C9A84C]/30 text-[#C9A84C] text-xs font-medium tracking-wide hover:bg-[#C9A84C]/10 transition-colors">
            <Plus size={14} /> Add Category
          </button>
        )}
      </div>

      {/* Drag-and-Drop Board */}
      {allColumns.length === 0 ? (
        <div className="border border-dashed border-[#A8A9AD]/20 p-8 text-center">
          <p className="text-sm text-[#A8A9AD]">No categories yet. Create a category above, then add curriculum items to it.</p>
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4 min-h-[200px]">
            {allColumns.map(col => {
              const colItems = itemsByCategory(col.id);
              return (
                <div key={col.id} className="flex-shrink-0 w-72 border border-[#A8A9AD]/20 bg-black/50 flex flex-col">
                  {/* Column header */}
                  <div className="px-3 py-2.5 border-b border-[#A8A9AD]/20 flex items-center justify-between bg-[#0A0A0A]">
                    {editingCategoryId === col.id ? (
                      <div className="flex items-center gap-1 flex-1">
                        <input autoFocus value={editCategoryName} onChange={e => setEditCategoryName(e.target.value)} onKeyDown={e => { if (e.key === "Enter") handleEditCategory(col.cat); if (e.key === "Escape") setEditingCategoryId(null); }} className="flex-1 bg-transparent border border-[#A8A9AD]/30 px-2 py-1 text-sm text-white focus:border-[#C9A84C] focus:outline-none" />
                        <button onClick={() => handleEditCategory(col.cat)} className="text-xs text-[#C9A84C]">Save</button>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm font-bold text-white">{col.name}</span>
                        <span className="text-xs text-[#A8A9AD]">{colItems.length}</span>
                      </>
                    )}
                    <div className="flex items-center gap-1 ml-2">
                      {col.isCustom && editingCategoryId !== col.id && (
                        <>
                          <button onClick={() => { setEditingCategoryId(col.id); setEditCategoryName(col.name); }} className="text-[#A8A9AD] hover:text-white"><Pencil size={12} /></button>
                          <button onClick={() => handleDeleteCategory(col.cat)} className="text-[#A8A9AD] hover:text-red-400"><Trash2 size={12} /></button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Droppable area */}
                  <Droppable droppableId={col.id}>
                    {(provided, snapshot) => (
                      <div ref={provided.innerRef} {...provided.droppableProps} className={`flex-1 p-2 space-y-2 min-h-[100px] transition-colors ${snapshot.isDraggingOver ? "bg-[#C9A84C]/5" : ""}`}>
                        {colItems.map((item, idx) => (
                          <Draggable key={item.id} draggableId={item.id} index={idx}>
                            {(prov, snap) => (
                              <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps} className={`border border-[#A8A9AD]/20 bg-[#0A0A0A] p-2.5 group ${snap.isDragging ? "border-[#C9A84C]/50 shadow-lg" : ""}`}>
                                <div className="flex items-start gap-2">
                                  <GripVertical size={14} className="text-[#A8A9AD]/40 mt-0.5 shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white leading-tight">{item.title}</p>
                                    {item.description && <p className="text-xs text-[#A8A9AD] truncate mt-0.5">{item.description}</p>}
                                    <div className="flex items-center gap-1.5 mt-1.5">
                                      {item.video_url && <Video size={11} className="text-[#C9A84C]" />}
                                      {item.document_url && <FileText size={11} className="text-blue-400" />}
                                      {item.is_required === false && <span className="text-[9px] text-[#A8A9AD] border border-[#A8A9AD]/20 px-1.5">OPT</span>}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setEditingItem(item); setShowItemForm(true); }} className="text-[#A8A9AD] hover:text-white"><Pencil size={12} /></button>
                                    <button onClick={() => handleDeleteItem(item.id)} className="text-[#A8A9AD] hover:text-red-400"><Trash2 size={12} /></button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        {colItems.length === 0 && (
                          <p className="text-xs text-[#A8A9AD]/50 text-center py-4">Drag items here</p>
                        )}
                      </div>
                    )}
                  </Droppable>

                  {/* Add item button */}
                  <button onClick={() => { setEditingItem(null); setShowItemForm(true); }} className="flex items-center gap-1.5 px-3 py-2 border-t border-[#A8A9AD]/20 text-xs text-[#A8A9AD] hover:text-[#C9A84C] transition-colors">
                    <Plus size={12} /> Add Item
                  </button>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      )}

      {showItemForm && (
        <CurriculumItemForm
          rankId={belt.id}
          rankName={belt.belt_name}
          programId={belt.program_id}
          categories={categories}
          criteria={editingItem}
          onSave={load}
          onClose={() => { setShowItemForm(false); setEditingItem(null); }}
        />
      )}
    </div>
  );
}