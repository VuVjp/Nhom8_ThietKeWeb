import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Input } from '../../components/Input';
import { useAppAuth } from '../../auth/useAppAuth';

interface LoginLocationState {
    from?: {
        pathname?: string;
    };
}

export function AdminLoginPage() {
    const { login, isAuthenticated, isAuthReady } = useAppAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as LoginLocationState | null;
    const rawRedirectPath = state?.from?.pathname ?? '/admin';
    const redirectPath = rawRedirectPath.startsWith('/admin') ? rawRedirectPath : '/admin';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isAuthReady) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-950 text-sm text-slate-300">
                Loading authentication...
            </div>
        );
    }

    if (isAuthenticated) {
        return <Navigate to="/admin" replace />;
    }

    const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (isSubmitting) {
            return;
        }

        setIsSubmitting(true);
        const ok = await login(email, password);
        setIsSubmitting(false);

        if (!ok) {
            toast.error('Invalid credentials');
            return;
        }

        toast.success('Login successful');
        navigate(redirectPath, { replace: true });
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(8,145,178,0.35),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(14,116,144,0.3),transparent_30%),radial-gradient(circle_at_50%_80%,rgba(15,23,42,0.55),transparent_45%)]" />

            <div className="relative z-10 w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-900/90 shadow-2xl shadow-cyan-900/20 backdrop-blur-xl lg:grid lg:grid-cols-[1.15fr_0.85fr]">
                <div className="space-y-5 border-b border-slate-700/60 p-8 lg:border-b-0 lg:border-r lg:p-10">
                    <p className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-200">
                        Celestia Grand
                    </p>
                    <h1 className="text-3xl font-semibold leading-tight text-white">Admin Command Center</h1>
                    <p className="max-w-md text-sm text-slate-300">
                        Sign in to access room operations, inventory controls, and role-based management screens.
                    </p>

                    <div className="rounded-2xl border border-slate-700/60 bg-slate-800/70 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">Secure access</p>
                        <p className="mt-2 text-xs text-slate-300">Use your real admin account credentials to continue.</p>
                    </div>
                </div>

                <form onSubmit={onSubmit} className="space-y-4 p-8 lg:p-10">
                    <h2 className="text-xl font-semibold text-white">Sign In</h2>
                    <p className="text-sm text-slate-400">Permission checks are enforced immediately after authentication.</p>

                    <div className="space-y-1.5">
                        <label htmlFor="email" className="text-xs font-medium uppercase tracking-wide text-slate-300">
                            Email
                        </label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            className="border-slate-700 bg-slate-800 text-slate-950 placeholder:text-slate-500"
                            placeholder="your@email.com"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="password" className="text-xs font-medium uppercase tracking-wide text-slate-300">
                            Password
                        </label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            className="border-slate-700 bg-slate-800 text-slate-950 placeholder:text-slate-500"
                            placeholder="Enter password"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-500"
                    >
                        {isSubmitting ? 'Signing in...' : 'Continue to Admin'}
                    </button>
                </form>
            </div>
        </div>
    );
}
