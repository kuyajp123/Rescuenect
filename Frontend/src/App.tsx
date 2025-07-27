import SideBar from './components/ui/sideBar/SideBar';
import Header from './components/ui/header/Header';
import Content from './components/ui/content/Content';

function App() {

  return (
    <div className='flex flex-row gap-4 pr-4'>
      <div>
        <SideBar />
      </div>
      
      <div className='flex flex-col w-full'>
        <div>
          <Header />
        </div>
        <div className='flex h-full pb-4'>
          {/* <Content /> */}
        </div>
      </div>
    </div>
  );
}
 
export default App;
