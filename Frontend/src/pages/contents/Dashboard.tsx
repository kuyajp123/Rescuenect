import { Card, CardBody, CardHeader, Chip } from '@heroui/react';
import { Activity, AlertTriangle, Calendar, TrendingUp, Users } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const PieData = [
  { name: 'Safe', value: 120 },
  { name: 'Evacuated', value: 45 },
  { name: 'Affected', value: 80 },
  { name: 'Missing', value: 10 },
];

const WeekData = [
  {
    week: 'Week 1',
    safe: 120,
    evacuated: 30,
    affected: 55,
    missing: 5,
  },
  {
    week: 'Week 2',
    safe: 150,
    evacuated: 40,
    affected: 70,
    missing: 8,
  },
  {
    week: 'Week 3',
    safe: 100,
    evacuated: 35,
    affected: 60,
    missing: 12,
  },
  {
    week: 'Week 4',
    safe: 180,
    evacuated: 25,
    affected: 45,
    missing: 4,
  },
];

const earthquakeData = [
  { date: 'Dec 1', magnitude: 3.2 },
  { date: 'Dec 3', magnitude: 4.5 },
  { date: 'Dec 5', magnitude: 2.8 },
  { date: 'Dec 8', magnitude: 5.1 },
  { date: 'Dec 12', magnitude: 4.0 },
  { date: 'Dec 16', magnitude: 6.2 },
  { date: 'Dec 20', magnitude: 3.9 },
  { date: 'Dec 25', magnitude: 5.5 },
];

const categoryData = [
  { category: 'Earthquake', count: 12 },
  { category: 'Flood', count: 8 },
  { category: 'Landslide', count: 4 },
  { category: 'Fire', count: 2 },
  { category: 'Typhoon', count: 6 },
  { category: 'Emergency', count: 10 },
];

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'];

