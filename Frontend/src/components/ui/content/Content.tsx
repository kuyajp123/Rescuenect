import { Outlet } from 'react-router-dom';

const Content = () => {
  return (
    <div className='h-full flex flex-row container w-full '>
      <Outlet />
    </div>
  )
}

export default Content