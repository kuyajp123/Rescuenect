import { GoogleButton } from '@/components/ui/button';
import { useAuth } from '@/components/stores/useAuth';
import { Navigate } from "react-router-dom";
import { useErrorStore } from '@/components/stores/useErrorMessage';

const Login = () => {
  const userAuth = useAuth((state) => state.auth);
  const isLoading = useAuth((state) => state.isLoading);
  const error = useErrorStore((state) => state.message);
  
  // Show loading while Firebase is checking auth state
  if (isLoading) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    );
  }

  if (userAuth) {
    return <Navigate to="/" replace />;
  }
  
  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-4xl dark:text-white/90 sm:text-title-md">
              Sign In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Sign in to your account to continue
            </p>
          </div>
          <div>
            <div className="grid grid-cols-1 gap-3 ">
              <GoogleButton />
            </div>
            <br />
            <div className='text-red-500 flex justify-center'>
              {error && <p>{error}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login