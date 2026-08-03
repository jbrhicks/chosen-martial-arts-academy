import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { DEFAULT_GROUPS, DEFAULT_GROUP_ORDER } from "@/components/admin/sidebar/navConfig";

function getDefaultSettings() {
  const itemOrder = {};
  DEFAULT_GROUPS.forEach((group) => {
    itemOrder[group.id] = group.items.map((item) => item.path);
  });
  return {
    favorites: [],
    groupOrder: [...DEFAULT_GROUP_ORDER],
    itemOrder,
    sidebarCollapsed: false,
  };
}

function mergeWithDefaults(saved) {
  const merged = { ...getDefaultSettings(), ...saved };
  // Ensure all groups exist in order
  DEFAULT_GROUP_ORDER.forEach((id) => {
    if (!merged.groupOrder.includes(id)) merged.groupOrder.push(id);
  });
  // Ensure all items exist in each group
  DEFAULT_GROUPS.forEach((group) => {
    const defaultPaths = group.items.map((i) => i.path);
    if (!merged.itemOrder[group.id]) {
      merged.itemOrder[group.id] = defaultPaths;
    } else {
      defaultPaths.forEach((p) => {
        if (!merged.itemOrder[group.id].includes(p)) merged.itemOrder[group.id].push(p);
      });
    }
  });
  return merged;
}

export function useAdminNavSettings(user) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    try {
      const parsed = user.admin_nav_settings ? JSON.parse(user.admin_nav_settings) : getDefaultSettings();
      setSettings(mergeWithDefaults(parsed));
    } catch {
      setSettings(getDefaultSettings());
    }
    setLoading(false);
  }, [user]);

  const saveSettings = useCallback(async (newSettings) => {
    setSettings(newSettings);
    try {
      await base44.auth.updateMe({ admin_nav_settings: JSON.stringify(newSettings) });
    } catch {
      // Silently fail — settings still work in-session
    }
  }, []);

  const toggleFavorite = useCallback((path) => {
    setSettings((prev) => {
      if (!prev) return prev;
      const favorites = prev.favorites.includes(path)
        ? prev.favorites.filter((p) => p !== path)
        : [...prev.favorites, path];
      const next = { ...prev, favorites };
      saveSettings(next);
      return next;
    });
  }, [saveSettings]);

  const toggleSidebarCollapsed = useCallback(() => {
    setSettings((prev) => {
      if (!prev) return prev;
      const next = { ...prev, sidebarCollapsed: !prev.sidebarCollapsed };
      saveSettings(next);
      return next;
    });
  }, [saveSettings]);

  const handleDragEnd = useCallback((result) => {
    if (!result.destination) return;
    setSettings((prev) => {
      if (!prev) return prev;
      let next = prev;
      if (result.type === "group") {
        const newOrder = [...prev.groupOrder];
        const [moved] = newOrder.splice(result.source.index, 1);
        newOrder.splice(result.destination.index, 0, moved);
        next = { ...prev, groupOrder: newOrder };
      } else if (result.type === "item") {
        if (result.source.droppableId !== result.destination.droppableId) return prev;
        const groupId = result.source.droppableId;
        const newOrder = [...(prev.itemOrder[groupId] || [])];
        const [moved] = newOrder.splice(result.source.index, 1);
        newOrder.splice(result.destination.index, 0, moved);
        next = { ...prev, itemOrder: { ...prev.itemOrder, [groupId]: newOrder } };
      }
      saveSettings(next);
      return next;
    });
  }, [saveSettings]);

  return { settings, loading, toggleFavorite, toggleSidebarCollapsed, handleDragEnd };
}