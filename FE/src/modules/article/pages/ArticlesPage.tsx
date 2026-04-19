import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    PencilSquareIcon,
    PlusIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { Table } from '../../../components/Table';
import { Modal } from '../../../components/Modal';
import { Pagination } from '../../../components/Pagination';
import { Badge } from '../../../components/Badge';
import { usePermissionCheck } from '../../../hooks/usePermissionCheck';
import { useAppAuth } from '../../../auth/useAppAuth';
import { articleService } from '../services/articleService';
import { articleCategoryService } from '../services/articleCategoryService';
import { useArticleStore } from '../hooks/useArticleStore';
import { CategorySelect } from '../../../components/CategorySelect';
import { stripHtml } from '../utils/htmlUtils';
import { toApiError } from '../../../api/httpClient';
import type { ArticleCategory, ArticleItem } from '../types/article.types';

function CategoryListCell({ categories }: { categories: ArticleCategory[] }) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Filter out inactive categories from the table display
    const activeCategories = categories.filter(c => c.isActive);

    if (activeCategories.length === 0) {
        return <span className="text-xs text-slate-400">—</span>;
    }

    const maxVisible = 2;
    const showExpander = activeCategories.length > maxVisible;
    const visibleCategories = isExpanded ? activeCategories : activeCategories.slice(0, maxVisible);

    return (
        <div className="flex flex-wrap items-center gap-1">
            {visibleCategories.map((cat) => (
                <span
                    key={cat.id}
                    className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-xs font-medium text-cyan-700 max-w-[120px] truncate"
                    title={cat.name}
                >
                    {cat.name}
                </span>
            ))}
            {showExpander && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsExpanded(!isExpanded);
                    }}
                    className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 hover:bg-slate-200"
                >
                    {isExpanded ? 'Show less' : `+${categories.length - maxVisible} more`}
                </button>
            )}
        </div>
    );
}

