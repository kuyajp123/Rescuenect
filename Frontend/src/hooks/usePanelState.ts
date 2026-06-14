import { useEffect, useState } from 'react';

/**
 * Safely loads panel state from sessionStorage with error handling.
 * Falls back to default value if sessionStorage is unavailable or throws an error.
 * 
 * @param storageKey - sessionStorage key
 * @param defaultValue - Default value if storage is unavailable
 * @returns Stored boolean value or default
 */
const loadPanelState = (storageKey: string, defaultValue: boolean): boolean => {
  try {
    const stored = sessionStorage.getItem(storageKey);
    return stored !== null ? stored === 'true' : defaultValue;
  } catch (error) {
    // sessionStorage may be unavailable in private browsing mode, disabled by user,
    // or quota may be exceeded
    console.warn(`Failed to load panel state from sessionStorage (key: ${storageKey}):`, error);
    return defaultValue;
  }
};

/**
 * Safely saves panel state to sessionStorage with error handling.
 * Logs warning if storage operation fails.
 * 
 * @param storageKey - sessionStorage key
 * @param value - Boolean value to store
 */
const savePanelState = (storageKey: string, value: boolean): void => {
  try {
    sessionStorage.setItem(storageKey, String(value));
  } catch (error) {
    // sessionStorage may be unavailable or quota may be exceeded
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.warn(`sessionStorage quota exceeded. Panel state for "${storageKey}" will not persist.`);
    } else {
      console.warn(`Failed to save panel state to sessionStorage (key: ${storageKey}):`, error);
    }
  }
};

/**
 * usePanelState Hook
 * 
 * Manages panel collapse state with sessionStorage persistence and graceful error handling.
 * Used for collapsible sidebar panels in the danger zones map view.
 * 
 * Features:
 * - Loads collapse state from sessionStorage on mount
 * - Persists state changes to sessionStorage
 * - Gracefully handles sessionStorage errors (disabled, quota exceeded, etc.)
 * - Falls back to default state when storage is unavailable
 * - Logs warnings for debugging in development
 * 
 * @param storageKey - sessionStorage key for persisting collapse state
 * @param defaultCollapsed - Default collapsed state (default: false)
 * @returns Tuple of [isCollapsed, toggleCollapse]
 * 
 * **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 12.5**
 */
export const usePanelState = (
  storageKey: string,
  defaultCollapsed = false
): [boolean, () => void] => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => 
    loadPanelState(storageKey, defaultCollapsed)
  );

  // Persist to sessionStorage when state changes
  useEffect(() => {
    savePanelState(storageKey, isCollapsed);
  }, [isCollapsed, storageKey]);

  const toggle = () => {
    setIsCollapsed(prev => !prev);
  };

  return [isCollapsed, toggle];
};
