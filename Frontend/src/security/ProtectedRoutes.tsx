// components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/stores/useAuth';

type Props = {
  children: React.ReactNode;
};

export default function ProtectedRoute({ children }: Props) {
  const userAuth = useAuth(state => state.auth);
  const isLoading = useAuth(state => state.isLoading);
  const isVerifying = useAuth(state => state.isVerifying);

  // Show loading spinner while Firebase OR backend is verifying
  if (isLoading || isVerifying) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        <p className="mt-4 text-gray-600">{isVerifying ? 'Verifying account...' : 'Loading...'}</p>
      </div>
    );
  }

  // Only allow access if user is authenticated AND not currently verifying
  return userAuth && !isVerifying ? children : <Navigate to="/auth/login" replace />;
}
