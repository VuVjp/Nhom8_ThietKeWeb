import { ChartBarIcon, HomeModernIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import { StatCard } from '../../components/StatCard';

export function DashboardPage() {
    return (
        <div className="space-y-5">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
                <p className="text-sm text-slate-500">Luxury operations overview with live-ready widgets.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <StatCard title="Revenue" value="$248,900" subtitle="+8.2% vs last month" />
                <StatCard title="Occupancy" value="82%" subtitle="Premium floor occupancy" />
                <StatCard title="Rooms" value="286" subtitle="Open inventory this week" />
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
                    <div className="flex items-center gap-2">
                        <ChartBarIcon className="h-5 w-5 text-cyan-700" />
                        <h3 className="font-semibold text-slate-800">Performance Chart</h3>
                    </div>
                    <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center text-sm text-slate-500">
                        Premium chart placeholder
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="font-semibold text-slate-800">Recent Activity</h3>
                    <ul className="mt-3 space-y-3 text-sm text-slate-600">
                        <li className="flex items-start gap-2"><HomeModernIcon className="mt-0.5 h-4 w-4" /> Room 1008 switched to Cleaning</li>
                        <li className="flex items-start gap-2"><BanknotesIcon className="mt-0.5 h-4 w-4" /> Loss record LS-211 approved</li>
                        <li className="flex items-start gap-2"><ChartBarIcon className="mt-0.5 h-4 w-4" /> Inventory stock synced manually</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
