import { Loading } from '@/components/ui/LazyLoading/Loading';
import { AccessUnavailable } from '@/security/AccessUnavailable';
import { useAuth } from '@/stores/useAuth';
import { Navigate, useLocation } from 'react-router-dom';

type Props = {
  children: React.ReactNode;
};

export default function ProtectedRoute({ children }: Props) {
  const userAuth = useAuth(state => state.auth);
  const userData = useAuth(state => state.userData);
  const accessIssue = useAuth(state => state.accessIssue);
  const isLoading = useAuth(state => state.isLoading);
  const isVerifying = useAuth(state => state.isVerifying);
  const location = useLocation();

  // Show branded loading spinner while Firebase OR backend is verifying
  if (isLoading || isVerifying) {
    return <Loading />;
  }

  // 1. Not authenticated -> Login
  if (!userAuth) {
    return <Navigate to="/home" replace />;
  }

  if (accessIssue) {
    return <AccessUnavailable issue={accessIssue} />;
  }

  const isOnboardingRoute = ['/Welcome', '/address-setup', '/info-setup'].includes(location.pathname);

  // 2. Authenticated but Incomplete Onboarding
  if (userData && !userData.onboardingComplete) {
    if (!isOnboardingRoute) {
      // Redirect to Welcome if attempting to access dashboard
      return <Navigate to="/Welcome" replace />;
    }
    // Allow access to onboarding routes
    return children;
  }

  // 3. Authenticated AND Complete Onboarding
  if (userData && userData.onboardingComplete) {
    if (isOnboardingRoute) {
      // Redirect to Dashboard if attempting to access onboarding
      return <Navigate to="/" replace />;
    }
    if (userData.role === 'super_admin' && location.pathname === '/') {
      return <Navigate to="/super" replace />;
    }
    if (userData.role !== 'super_admin' && location.pathname.startsWith('/super')) {
      return <Navigate to="/" replace />;
    }
    return children;
  }

  return <Navigate to="/home" replace />;
}
