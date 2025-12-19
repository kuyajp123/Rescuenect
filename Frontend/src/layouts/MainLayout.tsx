import Content from '@/components/ui/content/Content';
import Header from '@/components/ui/header/Header';
import { EvacuationPanel, StatusPanel } from '@/components/ui/panel';
import SideBar from '@/components/ui/sideBar/SideBar';
import { NotificationToast } from '@/components/ui/toast/NotificationToast';
import { Button } from '@heroui/react';
import { useEffect, useState } from 'react';
import { usePanelStore } from '../stores/panelStore.ts';

const MainLayout = () => {
  // Initialize sidebar state from localStorage or default to true
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarExpanded');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Save sidebar state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('sidebarExpanded', JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  // Get panel state from Zustand store
  const { isOpen: isPanelOpen, selectedUser: data, closePanel } = usePanelStore();

  return (
    <div className="relative flex h-screen overflow-hidden">
      {/* Sidebar */}
      <SideBar isOpen={sidebarOpen} />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content area */}
      <div className={`flex flex-col h-full w-full md:mx-4 ${sidebarOpen ? 'lg:ml-5' : 'lg:ml-16'}`}>
        <div className="flex-shrink-0 ">
          <Header isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        </div>
        <div className="flex-1 flex justify-between overflow-auto py-4 relative">
          {/* Main content area - adjusts width based on panel state */}
          <div className={`flex justify-center transition-all duration-300 ease-in-out w-full ${isPanelOpen ? 'lg:w-[68%]' : ''}`}>
            <Content />
          </div>

          {/* Side panel */}
          <div
            className={`
            fixed right-0 top-16 h-[calc(100vh-4rem)] bg-white dark:bg-gray-900 shadow-xl z-30
            border-l border-gray-200 dark:border-gray-700
            transition-transform duration-300 ease-in-out
            w-full sm:w-[450px] lg:w-[30%]
            ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'}
          `}
          >
            <div className="grid h-full grid-rows-[auto_1fr] gap-4 p-4">
              {/* Panel Header */}
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  {data?.type === 'status' && data.data ? `${data.data.firstName} ${data.data.lastName} Details` : null}
                  {data?.type === 'evacuation' && data.data ? `${data.data.name} Details` : null}
                  {data?.type === 'residentProfile' && data.data
                    ? `${data.data.firstName} ${data.data.lastName} Details`
                    : null}
                  {data?.type === 'statusHistory' && data.data
                    ? `${data.data.firstName} ${data.data.lastName} - ${data.data.versionId}`
                    : null}
                  {!data ? 'Status Details' : null}
                </h3>
                <Button variant="light" onPress={closePanel}>
                  Close Panel
                </Button>
              </div>

              {/* Map Section */}
              {data?.type === 'status' && data.data ? (
                <StatusPanel data={data} />
              ) : data?.type === 'evacuation' && data.data ? (
                <EvacuationPanel data={data} />
              ) : data?.type === 'residentProfile' && data.data ? (
                <StatusPanel data={data} />
              ) : data?.type === 'statusHistory' && data.data ? (
                <StatusPanel data={data} />
              ) : null}
            </div>
          </div>

          {/* Panel overlay for mobile/smaller screens */}
          {isPanelOpen && <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={closePanel} />}
        </div>
      </div>
      <NotificationToast />
    </div>
  );
};

export default MainLayout;