export function ArticlesPage() {
    const navigate = useNavigate();
    const { ensure } = usePermissionCheck();
    const { hasPermission } = useAppAuth();
    const canManage = hasPermission('MANAGE_ARTICLES');

    // ── Granular Zustand selectors (avoids `store` object as dep) ──────────
    const rawData = useArticleStore((s) => s.rawData);
    const isLoading = useArticleStore((s) => s.isLoading);
    const page = useArticleStore((s) => s.page);
    const pageSize = useArticleStore((s) => s.pageSize);
    const filters = useArticleStore((s) => s.filters);
    const setPage = useArticleStore((s) => s.setPage);
    const setFilter = useArticleStore((s) => s.setFilter);
    const resetFilters = useArticleStore((s) => s.resetFilters);
    const [categories, setCategories] = useState<ArticleCategory[]>([]);
    const [statusTarget, setStatusTarget] = useState<ArticleItem | null>(null);
    const [isToggling, setIsToggling] = useState(false);

    // Local debounce state for search
    const [searchTerm, setSearchTerm] = useState(filters.search);

    // Handle debounced search changes
    useEffect(() => {
        const handler = setTimeout(() => {
            if (filters.search !== searchTerm) {
                setFilter('search', searchTerm);
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(handler);
    }, [searchTerm, filters.search, setFilter]);

    // ── Local Filtering & Pagination ─────────────────────────────────────────
    const filteredItems = rawData.filter((a) => {
        if (filters.search) {
            const s = filters.search.toLowerCase();
            const matchesSearch =
                a.title.toLowerCase().includes(s) ||
                a.authorName.toLowerCase().includes(s) ||
                String(a.id).includes(s);
            if (!matchesSearch) return false;
        }
        if (filters.categoryId != null) {
            if (!a.categories.some((c) => c.id === filters.categoryId)) return false;
        }
        if (filters.authorId != null) {
            if (a.authorId !== filters.authorId) return false;
        }
        return true;
    });

    const sortedItems = [...filteredItems].sort((a, b) => {
        let cmp = 0;
        if (filters.sortBy === 'id') cmp = a.id - b.id;
        else if (filters.sortBy === 'title') cmp = a.title.localeCompare(b.title);
        return filters.sortDir === 'asc' ? cmp : -cmp;
    });

    const total = sortedItems.length;
    const items = sortedItems.slice((page - 1) * pageSize, page * pageSize);

    // ── Data loading ─────────────────────────────────────────────────────────
    // Use getState() inside callbacks so function stays stable (empty deps)
    const loadArticles = useCallback(async () => {
        const { setLoading, setRawData } = useArticleStore.getState();
        setLoading(true);
        try {
            const data = await articleService.getAll();
            setRawData(data);
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to load articles');
        } finally {
            useArticleStore.getState().setLoading(false);
        }
    }, []); // stable — no deps needed since we use getState()

    useEffect(() => {
        void articleCategoryService.getAll().then(setCategories).catch(() => {
            toast.error('Failed to load categories');
        });
    }, []);

    // Initial load only if not loaded
    useEffect(() => {
        if (!useArticleStore.getState().isLoaded) {
            void loadArticles();
        }
    }, [loadArticles]);

    const handleToggleStatus = async () => {
        if (!statusTarget) return;
        if (!ensure('MANAGE_ARTICLES', 'manage article status')) return;

        setIsToggling(true);
        try {
            if (statusTarget.isActive) {
                await articleService.remove(statusTarget.id);
                toast.success('Article deactivated');
            } else {
                await articleService.restore(statusTarget.id);
                toast.success('Article activated');
            }
            setStatusTarget(null);
            await loadArticles();
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to change article status');
        } finally {
            setIsToggling(false);
        }
    };

    const columns = [
        {
            key: 'id',
            label: 'ID',
            render: (row: ArticleItem) => (
                <span className="font-mono text-xs text-slate-500">#{row.id}</span>
            ),
        },
        {
            key: 'title',
            label: 'Title',
            render: (row: ArticleItem) => (
                <div className="max-w-xs">
                    <p className="truncate font-medium text-slate-900" title={stripHtml(row.title)}>
                        {stripHtml(row.title) || '(Untitled)'}
                    </p>
                </div>
            ),
        },
        {
            key: 'author',
            label: 'Author',
            render: (row: ArticleItem) => (
                <span className="text-slate-700">{row.authorName || '—'}</span>
            ),
        },
        {
            key: 'categories',
            label: 'Categories',
            render: (row: ArticleItem) => <CategoryListCell categories={row.categories} />,
        },
        {
            key: 'status',
            label: 'Status',
            render: (row: ArticleItem) => <Badge value={row.status} />,
        },
        {
            key: 'createdAt',
            label: 'Created',
            render: (row: ArticleItem) => (
                <span className="text-xs text-slate-500">
                    {row.createdAt
                        ? new Date(row.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                          })
                        : '—'}
                </span>
            ),
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (row: ArticleItem) => (
                <div className="flex gap-2">
                    {canManage && (
                        <>
                            <button
                                type="button"
                                title="Edit Article"
                                onClick={() => navigate(`/admin/articles/${row.id}/edit`)}
                                className="p-1 hover:text-cyan-600 transition"
                            >
                                <PencilSquareIcon className="h-5 w-5" />
                            </button>
                            {row.isActive ? (
                                <button
                                    type="button"
                                    title="Deactivate Article"
                                    onClick={() => setStatusTarget(row)}
                                    className="p-1 hover:text-red-600 transition"
                                >
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    title="Activate Article"
                                    onClick={() => setStatusTarget(row)}
                                    className="p-1 hover:text-emerald-600 transition"
                                >
                                    <ArrowPathIcon className="h-5 w-5" />
                                </button>
                            )}
                        </>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Articles</h2>
                    <p className="text-sm text-slate-500">Manage all published and draft articles.</p>
                </div>
                {canManage && (
                    <button
                        type="button"
                        onClick={() => navigate('/admin/articles/new')}
                        className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800"
                    >
                        <PlusIcon className="h-4 w-4" />
                        New Article
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
                {/* Search */}
                <div className="relative min-w-[220px] flex-1">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by ID, title, author..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-slate-300 disabled:bg-slate-50 disabled:text-slate-500"
                    />
                </div>

                {/* Category filter using searchable CategorySelect */}
                <div className="pointer-events-auto" style={{ opacity: isLoading ? 0.6 : 1, pointerEvents: isLoading ? 'none' : 'auto' }}>
                    <CategorySelect
                        categories={categories}
                        selectedId={filters.categoryId}
                        onChange={(id) => setFilter('categoryId', id)}
                        placeholder="All Categories"
                    />
                </div>

                {/* Sort */}
                <select
                    value={`${filters.sortBy}_${filters.sortDir}`}
                    onChange={(e) => {
                        const [by, dir] = e.target.value.split('_') as ['id' | 'title', 'asc' | 'desc'];
                        setFilter('sortBy', by);
                        setFilter('sortDir', dir);
                    }}
                    disabled={isLoading}
                    className="h-9 min-w-[140px] rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                >
                    <option value="id_desc">Newest First</option>
                    <option value="id_asc">Oldest First</option>
                    <option value="title_asc">Title A–Z</option>
                    <option value="title_desc">Title Z–A</option>
                </select>

                {/* Reset */}
                <button
                    type="button"
                    title="Reset Filters"
                    disabled={isLoading}
                    onClick={() => {
                        setSearchTerm('');
                        resetFilters();
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:bg-slate-50 disabled:text-slate-400"
                >
                    <ArrowPathIcon className="h-4 w-4" />
                </button>
            </div>

            {/* Table */}
            {isLoading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="h-7 w-7 animate-spin rounded-full border-2 border-cyan-600 border-t-transparent" />
                </div>
            ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-16 text-center">
                    <p className="text-sm font-medium text-slate-700">No articles found</p>
                    <p className="mt-1 text-xs text-slate-400">Try adjusting your filters or create a new article.</p>
                </div>
            ) : (
                <Table columns={columns} rows={items} />
            )}

            {/* Pagination */}
            {total > pageSize && (
                <Pagination
                    page={page}
                    pageSize={pageSize}
                    total={total}
                    onPageChange={(p) => setPage(p)}
                />
            )}

            {/* Toggle Status Confirm Modal */}
            <Modal
                open={Boolean(statusTarget)}
                title={statusTarget?.isActive ? 'Deactivate Article' : 'Activate Article'}
                onClose={() => setStatusTarget(null)}
            >
                <div className="space-y-4">
                    <p className="text-sm text-slate-700">
                        {statusTarget?.isActive ? (
                            <>
                                Are you sure you want to deactivate the article{' '}
                                <strong className="text-slate-900">#{statusTarget.id}</strong>? It will remain visible
                                here but it won't be shown to the public.
                            </>
                        ) : (
                            <>
                                Are you sure you want to activate the article{' '}
                                <strong className="text-slate-900">#{statusTarget?.id}</strong>? It will be published
                                and shown to the public.
                            </>
                        )}
                    </p>
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setStatusTarget(null)}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={() => void handleToggleStatus()}
                            disabled={isToggling}
                            className={`rounded-lg px-3 py-2 text-sm font-semibold text-white disabled:opacity-60 ${
                                statusTarget?.isActive
                                    ? 'bg-rose-600 hover:bg-rose-700'
                                    : 'bg-emerald-600 hover:bg-emerald-700'
                            }`}
                        >
                            {isToggling
                                ? statusTarget?.isActive
                                    ? 'Deactivating...'
                                    : 'Activating...'
                                : statusTarget?.isActive
                                ? 'Deactivate'
                                : 'Activate'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
