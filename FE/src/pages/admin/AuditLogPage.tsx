import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
    ArrowPathIcon,
    MagnifyingGlassIcon,
    ClipboardDocumentListIcon,
    FunnelIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { Table } from '../../components/Table';
import { Pagination } from '../../components/Pagination';
import { Input } from '../../components/Input';
import { Select } from '../../components/Select';
import { toApiError } from '../../api/httpClient';
import { auditLogApi } from '../../api/auditLogApi';
import type { AuditLog } from '../../api/auditLogApi';
import { paginate, queryIncludes } from '../../utils/table';

const ACTION_COLORS: Record<string, { bg: string; text: string }> = {
    Create:       { bg: 'bg-emerald-100', text: 'text-emerald-800' },
    Update:       { bg: 'bg-cyan-100',    text: 'text-cyan-800'    },
    Delete:       { bg: 'bg-red-100',     text: 'text-red-800'     },
    Login:        { bg: 'bg-blue-100',    text: 'text-blue-800'    },
    Logout:       { bg: 'bg-slate-100',   text: 'text-slate-600'   },
    StatusChange: { bg: 'bg-amber-100',   text: 'text-amber-800'   },
    Other:        { bg: 'bg-violet-100',  text: 'text-violet-800'  },
};

function ActionBadge({ action }: { action: string }) {
    const style = ACTION_COLORS[action] ?? ACTION_COLORS['Other'];
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.bg} ${style.text}`}>
            {action}
        </span>
    );
}

function formatDateTime(iso: string) {
    try {
        return new Intl.DateTimeFormat('vi-VN', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
        }).format(new Date(iso));
    } catch {
        return iso;
    }
}

const PAGE_SIZE = 15;
const ACTION_OPTIONS = ['All', 'Create', 'Update', 'Delete', 'Login', 'Logout', 'StatusChange', 'Other'];

export function AuditLogPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [actionFilter, setActionFilter] = useState('All');
    const [entityFilter, setEntityFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [page, setPage] = useState(1);

    const loadLogs = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await auditLogApi.getAll();
            setLogs(data || []);
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to load audit logs');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadLogs();
    }, [loadLogs]);

    // Reset page whenever filters change
    useEffect(() => {
        setPage(1);
    }, [searchQuery, actionFilter, entityFilter, dateFrom, dateTo]);

    const entityTypes = useMemo(() => {
        const unique = new Set(logs.map((l) => l.entityType).filter(Boolean));
        return ['All', ...Array.from(unique).sort()];
    }, [logs]);

    const filtered = useMemo(() => {
        return logs.filter((log) => {
            const matchSearch =
                !searchQuery.trim() ||
                queryIncludes(log.userName ?? '', searchQuery) ||
                queryIncludes(log.userEmail ?? '', searchQuery) ||
                queryIncludes(log.description ?? '', searchQuery);

            const matchAction  = actionFilter === 'All' || log.action === actionFilter;
            const matchEntity  = entityFilter === 'All' || !entityFilter || log.entityType === entityFilter;

            const logDate = new Date(log.createdAt);
            const matchFrom = !dateFrom || logDate >= new Date(dateFrom);
            const matchTo   = !dateTo   || logDate <= new Date(dateTo + 'T23:59:59');

            return matchSearch && matchAction && matchEntity && matchFrom && matchTo;
        });
    }, [logs, searchQuery, actionFilter, entityFilter, dateFrom, dateTo]);

    const paged = paginate(filtered, page, PAGE_SIZE);

    const clearFilters = () => {
        setSearchQuery('');
        setActionFilter('All');
        setEntityFilter('');
        setDateFrom('');
        setDateTo('');
    };

    const hasActiveFilter = searchQuery || actionFilter !== 'All' || entityFilter || dateFrom || dateTo;

    const columns = [
        {
            key: 'createdAt',
            label: 'Time',
            render: (row: AuditLog) => (
                <span className="whitespace-nowrap text-xs text-slate-500">
                    {formatDateTime(row.createdAt)}
                </span>
            ),
        },
        {
            key: 'user',
            label: 'User',
            render: (row: AuditLog) => (
                <div>
                    <p className="text-sm font-medium text-slate-800">{row.userName || '—'}</p>
                    <p className="text-xs text-slate-400">{row.userEmail || ''}</p>
                </div>
            ),
        },
        {
            key: 'action',
            label: 'Action',
            render: (row: AuditLog) => <ActionBadge action={row.action} />,
        },
        {
            key: 'entityType',
            label: 'Entity',
            render: (row: AuditLog) => (
                <div className="text-xs">
                    <span className="font-semibold text-slate-700">{row.entityType || '—'}</span>
                    {row.entityId && (
                        <span className="ml-1 text-slate-400">#{row.entityId}</span>
                    )}
                </div>
            ),
        },
        {
            key: 'description',
            label: 'Description',
            render: (row: AuditLog) => (
                <p className="max-w-xs truncate text-sm text-slate-600" title={row.description}>
                    {row.description || '—'}
                </p>
            ),
        },
        {
            key: 'ipAddress',
            label: 'IP Address',
            render: (row: AuditLog) => (
                <span className="font-mono text-xs text-slate-400">{row.ipAddress || '—'}</span>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Audit Log</h2>
                    <p className="text-sm text-slate-500">Track all system activities and user actions.</p>
                </div>
                <button
                    onClick={() => void loadLogs()}
                    className="p-2 text-slate-500 hover:text-cyan-600 transition bg-white border border-slate-200 rounded-xl"
                    title="Refresh"
                >
                    <ArrowPathIcon className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                    { label: 'Total Logs',   value: logs.length,                                     color: 'text-slate-800' },
                    { label: 'Filtered',     value: filtered.length,                                 color: 'text-cyan-700'  },
                    { label: 'Actions Today',value: logs.filter(l => new Date(l.createdAt).toDateString() === new Date().toDateString()).length, color: 'text-emerald-700' },
                    { label: 'Unique Users', value: new Set(logs.map(l => l.userId)).size,           color: 'text-amber-700' },
                ].map((stat) => (
                    <div key={stat.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-xs font-medium text-slate-400">{stat.label}</p>
                        <p className={`mt-1 text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                    <FunnelIcon className="h-4 w-4 text-slate-400" />
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Filters</span>
                    {hasActiveFilter && (
                        <button
                            onClick={clearFilters}
                            className="ml-auto inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-500 hover:bg-slate-50 transition"
                        >
                            <XMarkIcon className="h-3 w-3" /> Clear all
                        </button>
                    )}
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                    <div className="relative xl:col-span-2">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                            placeholder="Search by user, email or description..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
                        {ACTION_OPTIONS.map((a) => (
                            <option key={a} value={a}>{a === 'All' ? 'All Actions' : a}</option>
                        ))}
                    </Select>
                    <Select value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)}>
                        {entityTypes.map((t) => (
                            <option key={t} value={t === 'All' ? '' : t}>{t === 'All' ? 'All Entities' : t}</option>
                        ))}
                    </Select>
                    <div className="grid grid-cols-2 gap-2">
                        <Input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            placeholder="From"
                        />
                        <Input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            placeholder="To"
                        />
                    </div>
                </div>
                <p className="mt-3 text-xs text-slate-400">
                    Showing <span className="font-semibold text-slate-600">{filtered.length}</span> / {logs.length} records
                </p>
            </div>

            {/* Table */}
            {isLoading ? (
                <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
                    <ClipboardDocumentListIcon className="mx-auto mb-3 h-10 w-10 text-slate-300 animate-pulse" />
                    <p className="text-sm text-slate-400">Loading audit logs...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
                    <ClipboardDocumentListIcon className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                    <p className="text-sm font-medium text-slate-500">No audit logs found</p>
                    {hasActiveFilter && (
                        <p className="mt-1 text-xs text-slate-400">Try adjusting your filters.</p>
                    )}
                </div>
            ) : (
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden p-4">
                    <Table columns={columns} rows={paged} />
                    <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />
                </div>
            )}
        </div>
    );
}
