// components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/components/stores/useAuth';

type Props = {
  children: React.ReactNode;
};

export default function ProtectedRoute({ children }: Props) {
  const userAuth = useAuth((state) => state.auth);
  const isLoading = useAuth((state) => state.isLoading);

  // Show loading spinner while Firebase is checking auth state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return userAuth ? children : <Navigate to="/auth/login" replace />;
}
