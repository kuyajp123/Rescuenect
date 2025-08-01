import { useEffect, useState } from 'react';

const Status = () => {
  const [data, setData] = useState('');

  useEffect(() => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/test`)
      .then(res => res.json())
      .then(json => setData(JSON.stringify(json, null, 2))) // just to display something readable
      .catch(err => console.error('Error fetching:', err));
  }, []);

  return (
    <div>{data}</div>
  )
}

export default Status