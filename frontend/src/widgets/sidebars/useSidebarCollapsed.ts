import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'enit_sidebar_collapsed';

const readInitial = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
};

/**
 * Desktop sidebar collapse state. Mirrors the state onto <html data-sidebar>
 * so CSS can shrink --sidebar-width (used by both the sidebar and the main
 * content offset). Only takes effect at ≥lg; mobile stays off-canvas.
 */
export function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(readInitial);

  useEffect(() => {
    const root = document.documentElement;
    if (collapsed) root.dataset.sidebar = 'collapsed';
    else delete root.dataset.sidebar;
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0');
    } catch {
      /* storage unavailable: keep in-memory state */
    }
    return () => {
      delete root.dataset.sidebar;
    };
  }, [collapsed]);

  const toggle = useCallback(() => setCollapsed((v) => !v), []);
  return { collapsed, toggle };
}
