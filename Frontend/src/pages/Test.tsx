import { useScreenSize } from '@/utils/ScreenSizeContext';

const Test = () => {
  const { screenSize  } = useScreenSize();

  return (
    <div className='flex justify-center items-center h-auto w-auto bg-bg dark:bg-bg p-20 gap-3'>
      {screenSize == 'desktop' && 'You are using desktop!'}
      {screenSize == 'tablet' && 'You are using tablet!'}
      {screenSize == 'mobile' && 'You are using mobile!'}
    </div>
  )
}

export default Test