const statsCards = [
  {
    title: 'Total Residents',
    value: '255',
    change: '+12%',
    trend: 'up',
    icon: Users,
    color: 'bg-blue-500/10 dark:bg-blue-500/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    title: 'Active Incidents',
    value: '42',
    change: '+8%',
    trend: 'up',
    icon: AlertTriangle,
    color: 'bg-orange-500/10 dark:bg-orange-500/20',
    iconColor: 'text-orange-600 dark:text-orange-400',
  },
  {
    title: 'Safe Status',
    value: '180',
    change: '+5%',
    trend: 'up',
    icon: Activity,
    color: 'bg-green-500/10 dark:bg-green-500/20',
    iconColor: 'text-green-600 dark:text-green-400',
  },
  {
    title: 'This Month',
    value: 'Dec 2024',
    change: 'Week 4',
    trend: 'neutral',
    icon: Calendar,
    color: 'bg-purple-500/10 dark:bg-purple-500/20',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
];

export const Dashboard = () => {
  const renderLabel = ({ percent }: any) => {
    return `${(percent * 100).toFixed(0)}%`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-lg">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {payload[0].payload.name || payload[0].name}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs text-gray-600 dark:text-gray-400">
              {entry.name}:{' '}
              <span className="font-semibold" style={{ color: entry.color }}>
                {entry.value}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full overflow-auto bg-gray-50 dark:bg-gray-950 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Dashboard Overview</h1>
        <p className="text-gray-600 dark:text-gray-400">Monitor real-time status and analytics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((stat, index) => (
          <Card
            key={index}
            className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-none"
          >
            <CardBody className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{stat.title}</p>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{stat.value}</h3>
                  <div className="flex items-center gap-1">
                    {stat.trend !== 'neutral' && <TrendingUp size={14} className="text-green-500" />}
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{stat.change}</span>
                  </div>
                </div>
                <div className={`${stat.color} p-3 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className={`${stat.iconColor}`} size={24} />
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Status Distribution */}
        <Card className="hover:shadow-lg transition-shadow duration-300 border-none">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between w-full">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Status Distribution</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Current residents by status</p>
              </div>
              <Chip size="sm" color="primary" variant="flat">
                Live
              </Chip>
            </div>
          </CardHeader>
          <CardBody className="pt-4">
            <div className="w-full h-[280px]">
              <ResponsiveContainer>
                <PieChart>
                  <defs>
                    <filter id="shadow" height="200%">
                      <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                      <feOffset dx="0" dy="2" result="offsetblur" />
                      <feComponentTransfer>
                        <feFuncA type="linear" slope="0.2" />
                      </feComponentTransfer>
                      <feMerge>
                        <feMergeNode />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <Pie
                    data={PieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    dataKey="value"
                    label={renderLabel}
                    filter="url(#shadow)"
                  >
                    {PieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        className="hover:opacity-80 transition-opacity cursor-pointer"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="circle"
                    formatter={value => <span className="text-sm text-gray-700 dark:text-gray-300">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        {/* Weekly Trends */}
        <Card className="hover:shadow-lg transition-shadow duration-300 border-none">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between w-full">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Weekly Trends</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Status changes over 4 weeks</p>
              </div>
              <Chip size="sm" color="success" variant="flat">
                +15%
              </Chip>
            </div>
          </CardHeader>
          <CardBody className="pt-4">
            <div className="w-full h-[280px]">
              <ResponsiveContainer>
                <BarChart data={WeekData} barGap={0}>
                  <defs>
                    <linearGradient id="safeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity={0.3} />
                    </linearGradient>
                    <linearGradient id="evacuatedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.3} />
                    </linearGradient>
                    <linearGradient id="affectedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.3} />
                    </linearGradient>
                    <linearGradient id="missingGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                    className="dark:stroke-gray-800"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="week"
                    stroke="#9ca3af"
                    className="dark:stroke-gray-600"
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                  />
                  <YAxis stroke="#9ca3af" className="dark:stroke-gray-600" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} />
                  <Legend
                    wrapperStyle={{ paddingTop: '10px' }}
                    iconType="circle"
                    formatter={value => <span className="text-sm text-gray-700 dark:text-gray-300">{value}</span>}
                  />
                  <Bar dataKey="safe" stackId="a" fill="url(#safeGradient)" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="evacuated" stackId="a" fill="url(#evacuatedGradient)" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="affected" stackId="a" fill="url(#affectedGradient)" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="missing" stackId="a" fill="url(#missingGradient)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Bottom Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Earthquake Activity */}
        <Card className="hover:shadow-lg transition-shadow duration-300 border-none">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between w-full">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Earthquake Activity</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Magnitude readings this month</p>
              </div>
              <Chip size="sm" color="danger" variant="flat">
                Alert
              </Chip>
            </div>
          </CardHeader>
          <CardBody className="pt-4">
            <div className="w-full h-[280px]">
              <ResponsiveContainer>
                <LineChart data={earthquakeData}>
                  <defs>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-800" />
                  <XAxis
                    dataKey="date"
                    stroke="#9ca3af"
                    className="dark:stroke-gray-600"
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                  />
                  <YAxis
                    domain={[0, 10]}
                    stroke="#9ca3af"
                    className="dark:stroke-gray-600"
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ paddingTop: '10px' }}
                    iconType="circle"
                    formatter={value => <span className="text-sm text-gray-700 dark:text-gray-300">{value}</span>}
                  />
                  <Line
                    type="monotone"
                    dataKey="magnitude"
                    stroke="#ef4444"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 7, strokeWidth: 2 }}
                    fill="url(#lineGradient)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        {/* Incident Categories */}
        <Card className="hover:shadow-lg transition-shadow duration-300 border-none">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between w-full">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Incident Categories</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Distribution by type</p>
              </div>
              <Chip size="sm" color="warning" variant="flat">
                42 Total
              </Chip>
            </div>
          </CardHeader>
          <CardBody className="pt-4">
            <div className="w-full h-[280px]">
              <ResponsiveContainer>
                <BarChart data={categoryData} layout="horizontal">
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                    className="dark:stroke-gray-800"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    stroke="#9ca3af"
                    className="dark:stroke-gray-600"
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                  />
                  <YAxis
                    dataKey="category"
                    type="category"
                    stroke="#9ca3af"
                    className="dark:stroke-gray-600"
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    width={100}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} />
                  <Legend
                    wrapperStyle={{ paddingTop: '10px' }}
                    iconType="circle"
                    formatter={value => <span className="text-sm text-gray-700 dark:text-gray-300">{value}</span>}
                  />
                  <Bar dataKey="count" fill="url(#barGradient)" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
