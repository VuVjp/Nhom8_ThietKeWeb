import { create } from 'zustand';
import type { ArticleCategory, ArticleItem } from '../types/article.types';

// ─── Article Store ────────────────────────────────────────────────────────────

interface ArticleFilters {
    search: string;
    categoryId: number | null;
    authorId: number | null;
    sortBy: 'id' | 'title';
    sortDir: 'asc' | 'desc';
}

interface ArticleState {
    rawData: ArticleItem[];
    isLoaded: boolean;
    page: number;
    pageSize: number;
    isLoading: boolean;
    filters: ArticleFilters;

    setRawData: (items: ArticleItem[]) => void;
    setPage: (page: number) => void;
    setPageSize: (size: number) => void;
    setLoading: (loading: boolean) => void;
    setFilter: <K extends keyof ArticleFilters>(key: K, value: ArticleFilters[K]) => void;
    resetFilters: () => void;
}

const defaultFilters: ArticleFilters = {
    search: '',
    categoryId: null,
    authorId: null,
    sortBy: 'id',
    sortDir: 'desc',
};

export const useArticleStore = create<ArticleState>((set) => ({
    rawData: [],
    isLoaded: false,
    page: 1,
    pageSize: 15,
    isLoading: false,
    filters: { ...defaultFilters },

    setRawData: (rawData) => set({ rawData, isLoaded: true }),
    setPage: (page) => set({ page }),
    setPageSize: (pageSize) => set({ pageSize }),
    setLoading: (isLoading) => set({ isLoading }),
    setFilter: (key, value) =>
        set((state) => ({
            filters: { ...state.filters, [key]: value },
            page: 1, // reset page on filter change
        })),
    resetFilters: () => set({ filters: { ...defaultFilters }, page: 1 }),
}));

// ─── Article Category Store ───────────────────────────────────────────────────

interface ArticleCategoryState {
    categories: ArticleCategory[];
    isLoading: boolean;
    setCategories: (categories: ArticleCategory[]) => void;
    setLoading: (loading: boolean) => void;
    upsertCategory: (category: ArticleCategory) => void;
    removeCategory: (id: number) => void;
}

export const useArticleCategoryStore = create<ArticleCategoryState>((set) => ({
    categories: [],
    isLoading: false,
    setCategories: (categories) => set({ categories }),
    setLoading: (isLoading) => set({ isLoading }),
    upsertCategory: (category) =>
        set((state) => {
            const exists = state.categories.find((c) => c.id === category.id);
            if (exists) {
                return { categories: state.categories.map((c) => (c.id === category.id ? category : c)) };
            }
            return { categories: [...state.categories, category] };
        }),
    removeCategory: (id) =>
        set((state) => ({ categories: state.categories.filter((c) => c.id !== id) })),
}));
