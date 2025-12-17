import { StatusData } from '@/types/types';

// Get color based on earthquake severity
export const getEarthquakeSeverityColor = (severity: string) => {
  switch (severity) {
    case 'micro':
      return '#ADFF2F'; // Yellow-green
    case 'minor':
      return '#FFD700'; // Gold/Yellow
    case 'light':
      return '#FFA500'; // Orange
    case 'moderate':
      return '#FF4500'; // Orange-red
    case 'strong':
      return '#FF0000'; // Red
    case 'major':
      return '#8B0000'; // Dark red
    case 'great':
      return '#4B0000'; // Very dark red
    default:
      return '#808080'; // Gray for unknown
  }
};

export const types = [
  { key: 'school', label: 'School' },
  { key: 'barangay hall', label: 'Barangay Hall' },
  { key: 'gymnasium', label: 'Gymnasium' },
  { key: 'church', label: 'Church' },
  { key: 'government building', label: 'Government Building' },
  { key: 'private facility', label: 'Private Facility' },
  { key: 'vacant building', label: 'Vacant Building' },
  { key: 'covered court', label: 'Covered Court' },
  { key: 'other', label: 'Other' },
];

export const severityLevels = [
  { level: 'micro', label: 'Micro', magnitude: '< 2.0' },
  { level: 'minor', label: 'Minor', magnitude: '2.0 - 3.9' },
  { level: 'light', label: 'Light', magnitude: '4.0 - 4.9' },
  { level: 'moderate', label: 'Moderate', magnitude: '5.0 - 5.9' },
  { level: 'strong', label: 'Strong', magnitude: '6.0 - 6.9' },
  { level: 'major', label: 'Major', magnitude: '7.0 - 7.9' },
  { level: 'great', label: 'Great', magnitude: '8.0+' },
];

// custom legend colors for earthquake severity and status conditions
export const CustomLegend = (styleUrl: string, status?: StatusData[]) => {
  const statusLevels = [
    { condition: 'safe', label: 'Safe', color: '#22c55e' },
    { condition: 'evacuated', label: 'Evacuated', color: '#3b82f6' },
    { condition: 'affected', label: 'Affected', color: '#f97316' },
    { condition: 'missing', label: 'Missing', color: '#ef4444' },
  ];

  return (
    <div
      className={`${styleUrl === 'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png' ? 'bg-white' : 'bg-gray-800'} bg-opacity-80 dark:bg-opacity-80 p-3 rounded-lg shadow-md max-h-96 overflow-y-auto`}
    >
      {/* Earthquake Legend */}
      <h4
        className={`${styleUrl === 'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png' ? 'text-gray-900' : 'text-gray-100'} font-semibold mb-2`}
      >
        Earthquake Severity
      </h4>
      <div className="flex flex-col gap-1 mb-4">
        {severityLevels.map(({ level, label, magnitude }) => (
          <div key={level} className="flex items-center gap-2">
            <span
              className="w-4 h-4 rounded-full inline-block border border-gray-300"
              style={{ backgroundColor: getEarthquakeSeverityColor(level) }}
            />
            <span className="text-xs">
              <span
                className={`${styleUrl === 'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png' ? 'text-gray-900' : 'text-gray-100'} font-medium`}
              >
                {label}
              </span>
              <span className="text-gray-500 ml-1">({magnitude})</span>
            </span>
          </div>
        ))}
      </div>

      {/* Status Legend - Only show if status data exists */}
      {status && status.length > 0 && (
        <>
          <h4
            className={`${styleUrl === 'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png' ? 'text-gray-900' : 'text-gray-100'} font-semibold mb-2`}
          >
            Status Markers
          </h4>
          <div className="flex flex-col gap-1">
            {statusLevels.map(({ condition, label, color }) => (
              <div key={condition} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 border border-gray-300"
                  style={{
                    backgroundColor: color,
                    clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                    transform: 'translateY(-2px)',
                  }}
                />
                <span className="text-xs">
                  <span
                    className={`${styleUrl === 'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png' ? 'text-gray-900' : 'text-gray-100'} font-medium`}
                  >
                    {label}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
