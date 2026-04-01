import { Link } from 'react-router-dom';

export const ForbiddenPage = () => {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(8,145,178,0.35),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(14,116,144,0.3),transparent_30%),radial-gradient(circle_at_50%_80%,rgba(15,23,42,0.55),transparent_45%)]" />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-700/60 bg-slate-900/90 p-8 text-center shadow-xl">
        <p className="text-5xl font-bold text-cyan-300">403</p>
        <h1 className="mt-3 text-xl font-semibold text-white">Permission Required</h1>
        <p className="mt-2 text-sm text-slate-300">Your account does not have permission to access this feature.</p>
        <Link
          to="/admin/dashboard"
          className="mt-6 inline-flex rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
};
