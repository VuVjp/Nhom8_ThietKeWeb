import { useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import { articleService } from '../services/articleService';
import { articleCategoryService } from '../services/articleCategoryService';
import { useArticleCategoryStore, useArticleStore } from './useArticleStore';
import { toApiError } from '../../../api/httpClient';

// ─── useArticles ─────────────────────────────────────────────────────────────
// Correct Zustand pattern: use getState() inside callbacks (stable),
// and primitive selectors for effect deps (avoids infinite loops).

export function useArticles() {
    const page = useArticleStore((s) => s.page);
    const filters = useArticleStore((s) => s.filters);

    const load = useCallback(async () => {
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
    }, []); // stable — reads state via getState()

    useEffect(() => {
        void load();
    }, [
        page,
        filters.search,
        filters.categoryId,
        filters.authorId,
        filters.sortBy,
        filters.sortDir,
        load,
    ]);

    return { reload: load };
}

// ─── useArticleCategories ─────────────────────────────────────────────────────

export function useArticleCategories() {
    const load = useCallback(async () => {
        const { setLoading, setCategories } = useArticleCategoryStore.getState();
        setLoading(true);
        try {
            const categories = await articleCategoryService.getAll();
            setCategories(categories);
        } catch (error) {
            const apiError = toApiError(error);
            toast.error(apiError.message || 'Failed to load categories');
        } finally {
            useArticleCategoryStore.getState().setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    return { reload: load };
}
