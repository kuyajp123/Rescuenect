import { Outlet } from 'react-router-dom';

const Content = () => {
  return (
    <div className='w-full h-full'>
      <Outlet />
    </div>
  )
}

export default Content