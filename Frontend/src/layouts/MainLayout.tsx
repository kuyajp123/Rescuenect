import Content from '@/components/ui/content/Content'
import Header from '@/components/ui/header/Header'
import SideBar from '@/components/ui/sideBar/SideBar'
import React from 'react'

const MainLayout = () => {
  return (
    <div className='flex flex-row gap-4 pr-4 h-screen'>
      <div className='overflow-hidden'>
        <SideBar />
      </div>
      
      <div className='flex flex-col w-full'>
        <div>
          <Header />
        </div>
        <div className='flex h-full overflow-auto pb-4'>
          <Content />
        </div>
      </div>
    </div>
  )
}

export default MainLayout