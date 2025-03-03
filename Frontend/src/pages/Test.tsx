import { useScreenSize } from '@/utils/ScreenSizeContext';

const Test = () => {
  const { screenSize  } = useScreenSize();

  return (
    <div className='flex justify-center items-center flex-col h-auto w-auto bg-card dark:bg-card p-20 gap-3'>
      {screenSize == 'desktop' && 'You are using desktop!'}
      {screenSize == 'large_screen' && 'You are using big screen!'}
      {screenSize == 'tablet' && 'You are using tablet!'}
      {screenSize == 'mobile' && 'You are using mobile!'}
      Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.
    </div>
  )
}

export default Test
