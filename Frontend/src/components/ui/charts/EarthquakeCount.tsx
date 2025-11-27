import { CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';

export const EarthquakeCount = () => {
  return (
    <LineChart
      style={{ width: '100%', aspectRatio: 1.618, maxWidth: 600 }}
      responsive
      data={[
        { month: 'Jan', earthquakes: 0 },
        { month: 'Feb', earthquakes: 0 },
        { month: 'Mar', earthquakes: 12 },
        { month: 'Apr', earthquakes: 0 },
        { month: 'May', earthquakes: 0 },
      ]}
      margin={{
        top: 20,
        right: 20,
        bottom: 5,
        left: 0,
      }}
    >
      <CartesianGrid stroke="#aaa" strokeDasharray="0" /> {/* solid lines */}
      <Line type="monotone" dataKey="earthquakes" stroke="purple" strokeWidth={2} name="Earthquakes per month" />
      <XAxis dataKey="month" />
      <YAxis width="auto" label={{ value: 'Earthquakes', position: 'insideLeft', angle: -90 }} />
      <Legend align="right" />
      <Tooltip />
    </LineChart>
  );
};
