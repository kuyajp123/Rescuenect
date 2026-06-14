import React, { Component, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, errorInfo: React.ErrorInfo, resetError: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * ErrorBoundary Component
 * 
 * React class component that catches JavaScript errors anywhere in the child component tree.
 * Logs error details and displays a fallback UI instead of crashing the entire app.
 * 
 * Features:
 * - Catches rendering errors, lifecycle errors, and constructor errors
 * - Provides error reset functionality to attempt recovery
 * - Accepts custom fallback render function
 * - Logs errors to console in development mode
 * - Optional error callback for error tracking services
 * 
 * **Validates: Requirements 12.1, 12.2**
 * 
 * @example
 * ```tsx
 * <ErrorBoundary fallback={(error, errorInfo, reset) => (
 *   <div>
 *     <p>Something went wrong: {error.message}</p>
 *     <button onClick={reset}>Try Again</button>
 *   </div>
 * )}>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error details to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error);
      console.error('Error component stack:', errorInfo.componentStack);
    }

    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Call optional error callback (can be used for error tracking services)
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      // Render custom fallback if provided
      if (fallback && errorInfo) {
        return fallback(error, errorInfo, this.resetError);
      }

      // Default fallback UI
      return (
        <div className="flex h-full w-full items-center justify-center p-8">
          <div className="max-w-md rounded-lg border border-danger-200 bg-danger-50 p-6 text-center">
            <h2 className="mb-2 text-xl font-semibold text-danger-700">Something went wrong</h2>
            <p className="mb-4 text-sm text-danger-600">
              {error.message || 'An unexpected error occurred'}
            </p>
            {process.env.NODE_ENV === 'development' && errorInfo && (
              <details className="mb-4 rounded-md bg-danger-100 p-3 text-left">
                <summary className="cursor-pointer text-xs font-medium text-danger-700">
                  Error Details (Development Only)
                </summary>
                <pre className="mt-2 max-h-48 overflow-auto text-xs text-danger-600">
                  {error.stack}
                  {'\n\n'}
                  {errorInfo.componentStack}
                </pre>
              </details>
            )}
            <button
              onClick={this.resetError}
              className="rounded-md bg-danger-600 px-4 py-2 text-sm font-medium text-white hover:bg-danger-700 focus:outline-none focus:ring-2 focus:ring-danger-500 focus:ring-offset-2"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return children;
  }
}
