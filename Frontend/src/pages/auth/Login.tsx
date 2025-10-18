import { GoogleButton } from '@/components/ui/button';
import { useAuth } from '@/stores/useAuth';
import { Navigate } from 'react-router-dom';
import { useErrorStore } from '@/stores/useErrorMessage';

const Login = () => {
  const userAuth = useAuth(state => state.auth);
  const isVerifying = useAuth(state => state.isVerifying);
  const error = useErrorStore(state => state.message);

  // Only redirect if user is authenticated AND not currently verifying
  if (userAuth && !isVerifying) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-4xl dark:text-white/90 sm:text-title-md">Sign In</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Sign in to your account to continue</p>
          </div>
          <div>
            <div className="grid grid-cols-1 gap-3 ">
              <GoogleButton />
            </div>
            <br />
            <div className="text-red-500 flex justify-center">{error && <p>{error}</p>}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
