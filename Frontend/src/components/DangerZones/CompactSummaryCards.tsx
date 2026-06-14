import { Card, Spinner } from '@heroui/react';
import { Activity, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';

interface CompactSummaryCardsProps {
  pendingCount: number;
  verifiedActiveCount: number;
  highCriticalCount: number;
  routeFallbackCount: number;
  routeCount?: number;
  isLoading: boolean;
}

/**
 * CompactSummaryCards displays four key metrics about danger zones in a horizontal layout.
 * 
 * Features:
 * - Reduced vertical height (80-100px) for space efficiency
 * - Responsive grid: 4 columns (desktop), 2x2 (mobile)
 * - Icons for visual hierarchy
 * - Loading state with skeleton UI
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**
 */
export const CompactSummaryCards = ({
  pendingCount,
  verifiedActiveCount,
  highCriticalCount,
  routeFallbackCount,
  routeCount = 0,
  isLoading,
}: CompactSummaryCardsProps) => {
  const cards = [
    {
      label: 'Pending reports',
      value: pendingCount,
      icon: Activity,
      iconColor: 'text-warning',
      testId: 'pending-reports-card',
    },
    {
      label: 'Verified active',
      value: verifiedActiveCount,
      icon: CheckCircle,
      iconColor: 'text-success',
      testId: 'verified-active-card',
    },
    {
      label: 'High / critical',
      value: highCriticalCount,
      icon: AlertTriangle,
      iconColor: 'text-danger',
      testId: 'high-critical-card',
    },
    {
      label: 'Route fallbacks',
      value: routeFallbackCount,
      icon: ShieldAlert,
      iconColor: 'text-primary',
      subtitle: `/ ${routeCount} routes`,
      testId: 'route-fallbacks-card',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4" role="region" aria-label="Danger zone summary metrics">
      {cards.map(card => {
        const Icon = card.icon;
        return (
          <Card
            key={card.label}
            shadow="sm"
            className="bg-content1"
            data-testid={card.testId}
          >
            <div className="flex h-[90px] flex-col justify-between p-4">
              {isLoading ? (
                <>
                  <div className="flex items-center gap-2" aria-busy="true" aria-live="polite">
                    <Spinner size="sm" />
                    <div className="h-3 w-24 animate-pulse rounded bg-default-200" />
                  </div>
                  <div className="h-8 w-16 animate-pulse rounded bg-default-200" />
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <Icon size={20} className={card.iconColor} aria-hidden="true" />
                    <span className="text-sm text-default-500">{card.label}</span>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold" aria-label={`${card.label}: ${card.value}`}>
                      {card.value}
                    </span>
                    {card.subtitle && (
                      <span className="pb-1 text-xs text-default-500">
                        {card.subtitle}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
};
