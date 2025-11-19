import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';

const data = [
  { time: '11/18/2025, 3:14 PM', magnitude: 4.6 },
  { time: '11/18/2025, 3:30 PM', magnitude: 5.2 },
  { time: '11/18/2025, 4:00 PM', magnitude: 4.9 },
  { time: '11/18/2025, 4:15 PM', magnitude: 5.5 },
];

const Earthquake = () => {
  return (
    <LineChart width={600} height={350} data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="time" angle={-30} textAnchor="end" />
      <YAxis domain={[0, 'dataMax + 1']} />
      <Tooltip />
      <Line type="monotone" dataKey="magnitude" stroke="#8884d8" strokeWidth={3} />
    </LineChart>
  );
};

export default Earthquake;
