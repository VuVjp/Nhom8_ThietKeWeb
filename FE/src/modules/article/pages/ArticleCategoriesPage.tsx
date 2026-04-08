import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Table } from '../../../components/Table';
import { Modal } from '../../../components/Modal';
import { Input } from '../../../components/Input';
import { Pagination } from '../../../components/Pagination';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { usePermissionCheck } from '../../../hooks/usePermissionCheck';
import { useAppAuth } from '../../../auth/useAppAuth';
import { articleCategoryService } from '../services/articleCategoryService';
import { toApiError } from '../../../api/httpClient';
import { Badge } from '../../../components/Badge';
import type { ArticleCategory } from '../types/article.types';

export function ArticleCategoriesPage() {
    const { ensure } = usePermissionCheck();
    const { hasPermission } = useAppAuth();
    const canManage = hasPermission('MANAGE_ARTICLE_CATEGORY');

    const [categories, setCategories] = useState<ArticleCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // List states
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<'id' | 'name'>('id');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);

    // Create state
    const [openCreate, setOpenCreate] = useState(false);
    const [createName, setCreateName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Edit state
    const [editing, setEditing] = useState<ArticleCategory | null>(null);
    const [editName, setEditName] = useState('');
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    // Status toggle state
    const [statusTarget, setStatusTarget] = useState<ArticleCategory | null>(null);
    const [isToggling, setIsToggling] = useState(false);

    const loadCategories = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await articleCategoryService.getAll();
            setCategories(data);
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to load categories');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadCategories();
    }, [loadCategories]);

    // Reset pagination when filter/sort changes
    useEffect(() => {
        setPage(1);
    }, [search, sortBy, sortDir]);

    // Compute display data
    const filteredCategories = categories.filter((c) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return c.name.toLowerCase().includes(s) || String(c.id).includes(s);
    });

    const sortedCategories = [...filteredCategories].sort((a, b) => {
        let cmp = 0;
        if (sortBy === 'id') cmp = a.id - b.id;
        if (sortBy === 'name') cmp = a.name.localeCompare(b.name);
        return sortDir === 'asc' ? cmp : -cmp;
    });

    const paginatedCategories = sortedCategories.slice((page - 1) * pageSize, page * pageSize);

    const handleCreate = async () => {
        if (!ensure('MANAGE_ARTICLE_CATEGORY', 'create category')) return;
        if (!createName.trim()) {
            toast.error('Category name is required');
            return;
        }

        setIsCreating(true);
        try {
            await articleCategoryService.create({ name: createName.trim() });
            toast.success('Category created');
            setCreateName('');
            setOpenCreate(false);
            await loadCategories();
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to create category');
        } finally {
            setIsCreating(false);
        }
    };

    const handleSaveEdit = async () => {
        if (!editing) return;
        if (!ensure('MANAGE_ARTICLE_CATEGORY', 'update category')) return;
        if (!editName.trim()) {
            toast.error('Category name is required');
            return;
        }

        setIsSavingEdit(true);
        try {
            await articleCategoryService.update(editing.id, { name: editName.trim() });
            toast.success('Category updated');
            setEditing(null);
            setEditName('');
            await loadCategories();
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to update category');
        } finally {
            setIsSavingEdit(false);
        }
    };

    const handleToggleStatus = async () => {
        if (!statusTarget) return;
        if (!ensure('MANAGE_ARTICLE_CATEGORY', 'manage category status')) return;

        setIsToggling(true);
        try {
            if (statusTarget.isActive) {
                await articleCategoryService.remove(statusTarget.id);
                toast.success('Category deactivated');
            } else {
                await articleCategoryService.restore(statusTarget.id);
                toast.success('Category activated');
            }
            setStatusTarget(null);
            await loadCategories();
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to change category status');
        } finally {
            setIsToggling(false);
        }
    };

    const columns = [
        {
            key: 'id',
            label: 'ID',
            render: (row: ArticleCategory) => (
                <span className="font-mono text-xs text-slate-500">#{row.id}</span>
            ),
        },
        {
            key: 'name',
            label: 'Name',
            render: (row: ArticleCategory) => (
                <span className="font-medium text-slate-900">{row.name}</span>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (row: ArticleCategory) => (
                <Badge value={row.isActive ? 'Active' : 'Inactive'} />
            ),
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (row: ArticleCategory) => (
                <div className="flex gap-2">
                    {canManage && (
                        <>
                            <button
                                type="button"
                                onClick={() => {
                                    setEditing(row);
                                    setEditName(row.name);
                                }}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50"
                            >
                                <PencilSquareIcon className="h-4 w-4" />
                                Edit
                            </button>
                            <button
                                type="button"
                                onClick={() => setStatusTarget(row)}
                                className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs ${
                                    row.isActive 
                                    ? 'border-rose-200 text-rose-600 hover:bg-rose-50' 
                                    : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                                }`}
                            >
                                <TrashIcon className="h-4 w-4" />
                                {row.isActive ? 'Deactivate' : 'Activate'}
                            </button>
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
                    <h2 className="text-2xl font-bold text-slate-900">Article Categories</h2>
                    <p className="text-sm text-slate-500">Manage categories used to classify articles.</p>
                </div>
                {canManage && (
                    <button
                        type="button"
                        onClick={() => setOpenCreate(true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800"
                    >
                        <PlusIcon className="h-4 w-4" />
                        Add Category
                    </button>
                )}
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
                <div className="relative min-w-[220px] flex-1">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by ID or name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-slate-300 disabled:bg-slate-50 disabled:text-slate-500"
                    />
                </div>

                <select
                    value={`${sortBy}_${sortDir}`}
                    onChange={(e) => {
                        const [by, dir] = e.target.value.split('_') as ['id' | 'name', 'asc' | 'desc'];
                        setSortBy(by);
                        setSortDir(dir);
                    }}
                    className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
                >
                    <option value="id_desc">Newest First (ID)</option>
                    <option value="id_asc">Oldest First (ID)</option>
                    <option value="name_asc">Name A–Z</option>
                    <option value="name_desc">Name Z–A</option>
                </select>

                <button
                    type="button"
                    onClick={() => {
                        setSearch('');
                        setSortBy('id');
                        setSortDir('desc');
                    }}
                    className="h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-600 transition hover:bg-slate-50"
                >
                    Reset
                </button>
            </div>

            {/* Table */}
            {isLoading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="h-7 w-7 animate-spin rounded-full border-2 border-cyan-600 border-t-transparent" />
                </div>
            ) : categories.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-16 text-center">
                    <p className="text-sm font-medium text-slate-700">No categories found</p>
                    <p className="mt-1 text-xs text-slate-400">Try adjusting your filters or add a new category.</p>
                </div>
            ) : (
                <Table columns={columns} rows={paginatedCategories} />
            )}

            {/* Pagination */}
            {filteredCategories.length > pageSize && (
                <Pagination
                    page={page}
                    pageSize={pageSize}
                    total={filteredCategories.length}
                    onPageChange={(p) => setPage(p)}
                />
            )}

            {/* Create Modal */}
            <Modal
                open={openCreate}
                title="Add Category"
                onClose={() => {
                    setOpenCreate(false);
                    setCreateName('');
                }}
            >
                <div className="space-y-4">
                    <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900">Category details</h3>
                            <p className="text-xs text-slate-500">Enter the display name for this category.</p>
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="create-category-name" className="text-sm font-medium text-slate-700">
                                Category name
                            </label>
                            <Input
                                id="create-category-name"
                                placeholder="e.g. Technology"
                                value={createName}
                                onChange={(e) => setCreateName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') void handleCreate();
                                }}
                            />
                        </div>
                    </section>
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setOpenCreate(false);
                                setCreateName('');
                            }}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={() => void handleCreate()}
                            disabled={isCreating}
                            className="rounded-lg bg-cyan-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60 hover:bg-cyan-800"
                        >
                            {isCreating ? 'Saving...' : 'Save Category'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Edit Modal */}
            <Modal
                open={Boolean(editing)}
                title={editing ? `Edit Category: ${editing.name}` : 'Edit Category'}
                onClose={() => {
                    setEditing(null);
                    setEditName('');
                }}
            >
                <div className="space-y-4">
                    <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900">Category details</h3>
                            <p className="text-xs text-slate-500">Update the display name for this category.</p>
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="edit-category-name" className="text-sm font-medium text-slate-700">
                                Category name
                            </label>
                            <Input
                                id="edit-category-name"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') void handleSaveEdit();
                                }}
                            />
                        </div>
                    </section>
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setEditing(null);
                                setEditName('');
                            }}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={() => void handleSaveEdit()}
                            disabled={isSavingEdit}
                            className="rounded-lg bg-cyan-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60 hover:bg-cyan-800"
                        >
                            {isSavingEdit ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Toggle Status Confirm Modal */}
            <Modal
                open={Boolean(statusTarget)}
                title={statusTarget?.isActive ? 'Deactivate Category' : 'Activate Category'}
                onClose={() => setStatusTarget(null)}
            >
                <div className="space-y-4">
                    <p className="text-sm text-slate-700">
                        {statusTarget?.isActive ? (
                            <>
                                Are you sure you want to deactivate the category{' '}
                                <strong className="text-slate-900">"{statusTarget.name}"</strong>? It will remain visible here
                                but won't be active for new articles.
                            </>
                        ) : (
                            <>
                                Are you sure you want to activate the category{' '}
                                <strong className="text-slate-900">"{statusTarget?.name}"</strong>? It will become available
                                for new articles.
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
