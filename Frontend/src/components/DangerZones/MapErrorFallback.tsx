import { Button } from '@heroui/react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface MapErrorFallbackProps {
  error?: Error;
  errorInfo?: React.ErrorInfo;
  onRetry?: () => void;
}

/**
 * MapErrorFallback Component
 * 
 * Displays a user-friendly error message when the map component fails to render.
 * Provides a retry button to attempt recovery (typically by reloading the page).
 * 
 * Features:
 * - Clear error message with icon
 * - Retry button that reloads the page or resets state
 * - Shows error details in development mode
 * - Uses HeroUI components for consistent styling
 * - Maintains map container dimensions to prevent layout shift
 * 
 * **Validates: Requirements 12.1, 12.2**
 * 
 * @example
 * ```tsx
 * <ErrorBoundary fallback={(error, errorInfo, reset) => (
 *   <MapErrorFallback 
 *     error={error} 
 *     errorInfo={errorInfo} 
 *     onRetry={() => window.location.reload()} 
 *   />
 * )}>
 *   <AdminDangerZoneMap {...mapProps} />
 * </ErrorBoundary>
 * ```
 */
export const MapErrorFallback = ({ error, errorInfo, onRetry }: MapErrorFallbackProps) => {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      // Default: reload the page
      window.location.reload();
    }
  };

  return (
    <div className="flex h-full min-h-[640px] w-full items-center justify-center rounded-lg border border-default-200 bg-content1 p-8">
      <div className="max-w-md text-center">
        {/* Error Icon */}
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-danger-100 p-4">
            <AlertTriangle size={48} className="text-danger-600" aria-hidden="true" />
          </div>
        </div>

        {/* Error Title */}
        <h2 className="mb-2 text-xl font-semibold text-foreground">
          Map Failed to Load
        </h2>

        {/* Error Message */}
        <p className="mb-4 text-sm text-default-500">
          {error?.message || 'The map component encountered an error and could not be displayed.'}
        </p>

        {/* Development Error Details */}
        {process.env.NODE_ENV === 'development' && error && (
          <details className="mb-4 rounded-md border border-danger-200 bg-danger-50 p-3 text-left">
            <summary className="cursor-pointer text-xs font-medium text-danger-700">
              Error Details (Development Only)
            </summary>
            <div className="mt-2 max-h-48 overflow-auto">
              <pre className="text-xs text-danger-600">
                {error.stack}
              </pre>
              {errorInfo && (
                <>
                  <p className="mt-2 text-xs font-semibold text-danger-700">Component Stack:</p>
                  <pre className="text-xs text-danger-600">
                    {errorInfo.componentStack}
                  </pre>
                </>
              )}
            </div>
          </details>
        )}

        {/* Retry Button */}
        <Button
          color="primary"
          variant="solid"
          onPress={handleRetry}
          startContent={<RefreshCw size={18} aria-hidden="true" />}
          aria-label="Retry loading map"
        >
          Retry
        </Button>

        {/* Help Text */}
        <p className="mt-4 text-xs text-default-400">
          If the problem persists, try refreshing the page or contact support.
        </p>
      </div>
    </div>
  );
};
