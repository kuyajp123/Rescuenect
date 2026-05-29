import { AccessUnavailable } from '@/security/AccessUnavailable';
import { GoogleButton } from '@/components/ui/button';
import { useAuth } from '@/stores/useAuth';
import { useErrorStore } from '@/stores/useErrorMessage';
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
  const userAuth = useAuth(state => state.auth);
  const accessIssue = useAuth(state => state.accessIssue);
  const isVerifying = useAuth(state => state.isVerifying);
  const error = useErrorStore(state => state.message);
  const setError = useErrorStore(state => state.setError);
  const navigate = useNavigate();

  useEffect(() => {
    if (userAuth && !isVerifying && !accessIssue) {
      navigate('/');
    }
  }, [userAuth, isVerifying, accessIssue, navigate]);

  useEffect(() => {
    return () => {
      setError('');
    };
  }, [setError]);

  if (userAuth && accessIssue) {
    return <AccessUnavailable issue={accessIssue} />;
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
            <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
              LGU client?{' '}
              <Link className="font-medium text-primary hover:underline" to="/request-access">
                Request Rescuenect access
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
