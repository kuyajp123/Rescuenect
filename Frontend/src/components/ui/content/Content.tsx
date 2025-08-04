import { Outlet } from 'react-router-dom';

const Content = () => {
  return (
    <div className='w-full h-full container mx-auto py-8'>
      <Outlet />
    </div>
  )
}

export default Content