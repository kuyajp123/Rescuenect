import { useState, useEffect } from 'react'
import Content from '@/components/ui/content/Content'
import Header from '@/components/ui/header/Header'
import SideBar from '@/components/ui/sideBar/SideBar'

const MainLayout = () => {
  // Initialize sidebar state from localStorage or default to true
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarExpanded')
    return saved !== null ? JSON.parse(saved) : true
  })

  // Save sidebar state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('sidebarExpanded', JSON.stringify(sidebarOpen))
  }, [sidebarOpen])

  return (
    <div className='relative flex h-screen overflow-hidden'>
      {/* Sidebar */}
      <SideBar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className='fixed inset-0 z-20 bg-black/50 transition-opacity duration-300 ease-out lg:hidden'
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Main content area */}
      <div className={`flex flex-col h-full w-full transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'lg:ml-5' : 'lg:ml-16'
      }`}>
        <div className='flex-shrink-0 '>
          <Header />
        </div>
        <div className='flex-1 overflow-auto p-4'>
          <Content />
        </div>
      </div>
    </div>
  )
}

export default MainLayout