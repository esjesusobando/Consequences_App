import React, { createContext, useContext, useState, PropsWithChildren } from 'react';
import type { TabId } from '../components/SideNavBar';

// Tipo de contexto para el estado de tabs
type TabContextValue = {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  hideLeftPanel: boolean;
  setHideLeftPanel: (visible: boolean) => void;
  hideRightPanel: boolean;
  setHideRightPanel: (visible: boolean) => void;
};

// Create context with default values
const TabContextDefaultValue: TabContextValue = {
  activeTab: 'dashboard' as TabId,
  setActiveTab: () => {},
  hideLeftPanel: false,
  setHideLeftPanel: () => {},
  hideRightPanel: false,
  setHideRightPanel: () => {},
};

// Create context
export const TabContext = createContext<TabContextValue>(TabContextDefaultValue);

// Custom hook to consume context
export const useTabContext = () => useContext(TabContext);

// Provider component
export const TabContextProvider = (props: PropsWithChildren<{}>) => {
  // Tab state managed in context
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [hideLeftPanel, setHideLeftPanel] = useState<boolean>(false);
  const [hideRightPanel, setHideRightPanel] = useState<boolean>(false);

  return (
    <TabContext.Provider value={{
      activeTab,
      setActiveTab,
      hideLeftPanel,
      setHideLeftPanel,
      hideRightPanel,
      setHideRightPanel,
    }}>
      {props.children}
    </TabContext.Provider>
  );
};