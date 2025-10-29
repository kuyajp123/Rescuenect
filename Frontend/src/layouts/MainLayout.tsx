import Content from '@/components/ui/content/Content';
import Header from '@/components/ui/header/Header';
import { Map } from '@/components/ui/Map';
import SideBar from '@/components/ui/sideBar/SideBar';
import { StatusCard } from '@/components/ui/status';
import { Button } from '@heroui/react';
import { useState } from 'react';
import { usePanelStore } from '../stores/panelStore.ts';

const MainLayout = () => {
  // Initialize sidebar state from localStorage or default to true
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarExpanded');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Get panel state from Zustand store
  const { isOpen: isPanelOpen, selectedUser, closePanel } = usePanelStore();

  return (
    <div className="relativ flex h-screen overflow-hidden">
      {/* Sidebar */}
      <SideBar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content area */}
      <div className={`flex flex-col h-full w-full ${sidebarOpen ? 'lg:ml-5' : 'lg:ml-16'}`}>
        <div className="flex-shrink-0 ">
          <Header />
        </div>
        <div className="flex-1 flex justify-between overflow-auto py-4 relative">
          {/* Main content area - adjusts width based on panel state */}
          <div className={`flex justify-center ${isPanelOpen ? 'w-[68%]' : 'w-full'}`}>
            <Content />
          </div>

          {/* Side panel */}
          <div
            className={`
            fixed right-0 top-16 h-[calc(100vh-4rem)] w-[28%] bg-white dark:bg-gray-900 shadow-xl z-30
           border-l border-gray-200 dark:border-gray-700
            ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'}
          `}
          >
            <div className="grid h-full grid-rows-[auto_1fr_2fr] gap-4 p-4">
              {/* Panel Header */}
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  {selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName} Details` : 'Status Details'}
                </h3>
                <Button variant="light" onPress={closePanel}>
                  Close Panel
                </Button>
              </div>

              {/* Map Section */}
              <div className="">
                <div className="h-full rounded-lg overflow-hidden">
                  <Map
                    key={selectedUser ? `map-${selectedUser.id}` : 'map-default'}
                    data={
                      selectedUser
                        ? [
                            {
                              uid: selectedUser.id,
                              lat: selectedUser.lat,
                              lng: selectedUser.lng,
                              condition: selectedUser.condition,
                            },
                          ]
                        : []
                    }
                    center={selectedUser ? [selectedUser.lat, selectedUser.lng] : [14.2965, 120.7925]}
                    hasMapStyleSelector={false}
                    zoomControl={false}
                    dragging={false}
                    hasMapControl={true}
                    zoom={selectedUser ? 15 : 13}
                    markerType="status"
                  />
                </div>
              </div>

              {/* Status Card Section */}
              <div className="min-h-0 overflow-auto">
                {selectedUser ? (
                  <StatusCard
                    className="h-fit max-h-[500px]"
                    uid={selectedUser.id}
                    profileImage={selectedUser.profileImage}
                    firstName={selectedUser.firstName}
                    lastName={selectedUser.lastName}
                    phoneNumber={selectedUser.phoneNumber || ''}
                    condition={selectedUser.condition}
                    location={selectedUser.location}
                    note={selectedUser.originalStatus?.note || ''}
                    image={selectedUser.originalStatus?.image}
                    expiresAt={selectedUser.originalStatus?.expiresAt}
                    createdAt={selectedUser.originalStatus?.createdAt}
                    vid={selectedUser.vid}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                    <p>Select a row from the history table to view details</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Panel overlay for mobile/smaller screens */}
          {isPanelOpen && <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={closePanel} />}
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
