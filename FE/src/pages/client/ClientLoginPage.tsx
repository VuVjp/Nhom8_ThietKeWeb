import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export function ClientLoginPage() {
    const navigate = useNavigate();
    const [credentials, setCredentials] = useState({ email: '', password: '' });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!credentials.email || !credentials.password) {
            toast.error('Please enter email and password');
            return;
        }
        
        toast.promise(
            new Promise(resolve => setTimeout(resolve, 800)),
            {
                loading: 'Authenticating...',
                success: 'Login Successful!',
                error: 'Login failed',
            }
        ).then(() => {
            // Mock authentication success
            localStorage.setItem('client_auth_mock', 'true');
            navigate('/account');
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden pt-[88px]">
            {/* Background Image Setup */}
            <div className="absolute inset-0 z-0">
                <img 
                    src="https://images.unsplash.com/photo-1551882547-ff40c0d129df?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" 
                    alt="Background" 
                    className="w-full h-full object-cover filter blur-sm scale-105 opacity-50"
                />
                <div className="absolute inset-0 bg-slate-900/40" />
            </div>

            <div className="relative z-10 w-full max-w-md px-6 my-12">
                <div className="bg-white/95 backdrop-blur-xl p-10 rounded-2xl shadow-2xl border border-white/50">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Welcome Back</h2>
                        <p className="text-sm text-slate-500 uppercase tracking-widest">Sign in to your account</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Email Address</label>
                            <input 
                                type="email" 
                                name="email" 
                                value={credentials.email} 
                                onChange={handleChange} 
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none" 
                                placeholder="name@example.com"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Password</label>
                                <a href="#" className="text-xs text-cyan-600 hover:text-cyan-500 font-semibold" onClick={(e) => { e.preventDefault(); toast('Forgot password feature coming soon'); }}>Forgot Password?</a>
                            </div>
                            <input 
                                type="password" 
                                name="password" 
                                value={credentials.password} 
                                onChange={handleChange} 
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none" 
                                placeholder="••••••••"
                            />
                        </div>

                        <button type="submit" className="w-full py-4 bg-slate-900 hover:bg-cyan-600 text-white rounded-xl font-bold uppercase tracking-widest text-sm transition-colors shadow-lg mt-8">
                            Sign In
                        </button>
                    </form>

                    <div className="mt-8 text-center text-sm text-slate-600">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-cyan-600 font-bold hover:text-cyan-500 hover:underline">
                            Create one
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
