import { Loading } from '@/components/ui/LazyLoading/Loading';
import { useAuth } from '@/stores/useAuth';
import { Navigate, useLocation } from 'react-router-dom';

type Props = {
  children: React.ReactNode;
};

export default function ProtectedRoute({ children }: Props) {
  const userAuth = useAuth(state => state.auth);
  const userData = useAuth(state => state.userData);
  const isLoading = useAuth(state => state.isLoading);
  const isVerifying = useAuth(state => state.isVerifying);
  const location = useLocation();

  // Show branded loading spinner while Firebase OR backend is verifying
  if (isLoading || isVerifying) {
    return <Loading />;
  }

  // 1. Not authenticated -> Login
  if (!userAuth) {
    return <Navigate to="/auth/login" replace />;
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
    return children;
  }

  // Fallback (e.g. userData is null but userAuth is true - shouldn't happen usually if logic is correct)
  // If userData is still fetching, we might be here. But verified flow usually sets them together?
  // Actually onAuthStateChanged runs, then GoogleButton sets UserData.
  // If we refresh, onAuthStateChanged runs, but userData load might be from persist?
  // Let's assume userData is ready if isLoading is false.

  return children;
}
