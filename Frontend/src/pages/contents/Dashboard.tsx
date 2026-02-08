import { parseCategory } from '@/helper/commonHelpers';
import { useResidentsStore } from '@/hooks/useFetchResidents';
import { useAllStatusStore } from '@/stores/useAllStatusStore';
import { useEarthquakeStore } from '@/stores/useEarthquakeStore';
import { useStatusStore } from '@/stores/useStatusStore';
import { StatusData } from '@/types/types';
import { Card, CardBody, CardHeader, Chip } from '@heroui/react';
import { Activity, AlertTriangle, Calendar, TrendingUp, Users } from 'lucide-react';
import { useMemo } from 'react';
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

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'];

// Helper to get timestamp in milliseconds
const getTimestamp = (date: any): number => {
  if (!date) return 0;
  if (date._seconds) return date._seconds * 1000;
  if (date.seconds) return date.seconds * 1000;
  if (typeof date === 'string') return new Date(date).getTime();
  return 0;
};

export const Dashboard = () => {
  const totalCount = useResidentsStore(state => state.totalCount);
  const statusData = useAllStatusStore(state => state.allStatuses);
  const earthquakes = useEarthquakeStore(state => state.earthquakes);
  const currentStatuses = useStatusStore(state => state.statusData);

  // Calculate status counts
  const safeCount = currentStatuses.filter(item => item.condition === 'safe').length;
  const evacuatedCount = currentStatuses.filter(item => item.condition === 'evacuated').length;
  const affectedCount = currentStatuses.filter(item => item.condition === 'affected').length;
  const missingCount = currentStatuses.filter(item => item.condition === 'missing').length;
  const activeIncidents = currentStatuses.length;

  // Dynamic Pie Chart Data - Status Distribution
  const PieData = useMemo(
    () => [
      { name: 'Safe', value: safeCount || 0 },
      { name: 'Evacuated', value: evacuatedCount || 0 },
      { name: 'Affected', value: affectedCount || 0 },
      { name: 'Missing', value: missingCount || 0 },
    ],
    [safeCount, evacuatedCount, affectedCount, missingCount]
  );

  // Dynamic Weekly Data - Group statuses by week of current month
  const WeekData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Calculate how many weeks have passed in current month
    const currentWeekNumber = Math.ceil(now.getDate() / 7);

    // Create weeks array based on current week (only show weeks that have occurred)
    const weeks: any[] = [];
    for (let i = 1; i <= Math.min(currentWeekNumber, 5); i++) {
      weeks.push({ week: `Week ${i}`, safe: 0, evacuated: 0, affected: 0, missing: 0 });
    }

    statusData.forEach((status: StatusData) => {
      const timestamp = getTimestamp(status.createdAt);
      const statusDate = new Date(timestamp);

      // Only count statuses from current month
      if (statusDate.getMonth() === currentMonth && statusDate.getFullYear() === currentYear) {
        const statusDay = statusDate.getDate();
        const weekNumber = Math.ceil(statusDay / 7);

        // Find the corresponding week
        const weekIndex = weekNumber - 1;
        if (weekIndex >= 0 && weekIndex < weeks.length) {
          const week = weeks[weekIndex];
          if (status.condition === 'safe') week.safe++;
          else if (status.condition === 'evacuated') week.evacuated++;
          else if (status.condition === 'affected') week.affected++;
          else if (status.condition === 'missing') week.missing++;
        }
      }
    });

    return weeks;
  }, [statusData]);

  // Dynamic Earthquake Data - Last 8 earthquakes sorted by time
  const earthquakeData = useMemo(() => {
    return earthquakes
      .sort((a, b) => b.time - a.time)
      .slice(0, 8)
      .reverse()
      .map(eq => ({
        date: new Date(eq.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        magnitude: eq.magnitude,
      }));
  }, [earthquakes]);

  // Dynamic Category Data - Count categories from all statuses
  const categoryData = useMemo(() => {
    const categoryCounts: Record<string, number> = {};

    statusData.forEach((status: StatusData) => {
      const categories = parseCategory(status.category);
      categories.forEach(cat => {
        const capitalizedCat = cat.charAt(0).toUpperCase() + cat.slice(1);
        categoryCounts[capitalizedCat] = (categoryCounts[capitalizedCat] || 0) + 1;
      });
    });

    return Object.entries(categoryCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }, [statusData]);

  // Dynamic stats cards
  const statsCards = useMemo(() => {
    const currentMonth = new Date().toLocaleDateString('en-PH', {
      timeZone: 'Asia/Manila',
      month: 'long',
      year: 'numeric',
    });
    const currentWeek = `Week ${Math.ceil(new Date().getDate() / 7)}`;

    return [
      {
        title: 'Total Residents',
        value: totalCount.toString(),
        change: totalCount > 0 ? `${totalCount} registered` : 'No data',
        trend: 'up' as const,
        icon: Users,
        color: 'bg-blue-500/10 dark:bg-blue-500/20',
        iconColor: 'text-blue-600 dark:text-blue-400',
      },
      {
        title: 'Active Status',
        value: activeIncidents.toString(),
        change: activeIncidents > 0 ? `${activeIncidents} active` : 'No incidents',
        trend: activeIncidents > 0 ? ('up' as const) : ('neutral' as const),
        icon: AlertTriangle,
        color: 'bg-orange-500/10 dark:bg-orange-500/20',
        iconColor: 'text-orange-600 dark:text-orange-400',
      },
      {
        title: 'Safe Status',
        value: safeCount.toString(),
        change: safeCount > 0 ? `${Math.round((safeCount / (activeIncidents || 1)) * 100)}% of total` : 'No data',
        trend: 'up' as const,
        icon: Activity,
        color: 'bg-green-500/10 dark:bg-green-500/20',
        iconColor: 'text-green-600 dark:text-green-400',
      },
      {
        title: 'This Month',
        value: currentMonth,
        change: currentWeek,
        trend: 'neutral' as const,
        icon: Calendar,
        color: 'bg-purple-500/10 dark:bg-purple-500/20',
        iconColor: 'text-purple-600 dark:text-purple-400',
      },
    ];
  }, [totalCount, activeIncidents, safeCount]);

  const renderLabel = ({ percent }: any) => {
    return `${(percent * 100).toFixed(0)}%`;
  };

  const formatTooltipLabel = (label?: string) => {
    if (!label) return label;
    if (label === 'safe') return 'Status';
    return label;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const headerLabel = formatTooltipLabel(payload[0].payload.category || payload[0].payload.name || payload[0].name);
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-lg">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{headerLabel}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs text-gray-600 dark:text-gray-400">
              {entry.name === 'count' && entry.payload?.category
                ? entry.payload.category
                : formatTooltipLabel(entry.name)}
              :{' '}
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
    <div className="w-full h-full overflow-auto p-4">
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
            <div className="w-full h-70">
              {activeIncidents > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
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
                      {PieData.map((_entry, index) => (
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
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500 dark:text-gray-400">No status data available</p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Incident Categories */}
        <Card className="hover:shadow-lg transition-shadow duration-300 border-none">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between w-full">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Incident Categories</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total category occurrences</p>
              </div>
              <Chip size="sm" color="warning" variant="flat">
                {categoryData.reduce((sum, cat) => sum + cat.count, 0)} Total
              </Chip>
            </div>
          </CardHeader>
          <CardBody className="pt-4">
            <div className="w-full h-70">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={categoryData}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.8} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e5e7eb"
                      className="dark:stroke-gray-800"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="category"
                      stroke="#9ca3af"
                      className="dark:stroke-gray-600"
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis stroke="#9ca3af" className="dark:stroke-gray-600" tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} />
                    <Legend
                      wrapperStyle={{ paddingTop: '10px' }}
                      iconType="circle"
                      formatter={value => <span className="text-sm text-gray-700 dark:text-gray-300">{value}</span>}
                    />
                    <Bar dataKey="count" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500 dark:text-gray-400">No category data available</p>
                </div>
              )}
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
              <Chip size="sm" color={earthquakes.length > 0 ? 'danger' : 'default'} variant="flat">
                {earthquakes.length} Events
              </Chip>
            </div>
          </CardHeader>
          <CardBody className="pt-4">
            <div className="w-full h-70">
              {earthquakeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
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
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500 dark:text-gray-400">No earthquake data available</p>
                </div>
              )}
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
                {WeekData.reduce((sum, week) => sum + week.safe + week.evacuated + week.affected + week.missing, 0)}{' '}
                Total
              </Chip>
            </div>
          </CardHeader>
          <CardBody className="pt-4">
            <div className="w-full h-70">
              <ResponsiveContainer width="100%" height={280}>
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
    </div>
  );
};
