// ─── Article Category ────────────────────────────────────────────────────────

export interface ArticleCategory {
    id: number;
    name: string;
    isActive: boolean;
}

export interface CreateArticleCategoryPayload {
    name: string;
}

export interface UpdateArticleCategoryPayload {
    name: string;
}

// ─── Article ─────────────────────────────────────────────────────────────────

export type ArticleStatus = 'Active' | 'Inactive';

export interface ArticleItem {
    id: number;
    title: string;
    content: string;
    thumbnailUrl?: string;
    status: ArticleStatus;
    authorName: string;
    authorId: number;
    categories: ArticleCategory[];
    createdAt: string;
    updatedAt?: string;
    isActive: boolean;
}

export interface ArticleListParams {
    page?: number;
    pageSize?: number;
    search?: string;
    categoryId?: number | null;
    authorId?: number | null;
    sortBy?: 'id' | 'title';
    sortDir?: 'asc' | 'desc';
}

export interface ArticlePaginatedResult {
    items: ArticleItem[];
    total: number;
    page: number;
    pageSize: number;
}

export interface CreateArticlePayload {
    title: string;
    content: string;
    status: ArticleStatus;
    categoryIds: number[];
    thumbnail?: File | null;
    thumbnailUrl?: string | null;
}

export interface UpdateArticlePayload {
    title: string;
    content: string;
    status: ArticleStatus;
    categoryIds: number[];
    thumbnail?: File | null;
    thumbnailUrl?: string | null;
}
