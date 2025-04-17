import { useScreenSize } from '@/utils/ScreenSizeContext';

const Test = () => {
  const { screenSize  } = useScreenSize();

  return (
    <div className='flex justify-center items-center flex-col h-auto w-auto bg-card dark:bg-card p-20 gap-3'>
      {screenSize == 'desktop' && 'You are using desktop!'}
      {screenSize == 'large_screen' && 'You are using big screen!'}
      {screenSize == 'tablet' && 'You are using tablet!'}
      {screenSize == 'mobile' && 'You are using mobile!'}
    </div>
  )
}

export default Test
