type StatusCounts = {
  Safe: number;
  Evacuated: number;
  Affected: number;
  Missing: number;
};

export const StatusList = ({ Safe, Evacuated, Affected, Missing }: StatusCounts) => {
  return (
    <div className='grid grid-cols-2 gap-20'>
        <div className='grid grid-cols-2 gap-5'>
            <span className='flex gap-2'><div className='bg-green-500 w-4 h-4 inline-block rounded-full'></div> Safe</span>
            <span>{Safe}</span>
            <span className='flex gap-2'><div className='bg-blue-500 w-4 h-4 inline-block rounded-full'></div> Evacuated</span>
            <span>{Evacuated}</span>
        </div>
        <div className='grid grid-cols-2 gap-5'>
            <span className='flex gap-2'><div className='bg-yellow-500 w-4 h-4 inline-block rounded-full'></div> Affected</span>
            <span>{Affected}</span>
            <span className='flex gap-2'><div className='bg-red-500 w-4 h-4 inline-block rounded-full'></div> Missing</span>
            <span>{Missing}</span>
        </div>
    </div>
  )
}