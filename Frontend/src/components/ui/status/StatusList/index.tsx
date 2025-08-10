type StatusCounts = {
  safe: number;
  evacuated: number;
  affected: number;
  missing: number;
};

export const StatusList = ({ safe, evacuated, affected, missing }: StatusCounts) => {
  return (
    <div className='grid grid-cols-2 gap-20'>
        <div className='grid grid-cols-2 gap-5'>
            <span className='flex gap-2'><div className='bg-green-500 w-4 h-4 inline-block rounded-full'></div> Safe</span>
            <span>{safe}</span>
            <span className='flex gap-2'><div className='bg-blue-500 w-4 h-4 inline-block rounded-full'></div> Evacuated</span>
            <span>{evacuated}</span>
        </div>
        <div className='grid grid-cols-2 gap-5'>
            <span className='flex gap-2'><div className='bg-yellow-500 w-4 h-4 inline-block rounded-full'></div> Affected</span>
            <span>{affected}</span>
            <span className='flex gap-2'><div className='bg-red-500 w-4 h-4 inline-block rounded-full'></div> Missing</span>
            <span>{missing}</span>
        </div>
    </div>
  )
}