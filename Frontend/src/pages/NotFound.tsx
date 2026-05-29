import { Home } from 'lucide-react';
import { Link } from 'react-router-dom';

const notFoundImage = '/images/empty-page/404-image.png';

export const NotFound = () => {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-cyan-50 px-6 py-12 transition-colors duration-300 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      {/* Background decoration */}
      <div className="absolute left-10 top-10 h-32 w-32 rounded-full bg-indigo-200/40 blur-3xl dark:bg-indigo-600/20" />
      <div className="absolute bottom-10 right-10 h-40 w-40 rounded-full bg-cyan-200/50 blur-3xl dark:bg-cyan-500/20" />
      <div className="absolute right-1/4 top-20 h-24 w-24 rounded-full bg-purple-200/40 blur-2xl dark:bg-purple-500/20" />

      <section className="relative z-10 grid w-full max-w-6xl items-center gap-10 rounded-[2rem] border border-white/70 bg-white/80 p-8 shadow-2xl shadow-indigo-100/60 backdrop-blur transition-colors duration-300 md:grid-cols-2 md:p-14 dark:border-white/10 dark:bg-slate-900/75 dark:shadow-black/30">
        {/* Text content */}
        <div className="text-center md:text-left">
          <p className="mb-3 inline-flex rounded-full bg-indigo-100 px-4 py-2 text-sm font-semibold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
            Page not found
          </p>

          <h1 className="text-8xl font-black tracking-tight text-indigo-950 md:text-9xl dark:text-indigo-100">404</h1>

          <h2 className="mt-4 text-2xl font-bold text-slate-900 md:text-3xl dark:text-white">
            Oops! You seem to be lost.
          </h2>

          <p className="mt-4 max-w-md text-base leading-7 text-slate-600 md:text-lg dark:text-slate-300">
            The page you’re looking for may have been moved, deleted, or never existed in the first place.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row md:items-start">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 dark:bg-indigo-500 dark:shadow-indigo-950/50 dark:hover:bg-indigo-400 dark:focus:ring-indigo-500/40"
            >
              <Home size={18} />
              Back to Home
            </Link>

            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Return safely
            </Link>
          </div>
        </div>

        {/* Illustration */}
        <div className="relative mx-auto flex h-80 w-full max-w-md items-center justify-center">
          <div className="relative rounded-[2rem] p-6">
            <img
              src={notFoundImage}
              alt="404 Not Found"
              className="h-110 w-auto object-contain drop-shadow-2xl dark:brightness-90 dark:contrast-110"
            />
          </div>

          {/* Floating bubbles */}
          <div className="absolute left-6 top-8 h-5 w-5 rounded-full bg-indigo-300 dark:bg-indigo-400/70" />
          <div className="absolute right-10 top-10 h-3 w-3 rounded-full bg-cyan-300 dark:bg-cyan-400/70" />
          <div className="absolute bottom-8 left-14 h-4 w-4 rounded-full bg-purple-300 dark:bg-purple-400/70" />
          <div className="absolute bottom-14 right-4 h-6 w-6 rounded-full bg-indigo-200 dark:bg-indigo-500/50" />
        </div>
      </section>
    </main>
  );
};
