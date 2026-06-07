import { auth as firebaseAuth } from '@/lib/firebaseConfig';
import type { AuthAccessIssue } from '@/stores/useAuth';
import { useAuth } from '@/stores/useAuth';
import { LogOut, RefreshCw, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const notFoundImage = '/images/empty-page/404-image.png';

type AccessUnavailableProps = {
  issue: NonNullable<AuthAccessIssue>;
};

const contentByCode = {
  admin_inactive: {
    title: 'Admin account is inactive',
    description:
      'Your admin account is currently disabled. Contact the Super Admin if you need this access restored.',
    label: 'Account inactive',
    code: '403',
  },
  client_inactive: {
    title: 'LGU client access is paused',
    description:
      'Your LGU client is not active or was removed, so the dashboard is closed until Super Admin restores the client.',
    label: 'Client inactive',
    code: '403',
  },
  admin_denied: {
    title: 'Admin access is unavailable',
    description: 'This Google account is not currently allowed to access Rescuenect Admin.',
    label: 'Access unavailable',
    code: '403',
  },
  unauthorized: {
    title: 'Session expired',
    description: 'Your session is no longer valid. Please sign in again.',
    label: 'Session expired',
    code: '401',
  },
};

export const AccessUnavailable = ({ issue }: AccessUnavailableProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuth(state => state.setAuth);
  const setUserData = useAuth(state => state.setUserData);
  const setAccessIssue = useAuth(state => state.setAccessIssue);
  const syncUserData = useAuth(state => state.syncUserData);
  const content = contentByCode[issue.code] ?? contentByCode.admin_denied;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await syncUserData({ silent: true });
    setIsRefreshing(false);
  };

  const handleSignOut = async () => {
    await firebaseAuth.signOut();
    setAuth(null);
    setUserData(null);
    setAccessIssue(null);
    navigate('/home', { replace: true });
  };

  return (
    <main className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-cyan-50 px-6 py-12 transition-colors duration-300 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <div className="absolute left-10 top-10 h-32 w-32 rounded-full bg-indigo-200/40 blur-3xl dark:bg-indigo-600/20" />
      <div className="absolute bottom-10 right-10 h-40 w-40 rounded-full bg-cyan-200/50 blur-3xl dark:bg-cyan-500/20" />
      <div className="absolute right-1/4 top-20 h-24 w-24 rounded-full bg-purple-200/40 blur-2xl dark:bg-purple-500/20" />

      <section className="relative z-10 grid w-full max-w-6xl items-center gap-10 rounded-[2rem] border border-white/70 bg-white/80 p-8 shadow-2xl shadow-indigo-100/60 backdrop-blur transition-colors duration-300 md:grid-cols-2 md:p-14 dark:border-white/10 dark:bg-slate-900/75 dark:shadow-black/30">
        <div className="text-center md:text-left">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-2 text-sm font-semibold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
            <ShieldAlert size={16} />
            {content.label}
          </p>

          <h1 className="text-8xl font-black tracking-tight text-indigo-950 md:text-9xl dark:text-indigo-100">
            {content.code}
          </h1>

          <h2 className="mt-4 text-2xl font-bold text-slate-900 md:text-3xl dark:text-white">{content.title}</h2>

          <p className="mt-4 max-w-md text-base leading-7 text-slate-600 md:text-lg dark:text-slate-300">
            {content.description}
          </p>

          <div className="mt-5 max-w-md rounded-2xl border border-indigo-100 bg-indigo-50/80 px-4 py-3 text-sm font-medium text-indigo-900 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-100">
            Current status: {issue.message}
          </div>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row md:items-start">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-indigo-500 dark:shadow-indigo-950/50 dark:hover:bg-indigo-400 dark:focus:ring-indigo-500/40"
            >
              <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
              Refresh status
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <LogOut size={18} />
              Log out
            </button>
          </div>
        </div>

        <div className="relative mx-auto flex h-80 w-full max-w-md items-center justify-center">
          <div className="relative rounded-[2rem] p-6">
            <img
              src={notFoundImage}
              alt="Access unavailable"
              className="h-110 w-auto object-contain drop-shadow-2xl dark:brightness-90 dark:contrast-110"
            />
          </div>

          <div className="absolute left-6 top-8 h-5 w-5 rounded-full bg-indigo-300 dark:bg-indigo-400/70" />
          <div className="absolute right-10 top-10 h-3 w-3 rounded-full bg-cyan-300 dark:bg-cyan-400/70" />
          <div className="absolute bottom-8 left-14 h-4 w-4 rounded-full bg-purple-300 dark:bg-purple-400/70" />
          <div className="absolute bottom-14 right-4 h-6 w-6 rounded-full bg-indigo-200 dark:bg-indigo-500/50" />
        </div>
      </section>
    </main>
  );
};
