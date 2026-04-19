import { useEffect, useState } from 'react';
import { membershipsApi, type Membership } from '../../api/membershipsApi';
import { Spin } from 'antd';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

export function ClientMembershipsPage() {
    const [memberships, setMemberships] = useState<Membership[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMemberships = async () => {
            try {
                const data = await membershipsApi.getAll();
                // Sort by points to display tiers correctly
                const active = data.filter((m: Membership) => m.isActive).sort((a: Membership, b: Membership) => (a.minPoints || 0) - (b.minPoints || 0));
                setMemberships(active);
            } catch (error) {
                toast.error('Failed to load memberships');
            } finally {
                setLoading(false);
            }
        };
        fetchMemberships();
    }, []);

    const renderTierCard = (membership: Membership, index: number) => {
        const isPremium = index === memberships.length - 1; // Highlight the top tier
        
        return (
            <div 
                key={membership.id} 
                className={`relative rounded-3xl p-8 transition-transform duration-500 hover:-translate-y-2 ${
                    isPremium 
                    ? 'bg-gradient-to-b from-cyan-900 to-slate-900 text-white shadow-2xl shadow-cyan-900/40 border border-cyan-800' 
                    : 'bg-white text-slate-900 border border-slate-200 shadow-xl shadow-slate-200/50'
                }`}
            >
                {isPremium && (
                    <div className="absolute top-0 right-10 transform -translate-y-1/2">
                        <span className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white text-xs font-bold uppercase tracking-wider py-1 px-4 rounded-full shadow-lg">
                            Most Popular
                        </span>
                    </div>
                )}
                
                <h3 className={`text-3xl font-bold mb-2 ${isPremium ? 'text-white' : 'text-slate-900'}`}>
                    {membership.tierName}
                </h3>
                <p className={`text-sm mb-8 ${isPremium ? 'text-cyan-200' : 'text-slate-500'}`}>
                    Unlock exclusive privileges and rewards.
                </p>
                
                <div className="mb-8">
                    <span className="text-4xl font-bold">{membership.discountPercent}%</span>
                    <span className={`ml-2 font-medium ${isPremium ? 'text-cyan-200' : 'text-slate-500'}`}>Discount</span>
                </div>
                
                <ul className="space-y-4 mb-8">
                    <li className="flex items-start gap-3">
                        <CheckCircleIcon className={`w-6 h-6 shrink-0 ${isPremium ? 'text-cyan-400' : 'text-cyan-600'}`} />
                        <span className={isPremium ? 'text-slate-200' : 'text-slate-700'}>
                            Requires {membership.minPoints?.toLocaleString() || 0} accumulated points
                        </span>
                    </li>
                    <li className="flex items-start gap-3">
                        <CheckCircleIcon className={`w-6 h-6 shrink-0 ${isPremium ? 'text-cyan-400' : 'text-cyan-600'}`} />
                        <span className={isPremium ? 'text-slate-200' : 'text-slate-700'}>
                            Priority room upgrades (subject to availability)
                        </span>
                    </li>
                    <li className="flex items-start gap-3">
                        <CheckCircleIcon className={`w-6 h-6 shrink-0 ${isPremium ? 'text-cyan-400' : 'text-cyan-600'}`} />
                        <span className={isPremium ? 'text-slate-200' : 'text-slate-700'}>
                            Late check-out options
                        </span>
                    </li>
                    {isPremium && (
                        <li className="flex items-start gap-3">
                            <CheckCircleIcon className={`w-6 h-6 shrink-0 text-cyan-400`} />
                            <span className="text-slate-200">
                                Complimentary Spa access and airport transfers
                            </span>
                        </li>
                    )}
                </ul>
                
                <button 
                    onClick={() => toast.success(`More details for ${membership.tierName} will be sent to you shortly!`)}
                    className={`w-full py-4 rounded-xl font-bold transition-colors ${
                        isPremium 
                        ? 'bg-cyan-500 hover:bg-cyan-400 text-white shadow-lg shadow-cyan-500/30' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200'
                    }`}
                >
                    Learn More
                </button>
            </div>
        );
    };

    return (
        <div className="w-full bg-slate-50 min-h-screen">
            {/* Header Banner */}
            <div className="bg-slate-900 py-20 text-center text-white px-4 relative overflow-hidden">
                 <div className="absolute top-0 right-1/4 w-[40rem] h-[40rem] bg-indigo-600/10 rounded-full mix-blend-screen filter blur-3xl opacity-50" />
                 <div className="absolute bottom-0 left-1/4 w-[30rem] h-[30rem] bg-cyan-600/10 rounded-full mix-blend-screen filter blur-3xl opacity-50" />
                 
                 <div className="relative z-10 max-w-3xl mx-auto">
                    <span className="text-cyan-400 font-semibold tracking-widest uppercase text-sm mb-4 block">Grandeur Club</span>
                    <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">Elevate Your Stay</h1>
                    <p className="text-slate-300 text-lg">
                        Join our exclusive membership tiers to enjoy unparalleled benefits, dedicated services, and significant savings on every visit.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 -mt-10 relative z-20">
                {loading ? (
                    <div className="flex justify-center py-20 bg-white rounded-3xl shadow-xl">
                        <Spin size="large" />
                    </div>
                ) : memberships.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl shadow-xl border border-slate-100">
                        <p className="text-xl text-slate-500">Membership tiers are currently being updated.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-center">
                        {memberships.map((membership, index) => renderTierCard(membership, index))}
                    </div>
                )}
            </div>
            
            {/* Info Section */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 text-center">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">How it works</h2>
                <p className="text-slate-600">
                    Earn points automatically with every booking you make through our official portal. 
                    Your tier is calculated based on total points accumulated over your lifetime. 
                    No renewals, no hidden fees—just pure luxury.
                </p>
            </div>
        </div>
    );
}
