import { Outlet } from 'react-router-dom';

const Content = () => {
  return (
    <div className='w-full h-full p-6'>
      <Outlet />
    </div>
  )
}

export default Content