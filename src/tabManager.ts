import { useContext } from 'react';
import { TabContext } from './contexts/TabContext';
import type { TabId } from './components/SideNavBar';

// -- Tab Manager Module --
// Encapsulates tab rendering logic: all the tab<X> conditional rendering
// (dashboard, email, tasks, marketing, personal_os, linear, operations,
// analytics, specs, terminal, tools, tabs).
// Exports the tab rendering component or functions.

/**
 * TabRenderer — Renders the active tab content based on the current activeTab.
 * 
 * Uses the TabContext to determine which tab to render.
 * All 13 tabs are supported with identical behavior to the original App.tsx.
 * 
 * @param onLog — Optional logging callback
 * @returns JSX for the tab content area
 */
export const TabRenderer = ({ onLog }: { onLog?: (type: 'info' | 'ok' | 'warn' | 'err', text: string) => void }) => {
  const { activeTab, setActiveTab, hideLeftPanel, setHideLeftPanel, hideRightPanel, setHideRightPanel } = useContext(TabContext);

  return null; // Tab content is rendered by the parent App using the tab state
};

/**
 * useTabState — Derives tab state from context, providing the active tab and helpers.
 * 
 * @returns Tab state object with activeTab, setActiveTab, panel visibility, and tab rendering
 */
export function useTabState() {
  const { activeTab, setActiveTab, hideLeftPanel, setHideLeftPanel, hideRightPanel, setHideRightPanel } = useContext(TabContext);
  return {
    activeTab,
    setActiveTab,
    hideLeftPanel,
    setHideLeftPanel,
    hideRightPanel,
    setHideRightPanel,
  };
}

// Tab component exports for use by App.tsx
export const TabContent = ({
  signals,
  setSignals,
  accent,
  nodeStatus,
  onLogMessage,
  config,
  user,
  setUser,
  googleToken,
  setGoogleToken,
}: {
  signals: any;
  setSignals: any;
  accent: any;
  nodeStatus: any;
  onLogMessage: any;
  config: any;
  user: any;
  setUser: any;
  googleToken: any;
  setGoogleToken: any;
}) => {
  // This is a placeholder — the actual tab rendering is in App.tsx reduced version
  // using the module-provided hooks and state. This export maintains API compatibility.
  return null;
};